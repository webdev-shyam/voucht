import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { canAccess } from "@/lib/utils";
import { sendMilestoneReminderEmail, sendSubscriptionExpiringEmail } from "@/lib/email";

export async function GET(request: Request) {
  // Check authorization via Header or Query param
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Fail closed: without a configured secret anyone could trigger bulk email
  // sends, so the scheduled job is unavailable rather than unprotected.
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured; scheduled jobs are disabled." },
      { status: 503 }
    );
  }

  const isHeaderValid = authHeader === `Bearer ${cronSecret}`;
  const isQueryValid = querySecret === cronSecret;
  if (!isHeaderValid && !isQueryValid) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const nowIso = now.toISOString();
  const twoDaysIso = twoDaysFromNow.toISOString();
  const threeDaysIso = threeDaysFromNow.toISOString();

  let remindersSent = 0;
  let overdueUpdated = 0;
  let expiringCryptoNotified = 0;
  let cryptoDowngraded = 0;
  const processedMilestones: { id: string; title: string; action: string }[] = [];
  const processedSubscriptions: { id: string; user_id: string; action: string }[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = createAdminClient();

      // 1. Query upcoming milestones due within 2 days
      const { data: upcomingMilestones, error: upcomingError } = await supabase
        .from("milestones")
        .select(`
          id,
          title,
          due_date,
          status,
          project_id,
          projects (
            id,
            title,
            freelancer_id,
            profiles (
              email,
              full_name,
              trust_score,
              plan
            )
          )
        `)
        .in("status", ["pending", "in_progress"])
        .gte("due_date", nowIso.split("T")[0])
        .lte("due_date", twoDaysIso.split("T")[0]);

      if (!upcomingError && upcomingMilestones) {
        for (const item of upcomingMilestones as any[]) {
          const project = item.projects;
          const profile = project?.profiles;

          // Automated reminders are a paid feature, so the job skips free
          // accounts instead of mailing the whole user base.
          if (!canAccess(profile?.plan, "milestone_reminders")) continue;

          if (profile?.email) {
            await sendMilestoneReminderEmail({
              to: profile.email,
              name: profile.full_name || "Creator",
              milestoneTitle: item.title,
              projectTitle: project.title,
              dueDate: item.due_date,
              projectId: project.id,
              score: profile.trust_score ?? null,
            });

            remindersSent++;
            processedMilestones.push({
              id: item.id,
              title: item.title,
              action: "reminder_sent",
            });
          }
        }
      }

      // 2. Query and update overdue milestones
      const todayDateOnly = nowIso.split("T")[0];
      const { data: overdueMilestones, error: overdueError } = await supabase
        .from("milestones")
        .select("id, title, project_id")
        .in("status", ["pending", "in_progress"])
        .lt("due_date", todayDateOnly);

      if (!overdueError && overdueMilestones && overdueMilestones.length > 0) {
        const overdueIds = overdueMilestones.map((m: any) => m.id);

        await (supabase as any)
          .from("milestones")
          .update({ status: "overdue" })
          .in("id", overdueIds);

        overdueUpdated = overdueMilestones.length;
        for (const m of overdueMilestones as any[]) {
          processedMilestones.push({
            id: m.id,
            title: m.title,
            action: "marked_overdue",
          });
        }
      }

      // 3. Check for expiring crypto subscriptions (due within 3 days)
      const { data: expiringSubs } = await supabase
        .from("subscriptions")
        .select(`
          id,
          user_id,
          plan,
          current_period_end,
          profiles (
            email,
            full_name
          )
        `)
        .eq("payment_provider", "nowpayments")
        .eq("status", "active")
        .gte("current_period_end", nowIso)
        .lte("current_period_end", threeDaysIso);

      if (expiringSubs && expiringSubs.length > 0) {
        for (const sub of expiringSubs as any[]) {
          const profile = sub.profiles;
          if (profile?.email) {
            await sendSubscriptionExpiringEmail({
              to: profile.email,
              name: profile.full_name || "Creator",
              plan: sub.plan,
              daysLeft: 3,
            });
            expiringCryptoNotified++;
            processedSubscriptions.push({
              id: sub.id,
              user_id: sub.user_id,
              action: "expiring_notice_sent",
            });
          }
        }
      }

      // 4. Check for expired crypto subscriptions (period_end < now) & automatic downgrade
      const { data: expiredSubs } = await supabase
        .from("subscriptions")
        .select("id, user_id, plan")
        .eq("payment_provider", "nowpayments")
        .eq("status", "active")
        .lt("current_period_end", nowIso);

      if (expiredSubs && expiredSubs.length > 0) {
        for (const sub of expiredSubs as any[]) {
          // Downgrade subscription record to expired
          await (supabase as any)
            .from("subscriptions")
            .update({ status: "expired", updated_at: nowIso })
            .eq("id", sub.id);

          // Downgrade profile to free
          await (supabase as any)
            .from("profiles")
            .update({ plan: "free" })
            .eq("id", sub.user_id);

          // Log activity
          await (supabase as any).from("activity_log").insert({
            user_id: sub.user_id,
            action: "Crypto subscription expired",
            description: "Automatically transitioned to Free tier upon subscription end.",
          });

          cryptoDowngraded++;
          processedSubscriptions.push({
            id: sub.id,
            user_id: sub.user_id,
            action: "downgraded_to_free",
          });
        }
      }
    } catch (err) {
      console.error("[Cron Execution Error]:", err);
    }
  } else {
    // No database, nothing to check. Reporting invented counts here would make
    // a broken scheduled job look healthy in the logs.
    return NextResponse.json(
      {
        success: false,
        reason: "not-configured",
        timestamp: nowIso,
        error: "Supabase is not configured, so the milestone job did nothing.",
      },
      { status: 503 }
    );
  }

  return NextResponse.json({
    success: true,
    timestamp: nowIso,
    stats: {
      remindersSent,
      overdueUpdated,
      expiringCryptoNotified,
      cryptoDowngraded,
      totalProcessed: processedMilestones.length + processedSubscriptions.length,
    },
    processedMilestones,
    processedSubscriptions,
  });
}

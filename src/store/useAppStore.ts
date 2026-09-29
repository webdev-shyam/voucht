import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import type {
  ActivityItem,
  Contract,
  Database,
  Milestone,
  Project,
  SubscriptionSummary,
  UserProfile,
} from "@/lib/types";
import {
  toActivityItem,
  toContract,
  toProject,
  toSubscription,
  toUserProfile,
} from "@/lib/mappers";
import { canAccess } from "@/lib/utils";

// Only the columns a freelancer may edit; the score, badge and plan are derived
// by the database and the payment webhooks.
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export interface NewMilestone {
  title: string;
  description?: string;
  // The UI does not collect a per-milestone price yet; null renders as "amount
  // not specified" rather than a fabricated 0.
  amount?: number;
  dueDate: string;
  sortOrder: number;
}

export interface NewProject {
  title: string;
  description?: string;
  clientName: string;
  clientEmail: string;
  totalBudget: number;
  currency: string;
  startDate: string;
  deadline: string;
  milestones: NewMilestone[];
}

export interface NewContract {
  title: string;
  projectId?: string;
  clientName: string;
  clientEmail: string;
  contractText: string;
  scopeOfWork: string;
  totalValue: number;
  paymentTerms: string;
  ipClause: string;
  terminationTerms: string;
  // Only true when an actual model produced the text; a template fallback must
  // not be recorded as AI generated.
  generatedByAi?: boolean;
}

export type LoadStatus = "idle" | "loading" | "ready" | "signed-out" | "error";

interface AppState {
  status: LoadStatus;
  error: string | null;
  user: UserProfile | null;
  projects: Project[];
  contracts: Contract[];
  activities: ActivityItem[];
  // Only counted for plans that include analytics; null means "not collected".
  profileViews: number | null;
  // The subscription row written by a payment webhook, or null when the account
  // has none. Billing reads this instead of trusting a URL query parameter.
  subscription: SubscriptionSummary | null;

  load: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  createProject: (input: NewProject) => Promise<Project | null>;
  // True only when the milestone row is in the database. The UI reports an
  // added milestone from this result, never from the click itself.
  addMilestone: (projectId: string, input: NewMilestone) => Promise<boolean>;
  submitDelivery: (
    projectId: string,
    milestoneId: string
  ) => Promise<{ token: string } | null>;
  sendVerificationRequest: (
    projectId: string,
    milestoneId: string
  ) => Promise<{ sent: boolean; reason?: string }>;
  setProjectStatus: (
    projectId: string,
    status: "completed" | "cancelled"
  ) => Promise<void>;
  addContract: (input: NewContract) => Promise<Contract | null>;
}

// Every read and write here runs with the user's own session against RLS. There
// is no service-role key in the browser and no fallback dataset: if a query
// fails the UI says so instead of showing somebody else's work.
async function requireUserId(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new SignedOutError();
  return user.id;
}

class SignedOutError extends Error {
  constructor() {
    super("You need to sign in to view this page.");
    this.name = "SignedOutError";
  }
}

export const useAppStore = create<AppState>((set, get) => ({
  status: "idle",
  error: null,
  user: null,
  projects: [],
  contracts: [],
  activities: [],
  profileViews: null,
  subscription: null,

  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null });

    const supabase = createClient();

    let userId: string;
    try {
      userId = await requireUserId(supabase);
    } catch {
      set({
        status: "signed-out",
        user: null,
        projects: [],
        contracts: [],
        activities: [],
        profileViews: null,
        subscription: null,
      });
      return;
    }

    const [
      { data: profile },
      { data: projectRows, error: projectsError },
      { data: contractRows },
      { data: activityRows },
      { data: subscriptionRow },
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("projects")
        .select("*")
        .eq("freelancer_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("contracts")
        .select("*")
        .eq("freelancer_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    if (projectsError) {
      set({
        status: "error",
        error: "We couldn't load your projects. Check your connection and try again.",
      });
      return;
    }

    const projects = projectRows ?? [];
    const projectIds = projects.map((p) => p.id);

    const [{ data: milestoneRows }, { data: deliveryRows }] = await Promise.all([
      supabase.from("milestones").select("*").in("project_id", projectIds),
      supabase.from("deliveries").select("*").eq("freelancer_id", userId),
    ]);

    const milestones = milestoneRows ?? [];
    const deliveries = deliveryRows ?? [];

    // Visitor counts are an Elite feature, so the number is only fetched when
    // the plan includes it. null means "not collected", never "zero views".
    let profileViews: number | null = null;
    if (profile && canAccess(profile.plan, "profile_analytics")) {
      const { count } = await supabase
        .from("profile_views")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", userId);
      profileViews = count ?? 0;
    }

    set({
      status: profile ? "ready" : "error",
      error: profile ? null : "Your profile is missing. Please sign out and back in.",
      user: profile ? toUserProfile(profile) : null,
      profileViews,
      subscription: subscriptionRow ? toSubscription(subscriptionRow) : null,
      projects: projects.map((p) =>
        toProject(
          p,
          milestones.filter((m) => m.project_id === p.id),
          deliveries.filter((d) => d.project_id === p.id)
        )
      ),
      contracts: (contractRows ?? []).map(toContract),
      activities: (activityRows ?? []).map(toActivityItem),
    });
  },

  updateProfile: async (updates) => {
    const supabase = createClient();
    const userId = await requireUserId(supabase);

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select("*")
      .single();

    if (error) {
      set({ error: "We couldn't save those changes. Please try again." });
      throw new Error("profile_update_failed");
    }

    set({ user: toUserProfile(data), error: null });
  },

  createProject: async (input) => {
    const supabase = createClient();
    const userId = await requireUserId(supabase);

    const { data: project, error } = await supabase
      .from("projects")
      .insert({
        freelancer_id: userId,
        project_title: input.title,
        description: input.description || null,
        client_name: input.clientName,
        client_email: input.clientEmail,
        payment_amount: input.totalBudget,
        currency: input.currency,
        started_at: input.startDate,
        deadline: input.deadline,
        status: "active",
      })
      .select("*")
      .single();

    if (error || !project) {
      set({ error: "We couldn't create this project. Check the required fields and try again." });
      return null;
    }

    if (input.milestones.length > 0) {
      const { error: milestonesError } = await supabase.from("milestones").insert(
        input.milestones.map((m) => ({
          project_id: project.id,
          title: m.title,
          description: m.description || null,
          amount: m.amount ?? null,
          due_date: m.dueDate,
          sort_order: m.sortOrder,
          status: "pending",
        }))
      );

      if (milestonesError) {
        await supabase.from("projects").delete().eq("id", project.id);
        set({ error: "We couldn't add those milestones. The project was not created." });
        return null;
      }
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      project_id: project.id,
      action: "project_created",
      description: `Created "${input.title}".`,
    });

    await get().load();
    return get().projects.find((p) => p.id === project.id) ?? null;
  },

  addMilestone: async (projectId, input) => {
    const supabase = createClient();
    const userId = await requireUserId(supabase);

    const { error } = await supabase.from("milestones").insert({
      project_id: projectId,
      title: input.title,
      description: input.description || null,
      amount: input.amount ?? null,
      due_date: input.dueDate,
      sort_order: input.sortOrder,
      status: "pending",
    });

    if (error) {
      set({ error: "We couldn't add that milestone. Please try again." });
      return false;
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      project_id: projectId,
      action: "milestone_created",
      description: `Added milestone "${input.title}".`,
    });

    await get().load();
    return true;
  },

  // The verification token is generated by the database, never by the browser,
  // and the freelancer reads it back only because RLS grants them their own row.
  submitDelivery: async (projectId, milestoneId) => {
    const supabase = createClient();
    const userId = await requireUserId(supabase);

    const project = get().projects.find((p) => p.id === projectId);
    const milestone = project?.milestones.find((m) => m.id === milestoneId);
    if (!project || !milestone) {
      set({ error: "That milestone no longer exists." });
      return null;
    }

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .insert({
        project_id: projectId,
        milestone_id: milestoneId,
        freelancer_id: userId,
        client_email: project.clientEmail,
        client_name: project.clientName,
        delivery_type: "milestone",
      })
      .select("*")
      .single();

    if (error || !delivery) {
      set({
        error: "We couldn't record this delivery. Please check your connection and try again.",
      });
      return null;
    }

    await supabase
      .from("milestones")
      .update({ status: "delivered", freelancer_submitted_at: delivery.submitted_at })
      .eq("id", milestoneId);

    await supabase.from("activity_log").insert({
      user_id: userId,
      project_id: projectId,
      action: "delivery_submitted",
      description: `Submitted "${milestone.title}" for client verification.`,
    });

    await get().load();
    return { token: delivery.confirmation_token };
  },

  // The email route re-checks ownership with the caller's session, so this is a
  // request to send, not a instruction about what to send.
  sendVerificationRequest: async (projectId, milestoneId) => {
    const state = get();
    const project = state.projects.find((p) => p.id === projectId);
    const milestone = project?.milestones.find((m) => m.id === milestoneId);

    if (!milestone?.deliveryId || !milestone.verificationToken) {
      return { sent: false, reason: "no-delivery" };
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { sent: false, reason: "signed-out" };

    const response = await fetch("/api/email/send-client-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryId: milestone.deliveryId,
      }),
    });

    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.sent) {
      return { sent: false, reason: result?.reason ?? "send-failed" };
    }

    return { sent: true };
  },

  setProjectStatus: async (projectId, status) => {
    const supabase = createClient();
    const userId = await requireUserId(supabase);

    const { error } = await supabase
      .from("projects")
      .update(
        status === "completed"
          ? { status: "completed", completed_at: new Date().toISOString() }
          : { status: "cancelled" }
      )
      .eq("id", projectId)
      .eq("freelancer_id", userId);

    if (error) {
      set({ error: "We couldn't update that project. Please try again." });
      return;
    }

    if (status === "cancelled") {
      const project = get().projects.find((p) => p.id === projectId);
      await supabase.from("activity_log").insert({
        user_id: userId,
        project_id: projectId,
        action: "project_cancelled",
        description: `Cancelled "${project?.title ?? "project"}".`,
      });
    }

    await get().load();
  },

  addContract: async (input) => {
    const supabase = createClient();
    const userId = await requireUserId(supabase);

    const { data, error } = await supabase
      .from("contracts")
      .insert({
        freelancer_id: userId,
        project_id: input.projectId || null,
        title: input.title,
        client_name: input.clientName,
        client_email: input.clientEmail,
        contract_text: input.contractText,
        scope: input.scopeOfWork,
        total_value: input.totalValue,
        payment_terms: input.paymentTerms,
        ip_clause: input.ipClause,
        termination_terms: input.terminationTerms,
        generated_by_ai: input.generatedByAi ?? false,
        status: "draft",
      })
      .select("*")
      .single();

    if (error || !data) {
      set({ error: "We couldn't save this contract draft. Please try again." });
      return null;
    }

    await supabase.from("activity_log").insert({
      user_id: userId,
      project_id: input.projectId || null,
      action: "contract_created",
      description: `Created a contract draft for "${input.clientName}".`,
    });

    await get().load();
    return toContract(data);
  },
}));

export type { Milestone, UserProfile };

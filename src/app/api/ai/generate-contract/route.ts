import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateSmartContract } from "@/lib/ai";
import { canAccess } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const bodySchema = z.object({
  projectTitle: z.string().trim().min(2).max(120),
  clientName: z.string().trim().min(2).max(120),
  freelancerName: z.string().trim().max(120).optional(),
  scopeOfWork: z.string().trim().max(4000).optional(),
  totalBudget: z.union([z.number(), z.string()]).optional(),
  currency: z.enum(["USD", "EUR", "GBP"]).optional(),
  milestonesSummary: z.string().trim().max(4000).optional(),
});

// Contract drafting costs money per call, so it is gated on the caller's own
// session and plan rather than the plan value the browser claims.
export async function POST(request: Request) {
  try {
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "The contract generator is unavailable right now." },
        { status: 503 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to generate a contract draft." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (!canAccess(profile?.plan, "smart_contracts")) {
      return NextResponse.json(
        { error: "Contract drafting is part of the Pro plan.", upgrade: true },
        { status: 402 }
      );
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Check the project details and try again." },
        { status: 400 }
      );
    }

    const totalBudget = Number(parsed.data.totalBudget ?? 0);

    const contract = await generateSmartContract({
      projectTitle: parsed.data.projectTitle,
      clientName: parsed.data.clientName,
      freelancerName: parsed.data.freelancerName || profile?.full_name || "Freelance Consultant",
      scopeOfWork:
        parsed.data.scopeOfWork || "Milestone-based professional software and design services.",
      totalBudget: Number.isFinite(totalBudget) ? totalBudget : 0,
      currency: parsed.data.currency || "USD",
      milestonesSummary: parsed.data.milestonesSummary || "As agreed in the milestone ledger.",
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("AI contract generation error:", error);
    return NextResponse.json(
      { error: "We could not draft that contract. Please try again." },
      { status: 500 }
    );
  }
}

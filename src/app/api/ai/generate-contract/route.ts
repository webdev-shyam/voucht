import { NextResponse } from "next/server";
import { generateSmartContract } from "@/lib/ai";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      projectTitle,
      clientName,
      freelancerName,
      scopeOfWork,
      totalBudget,
      currency,
      milestonesSummary,
    } = body;

    if (!projectTitle || !clientName) {
      return NextResponse.json(
        { error: "Missing required contract fields" },
        { status: 400 }
      );
    }

    const contract = await generateSmartContract({
      projectTitle,
      clientName,
      freelancerName: freelancerName || "Freelance Consultant",
      scopeOfWork: scopeOfWork || "Milestone-based professional software and design services.",
      totalBudget: parseFloat(totalBudget) || 0,
      currency: currency || "USD",
      milestonesSummary: milestonesSummary || "As agreed in milestone ledger.",
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("AI contract generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate smart contract" },
      { status: 500 }
    );
  }
}

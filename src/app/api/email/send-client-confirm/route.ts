import { NextResponse } from "next/server";
import {
  sendClientProjectConfirmationEmail,
  sendMilestoneVerificationEmail,
} from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      to,
      type = "milestone",
      clientName,
      freelancerName,
      milestoneTitle,
      projectTitle,
      deadline,
      token,
    } = body;

    if (!to || !token) {
      return NextResponse.json(
        { error: "Missing required email parameters (to, token)" },
        { status: 400 }
      );
    }

    if (type === "project") {
      const result = await sendClientProjectConfirmationEmail({
        to,
        clientName: clientName || "Client",
        freelancerName: freelancerName || "Freelancer",
        projectTitle: projectTitle || "Freelance Project",
        deadline: deadline || "As agreed",
        token,
      });
      return NextResponse.json(result);
    }

    // Milestone verification
    const result = await sendMilestoneVerificationEmail({
      to,
      clientName: clientName || "Client",
      freelancerName: freelancerName || "Freelancer",
      milestoneTitle: milestoneTitle || "Project Milestone",
      projectTitle: projectTitle || "Freelance Project",
      token,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("send-client-confirm error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch client confirmation email" },
      { status: 500 }
    );
  }
}

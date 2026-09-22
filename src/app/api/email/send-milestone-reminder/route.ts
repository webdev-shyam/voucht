import { NextResponse } from "next/server";
import { sendMilestoneReminderEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, name, milestoneTitle, projectTitle, dueDate, projectId, score } = body;

    if (!to || !milestoneTitle) {
      return NextResponse.json({ error: "Missing required fields (to, milestoneTitle)" }, { status: 400 });
    }

    const result = await sendMilestoneReminderEmail({
      to,
      name: name || "Freelancer",
      milestoneTitle,
      projectTitle: projectTitle || "Active Project",
      dueDate: dueDate || "Upcoming",
      projectId,
      score: typeof score === "number" ? score : 94,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("send-milestone-reminder error:", error);
    return NextResponse.json({ error: "Failed to dispatch reminder email" }, { status: 500 });
  }
}

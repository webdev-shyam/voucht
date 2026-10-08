import { Resend } from "resend";
import { APP_URL } from "@/lib/constants";

const resendApiKey = process.env.RESEND_API_KEY;
export const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Base HTML Wrapper for Voucht Emails
function getEmailWrapper(content: string) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voucht</title>
  </head>
  <body style="margin: 0; padding: 24px 12px; background-color: #0b0c16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #151628; border: 1px solid #23253e; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
      <!-- Header -->
      <div style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #23253e; display: flex; align-items: center;">
        <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
          <span style="color: #00ff88;">✓</span> vouch<span style="color: #00ff88;">t</span>
        </div>
      </div>
      
      <!-- Content Body -->
      <div style="padding: 32px;">
        ${content}
      </div>

      <!-- Footer -->
      <div style="padding: 20px 32px; background-color: #0f101d; border-top: 1px solid #23253e; text-align: center; font-size: 12px; color: #71717a;">
        <p style="margin: 0 0 6px 0;">Sent by <strong style="color: #a1a1aa;">Voucht</strong> · The Verifiable Trust Layer for Freelancers</p>
        <p style="margin: 0;"><a href="${APP_URL}" style="color: #00ff88; text-decoration: none;">voucht.tech</a> · Verified delivery records</p>
      </div>
    </div>
  </body>
  </html>
  `;
}


// 1. Client project confirmation email
export async function sendClientProjectConfirmationEmail({
  to,
  clientName,
  freelancerName,
  projectTitle,
  deadline,
  token,
}: {
  to: string;
  clientName: string;
  freelancerName: string;
  projectTitle: string;
  deadline: string;
  token: string;
}) {
  const verifyUrl = `${APP_URL}/verify/${token}`;

  const html = getEmailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Project Invitation & Verification
    </h2>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 16px;">
      Hi <strong style="color: #ffffff;">${clientName}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 20px;">
      <strong style="color: #ffffff;">${freelancerName}</strong> has added a project on Voucht and listed you as the client.
    </p>
    
    <div style="background-color: #1a1b32; border: 1px solid #2a2b4d; border-radius: 10px; padding: 18px; margin: 20px 0;">
      <div style="margin-bottom: 8px;">
        <span style="font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 600;">Project:</span>
        <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 2px;">${projectTitle}</div>
      </div>
      <div>
        <span style="font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 600;">Target Deadline:</span>
        <div style="font-size: 14px; font-weight: 600; color: #00ff88; margin-top: 2px;">${deadline}</div>
      </div>
    </div>

    <p style="font-size: 14px; line-height: 22px; color: #cbd5e1; margin-bottom: 24px;">
      Please confirm this project:
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${verifyUrl}" style="background-color: #00ff88; color: #0b0c16; font-size: 14px; font-weight: 700; padding: 13px 32px; text-decoration: none; border-radius: 8px; display: inline-block;">
        ✅ Confirm Project →
      </a>
    </div>

    <p style="font-size: 12px; line-height: 18px; color: #71717a; margin-top: 24px; border-top: 1px solid #23253e; pt: 16px;">
      Voucht helps freelancers build verified track records. Your confirmation helps <strong>${freelancerName}</strong> prove their reliability.
    </p>
  `);

  if (!resend) {
    // No API key means no email: report that instead of a mocked success.
    return { sent: false, reason: "email-not-configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "Voucht Verification <verify@voucht.tech>",
      to: [to],
      subject: `${freelancerName} added you as a client on Voucht`,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendClientProjectConfirmationEmail error:", error);
    return { sent: false, reason: "send-failed" };
  }
}

// 2. Milestone verification request email
export async function sendMilestoneVerificationEmail({
  to,
  clientName,
  freelancerName,
  milestoneTitle,
  projectTitle,
  token,
}: {
  to: string;
  clientName: string;
  freelancerName: string;
  milestoneTitle: string;
  projectTitle: string;
  token: string;
}) {
  const verifyUrl = `${APP_URL}/verify/${token}`;

  const html = getEmailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Milestone Delivery Sign-off
    </h2>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 16px;">
      Hi <strong style="color: #ffffff;">${clientName}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 20px;">
      <strong style="color: #ffffff;">${freelancerName}</strong> has completed the <strong style="color: #00ff88;">'${milestoneTitle}'</strong> milestone for <strong style="color: #ffffff;">'${projectTitle}'</strong>.
    </p>
    
    <div style="background-color: #1a1b32; border: 1px solid #2a2b4d; border-radius: 10px; padding: 18px; margin: 20px 0; border-left: 4px solid #00ff88;">
      <div style="font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 600;">Delivered Milestone</div>
      <div style="font-size: 16px; font-weight: 700; color: #ffffff; margin-top: 4px;">${milestoneTitle}</div>
    </div>

    <p style="font-size: 14px; line-height: 22px; color: #cbd5e1; margin-bottom: 24px;">
      Can you confirm you received this delivery? It takes 2 seconds.
    </p>

    <div style="text-align: center; margin: 28px 0; display: flex; gap: 12px; justify-content: center;">
      <a href="${verifyUrl}" style="background-color: #00ff88; color: #0b0c16; font-size: 14px; font-weight: 700; padding: 13px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
        ✅ Confirm Delivery →
      </a>
      <a href="${verifyUrl}?action=dispute" style="background-color: transparent; border: 1px solid #ef4444; color: #ef4444; font-size: 14px; font-weight: 600; padding: 13px 20px; text-decoration: none; border-radius: 8px; display: inline-block; margin-left: 8px;">
        ❌ Not Received
      </a>
    </div>

    <p style="font-size: 12px; line-height: 18px; color: #71717a; margin-top: 24px;">
      Voucht turns client-confirmed deliveries into a public track record.
    </p>
  `);

  if (!resend) {
    // No API key means no email: report that instead of a mocked success.
    return { sent: false, reason: "email-not-configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "Voucht Verification <verify@voucht.tech>",
      to: [to],
      subject: `Please confirm: ${milestoneTitle} delivered`,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendMilestoneVerificationEmail error:", error);
    return { sent: false, reason: "send-failed" };
  }
}

// 3. Milestone reminder email
export async function sendMilestoneReminderEmail({
  to,
  name,
  milestoneTitle,
  projectTitle,
  dueDate,
  projectId,
  score,
}: {
  to: string;
  name: string;
  milestoneTitle: string;
  projectTitle: string;
  dueDate: string;
  projectId?: string;
  // The stored score, or null when the freelancer has no evidence yet. There is
  // no placeholder number: an email must never invent a reputation.
  score: number | null;
}) {
  const projectUrl = projectId
    ? `${APP_URL}/dashboard/projects/${projectId}`
    : `${APP_URL}/dashboard/projects`;

  const html = getEmailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Milestone Deadline Reminder
    </h2>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 16px;">
      Hey <strong style="color: #ffffff;">${name}</strong>! 👋
    </p>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 20px;">
      Your milestone <strong style="color: #00ff88;">'${milestoneTitle}'</strong> for <strong style="color: #ffffff;">'${projectTitle}'</strong> is due on <strong style="color: #ffffff;">${dueDate}</strong>.
    </p>
    <p style="font-size: 14px; line-height: 22px; color: #00ff88; font-weight: 600; margin-bottom: 20px;">
      Delivering on time is what builds your Trust Score.
    </p>

    <div style="background-color: #1a1b32; border: 1px solid #2a2b4d; border-radius: 10px; padding: 14px; margin: 20px 0; text-align: center;">
      <span style="font-size: 12px; color: #71717a; text-transform: uppercase;">Current Trust Score</span>
      <div style="font-size: 26px; font-weight: 800; color: #00ff88; margin-top: 4px;">${
        score === null
          ? '<span style="font-size: 15px; color: #cbd5e1;">No verified history yet</span>'
          : `${score}<span style="font-size: 14px; color: #71717a;">/100</span>`
      }</div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${projectUrl}" style="background-color: #00ff88; color: #0b0c16; font-size: 14px; font-weight: 700; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Update Progress →
      </a>
    </div>
  `);

  if (!resend) {
    // No API key means no email: report that instead of a mocked success.
    return { sent: false, reason: "email-not-configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "Voucht Reminders <reminders@voucht.tech>",
      to: [to],
      subject: `⏰ Reminder: '${milestoneTitle}' is due in 2 days`,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendMilestoneReminderEmail error:", error);
    return { sent: false, reason: "send-failed" };
  }
}

// 4. Crypto subscription expiring notice (3 days before expiry)
export async function sendSubscriptionExpiringEmail({
  to,
  name,
  plan,
  daysLeft = 3,
}: {
  to: string;
  name: string;
  plan: string;
  daysLeft?: number;
}) {
  const billingUrl = `${APP_URL}/dashboard/billing`;
  const planDisplay = plan.toUpperCase();

  const html = getEmailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Your Voucht ${planDisplay} Plan Expires in ${daysLeft} Days ⏳
    </h2>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 16px;">
      Hi <strong style="color: #ffffff;">${name}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 20px;">
      Your Voucht <strong>${planDisplay}</strong> crypto subscription will expire in <strong>${daysLeft} days</strong>. Since crypto payments require manual renewal, please extend your plan to keep your unlimited active projects, AI Smart Contracts, and dynamic SVG Trust Badges active without interruption.
    </p>

    <div style="background-color: #1a1b32; border: 1px solid #2a2b4d; border-radius: 10px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 12px; color: #71717a; text-transform: uppercase; font-weight: 600; margin-bottom: 8px;">Subscription Status</div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
        <span style="color: #94a3b8;">Current Tier:</span>
        <strong style="color: #00ff88;">${planDisplay}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 13px;">
        <span style="color: #94a3b8;">Renewal Method:</span>
        <span style="color: #ffffff;">Crypto (NOWPayments) / Card (CREEM)</span>
      </div>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${billingUrl}" style="background-color: #00ff88; color: #0b0c16; font-size: 14px; font-weight: 700; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Renew Subscription →
      </a>
    </div>

    <p style="font-size: 13px; line-height: 20px; color: #71717a; margin-bottom: 0;">
      If not renewed, your account will gracefully transition to the Free tier. All your past verified records and reviews remain permanently preserved.
    </p>
  `);

  if (!resend) {
    // No API key means no email: report that instead of a mocked success.
    return { sent: false, reason: "email-not-configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "Voucht Subscriptions <billing@voucht.tech>",
      to: [to],
      subject: `Your Voucht ${planDisplay} plan expires in ${daysLeft} days. Renew to keep your features.`,
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendSubscriptionExpiringEmail error:", error);
    return { sent: false, reason: "send-failed" };
  }
}

// 5. Payment failed notice
export async function sendPaymentFailedEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}) {
  const billingUrl = `${APP_URL}/dashboard/billing`;

  const html = getEmailWrapper(`
    <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 16px;">
      Action Required: Payment Failed ⚠️
    </h2>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 16px;">
      Hi <strong style="color: #ffffff;">${name}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 24px; color: #cbd5e1; margin-bottom: 20px;">
      Your payment failed. Please update your payment method to ensure uninterrupted access to your Voucht features.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${billingUrl}" style="background-color: #f87171; color: #0b0c16; font-size: 14px; font-weight: 700; padding: 12px 28px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Update Payment Method →
      </a>
    </div>
  `);

  if (!resend) {
    // No API key means no email: report that instead of a mocked success.
    return { sent: false, reason: "email-not-configured" };
  }

  try {
    const data = await resend.emails.send({
      from: "Voucht Billing <billing@voucht.tech>",
      to: [to],
      subject: "Your payment failed. Please update your payment method.",
      html,
    });
    return { sent: true };
  } catch (error) {
    console.error("sendPaymentFailedEmail error:", error);
    return { sent: false, reason: "send-failed" };
  }
}

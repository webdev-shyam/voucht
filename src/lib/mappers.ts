import type {
  ActivityItem,
  ActivityLog,
  BadgeTier,
  Contract,
  ContractDb,
  Delivery,
  Milestone,
  MilestoneDb,
  MilestoneStatusDb,
  Plan,
  Profile,
  Project,
  ProjectDb,
  Subscription,
  SubscriptionSummary,
  UserProfile,
} from "./types";

// The database speaks snake_case and keeps a null Trust Score for "no evidence
// yet"; the UI speaks camelCase. These mappers are the only place that bridge
// exists, so a missing value can never quietly become an invented one.

export function toUserProfile(row: Profile): UserProfile {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    fullName: row.full_name,
    bio: row.bio ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    trustScore: row.trust_score === null ? null : Number(row.trust_score),
    badgeTier: (row.badge_tier ?? "none") as BadgeTier,
    tier: (row.plan ?? "free") as Plan,
    createdAt: row.created_at,
    totalProjects: row.total_projects ?? 0,
    completedProjects: row.completed_projects ?? 0,
    onTimeRate: Number(row.on_time_rate ?? 0),
    ghostRate: Number(row.ghost_rate ?? 0),
    location: row.location ?? undefined,
    skill: row.skill ?? undefined,
    website: row.website ?? undefined,
    linkedinUrl: row.linkedin_url ?? undefined,
    planExpiresAt: row.plan_expires_at ?? null,
  };
}

export function toMilestone(
  row: MilestoneDb,
  delivery?: Delivery
): Milestone {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    description: row.description ?? undefined,
    amount: Number(row.amount ?? 0),
    dueDate: row.due_date,
    status: verifiedStatus(row.status, delivery),
    deliveredAt: row.freelancer_submitted_at ?? delivery?.submitted_at ?? undefined,
    confirmedAt: delivery?.client_confirmed_at ?? row.client_confirmed_at ?? undefined,
    isOnTime: delivery?.was_on_time ?? row.is_on_time ?? undefined,
    sortOrder: row.sort_order ?? 0,
    deliveryId: delivery?.id,
    verificationStatus: delivery?.verification_status,
    verificationToken: delivery?.confirmation_token,
    verificationExpiresAt: delivery?.verification_expires_at ?? undefined,
  };
}

// A milestone only counts as client-confirmed when a verified delivery record
// says so. milestones.status is writable by the account owner, deliveries are
// not, so the delivery is the proof the UI trusts.
function verifiedStatus(
  status: MilestoneStatusDb,
  delivery?: Delivery
): MilestoneStatusDb {
  if (!delivery) return status;
  if (delivery.verification_status === "confirmed") return "confirmed";
  if (delivery.verification_status === "disputed") return "disputed";
  return "delivered";
}

export function toProject(
  row: ProjectDb,
  milestones: MilestoneDb[],
  deliveries: Delivery[]
): Project {
  const byMilestone = new Map(deliveries.map((d) => [d.milestone_id, d]));

  return {
    id: row.id,
    userId: row.freelancer_id,
    title: row.project_title,
    description: row.description ?? undefined,
    clientName: row.client_name,
    clientEmail: row.client_email,
    totalBudget: Number(row.payment_amount ?? 0),
    currency: row.currency ?? "USD",
    startDate: row.started_at,
    deadline: row.deadline,
    status: row.status,
    clientConfirmed: row.client_confirmed ?? false,
    completedAt: row.completed_at ?? undefined,
    milestones: milestones
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((m) => toMilestone(m, byMilestone.get(m.id))),
    createdAt: row.created_at,
  };
}

export function toContract(row: ContractDb): Contract {
  return {
    id: row.id,
    userId: row.freelancer_id,
    title: row.title ?? row.contract_text.slice(0, 60),
    clientName: row.client_name,
    clientEmail: row.client_email,
    scopeOfWork: row.scope ?? "",
    contractText: row.contract_text ?? "",
    totalValue: Number(row.total_value ?? 0),
    currency: "USD",
    paymentTerms: row.payment_terms ?? "",
    ipClause: row.ip_clause ?? "",
    terminationTerms: row.termination_terms ?? "",
    status: row.status,
    generatedByAi: row.generated_by_ai ?? true,
    signedAt: row.signed_at ?? undefined,
    createdAt: row.created_at,
  };
}

export function toSubscription(row: Subscription): SubscriptionSummary {
  return {
    plan: row.plan,
    provider: row.payment_provider,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
  };
}

export function toActivityItem(row: ActivityLog): ActivityItem {
  return {
    id: row.id,
    type: row.action,
    title: activityTitle(row.action),
    description: row.description,
    createdAt: row.created_at,
  };
}

function activityTitle(action: string): string {
  switch (action) {
    case "project_created":
      return "Project created";
    case "milestone_created":
      return "Milestone added";
    case "delivery_submitted":
      return "Delivery submitted";
    case "delivery_confirmed":
      return "Client confirmed a delivery";
    case "delivery_disputed":
      return "Client disputed a delivery";
    case "contract_created":
      return "Contract draft created";
    case "profile_updated":
      return "Profile updated";
    case "subscription_changed":
      return "Plan changed";
    case "project_cancelled":
      return "Project cancelled";
    default:
      return "Activity";
  }
}

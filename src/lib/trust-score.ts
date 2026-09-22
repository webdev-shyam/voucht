import { Milestone, Project, TrustScoreBreakdown, TrustScoreFactors } from "./types";
import { TRUST_TIERS } from "./constants";

export interface TrustScoreInput {
  totalProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  avgResponseHours: number;
}

export interface TrustScoreResult {
  totalScore: number;        // 0-100
  deliveryRate: number;      // percentage
  onTimeRate: number;        // percentage
  ghostRate: number;         // percentage
  consistencyBonus: number;  // 0-15
  badgeTier: 'none' | 'building' | 'reliable' | 'exceptional';
}

/**
 * Client-side trust score calculation utility matching the database function:
 * Weights:
 * - Delivery Rate (completed/total): 40%
 * - On-Time Rate (onTime/totalDeliveries): 25%
 * - Anti-Ghost (100 - ghostRate): 20%
 * - Consistency Bonus (min(completedProjects * 1.5, 15)): 15%
 *
 * Badge tiers:
 * - exceptional: score >= 80 AND completedProjects >= 3
 * - reliable: score >= 60 AND completedProjects >= 2
 * - building: completedProjects >= 1
 * - none: default
 */
export function calculateTrustScore(input: TrustScoreInput): TrustScoreResult;
export function calculateTrustScore(projects: Project[], profileCreatedAt?: string): TrustScoreFactors;
export function calculateTrustScore(
  inputOrProjects: TrustScoreInput | Project[],
  profileCreatedAt?: string
): TrustScoreResult | TrustScoreFactors {
  if (Array.isArray(inputOrProjects)) {
    return calculateLegacyTrustScore(inputOrProjects, profileCreatedAt);
  }

  const input = inputOrProjects;
  const deliveryRate =
    input.totalProjects > 0 ? (input.completedProjects / input.totalProjects) * 100 : 0;
  const onTimeRate =
    input.totalDeliveries > 0 ? (input.onTimeDeliveries / input.totalDeliveries) * 100 : 0;
  const ghostRate =
    input.totalProjects > 0 ? (input.cancelledProjects / input.totalProjects) * 100 : 0;
  const consistencyBonus = Math.min(input.completedProjects * 1.5, 15);

  const baseScore =
    deliveryRate * 0.4 +
    onTimeRate * 0.25 +
    (100 - ghostRate) * 0.2;

  const totalScore = Math.round(
    Math.max(0, Math.min(100, baseScore + consistencyBonus))
  );

  let badgeTier: "none" | "building" | "reliable" | "exceptional" = "none";
  if (totalScore >= 80 && input.completedProjects >= 3) {
    badgeTier = "exceptional";
  } else if (totalScore >= 60 && input.completedProjects >= 2) {
    badgeTier = "reliable";
  } else if (input.completedProjects >= 1) {
    badgeTier = "building";
  }

  return {
    totalScore,
    deliveryRate: Math.round(deliveryRate),
    onTimeRate: Math.round(onTimeRate),
    ghostRate: Math.round(ghostRate),
    consistencyBonus: Math.round(consistencyBonus),
    badgeTier,
  };
}

function calculateLegacyTrustScore(
  projects: Project[],
  profileCreatedAt?: string
): TrustScoreFactors {
  if (!projects || projects.length === 0) {
    return {
      overallScore: 78,
      onTimeDelivery: 92,
      clientConfirmations: 85,
      disputeRate: 100,
      platformLongevity: 65,
      badges: ["Active Verified"],
    };
  }

  const allMilestones = projects.flatMap((p) => p.milestones || []);
  const totalMilestones = allMilestones.length;

  if (totalMilestones === 0) {
    return {
      overallScore: 78,
      onTimeDelivery: 92,
      clientConfirmations: 85,
      disputeRate: 100,
      platformLongevity: 65,
      badges: ["Active Verified"],
    };
  }

  const deliveredMilestones = allMilestones.filter(
    (m) => m.status === "delivered" || m.status === "confirmed"
  );

  let onTimeCount = 0;
  deliveredMilestones.forEach((m) => {
    if (!m.deliveredAt || !m.dueDate) {
      onTimeCount++;
    } else {
      const delivered = new Date(m.deliveredAt).getTime();
      const due = new Date(m.dueDate).getTime();
      if (delivered <= due + 24 * 60 * 60 * 1000) {
        onTimeCount++;
      }
    }
  });

  const onTimeRate =
    deliveredMilestones.length > 0
      ? (onTimeCount / deliveredMilestones.length) * 100
      : 92;

  const confirmedCount = allMilestones.filter((m) => m.status === "confirmed").length;
  const clientConfirmationRate =
    totalMilestones > 0 ? (confirmedCount / totalMilestones) * 100 : 85;

  const disputedCount = allMilestones.filter((m) => m.status === "disputed").length;
  const disputeRateScore =
    totalMilestones > 0
      ? Math.max(0, 100 - (disputedCount / totalMilestones) * 100 * 3)
      : 100;

  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const longevityScore = Math.min(100, 60 + completedProjects * 10);

  const rawScore =
    onTimeRate * 0.35 +
    clientConfirmationRate * 0.3 +
    disputeRateScore * 0.2 +
    longevityScore * 0.15;

  const overallScore = Math.round(Math.min(99, Math.max(25, rawScore)));

  const badges: string[] = ["Identity Verified"];
  if (overallScore >= TRUST_TIERS.ELITE.min) {
    badges.push("Elite 1% Talent", "Zero-Dispute Guarantee");
  } else if (overallScore >= TRUST_TIERS.PROVEN.min) {
    badges.push("Proven Performer", "Rapid Delivery");
  } else {
    badges.push("Active Verified");
  }

  if (confirmedCount >= 5) {
    badges.push("5+ Client Sign-offs");
  }

  return {
    overallScore,
    onTimeDelivery: Math.round(onTimeRate),
    clientConfirmations: Math.round(clientConfirmationRate),
    disputeRate: Math.round(disputeRateScore),
    platformLongevity: Math.round(longevityScore),
    badges,
  };
}

export function calculateTrustScoreBreakdown(
  totalProjects: number,
  completedProjects: number,
  totalDeliveries: number,
  onTimeDeliveries: number,
  cancelledProjects: number,
  avgResponseHours: number = 2.4
): TrustScoreBreakdown {
  if (totalProjects === 0) {
    return {
      deliveryRate: 0,
      onTimeRate: 0,
      responseSpeed: 100,
      ghostRate: 0,
      consistencyBonus: 0,
      totalScore: 0,
    };
  }

  const deliveryRate = (completedProjects / totalProjects) * 100;
  const onTimeRate = totalDeliveries > 0 ? (onTimeDeliveries / totalDeliveries) * 100 : 0;
  const ghostRate = (cancelledProjects / totalProjects) * 100;
  const consistencyBonus = Math.min(completedProjects * 1.5, 15);
  const responseSpeed = Math.max(0, 100 - avgResponseHours * 4);

  const baseScore =
    deliveryRate * 0.4 +
    onTimeRate * 0.25 +
    (100 - ghostRate) * 0.2;

  const totalScore = Math.round(
    Math.max(0, Math.min(100, baseScore + consistencyBonus))
  );

  return {
    deliveryRate: Math.round(deliveryRate),
    onTimeRate: Math.round(onTimeRate),
    responseSpeed: Math.round(responseSpeed),
    ghostRate: Math.round(ghostRate),
    consistencyBonus: Math.round(consistencyBonus),
    totalScore,
  };
}

export function getTierForScore(score: number) {
  if (score >= TRUST_TIERS.ELITE.min) return TRUST_TIERS.ELITE;
  if (score >= TRUST_TIERS.PROVEN.min) return TRUST_TIERS.PROVEN;
  if (score >= TRUST_TIERS.ESTABLISHED.min) return TRUST_TIERS.ESTABLISHED;
  return TRUST_TIERS.NEW;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Plan = "free" | "pro" | "elite";
export type BadgeTier = "none" | "building" | "reliable" | "exceptional";

export type ProjectStatus = "active" | "completed" | "cancelled" | "overdue" | "disputed";
export type MilestoneStatusDb = "pending" | "in_progress" | "submitted" | "confirmed" | "overdue";
export type DeliveryType = "milestone" | "final";
export type ContractStatus = "draft" | "sent" | "signed" | "expired";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type PaymentProvider = "creem" | "nowpayments";

// ==========================================
// SUPABASE GENERATED SCHEMA TYPE DEFINITIONS
// ==========================================
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          skill: string;
          bio: string | null;
          location: string | null;
          website: string | null;
          linkedin_url: string | null;
          trust_score: number;
          total_projects: number;
          completed_projects: number;
          on_time_rate: number;
          avg_response_hours: number;
          ghost_rate: number;
          badge_tier: BadgeTier;
          plan: Plan;
          plan_expires_at: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          skill?: string;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          linkedin_url?: string | null;
          trust_score?: number;
          total_projects?: number;
          completed_projects?: number;
          on_time_rate?: number;
          avg_response_hours?: number;
          ghost_rate?: number;
          badge_tier?: BadgeTier;
          plan?: Plan;
          plan_expires_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          skill?: string;
          bio?: string | null;
          location?: string | null;
          website?: string | null;
          linkedin_url?: string | null;
          trust_score?: number;
          total_projects?: number;
          completed_projects?: number;
          on_time_rate?: number;
          avg_response_hours?: number;
          ghost_rate?: number;
          badge_tier?: BadgeTier;
          plan?: Plan;
          plan_expires_at?: string | null;
          stripe_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          freelancer_id: string;
          client_name: string;
          client_email: string;
          client_confirmed: boolean;
          client_confirmed_at: string | null;
          client_token: string;
          project_title: string;
          description: string | null;
          deadline: string;
          payment_amount: number | null;
          currency: string;
          status: ProjectStatus;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          freelancer_id: string;
          client_name: string;
          client_email: string;
          client_confirmed?: boolean;
          client_confirmed_at?: string | null;
          client_token?: string;
          project_title: string;
          description?: string | null;
          deadline: string;
          payment_amount?: number | null;
          currency?: string;
          status?: ProjectStatus;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          freelancer_id?: string;
          client_name?: string;
          client_email?: string;
          client_confirmed?: boolean;
          client_confirmed_at?: string | null;
          client_token?: string;
          project_title?: string;
          description?: string | null;
          deadline?: string;
          payment_amount?: number | null;
          currency?: string;
          status?: ProjectStatus;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          due_date: string;
          status: MilestoneStatusDb;
          freelancer_submitted_at: string | null;
          client_confirmed_at: string | null;
          client_confirmation_token: string;
          is_on_time: boolean | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string | null;
          due_date: string;
          status?: MilestoneStatusDb;
          freelancer_submitted_at?: string | null;
          client_confirmed_at?: string | null;
          client_confirmation_token?: string;
          is_on_time?: boolean | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          title?: string;
          description?: string | null;
          due_date?: string;
          status?: MilestoneStatusDb;
          freelancer_submitted_at?: string | null;
          client_confirmed_at?: string | null;
          client_confirmation_token?: string;
          is_on_time?: boolean | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
        };
      };
      deliveries: {
        Row: {
          id: string;
          project_id: string;
          milestone_id: string | null;
          freelancer_id: string;
          client_email: string;
          client_name: string;
          delivery_type: DeliveryType;
          was_on_time: boolean;
          days_early_or_late: number;
          client_confirmed: boolean;
          client_confirmed_at: string | null;
          confirmation_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          milestone_id?: string | null;
          freelancer_id: string;
          client_email: string;
          client_name: string;
          delivery_type?: DeliveryType;
          was_on_time: boolean;
          days_early_or_late?: number;
          client_confirmed?: boolean;
          client_confirmed_at?: string | null;
          confirmation_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          milestone_id?: string | null;
          freelancer_id?: string;
          client_email?: string;
          client_name?: string;
          delivery_type?: DeliveryType;
          was_on_time?: boolean;
          days_early_or_late?: number;
          client_confirmed?: boolean;
          client_confirmed_at?: string | null;
          confirmation_token?: string;
          created_at?: string;
        };
      };
      contracts: {
        Row: {
          id: string;
          project_id: string | null;
          freelancer_id: string;
          client_name: string;
          client_email: string;
          contract_text: string;
          scope: string | null;
          payment_terms: string | null;
          deadline: string | null;
          freelancer_signed: boolean;
          client_signed: boolean;
          freelancer_signed_at: string | null;
          client_signed_at: string | null;
          sign_token: string;
          status: ContractStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id?: string | null;
          freelancer_id: string;
          client_name: string;
          client_email: string;
          contract_text: string;
          scope?: string | null;
          payment_terms?: string | null;
          deadline?: string | null;
          freelancer_signed?: boolean;
          client_signed?: boolean;
          freelancer_signed_at?: string | null;
          client_signed_at?: string | null;
          sign_token?: string;
          status?: ContractStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string | null;
          freelancer_id?: string;
          client_name?: string;
          client_email?: string;
          contract_text?: string;
          scope?: string | null;
          payment_terms?: string | null;
          deadline?: string | null;
          freelancer_signed?: boolean;
          client_signed?: boolean;
          freelancer_signed_at?: string | null;
          client_signed_at?: string | null;
          sign_token?: string;
          status?: ContractStatus;
          created_at?: string;
        };
      };
      activity_log: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          action: string;
          description: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          action: string;
          description: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          action?: string;
          description?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "pro" | "elite";
          payment_provider: PaymentProvider;
          provider_subscription_id: string | null;
          status: SubscriptionStatus;
          current_period_start: string | null;
          current_period_end: string | null;
          amount: number;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan: "pro" | "elite";
          payment_provider: PaymentProvider;
          provider_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          amount: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "pro" | "elite";
          payment_provider?: PaymentProvider;
          provider_subscription_id?: string | null;
          status?: SubscriptionStatus;
          current_period_start?: string | null;
          current_period_end?: string | null;
          amount?: number;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      profile_views: {
        Row: {
          id: string;
          profile_id: string;
          viewer_ip: string | null;
          viewer_country: string | null;
          referrer: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          viewer_ip?: string | null;
          viewer_country?: string | null;
          referrer?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          viewer_ip?: string | null;
          viewer_country?: string | null;
          referrer?: string | null;
          viewed_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      recalculate_trust_score: {
        Args: {
          p_freelancer_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      badge_tier: BadgeTier;
      plan: Plan;
      project_status: ProjectStatus;
      milestone_status: MilestoneStatusDb;
      delivery_type: DeliveryType;
      contract_status: ContractStatus;
      subscription_status: SubscriptionStatus;
    };
  };
}

// Convenience Row Types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type ProjectDb = Database["public"]["Tables"]["projects"]["Row"];
export type MilestoneDb = Database["public"]["Tables"]["milestones"]["Row"];
export type Delivery = Database["public"]["Tables"]["deliveries"]["Row"];
export type ContractDb = Database["public"]["Tables"]["contracts"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];
export type Subscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type ProfileView = Database["public"]["Tables"]["profile_views"]["Row"];

// Trust score mathematical breakdown
export interface TrustScoreBreakdown {
  deliveryRate: number;
  onTimeRate: number;
  responseSpeed: number;
  ghostRate: number;
  consistencyBonus: number;
  totalScore: number;
}

// Backward-compatible frontend application models
export type UserRole = "freelancer" | "agency" | "client";
export type SubscriptionTier = "free" | "pro" | "agency" | "elite";

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  headline?: string;
  bio?: string;
  avatarUrl?: string;
  role: UserRole;
  trustScore: number;
  tier: SubscriptionTier;
  createdAt: string;
  verifiedDeliveriesCount: number;
  onTimeRate: number;
  clientSatisfactionScore: number;
  badgeTier?: BadgeTier;
  location?: string;
  skill?: string;
}

export type MilestoneStatus = "pending" | "in_progress" | "delivered" | "confirmed" | "disputed" | "submitted" | "overdue";

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  deliveredAt?: string;
  confirmedAt?: string;
  verificationToken?: string;
  clientFeedback?: string;
  rating?: number;
  isOnTime?: boolean;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  clientName: string;
  clientEmail: string;
  clientCompany?: string;
  totalBudget: number;
  currency: string;
  startDate: string;
  deadline: string;
  status: "active" | "completed" | "archived" | "cancelled" | "disputed" | "overdue";
  clientConfirmed?: boolean;
  completedAt?: string;
  milestones: Milestone[];
  createdAt: string;
}

export interface Contract {
  id: string;
  userId: string;
  title: string;
  clientName: string;
  clientEmail: string;
  scopeOfWork: string;
  totalValue: number;
  currency: string;
  paymentTerms: string;
  ipClause: string;
  terminationTerms: string;
  status: "draft" | "sent" | "signed" | "expired";
  generatedByAi: boolean;
  signedAt?: string;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: "milestone_delivered" | "milestone_confirmed" | "contract_signed" | "score_updated" | "project_created";
  title: string;
  description: string;
  timestamp: string;
  scoreChange?: number;
}

export interface TrustScoreFactors {
  overallScore: number;
  onTimeDelivery: number;
  clientConfirmations: number;
  disputeRate: number;
  platformLongevity: number;
  badges: string[];
}

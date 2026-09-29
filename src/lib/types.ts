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
export type MilestoneStatusDb =
  | "pending"
  | "in_progress"
  | "submitted"
  | "delivered"
  | "confirmed"
  | "disputed"
  | "overdue";
export type VerificationStatus = "pending" | "confirmed" | "disputed" | "expired";
export type DeliveryType = "milestone" | "final";
export type ContractStatus = "draft" | "sent" | "signed" | "expired";
export type SubscriptionStatus = "active" | "cancelled" | "expired" | "past_due";
export type PaymentProvider = "creem" | "nowpayments";

// ==========================================
// SUPABASE GENERATED SCHEMA TYPE DEFINITIONS
// ==========================================
// Mirrors supabase/schema.sql plus supabase/migrations/. Regenerate after
// applying a migration: `npx supabase gen types typescript --linked > ...`.
// `Relationships: []` is deliberate: no query in this app selects embedded
// resources, related rows are fetched per table and joined in src/lib/mappers.ts.
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
          trust_score: number | null;
          total_projects: number;
          completed_projects: number;
          on_time_rate: number;
          ghost_rate: number;
          badge_tier: BadgeTier;
          plan: Plan;
          plan_expires_at: string | null;
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
          // plan / plan_expires_at are written only by payment webhooks running
          // as service_role; the enforce_profile_column_rules trigger rejects
          // any client-session attempt to change them.
          plan?: Plan;
          plan_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          freelancer_id: string;
          client_name: string;
          client_email: string;
          client_confirmed: boolean;
          client_confirmed_at: string | null;
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
        Relationships: [];
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
          is_on_time: boolean | null;
          notes: string | null;
          sort_order: number;
          amount: number | null;
          created_at: string;
          updated_at: string | null;
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
          is_on_time?: boolean | null;
          notes?: string | null;
          sort_order?: number;
          amount?: number | null;
          created_at?: string;
          updated_at?: string | null;
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
          is_on_time?: boolean | null;
          notes?: string | null;
          sort_order?: number;
          amount?: number | null;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
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
          submitted_at: string;
          was_on_time: boolean;
          days_early_or_late: number;
          verification_status: VerificationStatus;
          verification_expires_at: string | null;
          client_confirmed: boolean;
          client_confirmed_at: string | null;
          dispute_reason: string | null;
          recorded_at: string;
          confirmation_token: string;
          created_at: string;
        };
        Insert: {
          project_id: string;
          milestone_id?: string | null;
          freelancer_id: string;
          client_email: string;
          client_name: string;
          delivery_type?: DeliveryType;
          // was_on_time and days_early_or_late are omitted on purpose: a BEFORE
          // INSERT trigger derives them from the recorded deadline, so a client
          // cannot submit a delivery that claims to be early.
          client_confirmed?: boolean;
          created_at?: string;
        };
        // Verified receipts are immutable; only the verification RPCs move them.
        Update: Record<string, never>;
        Relationships: [];
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
          title: string | null;
          total_value: number | null;
          ip_clause: string | null;
          termination_terms: string | null;
          generated_by_ai: boolean | null;
          signed_at: string | null;
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
          title?: string | null;
          total_value?: number | null;
          ip_clause?: string | null;
          termination_terms?: string | null;
          generated_by_ai?: boolean | null;
          signed_at?: string | null;
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
          title?: string | null;
          total_value?: number | null;
          ip_clause?: string | null;
          termination_terms?: string | null;
          generated_by_ai?: boolean | null;
          signed_at?: string | null;
          sign_token?: string;
          status?: ContractStatus;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
      profile_views: {
        Row: {
          id: string;
          profile_id: string;
          viewer_hash: string | null;
          viewer_country: string | null;
          referrer_domain: string | null;
          source: string | null;
          viewed_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          viewer_hash?: string | null;
          viewer_country?: string | null;
          referrer_domain?: string | null;
          source?: string | null;
          viewed_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          viewer_hash?: string | null;
          viewer_country?: string | null;
          referrer_domain?: string | null;
          source?: string | null;
          viewed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      public_profiles: {
        Row: {
          id: string;
          username: string;
          full_name: string;
          avatar_url: string | null;
          skill: string;
          bio: string | null;
          location: string | null;
          website: string | null;
          linkedin_url: string | null;
          trust_score: number | null;
          badge_tier: BadgeTier;
          total_projects: number;
          completed_projects: number;
          on_time_rate: number;
          ghost_rate: number;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      public_deliveries: {
        Row: {
          id: string;
          freelancer_id: string;
          project_id: string;
          milestone_id: string | null;
          project_title: string;
          milestone_title: string | null;
          delivery_type: DeliveryType;
          was_on_time: boolean;
          days_early_or_late: number;
          client_label: string;
          client_confirmed_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Functions: {
      get_verification_request: {
        Args: {
          p_token: string;
        };
        Returns: Json;
      };
      record_verification: {
        Args: {
          p_token: string;
          p_action: "confirm" | "dispute";
          p_reason?: string | null;
        };
        Returns: Json;
      };
      recalculate_trust_score: {
        Args: {
          p_freelancer_id: string;
        };
        Returns: number | null;
      };
      mask_client_name: {
        Args: {
          p_client_name: string;
        };
        Returns: string;
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

// Backward-compatible frontend application models
export type MilestoneStatus = MilestoneStatusDb;

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  // null means "no verified work history yet" — it is not a score of zero.
  trustScore: number | null;
  badgeTier: BadgeTier;
  tier: Plan;
  createdAt: string;
  totalProjects: number;
  completedProjects: number;
  onTimeRate: number;
  ghostRate: number;
  location?: string;
  skill?: string;
  website?: string;
  linkedinUrl?: string;
  // When a paid plan stops applying; null on free accounts.
  planExpiresAt?: string | null;
}

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
  isOnTime?: boolean;
  sortOrder: number;
  // Verification state lives on the delivery record, not on the milestone.
  deliveryId?: string;
  verificationStatus?: VerificationStatus;
  // Readable only by the delivery's owner; the client never sees this field.
  verificationToken?: string;
  verificationExpiresAt?: string;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  clientName: string;
  clientEmail: string;
  totalBudget: number;
  currency: string;
  startDate: string;
  deadline: string;
  status: ProjectStatus;
  clientConfirmed: boolean;
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
  // The full markdown that was reviewed and saved, so the list can show the
  // same text the user approved instead of a summary of it.
  contractText: string;
  totalValue: number;
  currency: string;
  paymentTerms: string;
  ipClause: string;
  terminationTerms: string;
  status: ContractStatus;
  generatedByAi: boolean;
  signedAt?: string;
  createdAt: string;
}

// Mirrors the action values written to activity_log.
export type ActivityAction =
  | "project_created"
  | "milestone_created"
  | "delivery_submitted"
  | "delivery_confirmed"
  | "delivery_disputed"
  | "contract_created"
  | "profile_updated"
  | "subscription_changed"
  | "project_cancelled";

export interface ActivityItem {
  id: string;
  type: ActivityAction | string;
  title: string;
  description: string;
  createdAt: string;
}

// What the billing screen may show about a subscription. Every field is read
// from the row a payment webhook wrote — the app never stores plan state in
// the browser.
export interface SubscriptionSummary {
  plan: "pro" | "elite";
  provider: PaymentProvider;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

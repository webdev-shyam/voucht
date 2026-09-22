import { create } from "zustand";
import { ActivityItem, Contract, Milestone, Project, SubscriptionTier, TrustScoreFactors, UserProfile } from "@/lib/types";
import { calculateTrustScore } from "@/lib/trust-score";

interface AppState {
  user: UserProfile;
  projects: Project[];
  contracts: Contract[];
  activities: ActivityItem[];
  trustFactors: TrustScoreFactors;
  
  // Actions
  setUser: (user: Partial<UserProfile>) => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  addProject: (project: Omit<Project, "id" | "createdAt" | "userId">) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addMilestone: (projectId: string, milestone: Omit<Milestone, "id" | "projectId">) => void;
  deliverMilestone: (projectId: string, milestoneId: string) => void;
  confirmMilestone: (projectId: string, milestoneId: string, feedback?: string, rating?: number) => void;
  addContract: (contract: Omit<Contract, "id" | "createdAt" | "userId">) => Contract;
  recalculateTrustScore: () => void;
  logActivity: (activity: Omit<ActivityItem, "id" | "timestamp"> & { timestamp?: string }) => void;
  completeProject: (projectId: string) => void;
  cancelProject: (projectId: string) => void;
}

const INITIAL_USER: UserProfile = {
  id: "usr_alex_voucht",
  username: "alexrivera",
  email: "alex@riveradesign.co",
  fullName: "Alex Rivera",
  headline: "Principal Product Designer & Full-Stack Architect",
  bio: "Designing high-conversion design systems and fullstack Next.js web applications for funded fintech and AI companies. 100% verified delivery record.",
  avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
  role: "freelancer",
  trustScore: 94,
  tier: "pro",
  createdAt: "2024-01-15T00:00:00Z",
  verifiedDeliveriesCount: 28,
  onTimeRate: 98,
  clientSatisfactionScore: 9.8,
};

const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj_fintech_os",
    userId: "usr_alex_voucht",
    title: "Aura Pay - Mobile Banking Redesign & Design System",
    clientName: "Elena Rostova",
    clientEmail: "elena@aurapay.io",
    clientCompany: "Aura Financial Technologies",
    totalBudget: 14500,
    currency: "USD",
    startDate: "2024-07-01",
    deadline: "2024-09-30",
    status: "active",
    createdAt: "2024-07-01T10:00:00Z",
    milestones: [
      {
        id: "ms_1",
        projectId: "proj_fintech_os",
        title: "User Journey Maps & Wireframes",
        description: "Complete IA documentation, wireframes for 32 screens, and design tokens.",
        amount: 4500,
        dueDate: "2024-07-20",
        status: "confirmed",
        deliveredAt: "2024-07-18T14:00:00Z",
        confirmedAt: "2024-07-19T09:30:00Z",
        clientFeedback: "Phenomenal attention to detail. Delivered 2 days early.",
        rating: 5,
      },
      {
        id: "ms_2",
        projectId: "proj_fintech_os",
        title: "High-Fidelity Component Library & Prototype",
        description: "Interactive Figma prototype and responsive dark/light modes.",
        amount: 5500,
        dueDate: "2024-08-25",
        status: "confirmed",
        deliveredAt: "2024-08-24T18:00:00Z",
        confirmedAt: "2024-08-25T11:00:00Z",
        clientFeedback: "Our engineers loved the token structure. Flawless execution.",
        rating: 5,
      },
      {
        id: "ms_3",
        projectId: "proj_fintech_os",
        title: "Developer Handoff & Motion Specs",
        description: "Tailwind tokens export, micro-interactions, and code review guidance.",
        amount: 4500,
        dueDate: "2024-09-28",
        status: "delivered",
        deliveredAt: "2024-09-26T16:00:00Z",
        verificationToken: "tok_aura_hand_982",
      },
    ],
  },
  {
    id: "proj_saas_crm",
    userId: "usr_alex_voucht",
    title: "Orbit Analytics - Realtime Event Dashboard",
    clientName: "Marcus Vance",
    clientEmail: "marcus@orbitdata.dev",
    clientCompany: "Orbit Inc.",
    totalBudget: 9800,
    currency: "USD",
    startDate: "2024-05-10",
    deadline: "2024-06-25",
    status: "completed",
    createdAt: "2024-05-10T08:00:00Z",
    milestones: [
      {
        id: "ms_4",
        projectId: "proj_saas_crm",
        title: "API Architecture & Realtime Pipeline",
        description: "Next.js backend proxy with SSE data feeds and caching.",
        amount: 4800,
        dueDate: "2024-05-30",
        status: "confirmed",
        deliveredAt: "2024-05-28T12:00:00Z",
        confirmedAt: "2024-05-29T10:00:00Z",
        clientFeedback: "Top tier engineer. Would hire again in a heartbeat.",
        rating: 5,
      },
      {
        id: "ms_5",
        projectId: "proj_saas_crm",
        title: "Recharts Custom Visualizer & Edge Deployment",
        description: "Interactive data analytics suite deployed with zero latency.",
        amount: 5000,
        dueDate: "2024-06-25",
        status: "confirmed",
        deliveredAt: "2024-06-23T11:00:00Z",
        confirmedAt: "2024-06-24T15:00:00Z",
        clientFeedback: "Exceeded all performance benchmarks.",
        rating: 5,
      },
    ],
  },
];

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: "cnt_1",
    userId: "usr_alex_voucht",
    title: "Master Services Agreement - Aura Pay",
    clientName: "Elena Rostova",
    clientEmail: "elena@aurapay.io",
    scopeOfWork: "Full product design and design system specifications.",
    totalValue: 14500,
    currency: "USD",
    paymentTerms: "Net 7 from milestone sign-off on Voucht.",
    ipClause: "100% assignment upon final payment.",
    terminationTerms: "14 days written notice.",
    status: "signed",
    generatedByAi: true,
    signedAt: "2024-07-02T14:30:00Z",
    createdAt: "2024-07-01T11:00:00Z",
  },
];

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: "act_1",
    type: "milestone_delivered",
    title: "Delivered: Developer Handoff & Motion Specs",
    description: "Milestone sent for Aura Pay verification.",
    timestamp: "2 hours ago",
  },
  {
    id: "act_2",
    type: "milestone_confirmed",
    title: "Sign-off Received: High-Fidelity Prototype",
    description: "Elena Rostova verified delivery with 5.0 rating.",
    timestamp: "3 days ago",
    scoreChange: 2,
  },
  {
    id: "act_3",
    type: "score_updated",
    title: "Trust Score increased to 94",
    description: "Maintained 98% on-time delivery metric across 28 milestones.",
    timestamp: "1 week ago",
    scoreChange: 1,
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  user: INITIAL_USER,
  projects: INITIAL_PROJECTS,
  contracts: INITIAL_CONTRACTS,
  activities: INITIAL_ACTIVITIES,
  trustFactors: calculateTrustScore(INITIAL_PROJECTS),

  setUser: (updates) => {
    set((state) => ({ user: { ...state.user, ...updates } }));
  },

  setSubscriptionTier: (tier) => {
    set((state) => ({ user: { ...state.user, tier } }));
  },

  addProject: (data) => {
    const newProject: Project = {
      ...data,
      id: `proj_${Date.now()}`,
      userId: get().user.id,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const updatedProjects = [newProject, ...state.projects];
      return {
        projects: updatedProjects,
        trustFactors: calculateTrustScore(updatedProjects),
        activities: [
          {
            id: `act_${Date.now()}`,
            type: "project_created",
            title: `New Project: ${newProject.title}`,
            description: `Started with ${newProject.clientName} (${newProject.currency} ${newProject.totalBudget})`,
            timestamp: "Just now",
          },
          ...state.activities,
        ],
      };
    });
    return newProject;
  },

  updateProject: (id, updates) => {
    set((state) => {
      const updatedProjects = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      return {
        projects: updatedProjects,
        trustFactors: calculateTrustScore(updatedProjects),
      };
    });
  },

  addMilestone: (projectId, milestoneData) => {
    const newMilestone: Milestone = {
      ...milestoneData,
      id: `ms_${Date.now()}`,
      projectId,
      verificationToken: `tok_${Math.random().toString(36).substring(2, 10)}`,
    };
    set((state) => {
      const updatedProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: [...p.milestones, newMilestone],
        };
      });
      return {
        projects: updatedProjects,
        trustFactors: calculateTrustScore(updatedProjects),
      };
    });
  },

  deliverMilestone: (projectId, milestoneId) => {
    const now = new Date().toISOString();
    set((state) => {
      let milestoneTitle = "Milestone";
      const updatedProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            milestoneTitle = m.title;
            return {
              ...m,
              status: "delivered" as const,
              deliveredAt: now,
              verificationToken: m.verificationToken || `tok_${Math.random().toString(36).substring(2, 10)}`,
            };
          }),
        };
      });

      return {
        projects: updatedProjects,
        trustFactors: calculateTrustScore(updatedProjects),
        activities: [
          {
            id: `act_${Date.now()}`,
            type: "milestone_delivered",
            title: `Delivered: ${milestoneTitle}`,
            description: "Verification link dispatched to client.",
            timestamp: "Just now",
          },
          ...state.activities,
        ],
      };
    });
  },

  confirmMilestone: (projectId, milestoneId, feedback, rating = 5) => {
    const now = new Date().toISOString();
    set((state) => {
      let milestoneTitle = "Milestone";
      const updatedProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          milestones: p.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            milestoneTitle = m.title;
            return {
              ...m,
              status: "confirmed" as const,
              confirmedAt: now,
              clientFeedback: feedback || "Delivery confirmed.",
              rating,
            };
          }),
        };
      });

      const newFactors = calculateTrustScore(updatedProjects);
      return {
        projects: updatedProjects,
        trustFactors: newFactors,
        user: {
          ...state.user,
          trustScore: newFactors.overallScore,
          verifiedDeliveriesCount: state.user.verifiedDeliveriesCount + 1,
        },
        activities: [
          {
            id: `act_${Date.now()}`,
            type: "milestone_confirmed",
            title: `Verified Sign-off: ${milestoneTitle}`,
            description: `Client verified work. Trust score updated!`,
            timestamp: "Just now",
            scoreChange: 1,
          },
          ...state.activities,
        ],
      };
    });
  },

  addContract: (data) => {
    const newContract: Contract = {
      ...data,
      id: `cnt_${Date.now()}`,
      userId: get().user.id,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      contracts: [newContract, ...state.contracts],
      activities: [
        {
          id: `act_${Date.now()}`,
          type: "contract_signed",
          title: `Contract Created: ${newContract.title}`,
          description: `Ready for client signature (${newContract.currency} ${newContract.totalValue})`,
          timestamp: "Just now",
        },
        ...state.activities,
      ],
    }));
    return newContract;
  },

  recalculateTrustScore: () => {
    const updatedProjects = get().projects;
    const newFactors = calculateTrustScore(updatedProjects);
    set((state) => ({
      trustFactors: newFactors,
      user: {
        ...state.user,
        trustScore: newFactors.overallScore,
      },
    }));
  },

  logActivity: (activity) => {
    set((state) => ({
      activities: [
        {
          ...activity,
          id: `act_${Date.now()}`,
          timestamp: activity.timestamp || "Just now",
        },
        ...state.activities,
      ],
    }));
  },

  completeProject: (projectId) => {
    const now = new Date().toISOString();
    set((state) => {
      let completedTitle = "Project";
      const updatedProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        completedTitle = p.title;
        return {
          ...p,
          status: "completed" as const,
          completedAt: now,
        };
      });

      const newFactors = calculateTrustScore(updatedProjects);
      return {
        projects: updatedProjects,
        trustFactors: newFactors,
        user: {
          ...state.user,
          trustScore: Math.min(100, newFactors.overallScore + 3),
          verifiedDeliveriesCount: state.user.verifiedDeliveriesCount + 1,
        },
        activities: [
          {
            id: `act_${Date.now()}`,
            type: "milestone_confirmed",
            title: `Completed Project '${completedTitle}'`,
            description: "All contractual milestones fully verified & archived in the trust ledger.",
            timestamp: "Just now",
            scoreChange: 3,
          },
          ...state.activities,
        ],
      };
    });
  },

  cancelProject: (projectId) => {
    set((state) => {
      let cancelledTitle = "Project";
      const updatedProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        cancelledTitle = p.title;
        return {
          ...p,
          status: "disputed" as const,
        };
      });

      const newFactors = calculateTrustScore(updatedProjects);
      return {
        projects: updatedProjects,
        trustFactors: newFactors,
        user: {
          ...state.user,
          trustScore: Math.max(10, newFactors.overallScore - 5),
        },
        activities: [
          {
            id: `act_${Date.now()}`,
            type: "milestone_delivered",
            title: `Cancelled project '${cancelledTitle}'`,
            description: "Engagement terminated. Trust score recalibrated.",
            timestamp: "Just now",
            scoreChange: -5,
          },
          ...state.activities,
        ],
      };
    });
  },
}));

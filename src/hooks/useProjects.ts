import { useAppStore } from "@/store/useAppStore";

// Thin selector over the Supabase-backed store so pages don't reach into every
// action. Nothing here computes a score or fabricates a fallback.
export function useProjects() {
  const status = useAppStore((state) => state.status);
  const error = useAppStore((state) => state.error);
  const projects = useAppStore((state) => state.projects);
  const load = useAppStore((state) => state.load);
  const createProject = useAppStore((state) => state.createProject);
  const addMilestone = useAppStore((state) => state.addMilestone);
  const submitDelivery = useAppStore((state) => state.submitDelivery);
  const sendVerificationRequest = useAppStore((state) => state.sendVerificationRequest);
  const setProjectStatus = useAppStore((state) => state.setProjectStatus);

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");

  // Sum of budgets for work in flight or finished; cancelled projects are
  // excluded so the figure matches what the ledger actually shows.
  const totalValue = projects
    .filter((p) => p.status !== "cancelled")
    .reduce((acc, p) => acc + p.totalBudget, 0);

  return {
    status,
    error,
    projects,
    activeProjects,
    completedProjects,
    totalValue,
    isLoading: status === "idle" || status === "loading",
    load,
    createProject,
    addMilestone,
    submitDelivery,
    sendVerificationRequest,
    setProjectStatus,
  };
}

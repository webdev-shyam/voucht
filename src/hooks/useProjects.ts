import { useAppStore } from "@/store/useAppStore";

export function useProjects() {
  const projects = useAppStore((state) => state.projects);
  const addProject = useAppStore((state) => state.addProject);
  const updateProject = useAppStore((state) => state.updateProject);
  const addMilestone = useAppStore((state) => state.addMilestone);
  const deliverMilestone = useAppStore((state) => state.deliverMilestone);
  const confirmMilestone = useAppStore((state) => state.confirmMilestone);

  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");

  const totalRevenue = projects.reduce((acc, p) => acc + p.totalBudget, 0);

  return {
    projects,
    activeProjects,
    completedProjects,
    totalRevenue,
    addProject,
    updateProject,
    addMilestone,
    deliverMilestone,
    confirmMilestone,
  };
}

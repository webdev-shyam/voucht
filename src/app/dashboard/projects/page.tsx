"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Calendar,
  Clock,
  FolderKanban,
  Plus,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { UpgradeModal } from "@/components/dashboard/UpgradeModal";
import { useProjects } from "@/hooks/useProjects";
import { useAppStore } from "@/store/useAppStore";
import { canAccess } from "@/lib/utils";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects } = useProjects();
  const user = useAppStore((state) => state.user);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "overdue">("all");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const now = new Date();

  // Determine active and overdue projects
  const activeProjects = projects.filter((p) => p.status === "active");
  const completedProjects = projects.filter((p) => p.status === "completed");
  const overdueProjects = projects.filter((p) => {
    if (p.status === "completed") return false;
    const deadline = new Date(p.deadline);
    return deadline.getTime() < now.getTime();
  });

  const handleNewProjectClick = (e: React.MouseEvent) => {
    // FREE PLAN GATE: If user cannot access unlimited projects and already has 1 active project, show modal
    if (!canAccess(user.tier, "unlimited_projects") && activeProjects.length >= 1) {
      e.preventDefault();
      setShowUpgradeModal(true);
      return;
    }
    router.push("/dashboard/projects/new");
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.clientName.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "active") return p.status === "active";
    if (filter === "completed") return p.status === "completed";
    if (filter === "overdue") {
      if (p.status === "completed") return false;
      return new Date(p.deadline).getTime() < now.getTime();
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-electric" />
            <span>My Projects</span>
          </h1>
          <p className="text-sm text-textSecondary mt-1">
            Track client engagements, milestones, and verifiable delivery receipts.
          </p>
        </div>

        {/* + New Project button (green, top right) */}
        <Button
          onClick={handleNewProjectClick}
          variant="electric"
          className="font-bold shadow-md h-10 px-5 gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Project</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface border border-surfaceLight">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-textSecondary absolute left-3.5 top-3" />
          <Input
            placeholder="Search projects or client names..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-navyLight border-surfaceLight h-10 text-sm text-white placeholder:text-textSecondary/60 focus:border-electric"
          />
        </div>

        {/* Filter tabs: All | Active | Completed | Overdue */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button
            size="sm"
            variant={filter === "all" ? "electric" : "ghost"}
            onClick={() => setFilter("all")}
            className="text-xs h-8 px-3 font-semibold"
          >
            All ({projects.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "active" ? "electric" : "ghost"}
            onClick={() => setFilter("active")}
            className="text-xs h-8 px-3 font-semibold"
          >
            Active ({activeProjects.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "completed" ? "electric" : "ghost"}
            onClick={() => setFilter("completed")}
            className="text-xs h-8 px-3 font-semibold"
          >
            Completed ({completedProjects.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "overdue" ? "destructive" : "ghost"}
            onClick={() => setFilter("overdue")}
            className="text-xs h-8 px-3 font-semibold text-red-400 hover:text-red-300"
          >
            Overdue ({overdueProjects.length})
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        /* Empty state with illustration */
        <div className="text-center py-20 px-6 border-2 border-dashed border-surfaceLight rounded-2xl bg-surface/40 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-navyLight/80 border border-surfaceLight flex items-center justify-center mb-4 text-electric shadow-inner">
            <FolderKanban className="w-8 h-8 opacity-80" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            No projects found
          </h3>
          <p className="text-xs sm:text-sm text-textSecondary max-w-sm mb-6 leading-relaxed">
            {search
              ? `No results matching "${search}". Try adjusting your search query or filter.`
              : "You have no projects in this filter. Start tracking your verified milestones now."}
          </p>
          <Button
            onClick={handleNewProjectClick}
            variant="electric"
            size="sm"
            className="font-bold h-9 gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Project</span>
          </Button>
        </div>
      )}

      {/* FREE PLAN GATE MODAL */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="unlimited_projects"
      />
    </div>
  );
}

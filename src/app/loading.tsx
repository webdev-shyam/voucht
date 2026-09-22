import { Skeleton } from "@/components/ui/skeleton";
import { Check } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-navy text-white flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-electric/15 border border-electric/40 flex items-center justify-center text-electric animate-pulse">
          <Check className="w-6 h-6 stroke-[3]" />
        </div>
        <div className="space-y-2 text-center">
          <Skeleton className="h-4 w-32 mx-auto bg-surfaceLight/80" />
          <Skeleton className="h-3 w-48 mx-auto bg-surfaceLight/50" />
        </div>
      </div>
    </div>
  );
}

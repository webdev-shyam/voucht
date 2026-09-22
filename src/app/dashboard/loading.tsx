import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Welcome / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-surfaceLight/80" />
          <Skeleton className="h-4 w-96 bg-surfaceLight/50" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md bg-surfaceLight/80" />
          <Skeleton className="h-9 w-32 rounded-md bg-surfaceLight/80" />
        </div>
      </div>

      {/* Trust Score & Quick Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 p-6 rounded-2xl bg-surface border border-surfaceLight space-y-4">
          <Skeleton className="h-5 w-36 bg-surfaceLight/70" />
          <div className="flex justify-center my-4">
            <Skeleton className="h-32 w-32 rounded-full bg-surfaceLight/60" />
          </div>
          <Skeleton className="h-4 w-48 mx-auto bg-surfaceLight/50" />
        </div>

        <div className="lg:col-span-2 p-6 rounded-2xl bg-surface border border-surfaceLight space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-40 bg-surfaceLight/70" />
            <Skeleton className="h-4 w-20 bg-surfaceLight/50" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl bg-navyLight border border-surfaceLight/50" />
            ))}
          </div>
          <Skeleton className="h-16 w-full rounded-xl bg-surfaceLight/40 mt-4" />
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-xl bg-surface border border-surfaceLight space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="h-3 w-24 bg-surfaceLight/60" />
              <Skeleton className="h-8 w-8 rounded-lg bg-surfaceLight/60" />
            </div>
            <Skeleton className="h-8 w-16 bg-surfaceLight/90" />
            <Skeleton className="h-3 w-28 bg-surfaceLight/50" />
          </div>
        ))}
      </div>

      {/* Main Grid: Projects and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-40 bg-surfaceLight/80" />
            <Skeleton className="h-4 w-24 bg-surfaceLight/50" />
          </div>
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-xl bg-surface border border-surfaceLight space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48 bg-surfaceLight/80" />
                  <Skeleton className="h-3 w-32 bg-surfaceLight/50" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full bg-surfaceLight/70" />
              </div>
              <Skeleton className="h-2 w-full rounded bg-surfaceLight/50" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28 bg-surfaceLight/50" />
                <Skeleton className="h-4 w-20 bg-surfaceLight/50" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-36 bg-surfaceLight/80" />
          <div className="p-5 rounded-xl bg-surface border border-surfaceLight space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 items-center">
                <Skeleton className="h-8 w-8 rounded-full bg-surfaceLight/60 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3.5 w-full bg-surfaceLight/70" />
                  <Skeleton className="h-2.5 w-20 bg-surfaceLight/40" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

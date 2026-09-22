import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-navy text-white pb-20">
      {/* Top Banner */}
      <div className="h-48 w-full bg-surface border-b border-surfaceLight relative animate-pulse" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 space-y-8">
        {/* Profile Card Header */}
        <div className="p-8 rounded-2xl bg-surface border border-surfaceLight shadow-xl space-y-6 animate-pulse">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Skeleton className="w-28 h-28 rounded-2xl bg-surfaceLight/80 shrink-0" />
            <div className="space-y-3 flex-1 text-center sm:text-left">
              <Skeleton className="h-8 w-64 bg-surfaceLight/80 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-48 bg-surfaceLight/50 mx-auto sm:mx-0" />
              <Skeleton className="h-4 w-full max-w-lg bg-surfaceLight/40 mx-auto sm:mx-0" />
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start pt-2">
                <Skeleton className="h-6 w-20 rounded-full bg-surfaceLight/60" />
                <Skeleton className="h-6 w-24 rounded-full bg-surfaceLight/60" />
                <Skeleton className="h-6 w-28 rounded-full bg-surfaceLight/60" />
              </div>
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-navyLight border border-surfaceLight/70">
              <Skeleton className="h-24 w-24 rounded-full bg-surfaceLight/70 mb-2" />
              <Skeleton className="h-3 w-20 bg-surfaceLight/50" />
            </div>
          </div>
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-5 rounded-xl bg-surface border border-surfaceLight space-y-2">
              <Skeleton className="h-3 w-24 bg-surfaceLight/60" />
              <Skeleton className="h-7 w-20 bg-surfaceLight/90" />
            </div>
          ))}
        </div>

        {/* Delivered Projects List */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 bg-surfaceLight/80" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-xl bg-surface border border-surfaceLight space-y-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-56 bg-surfaceLight/80" />
                  <Skeleton className="h-3 w-36 bg-surfaceLight/50" />
                </div>
                <Skeleton className="h-6 w-24 rounded-full bg-surfaceLight/70" />
              </div>
              <Skeleton className="h-4 w-full bg-surfaceLight/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ClientTestimonialProps {
  clientName: string;
  projectTitle: string;
  rating?: number;
  feedback: string;
  confirmedDate: string;
}

export function ClientTestimonial({
  clientName,
  projectTitle,
  rating = 5,
  feedback,
  confirmedDate,
}: ClientTestimonialProps) {
  return (
    <Card className="border-surfaceLight bg-surface">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            {[...Array(rating)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-electric text-electric" />
            ))}
          </div>
          <span className="text-[11px] text-textSecondary font-mono">
            {new Date(confirmedDate).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed mb-4 italic">
          &ldquo;{feedback}&rdquo;
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-surfaceLight text-xs">
          <span className="font-semibold text-white">{clientName}</span>
          <span className="text-textSecondary">{projectTitle}</span>
        </div>
      </CardContent>
    </Card>
  );
}

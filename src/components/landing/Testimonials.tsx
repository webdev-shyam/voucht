import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const TESTIMONIALS = [
  {
    name: "Dmitri Volkov",
    role: "Founding Engineer @ VectorCloud",
    text: "Before Voucht, enterprise clients were hesitant to pay upfront for complex infrastructure contracts. Sending them my Voucht live badge closed a $45k contract in 48 hours.",
    score: 96,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    client: "Delivered 14 enterprise milestones",
  },
  {
    name: "Sarah Chen",
    role: "Design Director @ Studio Kroma",
    text: "The 1-click client sign-off email is genius. Our clients actually confirm deliverables within an hour instead of waiting for days. Our team trust score is 98.",
    score: 98,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    client: "32 verified projects",
  },
  {
    name: "Liam O'Connor",
    role: "Full-Stack Next.js Consultant",
    text: "Having an embeddable SVG trust badge directly inside my GitHub profile README and Notion proposals immediately separates me from 99% of Upwork bidders.",
    score: 92,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    client: "100% on-time rate",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 bg-navy relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Trusted by Elite Freelancers & Agencies
          </h2>
          <p className="text-textSecondary text-base sm:text-lg">
            Real creators leveraging verified proof to charge premium rates.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <Card key={idx} className="border-surfaceLight bg-surface flex flex-col justify-between">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-electric text-electric" />
                  ))}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed mb-6 italic">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-surfaceLight">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={t.avatar} alt={t.name} />
                    <AvatarFallback>{t.name.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{t.name}</h4>
                    <p className="text-xs text-textSecondary">{t.role}</p>
                    <span className="text-[10px] text-electric font-mono font-semibold">
                      {t.client} (Score {t.score})
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

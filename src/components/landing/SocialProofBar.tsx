import { CalendarCheck, Lock, MailCheck, ShieldCheck, Link2, EyeOff } from "lucide-react";

// No invented customer logos or user counts. This strip states what a Voucht
// record actually contains, which the product delivers today.
const GUARANTEES = [
  { icon: CalendarCheck, label: "Client-confirmed delivery dates" },
  { icon: MailCheck, label: "One-click verification links" },
  { icon: EyeOff, label: "Masked client names" },
  { icon: Lock, label: "Scores the API cannot write" },
  { icon: Link2, label: "One link to share anywhere" },
  { icon: ShieldCheck, label: "Embeddable trust badge" },
];

export function SocialProofBar() {
  return (
    <section className="py-10 border-y border-white/5 bg-[#1a1a2e]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#a0a0b8] mb-6 text-center">
          What a Voucht record is made of
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {GUARANTEES.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-[#a0a0b8] hover:text-white transition-colors"
            >
              <item.icon className="w-4 h-4 text-[#00ff88] shrink-0" />
              <span className="text-xs sm:text-sm font-medium">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

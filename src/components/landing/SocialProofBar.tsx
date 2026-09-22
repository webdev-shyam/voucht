export function SocialProofBar() {
  const companies = [
    { name: "TechCorp Labs", symbol: "◆" },
    { name: "Nordic Digital", symbol: "▲" },
    { name: "Vanguard Studio", symbol: "■" },
    { name: "Apex Media", symbol: "●" },
    { name: "Synergy AI", symbol: "◈" },
    { name: "Pulse Design", symbol: "✦" },
  ];

  return (
    <section className="py-12 border-y border-white/5 bg-[#1a1a2e]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#a0a0b8] mb-8">
          Trusted by 500+ freelancers & agencies worldwide
        </p>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-50 grayscale hover:grayscale-0 hover:opacity-80 transition-all duration-300">
          {companies.map((c) => (
            <div
              key={c.name}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm"
            >
              <span className="text-[#00ff88] text-sm">{c.symbol}</span>
              <span className="text-xs sm:text-sm font-semibold tracking-wide text-white/80">
                {c.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

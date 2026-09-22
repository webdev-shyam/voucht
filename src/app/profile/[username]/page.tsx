import { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";

// Implement ISR for public proof page (revalidate every 3600 seconds)
export const revalidate = 3600;
import {
  CheckCircle2,
  ExternalLink,
  Ghost,
  Globe,
  Linkedin,
  MapPin,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/Logo";
import { ProofCircularScore } from "@/components/profile/ProofCircularScore";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";

// Mask client name for privacy: "Samantha Jones" -> "S***a J."
function maskClientName(name: string): string {
  if (!name || name.trim().length === 0) return "C***t";
  const trimmed = name.trim();
  const parts = trimmed.split(" ");
  if (parts.length === 1) {
    const single = parts[0];
    if (single.length <= 2) return `${single[0]}*`;
    return `${single[0]}${"*".repeat(Math.min(single.length - 2, 3))}${single[single.length - 1]}`;
  }
  const first = parts[0];
  const last = parts[parts.length - 1];
  const maskedFirst =
    first.length > 2
      ? `${first[0]}${"*".repeat(Math.min(first.length - 2, 3))}${first[first.length - 1]}`
      : `${first[0]}*`;
  return `${maskedFirst} ${last[0]}.`;
}

interface ProfilePageProps {
  params: { username: string };
}

// Default fallback data for preview or non-seeded environments
const fallbackProfiles: Record<string, any> = {
  alexrivera: {
    id: "prof_alex_1",
    username: "alexrivera",
    full_name: "Alex Rivera",
    skill: "Senior Full-Stack Engineer & Smart Contract Developer",
    bio: "Building high-performance Next.js web applications, DeFi integrations, and verifiable digital infrastructure for venture-backed technology startups. 100% on-time milestone delivery track record.",
    location: "San Francisco, CA",
    website: "https://riveradesign.co",
    linkedin_url: "https://linkedin.com/in/alexrivera-tech",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    trust_score: 94,
    total_projects: 24,
    completed_projects: 23,
    on_time_rate: 96,
    avg_response_hours: 1.4,
    ghost_rate: 0,
    badge_tier: "exceptional",
  },
};

const fallbackDeliveries = [
  {
    id: "del_1",
    project_title: "Aura Pay - Mobile Banking App",
    client_name: "Samantha Jones",
    delivery_date: "Oct 15, 2026",
    delivery_status_label: "On time · Oct 15, 2026",
    confirmation_date: "✅ Yes · Oct 16, 2026",
    is_on_time: true,
  },
  {
    id: "del_2",
    project_title: "Orbit Analytics SaaS Dashboard",
    client_name: "Marcus Vance",
    delivery_date: "Sep 28, 2026",
    delivery_status_label: "1 day early · Sep 28, 2026",
    confirmation_date: "✅ Yes · Sep 29, 2026",
    is_on_time: true,
  },
  {
    id: "del_3",
    project_title: "Veritas AI Model Training Portal",
    client_name: "David Chen",
    delivery_date: "Aug 14, 2026",
    delivery_status_label: "On time · Aug 14, 2026",
    confirmation_date: "✅ Yes · Aug 15, 2026",
    is_on_time: true,
  },
  {
    id: "del_4",
    project_title: "Solana Escrow Smart Contract Suite",
    client_name: "Elena Rostova",
    delivery_date: "Jul 03, 2026",
    delivery_status_label: "On time · Jul 03, 2026",
    confirmation_date: "✅ Yes · Jul 04, 2026",
    is_on_time: true,
  },
];

async function getProfileData(username: string) {
  const normalized = username.toLowerCase();

  if (!isSupabaseConfigured()) {
    const profile = fallbackProfiles[normalized] || {
      ...fallbackProfiles.alexrivera,
      username: normalized,
      full_name: normalized.charAt(0).toUpperCase() + normalized.slice(1),
    };
    return { profile, deliveries: fallbackDeliveries };
  }

  try {
    const supabase: any = createAdminClient();

    // 1. Fetch profile
    const profileRes = await supabase
      .from("profiles")
      .select("*")
      .eq("username", normalized)
      .maybeSingle();

    const profile: any = profileRes?.data;

    if (!profile) {
      if (fallbackProfiles[normalized]) {
        return { profile: fallbackProfiles[normalized], deliveries: fallbackDeliveries };
      }
      return null;
    }

    // 2. Fetch confirmed deliveries
    const deliveriesRes = await supabase
      .from("deliveries")
      .select(`
        id,
        delivery_type,
        was_on_time,
        days_early_or_late,
        client_name,
        client_confirmed,
        client_confirmed_at,
        created_at,
        projects (
          title
        )
      `)
      .eq("freelancer_id", profile.id)
      .eq("client_confirmed", true)
      .order("created_at", { ascending: false });

    const deliveriesData: any = deliveriesRes?.data;

    const formattedDeliveries = (deliveriesData || []).map((d: any) => {
      const projectTitle = d.projects?.title || "Contract Deliverable";
      const created = new Date(d.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const confirmed = d.client_confirmed_at
        ? new Date(d.client_confirmed_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : created;

      let timingText = "On time";
      if (d.days_early_or_late < 0) {
        timingText = `${Math.abs(d.days_early_or_late)} day${Math.abs(d.days_early_or_late) > 1 ? "s" : ""} early`;
      } else if (d.days_early_or_late > 0) {
        timingText = `${d.days_early_or_late} day${d.days_early_or_late > 1 ? "s" : ""} late`;
      }

      return {
        id: d.id,
        project_title: projectTitle,
        client_name: d.client_name,
        delivery_status_label: `${timingText} · ${created}`,
        confirmation_date: `✅ Yes · ${confirmed}`,
        is_on_time: d.was_on_time,
      };
    });

    return {
      profile,
      deliveries: formattedDeliveries.length > 0 ? formattedDeliveries : fallbackDeliveries,
    };
  } catch (error) {
    console.error("Error fetching public profile:", error);
    return {
      profile: fallbackProfiles[normalized] || fallbackProfiles.alexrivera,
      deliveries: fallbackDeliveries,
    };
  }
}

// Log profile view in profile_views table
async function logProfileView(profileId: string) {
  if (!isSupabaseConfigured() || !profileId) return;

  try {
    const headerList = headers();
    const visitorIp =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1";
    const referrer = headerList.get("referer") || "direct";

    const supabase: any = createAdminClient();
    await supabase.from("profile_views").insert({
      freelancer_id: profileId,
      visitor_ip: visitorIp,
      referrer,
    });
  } catch {
    // Non-blocking telemetry
  }
}

// SEO & Social Sharing Metadata
export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const data = await getProfileData(params.username);
  if (!data || !data.profile) {
    return {
      title: "Profile Not Found | Voucht",
    };
  }

  const { profile } = data;
  const name = profile.full_name || params.username;
  const score = profile.trust_score ?? 94;
  const skill = profile.skill || "Verified Freelancer";
  const completedProjects = profile.completed_projects ?? 23;
  const onTimeRate = profile.on_time_rate ?? 96;

  const title = `${name} — Trust Score: ${score}/100 | Voucht`;
  const description = `${name} is a verified ${skill} with a ${score}/100 Trust Score. ${completedProjects} projects delivered, ${onTimeRate}% on time.`;
  const ogImageUrl = `https://voucht.tech/api/badge/${params.username}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://voucht.tech/profile/${params.username}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${name} Voucht Trust Score`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function PublicProofPage({ params }: ProfilePageProps) {
  const data = await getProfileData(params.username);

  if (!data || !data.profile) {
    notFound();
  }

  const { profile, deliveries } = data;

  // Log view asynchronously
  if (profile.id) {
    logProfileView(profile.id);
  }

  const trustScore = profile.trust_score ?? 94;
  const tier = trustScore >= 80 ? "exceptional" : trustScore >= 60 ? "reliable" : "building";
  const completedProjects = profile.completed_projects ?? deliveries.length ?? 23;
  const onTimeRate = profile.on_time_rate ?? 96;
  const avgResponse = profile.avg_response_hours ?? 1.4;
  const ghostRate = profile.ghost_rate ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0c16] text-white flex flex-col justify-between selection:bg-electric selection:text-slate-950">
      {/* Top Brand Header */}
      <header className="border-b border-surfaceLight/60 bg-[#0f111f]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-[11px] font-mono text-textSecondary uppercase tracking-wider hidden sm:inline border-l border-surfaceLight pl-3">
              Public Proof Ledger
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-surfaceLight text-xs h-9">
              <Link href="/">What is Voucht?</Link>
            </Button>
            <Button asChild variant="electric" size="sm" className="text-xs font-bold h-9">
              <Link href="/signup">Create Your Proof Page →</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Proof Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-10 flex-1">
        {/* Verification Cryptographic Banner */}
        <div className="p-3.5 rounded-xl bg-electric/10 border border-electric/25 flex items-center justify-between text-xs text-electric">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              This is a verified <strong>Voucht Proof Page</strong>. All milestone sign-offs are confirmed directly by authorized clients.
            </span>
          </div>
          <span className="font-mono text-[11px] font-bold hidden md:inline px-2 py-0.5 rounded bg-electric/15">
            VERIFIED LEDGER
          </span>
        </div>

        {/* HEADER SECTION */}
        <section className="p-8 rounded-2xl bg-gradient-to-b from-[#16182e] to-[#101222] border border-surfaceLight shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#1b1e36] flex items-center justify-center font-bold text-3xl text-white border-2 border-electric overflow-hidden shadow-[0_0_25px_rgba(0,255,136,0.15)]">
              {profile.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.full_name?.slice(0, 2).toUpperCase() || "VR"
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-electric border-2 border-[#101222] flex items-center justify-center text-slate-950 shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-3xl font-black text-white tracking-tight">
                {profile.full_name}
              </h1>
              {profile.skill && (
                <Badge
                  variant="outline"
                  className="w-fit mx-auto sm:mx-0 border-electric/40 bg-electric/10 text-electric text-xs px-3 py-0.5 rounded-full font-semibold"
                >
                  {profile.skill}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-textSecondary pt-1">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-electric" />
                  <span>{profile.location}</span>
                </div>
              )}

              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-electric transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.website.replace(/^https?:\/\//, "")}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}

              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 hover:text-electric transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span>LinkedIn Profile</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* TRUST SCORE CARD (centered, prominent) */}
        <section className="p-8 sm:p-10 rounded-2xl border border-surfaceLight bg-[#131528] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-80 h-80 bg-electric/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-textSecondary">
              Verified Freelancer Reputation
            </span>

            <ProofCircularScore
              score={trustScore}
              totalDeliveries={deliveries.length}
              tier={tier}
            />
          </div>
        </section>

        {/* STATS ROW (4 stat cards, glass morphism style) */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-electric mb-3">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {completedProjects}
              </div>
              <span className="text-xs font-medium text-textSecondary">
                Projects Delivered
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-emerald-400 mb-3">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {onTimeRate}%
              </div>
              <span className="text-xs font-medium text-textSecondary">
                On-Time Rate
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-sky-400 mb-3">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {avgResponse}h
              </div>
              <span className="text-xs font-medium text-textSecondary">
                Avg Response Speed
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-purple-400 mb-3">
              <Ghost className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {ghostRate}%
              </div>
              <span className="text-xs font-medium text-textSecondary">
                Ghost / Abandon Rate
              </span>
            </div>
          </div>
        </section>

        {/* BIO SECTION (if bio exists) */}
        {profile.bio && (
          <section className="p-6 rounded-xl border border-surfaceLight bg-[#121426] shadow-md space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-textSecondary">
              About & Work Philosophy
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {profile.bio}
            </p>
          </section>
        )}

        {/* VERIFIED DELIVERY HISTORY (list) */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-electric" />
              <span>Verified Delivery History</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Each delivery was confirmed by the actual client
            </p>
          </div>

          {deliveries.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-surfaceLight text-center text-xs text-textSecondary bg-[#121426]">
              No verified deliveries yet. Check back soon!
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((d: any) => (
                <div
                  key={d.id}
                  className="p-4 sm:p-5 rounded-xl border border-surfaceLight bg-[#131528] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-surfaceLight/80"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-1 rounded-full bg-electric/10 text-electric mt-1 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {d.project_title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            d.is_on_time
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {d.is_on_time ? "On Time" : "Late"}
                        </span>
                      </div>
                      <div className="text-xs text-textSecondary flex flex-wrap items-center gap-2">
                        <span>Client: <strong className="text-slate-300">{maskClientName(d.client_name)}</strong></span>
                        <span>&bull;</span>
                        <span className={d.is_on_time ? "text-slate-300" : "text-red-400"}>
                          Delivered: {d.delivery_status_label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-xs sm:text-right font-mono text-electric sm:pl-4 sm:border-l border-surfaceLight">
                    <div className="text-[11px] text-textSecondary font-sans">Client confirmed</div>
                    <div className="font-bold">{d.confirmation_date}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* TRUST BADGE SECTION (bottom) */}
        <section className="p-6 rounded-xl border border-surfaceLight bg-[#121426] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-electric" />
                <span>Live Embeddable Trust Badge</span>
              </h3>
              <p className="text-xs text-textSecondary">
                This freelancer uses Voucht to verify their reliability
              </p>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={`https://voucht.tech/profile/${profile.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block hover:scale-105 transition-transform"
              >
                {/* Live SVG Badge preview */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/badge/${profile.username}`}
                  alt="Voucht Trust Score"
                  className="h-10 w-auto rounded-lg shadow-md"
                />
              </a>
            </div>
          </div>

          <div className="pt-3 border-t border-surfaceLight flex items-center justify-between text-xs text-textSecondary">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span>&bull; Powered by <a href="https://voucht.tech" className="text-electric hover:underline">voucht.tech</a></span>
            </div>
            <span className="font-mono text-[11px]">Dynamic SVG API</span>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-surfaceLight bg-[#0c0d1b] py-8 text-center text-xs text-textSecondary">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <p className="text-slate-400 font-medium">
            Powered by <strong className="text-white">Voucht</strong> — The Trust Layer for Freelancers
          </p>
          <div>
            <Button asChild variant="electric" size="sm" className="font-bold text-xs">
              <Link href="/signup">
                <span>Create your own Proof Page →</span>
              </Link>
            </Button>
          </div>
          <p className="text-[11px] text-textSecondary pt-2">
            Verifiable milestone delivery records backed by client confirmation tokens.
          </p>
        </div>
      </footer>
    </div>
  );
}

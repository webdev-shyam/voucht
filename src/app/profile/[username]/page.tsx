import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Ghost,
  Globe,
  Linkedin,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sparkles,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/shared/Logo";
import { ProofCircularScore } from "@/components/profile/ProofCircularScore";
import { ProfileViewBeacon } from "@/components/profile/ProfileViewBeacon";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { badgeFor, formatTrustScore, TRUST_SCORE_WEIGHTS } from "@/lib/trust-score";
import { badgeImageUrl, proofPageUrl } from "@/lib/utils";
import type { Database } from "@/lib/types";

// Public proof pages render a read-only projection of the database, so they are
// cached and regenerated hourly. Nothing per-visitor is read during render:
// view telemetry is reported from the browser by ProfileViewBeacon.
export const revalidate = 3600;

type ProfileRow = Database["public"]["Views"]["public_profiles"]["Row"];
type DeliveryRow = Database["public"]["Views"]["public_deliveries"]["Row"];

interface ProfilePageProps {
  params: { username: string };
}

interface ProofDelivery {
  id: string;
  title: string;
  clientLabel: string;
  timingLabel: string;
  deliveredLabel: string;
  confirmedLabel: string;
  isOnTime: boolean;
}

interface ProofData {
  profile: ProfileRow;
  deliveries: ProofDelivery[];
}

function dateLabel(iso: string | null): string {
  if (!iso) return "—";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timingLabel(daysEarlyOrLate: number): string {
  const days = daysEarlyOrLate ?? 0;
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) > 1 ? "s" : ""} early`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} late`;
  return "On time";
}

// Reads public_profiles and public_deliveries only. The underlying tables hold
// client emails and single-use verification tokens, so they are never queried
// from a public surface. Client names arrive already masked by the database.
async function getProofData(username: string): Promise<ProofData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createAdminClient();

  const profileRes = await supabase
    .from("public_profiles")
    .select(
      "id, username, full_name, avatar_url, skill, bio, location, website, linkedin_url, trust_score, badge_tier, total_projects, completed_projects, on_time_rate, ghost_rate, created_at"
    )
    .eq("username", username.toLowerCase())
    .maybeSingle();

  const profile = profileRes.data;
  if (!profile) return null;

  const deliveriesRes = await supabase
    .from("public_deliveries")
    .select(
      "id, project_id, milestone_id, project_title, milestone_title, delivery_type, was_on_time, days_early_or_late, client_label, client_confirmed_at, created_at"
    )
    .eq("freelancer_id", profile.id)
    .order("client_confirmed_at", { ascending: false });

  const deliveries: ProofDelivery[] = (deliveriesRes.data ?? []).map((row: DeliveryRow) => ({
    id: row.id,
    title:
      row.project_title ||
      (row.milestone_title ? `Milestone · ${row.milestone_title}` : "Contract deliverable"),
    clientLabel: row.client_label,
    timingLabel: timingLabel(row.days_early_or_late),
    deliveredLabel: dateLabel(row.created_at),
    confirmedLabel: dateLabel(row.client_confirmed_at),
    isOnTime: row.was_on_time,
  }));

  return { profile, deliveries };
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const data = await getProofData(params.username);

  if (!data) {
    return { title: "Profile not found | Voucht" };
  }

  const { profile, deliveries } = data;
  const name = profile.full_name || profile.username;
  const scoreText = formatTrustScore(profile.trust_score);
  const url = proofPageUrl(profile.username);
  // Social crawlers do not render SVG, so shares use the static brand card while
  // the description below carries this profile's real, server-computed numbers.
  const ogImage = "/og-image.png";

  const description =
    profile.trust_score === null
      ? `${name}'s Voucht proof page. No client-confirmed deliveries recorded yet.`
      : `${name} — Trust Score ${scoreText}/100 (${badgeFor(profile.badge_tier).label}). ` +
        `${profile.completed_projects} projects delivered, ${profile.on_time_rate}% on time, ` +
        `${deliveries.length} client-confirmed deliveries.`;

  return {
    title: `${name} — Trust Score ${scoreText}/100 | Voucht`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} on Voucht`,
      description,
      type: "profile",
      url,
      images: [{ url: ogImage, width: 1792, height: 1024, alt: `${name} on Voucht` }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} on Voucht`,
      description,
      images: [ogImage],
    },
  };
}

export default async function PublicProofPage({ params }: ProfilePageProps) {
  const data = await getProofData(params.username);

  if (!data) {
    notFound();
  }

  const { profile, deliveries } = data;
  const badge = badgeFor(profile.badge_tier);

  return (
    <div className="min-h-screen bg-[#0a0c16] text-white flex flex-col justify-between selection:bg-electric selection:text-slate-950">
      <ProfileViewBeacon username={profile.username} />

      <header className="border-b border-surfaceLight/60 bg-[#0f111f]/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="text-[11px] font-mono text-textSecondary uppercase tracking-wider hidden sm:inline border-l border-surfaceLight pl-3">
              Public proof page
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="outline" size="sm" className="border-surfaceLight text-xs h-9">
              <Link href="/">What is Voucht?</Link>
            </Button>
            <Button asChild variant="electric" size="sm" className="text-xs font-bold h-9">
              <Link href="/signup">Create your proof page →</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full space-y-10 flex-1">
        <div className="p-3.5 rounded-xl bg-electric/10 border border-electric/25 flex items-center gap-2.5 text-xs text-electric">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Every delivery listed here was confirmed by the client who received it, through a
            single-use link. Client names are masked for their privacy.
          </span>
        </div>

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
                profile.full_name?.slice(0, 2).toUpperCase() || "V"
              )}
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-3xl font-black text-white tracking-tight">{profile.full_name}</h1>
              {profile.skill && (
                <Badge
                  variant="outline"
                  className="w-fit mx-auto sm:mx-0 border-electric/40 bg-electric/10 text-electric text-xs px-3 py-0.5 rounded-full font-semibold"
                >
                  {profile.skill}
                </Badge>
              )}
            </div>

            <p className="text-sm text-textSecondary">@{profile.username}</p>

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
                  rel="noreferrer noopener"
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
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 hover:text-electric transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[#0077b5]" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </section>

        <section className="p-8 sm:p-10 rounded-2xl border border-surfaceLight bg-[#131528] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-1/2 translate-x-1/2 w-80 h-80 bg-electric/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center justify-center text-center space-y-4 relative">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-textSecondary">
              Trust Score
            </span>

            <ProofCircularScore
              score={profile.trust_score}
              totalDeliveries={deliveries.length}
              tier={profile.badge_tier}
            />

            <p className="text-xs text-textSecondary max-w-md">
              {badge.requirement} The score is calculated by Voucht from recorded deliveries and
              cannot be set manually.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-electric mb-3">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {profile.completed_projects}
              </div>
              <span className="text-xs font-medium text-textSecondary">Projects delivered</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-emerald-400 mb-3">
              <Timer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {profile.on_time_rate}%
              </div>
              <span className="text-xs font-medium text-textSecondary">On-time deliveries</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-sky-400 mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {deliveries.length}
              </div>
              <span className="text-xs font-medium text-textSecondary">Client confirmations</span>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-surfaceLight/80 bg-[#121426]/80 backdrop-blur shadow-lg flex flex-col justify-between">
            <div className="p-2 w-fit rounded-lg bg-navyMid border border-surfaceLight text-purple-400 mb-3">
              <Ghost className="w-4 h-4" />
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white">
                {profile.ghost_rate}%
              </div>
              <span className="text-xs font-medium text-textSecondary">Abandoned projects</span>
            </div>
          </div>
        </section>

        {profile.bio && (
          <section className="p-6 rounded-xl border border-surfaceLight bg-[#121426] shadow-md space-y-2">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-textSecondary">
              About
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">{profile.bio}</p>
          </section>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-electric" />
              <span>Verified delivery history</span>
            </h2>
            <p className="text-xs text-textSecondary mt-0.5">
              Shown only when the client confirmed the delivery themselves.
            </p>
          </div>

          {deliveries.length === 0 ? (
            <div className="p-8 rounded-xl border border-dashed border-surfaceLight text-center text-xs text-textSecondary bg-[#121426]">
              No verified work history yet. This freelancer has no client-confirmed deliveries
              recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="p-4 sm:p-5 rounded-xl border border-surfaceLight bg-[#131528] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-surfaceLight/80"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-1 rounded-full bg-electric/10 text-electric mt-1 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {delivery.title}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            delivery.isOnTime
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}
                        >
                          {delivery.timingLabel}
                        </span>
                      </div>
                      <div className="text-xs text-textSecondary flex flex-wrap items-center gap-2">
                        <span>
                          Client: <strong className="text-slate-300">{delivery.clientLabel}</strong>
                        </span>
                        <span>&bull;</span>
                        <span>Submitted {delivery.deliveredLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 text-xs sm:text-right font-mono text-electric sm:pl-4 sm:border-l border-surfaceLight">
                    <div className="text-[11px] text-textSecondary font-sans">Client confirmed</div>
                    <div className="font-bold">{delivery.confirmedLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="p-6 rounded-xl border border-surfaceLight bg-[#121426] space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-electric" />
            <span>How this score is calculated</span>
          </h3>
          <ul className="grid sm:grid-cols-2 gap-3">
            {TRUST_SCORE_WEIGHTS.map((weight) => (
              <li key={weight.key} className="text-xs text-textSecondary space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-300 font-medium">{weight.label}</span>
                  <span className="font-mono text-electric">{weight.weight}%</span>
                </div>
                <p className="leading-relaxed">{weight.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="p-6 rounded-xl border border-surfaceLight bg-[#121426] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Embed this badge</h3>
              <p className="text-xs text-textSecondary">
                Shows {profile.full_name}&rsquo;s live Trust Score and updates automatically.
              </p>
            </div>

            <a
              href={proofPageUrl(profile.username)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-block hover:scale-105 transition-transform shrink-0"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={badgeImageUrl(profile.username)}
                alt={`Voucht Trust Score for ${profile.full_name}`}
                className="h-10 w-auto rounded-lg shadow-md"
              />
            </a>
          </div>

          <div className="pt-3 border-t border-surfaceLight flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-textSecondary">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <span>
                &bull; Hosted on{" "}
                <a href="https://voucht.tech" className="text-electric hover:underline">
                  Voucht
                </a>
              </span>
            </div>
            <code className="font-mono text-[11px] break-all">{badgeImageUrl(profile.username)}</code>
          </div>
        </section>
      </main>

      <footer className="border-t border-surfaceLight bg-[#0c0d1b] py-8 text-center text-xs text-textSecondary">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <p className="text-slate-400 font-medium">
            Powered by <strong className="text-white">Voucht</strong> — verifiable delivery records
            for freelancers
          </p>
          <div>
            <Button asChild variant="electric" size="sm" className="font-bold text-xs">
              <Link href="/signup">Create your own proof page →</Link>
            </Button>
          </div>
          <p className="text-[11px] text-textSecondary pt-2">
            Milestone deliveries backed by single-use client confirmation links.
          </p>
        </div>
      </footer>
    </div>
  );
}

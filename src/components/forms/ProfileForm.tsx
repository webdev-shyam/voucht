"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Check,
  Code,
  Copy,
  ExternalLink,
  Globe,
  Mail,
  Shield,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, and hyphens"),
  email: z.string().email("Valid email address required"),
  headline: z.string().optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url("Must be a valid image URL").or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const logActivity = useAppStore((state) => state.logActivity);

  const [copiedBadge, setCopiedBadge] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user.fullName || "",
      username: user.username || "",
      email: user.email || "",
      headline: user.headline || "",
      bio: user.bio || "",
      avatarUrl: user.avatarUrl || "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const currentUsername = watch("username");
  const proofUrl = `https://voucht.tech/${currentUsername || user.username}`;
  const badgeMarkdown = `[![Voucht Trust Score](https://voucht.tech/api/badge/${currentUsername || user.username})](https://voucht.tech/${currentUsername || user.username})`;

  const onSubmit = (data: ProfileFormValues) => {
    setUser({
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      headline: data.headline,
      bio: data.bio,
      avatarUrl: data.avatarUrl || undefined,
    });

    logActivity({
      title: "Updated profile credentials",
      description: `Saved public proof page settings for ${data.username}.`,
      type: "milestone_confirmed",
    });

    toast({
      title: "Settings Saved! ✅",
      description: "Your profile information and public proof page are updated.",
    });
  };

  const copyBadgeSnippet = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedBadge(true);
    toast({
      title: "Badge markdown copied!",
      description: "Paste into your GitHub README, portfolio, or Notion page.",
    });
    setTimeout(() => setCopiedBadge(false), 2000);
  };

  const copyProofUrl = () => {
    navigator.clipboard.writeText(proofUrl);
    setCopiedUrl(true);
    toast({
      title: "Profile URL copied!",
      description: proofUrl,
    });
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Public URL Callout Banner */}
      <div className="p-4 rounded-xl bg-surface border border-surfaceLight flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-navyLight border border-surfaceLight text-electric">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-textSecondary">
              Your Public Proof URL
            </span>
            <p className="text-sm font-mono font-bold text-white">
              voucht.tech/{currentUsername || user.username}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyProofUrl}
            className="border-surfaceLight text-xs gap-1.5 h-8"
          >
            {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUrl ? "Copied" : "Copy Link"}</span>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-xs text-electric hover:bg-surfaceLight h-8 gap-1"
          >
            <a href={`/${currentUsername || user.username}`} target="_blank" rel="noreferrer">
              <span>Visit Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </Button>
        </div>
      </div>

      {/* Main Profile Form */}
      <Card className="border-surfaceLight bg-surface shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-electric" />
            <span>Profile & Credibility Details</span>
          </CardTitle>
          <CardDescription className="text-xs text-textSecondary">
            Manage your verified identity, headline, and bio for prospective clients.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold text-slate-200">
                  Full Name *
                </Label>
                <Input
                  id="fullName"
                  placeholder="Alex Rivera"
                  className="bg-navyLight border-surfaceLight text-white h-10 text-sm focus:border-electric"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-xs text-red-400">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-slate-200">
                  Handle / Username *
                </Label>
                <Input
                  id="username"
                  placeholder="alexrivera"
                  className="bg-navyLight border-surfaceLight text-white h-10 text-sm focus:border-electric font-mono"
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs text-red-400">{errors.username.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-200">
                Primary Email *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="alex@riveradesign.co"
                className="bg-navyLight border-surfaceLight text-white h-10 text-sm focus:border-electric"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="headline" className="text-xs font-semibold text-slate-200">
                Professional Headline
              </Label>
              <Input
                id="headline"
                placeholder="Principal Product Designer & Full-Stack Architect"
                className="bg-navyLight border-surfaceLight text-white h-10 text-sm focus:border-electric"
                {...register("headline")}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl" className="text-xs font-semibold text-slate-200">
                Avatar Image URL
              </Label>
              <Input
                id="avatarUrl"
                placeholder="https://images.unsplash.com/photo-..."
                className="bg-navyLight border-surfaceLight text-white h-10 text-sm focus:border-electric"
                {...register("avatarUrl")}
              />
              {errors.avatarUrl && (
                <p className="text-xs text-red-400">{errors.avatarUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-semibold text-slate-200">
                Bio & Delivery Commitment
              </Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Designing high-conversion design systems and fullstack Next.js web applications for funded fintech and AI companies. 100% verified delivery record."
                className="bg-navyLight border-surfaceLight text-white text-sm focus:border-electric"
                {...register("bio")}
              />
            </div>

            <div className="pt-3 border-t border-surfaceLight flex justify-end">
              <Button
                type="submit"
                variant="electric"
                disabled={isSubmitting}
                className="font-bold gap-2 px-6 h-10 text-xs shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>{isSubmitting ? "Saving..." : "Save Settings"}</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Embeddable Trust Badge Section */}
      <Card className="border-surfaceLight bg-surface shadow-xl">
        <CardHeader className="p-6">
          <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Code className="w-5 h-5 text-electric" />
            <span>Embeddable Trust Badge</span>
          </CardTitle>
          <CardDescription className="text-xs text-textSecondary">
            Display your live Voucht Trust Score on your personal website, GitHub profile, or proposal emails.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 pt-0 space-y-4">
          <div className="p-3.5 rounded-xl bg-navyLight border border-surfaceLight flex items-center justify-between">
            <span className="text-xs font-mono text-slate-200 truncate mr-3">
              {badgeMarkdown}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyBadgeSnippet}
              className="border-surfaceLight text-xs gap-1.5 shrink-0 h-8"
            >
              {copiedBadge ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBadge ? "Copied" : "Copy Markdown"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

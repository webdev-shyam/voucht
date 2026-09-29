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
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppStore } from "@/store/useAppStore";
import { toast } from "@/components/ui/use-toast";
import { proofPageUrl, badgeImageUrl } from "@/lib/utils";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-z0-9_-]+$/, "Username can only contain lowercase letters, numbers, and hyphens"),
  skill: z.string().max(120, "Keep it under 120 characters").optional(),
  bio: z.string().max(600, "Keep it under 600 characters").optional(),
  avatarUrl: z.string().url("Must be a valid image URL").or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const user = useAppStore((state) => state.user);
  const updateProfile = useAppStore((state) => state.updateProfile);

  const [copiedBadge, setCopiedBadge] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      username: user?.username || "",
      skill: user?.skill || "",
      bio: user?.bio || "",
      avatarUrl: user?.avatarUrl || "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  if (!user) return null;

  const currentUsername = watch("username");
  const handle = currentUsername || user.username;
  const proofUrl = proofPageUrl(handle);
  const badgeMarkdown = `[![Voucht Trust Score](${badgeImageUrl(handle)})](${proofUrl})`;

  const onSubmit = async (data: ProfileFormValues) => {
    setSaveError(null);
    try {
      await updateProfile({
        full_name: data.fullName,
        username: data.username,
        skill: data.skill ?? "",
        bio: data.bio || null,
        avatar_url: data.avatarUrl || null,
      });
      toast({
        title: "Profile saved",
        description: "Your public proof page is updated.",
      });
    } catch {
      setSaveError(
        "We couldn't save your profile. Check that the handle isn't already taken and try again."
      );
    }
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
            <p className="text-sm font-mono font-bold text-white break-all">
              {proofUrl}
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
            <a href={proofUrl} target="_blank" rel="noreferrer">
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
                Account email
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-navyLight border-surfaceLight text-textSecondary h-10 text-sm"
              />
              <p className="text-[11px] text-textSecondary">
                Sign-in details are managed by your account, not this form.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skill" className="text-xs font-semibold text-slate-200">
                Headline / primary skill
              </Label>
              <Input
                id="skill"
                placeholder="Principal Product Designer"
                className="bg-navyLight border-surfaceLight text-white h-10 text-sm focus:border-electric"
                {...register("skill")}
              />
              {errors.skill && (
                <p className="text-xs text-red-400">{errors.skill.message}</p>
              )}
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
                Bio & delivery commitment
              </Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="What you build, who you build it for, and how you work with clients."
                className="bg-navyLight border-surfaceLight text-white text-sm focus:border-electric"
                {...register("bio")}
              />
              {errors.bio && (
                <p className="text-xs text-red-400">{errors.bio.message}</p>
              )}
            </div>

            {saveError && (
              <p className="text-xs text-red-400 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                {saveError}
              </p>
            )}

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

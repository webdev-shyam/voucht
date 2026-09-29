"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast({
        title: "Password too short",
        description: "Use at least 8 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirm) {
      toast({
        title: "Passwords do not match",
        description: "Type the new password twice.",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured()) {
      toast({
        title: "Password reset is not available",
        description:
          "This deployment has no Supabase project connected yet.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();

      // The reset email link exchanges a code for a short-lived recovery
      // session. Without it this form has nothing to update, and pretending
      // otherwise would claim a password changed when it did not.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Reset link is not active",
          description:
            "Open the password reset link from your email again, then set your new password here.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast({
          title: "Could not change the password",
          description: error.message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      toast({
        title: "Password updated",
        description: "You are signed in with your new password.",
        variant: "success",
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({ title: "Reset error", description: message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00ff88]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        <div className="text-center flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Choose a new password
          </h1>
          <p className="text-sm text-[#a0a0b8] mt-1.5">
            You reached this page from the reset link in your email
          </p>
        </div>

        <Card className="border border-white/10 bg-[#1e1e3f]/90 backdrop-blur-sm rounded-2xl shadow-2xl p-2 sm:p-4">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white font-bold">
              New password
            </CardTitle>
            <CardDescription className="text-xs text-[#a0a0b8]">
              At least 8 characters. It applies to your Voucht account only.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white text-xs font-semibold">
                  New password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a0a0b8] absolute left-3.5 top-3" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 bg-[#1a1a2e] border-white/10 text-white rounded-xl placeholder:text-[#a0a0b8]/50 focus-visible:ring-[#00ff88]"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-white text-xs font-semibold">
                  Repeat new password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a0a0b8] absolute left-3.5 top-3" />
                  <Input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-10 h-10 bg-[#1a1a2e] border-white/10 text-white rounded-xl placeholder:text-[#a0a0b8]/50 focus-visible:ring-[#00ff88]"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="electric"
                className="w-full h-11 font-bold text-sm"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>

            <div className="flex items-start gap-2 text-[11px] text-[#a0a0b8] bg-[#1a1a2e]/60 border border-white/5 rounded-xl p-3">
              <ShieldAlert className="w-4 h-4 shrink-0 text-[#00ff88]" />
              <span>
                If the form says the reset link is not active, request a new one
                from the log in page. Links expire and work once.
              </span>
            </div>
          </CardContent>

          <CardFooter className="flex justify-center pt-2">
            <p className="text-xs text-[#a0a0b8]">
              <Link href="/login" className="text-[#00ff88] hover:underline">
                Back to log in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

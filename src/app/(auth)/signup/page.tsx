"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, Briefcase, CheckCircle2 } from "lucide-react";
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

const SKILLS = [
  "Developer",
  "Designer",
  "Writer",
  "Marketer",
  "Video Editor",
  "Other",
];

function calculatePasswordStrength(password: string): {
  score: number;
  label: "Weak" | "Medium" | "Strong";
  color: string;
} {
  if (!password) {
    return { score: 0, label: "Weak", color: "bg-white/10" };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score === 1) return { score: 1, label: "Weak", color: "bg-red-500" };
  if (score === 2) return { score: 2, label: "Medium", color: "bg-yellow-400" };
  return { score: 3, label: "Strong", color: "bg-[#00ff88]" };
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [skill, setSkill] = useState(SKILLS[0]);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  // Set once signUp returns without a session, i.e. email confirmation is on.
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const confirmationRedirect = () =>
    `${window.location.origin}/callback?next=%2Fdashboard`;

  const handleResendConfirmation = async () => {
    if (!confirmationEmail || !isSupabaseConfigured()) return;
    setResending(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: confirmationEmail,
        options: { emailRedirectTo: confirmationRedirect() },
      });

      toast(
        error
          ? {
              title: "Could not resend the link",
              description: error.message,
              variant: "destructive",
            }
          : {
              title: "Confirmation link sent",
              description: "Check your inbox, and your spam folder if it is not there.",
            }
      );
    } catch (err: unknown) {
      toast({
        title: "Could not resend the link",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  const strength = calculatePasswordStrength(password);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const username =
          fullName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .slice(0, 16) || `user${Math.floor(Math.random() * 10000)}`;

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // Without this the confirmation link opens the site root, the
            // visitor sees the landing page and no session is created. The
            // exact URL must also be listed in Supabase → URL Configuration →
            // Redirect URLs.
            emailRedirectTo: confirmationRedirect(),
            data: {
              full_name: fullName,
              username,
              skill,
            },
          },
        });

        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // With email confirmation on, signUp returns no session. Sending the
        // visitor to the dashboard then shows an empty shell that immediately
        // bounces back to /login.
        if (!data.session) {
          setConfirmationEmail(email.trim().toLowerCase());
          setLoading(false);
          return;
        }

        toast({
          title: "Account Created!",
          description: "Welcome to Voucht. Preparing your profile...",
          variant: "success",
        });
        router.push("/dashboard");
      } else {
        toast({
          title: "Sign up is not available",
          description:
            "This deployment has no Supabase project connected yet, so no account can be created.",
          variant: "destructive",
        });
        setLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An error occurred during signup.";
      toast({
        title: "Sign up error",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setOauthLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/callback?next=/dashboard`,
          },
        });

        if (error) {
          toast({
            title: "Google Sign Up Failed",
            description: error.message,
            variant: "destructive",
          });
          setOauthLoading(false);
        }
      } else {
        toast({
          title: "Sign up is not available",
          description:
            "This deployment has no Supabase project connected yet, so Google sign-up cannot start.",
          variant: "destructive",
        });
        setOauthLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred with Google Sign Up.";
      toast({
        title: "OAuth Error",
        description: message,
        variant: "destructive",
      });
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col justify-center items-center p-4 relative py-12">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00ff88]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        {/* Top Logo & Heading */}
        <div className="text-center flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-[#a0a0b8] mt-1.5">
            One account, one public Proof Page at voucht.tech/your-name
          </p>
        </div>

        {/* Centered card on navy background */}
        <Card className="border border-white/10 bg-[#1e1e3f]/90 backdrop-blur-sm rounded-2xl shadow-2xl p-2 sm:p-4">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white font-bold">
              Get Started
            </CardTitle>
            <CardDescription className="text-xs text-[#a0a0b8]">
              Free forever &bull; No credit card &bull; Upgrade later if you need it
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {confirmationEmail ? (
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/5 p-4">
                  <CheckCircle2 className="w-5 h-5 text-[#00ff88] shrink-0 mt-0.5" />
                  <div className="space-y-1.5">
                    <p className="text-sm font-bold text-white">
                      One more step: confirm your email
                    </p>
                    <p className="text-xs text-[#a0a0b8] leading-relaxed">
                      We sent a link to{" "}
                      <span className="text-white font-semibold">
                        {confirmationEmail}
                      </span>
                      . The account exists but stays locked until you open that
                      link and log in.
                    </p>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={resending}
                      className="text-xs font-semibold text-[#00ff88] hover:underline pt-1 disabled:opacity-60"
                    >
                      {resending
                        ? "Sending a new link..."
                        : "Didn't get it? Resend the link"}
                    </button>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="w-full h-10 text-xs font-semibold border-white/10 bg-white/5 text-white rounded-xl"
                  onClick={() => setConfirmationEmail(null)}
                >
                  Use a different email
                </Button>
              </div>
            ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label
                  htmlFor="fullName"
                  className="text-white text-xs font-semibold"
                >
                  Full Name
                </Label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#a0a0b8] absolute left-3.5 top-3" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Alex Rivera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-10 bg-[#1a1a2e] border-white/10 text-white rounded-xl placeholder:text-[#a0a0b8]/50 focus-visible:ring-[#00ff88]"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white text-xs font-semibold"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a0a0b8] absolute left-3.5 top-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="alex@riveradesign.co"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-[#1a1a2e] border-white/10 text-white rounded-xl placeholder:text-[#a0a0b8]/50 focus-visible:ring-[#00ff88]"
                    required
                  />
                </div>
              </div>

              {/* Password with strength indicator */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-white text-xs font-semibold"
                >
                  Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#a0a0b8] absolute left-3.5 top-3" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10 bg-[#1a1a2e] border-white/10 text-white rounded-xl placeholder:text-[#a0a0b8]/50 focus-visible:ring-[#00ff88]"
                    required
                  />
                </div>

                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="pt-1.5 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#a0a0b8]">Password strength</span>
                      <span
                        className={`font-semibold ${
                          strength.label === "Strong"
                            ? "text-[#00ff88]"
                            : strength.label === "Medium"
                              ? "text-yellow-400"
                              : "text-red-400"
                        }`}
                      >
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-1.5">
                      <div
                        className={`rounded-full transition-colors duration-300 ${
                          strength.score >= 1 ? strength.color : "bg-white/10"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-colors duration-300 ${
                          strength.score >= 2 ? strength.color : "bg-white/10"
                        }`}
                      />
                      <div
                        className={`rounded-full transition-colors duration-300 ${
                          strength.score >= 3 ? strength.color : "bg-white/10"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Skill Dropdown */}
              <div className="space-y-2">
                <Label
                  htmlFor="skill"
                  className="text-white text-xs font-semibold"
                >
                  Primary Skill / Discipline
                </Label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-[#a0a0b8] absolute left-3.5 top-3 pointer-events-none" />
                  <select
                    id="skill"
                    value={skill}
                    onChange={(e) => setSkill(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 bg-[#1a1a2e] border border-white/10 text-white text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-[#00ff88] cursor-pointer"
                  >
                    {SKILLS.map((s) => (
                      <option
                        key={s}
                        value={s}
                        className="bg-[#1e1e3f] text-white"
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                type="submit"
                variant="electric"
                className="w-full h-11 text-sm font-semibold rounded-xl mt-3"
                disabled={loading}
              >
                {loading ? "Creating your account..." : "Create Account"}
              </Button>
            </form>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#1e1e3f] px-3 text-[#a0a0b8]">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth button */}
            <Button
              variant="outline"
              type="button"
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl gap-2.5"
              onClick={handleGoogleSignup}
              disabled={oauthLoading}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5.1 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              <span>
                {oauthLoading
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </span>
            </Button>
          </CardContent>

          <CardFooter className="pt-2 pb-4 justify-center">
            <p className="text-xs text-[#a0a0b8]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#00ff88] hover:underline font-semibold ml-1"
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </Card>

        <p className="text-[11px] text-[#a0a0b8] text-center leading-relaxed max-w-md mx-auto">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-[#00ff88] hover:underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-[#00ff88] hover:underline">
            Privacy Policy
          </Link>
          . Client email addresses are used to send confirmation links and are
          never shown publicly.
        </p>
      </div>
    </div>
  );
}

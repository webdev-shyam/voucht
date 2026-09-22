"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/Logo";
import { toast } from "@/components/ui/use-toast";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Signed in successfully to Voucht.",
          variant: "success",
        });
        router.push("/dashboard");
      } else {
        // Smooth demo fallback when Supabase is in initial configuration
        setTimeout(() => {
          toast({
            title: "Welcome back!",
            description: "Signed in successfully to your Voucht workspace.",
            variant: "success",
          });
          router.push("/dashboard");
        }, 500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast({
        title: "Login Error",
        description: message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
            title: "Google Sign In Failed",
            description: error.message,
            variant: "destructive",
          });
          setOauthLoading(false);
        }
      } else {
        setTimeout(() => {
          toast({
            title: "Signed In with Google",
            description: "Proceeding to your Voucht dashboard...",
            variant: "success",
          });
          router.push("/dashboard");
        }, 500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred with Google Sign In.";
      toast({
        title: "OAuth Error",
        description: message,
        variant: "destructive",
      });
      setOauthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a2e] flex flex-col justify-center items-center p-4 relative">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00ff88]/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        {/* Top Logo & Heading */}
        <div className="text-center flex flex-col items-center">
          <Logo size="lg" className="mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-[#a0a0b8] mt-1.5">
            Log in to manage your verified milestones & trust score
          </p>
        </div>

        {/* Centered card on navy background with border-white/10 and subtle glass morphism */}
        <Card className="border border-white/10 bg-[#1e1e3f]/90 backdrop-blur-sm rounded-2xl shadow-2xl p-2 sm:p-4">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white font-bold">Log In</CardTitle>
            <CardDescription className="text-xs text-[#a0a0b8]">
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white text-xs font-semibold">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#a0a0b8] absolute left-3.5 top-3" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah@chen.dev"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 bg-[#1a1a2e] border-white/10 text-white rounded-xl placeholder:text-[#a0a0b8]/50 focus-visible:ring-[#00ff88]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white text-xs font-semibold">
                    Password
                  </Label>
                  <a href="#" className="text-xs text-[#00ff88] hover:underline">
                    Forgot password?
                  </a>
                </div>
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
              </div>

              <Button
                type="submit"
                variant="electric"
                className="w-full h-11 text-sm font-semibold rounded-xl mt-2"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Log In"}
              </Button>
            </form>

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

            {/* Google OAuth button (outline style) */}
            <Button
              variant="outline"
              type="button"
              className="w-full h-11 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl gap-2.5"
              onClick={handleGoogleLogin}
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
              <span>{oauthLoading ? "Connecting to Google..." : "Continue with Google"}</span>
            </Button>
          </CardContent>

          <CardFooter className="pt-2 pb-4 justify-center">
            <p className="text-xs text-[#a0a0b8]">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-[#00ff88] hover:underline font-semibold ml-1">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

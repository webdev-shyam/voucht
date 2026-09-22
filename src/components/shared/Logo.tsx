import Link from "next/link";
import { ShieldCheck } from "lucide-react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link href="/" className={`inline-flex items-center gap-2 group ${className}`}>
      <span className="font-extrabold text-[#00ff88] text-xl sm:text-2xl transition-transform group-hover:scale-110">
        ✓
      </span>
      <span className={`font-bold tracking-tight text-white ${textSizes[size]}`}>
        voucht
      </span>
    </Link>
  );
}

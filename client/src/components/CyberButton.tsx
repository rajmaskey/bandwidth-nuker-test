import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost";
  isLoading?: boolean;
  size?: "sm" | "md" | "lg";
}

export function CyberButton({
  className,
  variant = "primary",
  isLoading = false,
  size = "md",
  children,
  ...props
}: CyberButtonProps) {
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] border border-primary/50",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] border border-secondary/50",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] border border-destructive/50",
    outline: "bg-transparent border border-primary text-primary hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(0,255,255,0.2)]",
    ghost: "bg-transparent text-primary hover:bg-primary/10",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={cn(
        "cyber-button inline-flex items-center justify-center font-bold disabled:opacity-50 disabled:cursor-not-allowed",
        "clip-path-slant", // You can add a custom clip path utility or svg later if needed, for now pure CSS
        variants[variant],
        sizes[size],
        className
      )}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

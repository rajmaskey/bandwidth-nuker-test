import { Link, useLocation } from "wouter";
import { Activity, History, Shield, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Load Runner", icon: Terminal },
    { href: "/history", label: "Mission Logs", icon: History },
  ];

  return (
    <nav className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary animate-pulse" />
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-accent font-display tracking-widest">
              NET.BREAKER
            </span>
          </div>
          
          <div className="flex space-x-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location === link.href;
              return (
                <Link 
                  key={link.href} 
                  href={link.href}
                  className={cn(
                    "px-4 py-2 flex items-center gap-2 text-sm font-medium transition-all duration-200 border-b-2",
                    isActive 
                      ? "border-primary text-primary bg-primary/5 shadow-[0_4px_12px_-4px_rgba(0,255,255,0.2)]" 
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="uppercase tracking-wide">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}

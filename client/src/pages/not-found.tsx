import { Link } from "wouter";
import { AlertTriangle } from "lucide-react";
import { CyberButton } from "@/components/CyberButton";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden">
      <div className="scanline" />
      
      <div className="cyber-card p-12 max-w-md text-center border-destructive/50 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
        <AlertTriangle className="w-20 h-20 text-destructive mx-auto mb-6 animate-pulse" />
        
        <h1 className="text-4xl font-display font-bold text-destructive mb-4">404 ERROR</h1>
        <p className="text-muted-foreground font-mono mb-8">
          The requested data segment could not be located in the neural network.
        </p>

        <Link href="/">
          <CyberButton variant="destructive" className="w-full">
            Return to Base
          </CyberButton>
        </Link>
      </div>
    </div>
  );
}

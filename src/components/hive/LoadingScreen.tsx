import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/[.04] blur-[120px] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-display font-black text-2xl tracking-[-.03em] text-foreground">
            Beezzy<span className="text-gold">.</span>
          </h1>
          <span className="text-muted-foreground text-[.6rem] tracking-[.35em] uppercase font-heading">
            The Hive
          </span>
        </div>

        {/* Hexagon animation */}
        <div className="relative w-16 h-16">
          <svg viewBox="0 0 64 64" className="w-full h-full animate-spin" style={{ animationDuration: "3s" }}>
            <polygon
              points="32,4 58,18 58,46 32,60 6,46 6,18"
              fill="none"
              stroke="hsl(var(--gold))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="180"
              strokeDashoffset="45"
              opacity="0.7"
            />
          </svg>
          <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full animate-spin" style={{ animationDuration: "5s", animationDirection: "reverse" }}>
            <polygon
              points="32,10 52,22 52,42 32,54 12,42 12,22"
              fill="none"
              stroke="hsl(var(--gold))"
              strokeWidth="0.8"
              opacity="0.25"
            />
          </svg>
        </div>

        {/* Loading indicator */}
        <div className="w-48 flex flex-col items-center gap-3">
          <div className="w-full h-[2px] bg-border rounded-full overflow-hidden">
            <div className="h-full bg-gold/70 rounded-full animate-loading-bar" />
          </div>
          <p className="text-muted-foreground text-[.6rem] tracking-[.2em] uppercase font-heading">
            Carregando conteúdo{dots}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loading-bar {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;

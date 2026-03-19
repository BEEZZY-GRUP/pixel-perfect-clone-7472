import { useEffect, useState } from "react";

const LoadingScreen = () => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Accelerate near the end
        const increment = prev < 60 ? 4 : prev < 85 ? 2 : 1;
        return Math.min(prev + increment, 100);
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/[.04] blur-[120px] animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <h1 className="font-sans font-extrabold text-2xl tracking-[.25em] uppercase text-foreground">
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
              strokeDasharray="180"
              strokeDashoffset={180 - (progress / 100) * 180}
              strokeLinecap="round"
              className="transition-all duration-200"
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

        {/* Progress bar */}
        <div className="w-48 flex flex-col items-center gap-3">
          <div className="w-full h-[2px] bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gold/70 rounded-full transition-all duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-muted-foreground text-[.6rem] tracking-[.2em] uppercase font-heading">
            Preparando sua colmeia…
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;

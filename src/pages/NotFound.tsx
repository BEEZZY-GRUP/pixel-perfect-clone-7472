import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const NotFound = () => {
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Starfield effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const stars: { x: number; y: number; z: number; pz: number }[] = [];
    const NUM_STARS = 400;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * canvas.width,
        pz: 0,
      });
    }

    const animate = () => {
      raf = requestAnimationFrame(animate);
      ctx.fillStyle = "rgba(8, 8, 7, 0.25)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      for (const star of stars) {
        star.pz = star.z;
        star.z -= 1.5;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = canvas.width;
          star.pz = star.z;
        }

        const sx = (star.x / star.z) * cx + cx;
        const sy = (star.y / star.z) * cy + cy;
        const px = (star.x / star.pz) * cx + cx;
        const py = (star.y / star.pz) * cy + cy;

        const size = Math.max(0, (1 - star.z / canvas.width) * 2.5);
        const alpha = Math.max(0, 1 - star.z / canvas.width);

        ctx.beginPath();
        ctx.strokeStyle = `hsla(36, 35%, 61%, ${alpha * 0.7})`;
        ctx.lineWidth = size;
        ctx.moveTo(px, py);
        ctx.lineTo(sx, sy);
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = `hsla(36, 54%, 71%, ${alpha})`;
        ctx.arc(sx, sy, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" />

      {/* Radial glow */}
      <div className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, hsla(36,35%,61%,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-[2] text-center flex flex-col items-center gap-6 px-6">
        {/* Floating logo */}
        <div className="animate-float">
          <img
            src="/images/astronauta.png"
            alt="Astronauta Beezzy"
            className="w-36 h-auto md:w-52 drop-shadow-[0_0_40px_hsla(36,35%,61%,0.3)]"
          />
        </div>

        <h1
          className="font-display text-[clamp(5rem,15vw,12rem)] font-light leading-none tracking-tight text-gold/30"
          style={{ textShadow: "0 0 60px hsla(36,35%,61%,0.15)" }}
        >
          404
        </h1>

        <p className="font-display text-[clamp(1.2rem,3vw,2rem)] font-light italic text-gold-light/70 -mt-2">
          Perdido no espaço
        </p>

        <p className="text-[.82rem] leading-relaxed text-muted-foreground max-w-[360px]">
          A página que você procura não existe ou foi movida para outra dimensão.
        </p>

        <a
          href="/"
          className="mt-4 inline-flex items-center gap-3 font-heading text-[.72rem] tracking-[.16em] uppercase font-semibold text-background bg-gold px-7 py-4 hover:bg-gold-light hover:-translate-y-px transition-all group"
        >
          Voltar ao início
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-14px) rotate(-3deg); }
          75% { transform: translateY(8px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;

import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

const NotFound = () => {
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Subtle particle canvas (2D, no WebGL)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.15,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.4 + 0.1,
      });
    }

    const animate = () => {
      raf = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.fillStyle = `hsla(36, 35%, 61%, ${p.a})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
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
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
      style={{ background: "#0a0a09", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Particle canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-60" />

      {/* Noise texture — same as landing */}
      <div className="hero-noise" />

      {/* Radial glow */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 55%, hsla(36,35%,61%,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Top nav-like bar */}
      <nav
        className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-6 md:px-14 py-5"
        style={{ background: "linear-gradient(180deg, rgba(10,10,9,0.9) 0%, transparent 100%)" }}
      >
        <a href="/" className="flex items-center gap-3 no-underline">
          <img src="/images/logo_branca.png" alt="Beezzy" className="h-7 w-auto" />
        </a>
        <a
          href="/"
          className="text-[.65rem] tracking-[.2em] uppercase font-medium no-underline transition-colors"
          style={{ color: "hsl(36,35%,61%)", fontFamily: "'DM Sans', sans-serif" }}
        >
          Voltar ao início
        </a>
      </nav>

      {/* Main content */}
      <div className="relative z-[3] flex flex-col items-center text-center px-6 gap-0">
        {/* Astronaut floating */}
        <div className="not-found-float mb-6">
          <img
            src="/images/astronauta.png"
            alt="Astronauta Beezzy"
            className="w-40 md:w-56 h-auto"
            style={{
              filter: "drop-shadow(0 0 50px hsla(36,35%,61%,0.2))",
            }}
          />
        </div>

        {/* Eyebrow */}
        <div
          className="flex items-center gap-3 mb-5"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: ".65rem",
            letterSpacing: ".24em",
            textTransform: "uppercase",
            color: "hsl(36,35%,61%)",
            fontWeight: 500,
          }}
        >
          <span
            className="block"
            style={{ width: 22, height: 1, background: "hsl(36,35%,61%)" }}
          />
          Página não encontrada
        </div>

        {/* Big 404 */}
        <h1
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(6rem, 18vw, 14rem)",
            fontWeight: 300,
            lineHeight: 0.9,
            letterSpacing: "-0.03em",
            color: "hsla(36,35%,61%,0.18)",
            margin: 0,
            textShadow: "0 0 80px hsla(36,35%,61%,0.08)",
          }}
        >
          404
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "clamp(1.3rem, 3vw, 2.2rem)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "hsl(36,54%,71%)",
            margin: "0.5rem 0 0",
            opacity: 0.8,
          }}
        >
          Perdido no espaço
        </p>

        {/* Description */}
        <p
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: ".85rem",
            lineHeight: 1.75,
            color: "hsl(30,4%,59%)",
            maxWidth: 380,
            margin: "1.5rem auto 0",
          }}
        >
          A página que você procura não existe ou foi movida para outra dimensão.
        </p>

        {/* CTA button — same style as landing */}
        <a
          href="/"
          className="group"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: ".72rem",
            letterSpacing: ".16em",
            textTransform: "uppercase",
            fontWeight: 600,
            color: "#0a0a09",
            background: "hsl(36,35%,61%)",
            padding: "16px 36px",
            marginTop: "2rem",
            textDecoration: "none",
            transition: "all .3s",
          }}
        >
          Voltar ao início
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="transition-transform group-hover:translate-x-1"
          >
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>

      {/* Bottom divider — same as landing */}
      <div
        className="absolute bottom-12 left-14 right-14 z-[2] hidden md:block"
        style={{
          height: 1,
          background:
            "linear-gradient(90deg, transparent, hsla(40,11%,95%,0.1) 30%, hsla(40,11%,95%,0.1) 70%, transparent)",
        }}
      />

      <style>{`
        @keyframes not-found-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-12px) rotate(-2deg); }
          66% { transform: translateY(6px) rotate(1.5deg); }
        }
        .not-found-float {
          animation: not-found-float 7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;

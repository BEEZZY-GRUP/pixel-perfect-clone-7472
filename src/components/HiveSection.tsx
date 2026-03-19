import { useEffect, useRef, useCallback } from "react";

const HiveSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const tiltRef = useRef({ rx: 0, ry: 0 });

  // Mouse tracking for 3D tilt + particle influence
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    mouseRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    // 3D tilt — max ±4deg
    tiltRef.current = { rx: -dy * 4, ry: dx * 4 };
  }, []);

  const handleMouseLeave = useCallback(() => {
    tiltRef.current = { rx: 0, ry: 0 };
  }, []);

  // Animate tilt
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let currentRx = 0, currentRy = 0;
    let raf: number;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      currentRx += (tiltRef.current.rx - currentRx) * 0.08;
      currentRy += (tiltRef.current.ry - currentRy) * 0.08;
      container.style.transform = `perspective(800px) rotateX(${currentRx}deg) rotateY(${currentRy}deg)`;
    };
    raf = requestAnimationFrame(animate);

    document.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  // Particle system with mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let size = canvas.parentElement?.offsetWidth || 400;
    canvas.width = size;
    canvas.height = size;

    const count = 120;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    class Particle {
      x = 0; y = 0; vx = 0; vy = 0; life = 0; maxLife = 0; r = 0; lum = 0; hue = 0;
      constructor() { this.reset(); }
      reset() {
        const angle = rand(0, Math.PI * 2);
        const radius = rand(10, size * 0.42);
        this.x = size / 2 + Math.cos(angle) * radius;
        this.y = size / 2 + Math.sin(angle) * radius;
        this.vx = rand(-0.25, 0.25);
        this.vy = rand(-0.25, 0.25);
        this.life = 0;
        this.maxLife = rand(140, 350);
        this.r = rand(0.4, 3);
        this.lum = rand(55, 98);
        this.hue = rand(36, 42); // slight golden tint
      }
      update(t: number, mx: number, my: number) {
        this.life++;
        const nx = (this.x / size) * 3 + t * 0.4;
        const ny = (this.y / size) * 3 + t * 0.3;
        const flowAngle = Math.sin(nx * 1.3) * Math.cos(ny * 1.1) * Math.PI * 2;

        // Mouse repulsion
        const mdx = this.x - mx * size;
        const mdy = this.y - my * size;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        const repulse = Math.max(0, 1 - mDist / (size * 0.2));
        const repulseAngle = Math.atan2(mdy, mdx);

        this.x += Math.cos(flowAngle) * 0.5 + this.vx + Math.cos(repulseAngle) * repulse * 1.5;
        this.y += Math.sin(flowAngle) * 0.5 + this.vy + Math.sin(repulseAngle) * repulse * 1.5;

        const dx = this.x - size / 2, dy = this.y - size / 2;
        if (Math.sqrt(dx * dx + dy * dy) > size * 0.47 || this.life > this.maxLife) this.reset();
      }
      draw(ctx: CanvasRenderingContext2D) {
        const alpha = Math.min(this.life / 30, 1) * Math.min((this.maxLife - this.life) / 30, 1);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        // Subtle golden glow on larger particles
        if (this.r > 2) {
          ctx.fillStyle = `hsla(${this.hue},25%,${this.lum}%,${alpha * 0.5})`;
          ctx.shadowColor = `hsla(${this.hue},30%,70%,${alpha * 0.3})`;
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = `hsla(0,0%,${this.lum}%,${alpha * 0.7})`;
          ctx.shadowBlur = 0;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const p = new Particle();
      p.life = Math.floor(rand(0, p.maxLife));
      particles.push(p);
    }

    let t = 0;
    let raf: number;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, size, size);

      // Background circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#0f0f0f";
      ctx.fill();
      ctx.restore();

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      // Connection lines with golden tint near mouse
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 55) {
            const midX = (particles[i].x + particles[j].x) / 2;
            const midY = (particles[i].y + particles[j].y) / 2;
            const mDist = Math.sqrt((midX - mx * size) ** 2 + (midY - my * size) ** 2);
            const nearMouse = Math.max(0, 1 - mDist / (size * 0.25));
            const lineAlpha = (1 - dist / 55) * 0.15;

            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            if (nearMouse > 0.1) {
              ctx.strokeStyle = `hsla(36,30%,65%,${lineAlpha * (0.5 + nearMouse)})`;
              ctx.lineWidth = 0.6 + nearMouse * 0.4;
            } else {
              ctx.strokeStyle = `rgba(245,244,240,${lineAlpha})`;
              ctx.lineWidth = 0.5;
            }
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => { p.update(t, mx, my); p.draw(ctx); });
      t += 0.008;
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="hive" className="border-t border-border px-6 py-[72px] md:px-[60px] md:py-[130px] grid grid-cols-1 md:grid-cols-2 gap-[60px] md:gap-[100px] items-center">
      <div
        ref={containerRef}
        className="reveal hive-visual-gsap relative aspect-square max-w-[280px] md:max-w-[460px]"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        <div className="absolute -inset-4 border border-gold-border rounded-full" style={{ animation: "spin-slow 22s linear infinite", transform: "translateZ(-20px)" }} />
        <div className="absolute -inset-11 border border-dashed border-[rgba(200,169,110,0.12)] rounded-full" style={{ animation: "spin-slow 40s linear infinite reverse", transform: "translateZ(-40px)" }} />
        <div className="w-full h-full rounded-full overflow-hidden" style={{ transform: "translateZ(10px)" }}>
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: "0 0 80px 20px rgba(200,169,110,0.06)", transform: "translateZ(5px)" }} />
      </div>
      <div>
        <div className="section-eyebrow reveal">The Hive</div>
        <h2 className="section-title reveal mt-4 mb-7">
          Um ecossistema<br />
          <em className="font-display italic font-light text-gold-light">vivo e real.</em>
        </h2>
        <p className="reveal reveal-delay-1 text-[.875rem] leading-[1.9] text-muted-foreground max-w-[420px] mt-6">
          The Hive é mais do que uma comunidade. É um ecossistema onde empresários, criativos e inovadores se conectam, colaboram e crescem juntos.
        </p>
        <p className="reveal reveal-delay-2 text-[.875rem] leading-[1.9] text-muted-foreground max-w-[420px] mt-6">
          Queremos que você, empresário(a), faça parte de algo maior — onde cada conexão é uma oportunidade e cada encontro pode mudar o rumo do seu negócio.
        </p>
        <a
          href="https://api.whatsapp.com/send/?phone=555584291090&text=Ol%C3%A1%21+Vim+pelo+site+da+Beezzy+e+gostaria+de+saber+como+minha+empresa+pode+fazer+parte+do+ecossistema.&type=phone_number&app_absent=0"
          target="_blank"
          rel="noopener noreferrer"
          className="reveal reveal-delay-3 inline-flex items-center gap-[10px] font-heading text-[.72rem] tracking-[.15em] uppercase text-gold no-underline mt-12 pb-2 border-b border-gold-border hover:border-gold hover:gap-4 transition-all font-semibold"
        >
          Entrar para o ecossistema
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default HiveSection;

import { useEffect, useRef } from "react";

const HiveSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let size = canvas.parentElement?.offsetWidth || 400;
    canvas.width = size;
    canvas.height = size;

    const count = 90;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    class Particle {
      x = 0; y = 0; vx = 0; vy = 0; life = 0; maxLife = 0; r = 0; lum = 0;
      constructor() { this.reset(); }
      reset() {
        const angle = rand(0, Math.PI * 2);
        const radius = rand(10, size * 0.42);
        this.x = size / 2 + Math.cos(angle) * radius;
        this.y = size / 2 + Math.sin(angle) * radius;
        this.vx = rand(-0.3, 0.3); this.vy = rand(-0.3, 0.3);
        this.life = 0; this.maxLife = rand(120, 300);
        this.r = rand(0.5, 2.5); this.lum = rand(50, 95);
      }
      update(t: number) {
        this.life++;
        const nx = (this.x / size) * 3 + t * 0.4;
        const ny = (this.y / size) * 3 + t * 0.3;
        const angle = Math.sin(nx * 1.3) * Math.cos(ny * 1.1) * Math.PI * 2;
        this.x += Math.cos(angle) * 0.5 + this.vx;
        this.y += Math.sin(angle) * 0.5 + this.vy;
        const dx = this.x - size / 2, dy = this.y - size / 2;
        if (Math.sqrt(dx * dx + dy * dy) > size * 0.47 || this.life > this.maxLife) this.reset();
      }
      draw(ctx: CanvasRenderingContext2D) {
        const alpha = Math.min(this.life / 30, 1) * Math.min((this.maxLife - this.life) / 30, 1);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0,0%,${this.lum}%,${alpha * 0.7})`;
        ctx.fill();
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
      ctx.save();
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fillStyle = "#0f0f0f";
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 48) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(245,244,240,${(1 - dist / 48) * 0.12})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => { p.update(t); p.draw(ctx); });
      t += 0.008;
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section id="hive" className="border-t border-border px-7 py-20 md:px-14 md:py-[140px] grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
      <div className="reveal relative aspect-square max-w-[280px] md:max-w-[480px]">
        <div className="absolute -inset-4 border border-gold-border rounded-full" style={{ animation: "spin-slow 20s linear infinite" }} />
        <div className="absolute -inset-10 border border-dashed border-gold-dim rounded-full" style={{ animation: "spin-slow 35s linear infinite reverse" }} />
        <div className="w-full h-full rounded-full overflow-hidden">
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>
      </div>
      <div>
        <div className="reveal text-[.65rem] tracking-[.25em] uppercase text-gold mb-[72px] flex items-center gap-3.5">
          <span className="block w-6 h-px bg-gold" />
          The Hive
        </div>
        <h2 className="reveal font-heading text-[clamp(2.2rem,5vw,5rem)] font-light leading-[1.08] tracking-tight mb-7">
          Um ecossistema
          <br />
          <em className="font-display italic font-light text-gold-light">vivo e real.</em>
        </h2>
        <p className="reveal reveal-delay-1 text-sm leading-[1.9] text-muted-foreground max-w-[440px] mt-7">
          The Hive é mais do que uma comunidade. É um ecossistema onde empresários, criativos e inovadores se conectam, colaboram e crescem juntos.
        </p>
        <p className="reveal reveal-delay-2 text-sm leading-[1.9] text-muted-foreground max-w-[440px] mt-7">
          Queremos que você, empresário(a), faça parte de algo maior — onde cada conexão é uma oportunidade e cada encontro pode mudar o rumo do seu negócio.
        </p>
        <a
          href="#"
          className="reveal reveal-delay-3 inline-flex items-center gap-2.5 text-xs tracking-[.15em] uppercase text-gold no-underline mt-12 pb-2 border-b border-gold-border hover:border-gold hover:text-gold-light transition-colors"
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
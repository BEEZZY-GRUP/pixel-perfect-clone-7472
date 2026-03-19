import { useRef, useEffect, useState, useCallback } from "react";

const beforeItems = [
  "Dono resolve tudo",
  "Processos na cabeça",
  "Resultados instáveis",
  "Time sem autonomia",
  "Sem visão de futuro",
];

const afterItems = [
  "Processos documentados",
  "Liderança preparada",
  "Resultados consistentes",
  "Cultura definida",
  "Visão de futuro clara",
];

const LegacySection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);

  const updatePos = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(15, Math.min(85, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => updatePos(e.clientX);
    const onTouchMove = (e: TouchEvent) => updatePos(e.touches[0].clientX);
    const onUp = () => setDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchend", onUp);
    };
  }, [dragging, updatePos]);

  return (
    <section id="legacy" className="bg-foreground text-background px-6 py-[72px] md:px-[60px] md:py-[130px]">
      <div className="section-eyebrow !text-gold-dark before:!bg-gold-dark">O que entregamos</div>
      <h2 className="section-title reveal !text-background">
        De dependente<br />
        <em className="font-display italic font-light !text-gold-dark">a independente.</em>
      </h2>
      <p className="reveal reveal-delay-1 text-[.875rem] text-muted-foreground mt-3 italic">
        Arraste o divisor para ver a transformação.
      </p>

      {/* Before/After Slider */}
      <div
        ref={containerRef}
        className="reveal reveal-delay-2 relative mt-16 mb-[72px] border border-border h-[340px] md:h-[340px] overflow-hidden select-none"
      >
        {/* Before — full-width, clipped from the right */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        >
          <div className="absolute inset-0 bg-[hsl(40_6%_5%)] flex flex-col justify-center items-center text-center">
            <div className="font-heading text-[.62rem] tracking-[.22em] uppercase font-bold mb-6 text-foreground/30">
              Antes
            </div>
            <div className="flex flex-col gap-3">
              {beforeItems.map((item) => (
                <div key={item} className="flex items-center gap-3 font-heading text-[.82rem] font-medium text-foreground/35 whitespace-nowrap">
                  <span className="text-[.75rem] text-foreground/25">✕</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* After — full-width, clipped from the left */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <div className="absolute inset-0 bg-background flex flex-col justify-center items-center text-center">
            <div className="font-heading text-[.62rem] tracking-[.22em] uppercase font-bold mb-6 text-gold">
              Legado
            </div>
            <div className="flex flex-col gap-3">
              {afterItems.map((item) => (
                <div key={item} className="flex items-center gap-3 font-heading text-[.82rem] font-medium text-foreground whitespace-nowrap">
                  <span className="text-[.75rem] text-gold">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-gold cursor-ew-resize flex items-center justify-center z-10"
          style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => { setDragging(true); e.preventDefault(); }}
          onTouchStart={() => setDragging(true)}
        >
          <div className="w-9 h-9 bg-gold text-background rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M5 3l-3 5 3 5M11 3l3 5-3 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="reveal mt-[72px] pt-[52px] border-t border-background/[.12] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 flex-wrap">
        <p className="font-display text-[clamp(1.3rem,2.2vw,2.2rem)] font-light italic max-w-[540px] leading-[1.45] text-[#6b5124]">
          "Você não precisa mais de nós para sobreviver — mas pode querer a gente para ir ainda mais longe."
        </p>
        <a
          href="#cta-section"
          className="inline-flex items-center gap-3 font-heading text-[.72rem] tracking-[.16em] uppercase font-semibold text-background bg-gold no-underline px-9 py-[18px] hover:bg-gold-light hover:-translate-y-px transition-all group"
        >
          Quero chegar ao legado
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </section>
  );
};

export default LegacySection;

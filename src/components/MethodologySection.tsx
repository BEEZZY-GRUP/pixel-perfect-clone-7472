import { useState } from "react";

const steps = [
  { num: "01", title: "Diagnóstico", desc: "Mapeamos os processos e identificamos gargalos e oportunidades invisíveis para quem está dentro da operação." },
  { num: "02", title: "Plano Operacional", desc: "Planejamento detalhado de todas as ações, com métricas definidas e responsáveis claros desde o início." },
  { num: "03", title: "Execução", desc: "Fazer, acompanhar, ajustar e documentar — com rigor e presença real. Somos sócios na operação, não observadores." },
  { num: "04", title: "Resultados", desc: "Mensuração precisa de números. Dashboards para decisões informadas, não para impressionar." },
  { num: "05", title: "Legado", desc: "Empresa autossustentável, liderança preparada, futuro definido. O começo da sua independência real." },
];

const ArrowRight = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M11.5 7h-9M6 3.5L2.5 7 6 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MethodologySection = () => {
  const [current, setCurrent] = useState(0);
  const progressPct = Math.round((current / 4) * 100);

  return (
    <section id="methodology" className="px-6 py-[72px] md:px-[60px] md:py-[130px]">
      <div className="max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-20 gap-8 flex-wrap">
        <div>
          <div className="section-eyebrow reveal">Metodologia Legacy</div>
          <h2 className="section-title reveal">
            Cinco pilares.<br />
            <em className="font-display italic font-light text-gold-light">Um legado.</em>
          </h2>
        </div>
        <p className="reveal reveal-delay-1 text-[.85rem] leading-[1.8] text-muted-foreground max-w-[340px]">
          Do caos à independência — em cinco etapas.
        </p>
      </div>

      {/* Stepper */}
      <div className="reveal reveal-delay-2">
        {/* Progress Track */}
        <div className="relative mb-14">
          <div className="absolute top-5 left-5 right-5 h-px bg-foreground/20">
            <div className="h-full bg-gold transition-all duration-500" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between relative z-[1]">
            {steps.map((step, i) => (
              <button
                key={step.num}
                onClick={() => setCurrent(i)}
                className={`w-10 h-10 flex items-center justify-center border transition-all cursor-pointer ${
                  i === current
                    ? "border-gold bg-gold"
                    : i < current
                    ? "border-gold bg-transparent"
                    : "border-foreground/20 bg-background"
                }`}
              >
                <span
                  className={`font-display text-[.85rem] transition-colors ${
                    i === current
                      ? "text-background font-semibold"
                      : i < current
                      ? "text-gold"
                      : "text-muted-foreground"
                  }`}
                >
                  {step.num}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Panel */}
        <div className="border border-border">
          <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_auto] gap-6 md:gap-12 p-10 md:p-16 items-start">
            <div className="font-display text-[4rem] md:text-[6rem] font-light leading-none text-gold opacity-60">
              {steps[current].num}
            </div>
            <div>
              <h3 className="font-display text-[clamp(1.8rem,3vw,3rem)] font-light italic text-gold-light mb-4">
                {steps[current].title}
              </h3>
              <p className="text-[.9rem] leading-[1.8] text-muted-foreground">
                {steps[current].desc}
              </p>
            </div>
            <div className="flex flex-row md:flex-col gap-3 items-start md:items-end md:justify-center pt-2">
              {current > 0 && (
                <button
                  onClick={() => setCurrent(current - 1)}
                  className="inline-flex items-center gap-2 font-heading text-[.7rem] tracking-[.14em] uppercase font-semibold text-muted-foreground hover:text-foreground transition-colors bg-transparent border-none cursor-pointer"
                >
                  <ArrowLeft /> Anterior
                </button>
              )}
              {current < 4 ? (
                <button
                  onClick={() => setCurrent(current + 1)}
                  className="inline-flex items-center gap-2 font-heading text-[.7rem] tracking-[.14em] uppercase font-semibold text-foreground hover:text-gold transition-colors bg-transparent border-none cursor-pointer"
                >
                  Próximo <ArrowRight />
                </button>
              ) : (
                <a
                  href="#cta-section"
                  className="inline-flex items-center gap-[10px] font-heading text-[.7rem] tracking-[.14em] uppercase font-bold text-background bg-gold no-underline px-6 py-3.5 hover:bg-gold-light transition-colors"
                >
                  Quero chegar aqui <ArrowRight />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MethodologySection;

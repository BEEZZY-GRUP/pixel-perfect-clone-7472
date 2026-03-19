const steps = [
  { num: "01", title: "Diagnóstico", desc: "Mapeamos os processos da empresa e identificamos gargalos e oportunidades invisíveis." },
  { num: "02", title: "Plano Operacional", desc: "Planejamento de todas as ações que serão executadas e como serão mensuradas." },
  { num: "03", title: "Execução", desc: "Fazer, acompanhar, ajustar e documentar — com rigor e presença real." },
  { num: "04", title: "Resultados", desc: "Mensuração precisa de números e criação de dashboards para decisões informadas." },
  { num: "05", title: "Legado", desc: "Empresa autossustentável, liderança preparada e futuro definido. O início da independência." },
];

const MethodologySection = () => (
  <section id="methodology" className="px-7 py-20 md:px-14 md:py-[140px]">
    <div className="reveal text-[.65rem] tracking-[.25em] uppercase text-gold mb-[72px] flex items-center gap-3.5">
      <span className="block w-6 h-px bg-gold" />
      Metodologia Legacy
    </div>
    <h2 className="reveal font-heading text-[clamp(2.2rem,5vw,5rem)] font-light leading-[1.08] tracking-tight">
      Cinco pilares.
      <br />
      <em className="font-display italic font-light text-gold-light">Um legado.</em>
    </h2>
    <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border border-border">
      {steps.map((step, i) => (
        <div
          key={step.num}
          className={`reveal ${i > 0 ? `reveal-delay-${i}` : ""} relative px-9 py-12 border-b sm:border-b lg:border-b-0 lg:border-r border-border last:border-r-0 last:border-b-0 overflow-hidden group`}
        >
          <div className="absolute inset-0 bg-gold-dim origin-bottom scale-y-0 group-hover:scale-y-100 transition-transform duration-500 ease-[cubic-bezier(.25,.46,.45,.94)] z-0" />
          <div className="relative z-[1]">
            <div className="font-display text-[4rem] font-light text-gold-dim leading-none mb-10 group-hover:text-gold transition-colors">
              {step.num}
            </div>
            <div className="font-bold text-[.8rem] tracking-[.12em] uppercase mb-4 group-hover:text-foreground transition-colors">
              {step.title}
            </div>
            <div className="text-[.8rem] leading-[1.8] text-muted-foreground group-hover:text-muted-foreground transition-colors">
              {step.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default MethodologySection;
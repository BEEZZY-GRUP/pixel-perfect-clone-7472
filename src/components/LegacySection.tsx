const items = [
  { title: "Processos Documentados", desc: "Processos claros que qualquer pessoa na empresa consegue executar, sem depender de uma única figura.", icon: <path d="M9 1v16M1 9h16" /> },
  { title: "Liderança Preparada", desc: "Time e liderança capacitados para tomar decisões sozinhos, com autonomia e confiança.", icon: <><circle cx="9" cy="6" r="3" /><path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /></> },
  { title: "Resultados Consistentes", desc: "Números previsíveis e crescimento sustentável, não dependentes de sorte ou de um bom momento.", icon: <polyline points="2,14 6,8 10,11 14,4 16,6" /> },
  { title: "Cultura Definida", desc: "Valores, jeito de trabalhar e identidade clara — a fundação de uma empresa que perdurar.", icon: <><rect x="2" y="2" width="14" height="14" rx="1" /><path d="M6 9h6M9 6v6" /></> },
];

const LegacySection = () => (
  <section id="legacy" className="relative px-7 py-20 md:px-14 md:py-[140px] bg-foreground text-background overflow-hidden">
    <div className="text-[.65rem] tracking-[.25em] uppercase text-gold mb-[72px] flex items-center gap-3.5">
      <span className="block w-6 h-px bg-gold" />
      O que entregamos
    </div>
    <h2 className="reveal font-heading text-[clamp(2.2rem,5vw,5rem)] font-light leading-[1.08] tracking-tight text-background">
      Mais do que resultados —
      <br />
      <em className="font-display italic font-light text-gold-dark">uma empresa que funciona.</em>
    </h2>

    <div className="mt-[72px] grid grid-cols-1 md:grid-cols-2 gap-px bg-background/[.12]">
      {items.map((item, i) => (
        <div key={item.title} className={`reveal ${i > 0 ? `reveal-delay-${i}` : ""} bg-foreground p-12 flex gap-6 items-start hover:bg-grey-light transition-colors group`}>
          <div className="w-10 h-10 flex-shrink-0 border border-gold-border flex items-center justify-center text-gold-dark">
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-[18px] h-[18px]">
              {item.icon}
            </svg>
          </div>
          <div>
            <h4 className="text-[.8rem] font-bold tracking-[.1em] uppercase mb-2.5">{item.title}</h4>
            <p className="text-[.82rem] leading-[1.8] text-background/55">{item.desc}</p>
          </div>
        </div>
      ))}
      <div className="reveal bg-foreground p-12 flex gap-6 items-start hover:bg-grey-light transition-colors group md:col-span-2">
        <div className="w-10 h-10 flex-shrink-0 border border-gold-border flex items-center justify-center text-gold-dark">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-[18px] h-[18px]">
            <circle cx="9" cy="9" r="7" /><path d="M9 5v4l3 3" />
          </svg>
        </div>
        <div>
          <h4 className="text-[.8rem] font-bold tracking-[.1em] uppercase mb-2.5">Visão de Futuro</h4>
          <p className="text-[.82rem] leading-[1.8] text-background/55">
            A empresa sabe onde quer chegar e tem o caminho mapeado. O próximo ciclo de crescimento já está traçado — com ou sem a Beezzy ao lado.
          </p>
        </div>
      </div>
    </div>

    <div className="reveal mt-20 pt-12 border-t border-background/15 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
      <p className="font-display text-[clamp(1.4rem,2.5vw,2.4rem)] font-light italic max-w-[560px] leading-[1.4] text-gold-dark">
        "Você não precisa mais de nós para sobreviver — mas pode querer a gente para ir ainda mais longe."
      </p>
      <a
        href="#verticals"
        className="inline-flex items-center gap-3 text-xs tracking-[.18em] uppercase text-background no-underline px-8 py-4 border border-background/30 hover:bg-gold hover:text-background hover:border-gold transition-all group"
      >
        Nossas verticais
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </div>
  </section>
);

export default LegacySection;
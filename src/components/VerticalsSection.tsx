const verticals = [
  {
    index: "01",
    name: <>PaaS <em className="text-gold-light italic">— Partner as a Service</em></>,
    tag: "Estratégia",
    desc: "Consultoria estratégica para destravar faturamento, sair do vermelho, projetar o próximo nível e transformar a gestão. Ideal para empresas que precisam de um parceiro real — não de um relatório.",
  },
  {
    index: "02",
    name: <>Growth <em className="text-gold-light italic">— MarTech</em></>,
    tag: "Tecnologia",
    desc: "Marketing + Tecnologia integrados. As empresas precisam de resultado através de tecnologia — ela deve servir como facilitadora do processo, reduzindo tempo e aumentando o lucro real.",
  },
];

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-gold-border fill-none group-hover:stroke-background transition-colors">
    <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" />
  </svg>
);

const VerticalsSection = () => (
  <section id="verticals" className="px-6 py-[72px] md:px-[60px] md:py-[130px]">
    <div className="max-w-[1200px] mx-auto">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-[72px] gap-10 flex-wrap">
      <div>
        <div className="section-eyebrow reveal">Verticais de negócio</div>
        <h2 className="section-title reveal">
          Como<br />
          <em className="font-display italic font-light text-gold-light">atuamos.</em>
        </h2>
      </div>
      <p className="reveal reveal-delay-1 text-[.875rem] leading-[1.85] text-muted-foreground max-w-[360px]">
        Duas frentes complementares que cobrem a jornada do empresário — da estratégia à tecnologia.
      </p>
    </div>

    <div className="flex flex-col border-t border-border group/list">
      {verticals.map((v, i) => (
        <div
          key={v.index}
          className={`vertical-item-gsap grid grid-cols-[52px_1fr] md:grid-cols-[80px_1fr_1fr_auto] gap-5 md:gap-10 items-start py-[52px] border-b border-border transition-opacity group-hover/list:opacity-35 hover:!opacity-100 group cursor-pointer`}
        >
          <span className="font-display text-[1.1rem] text-gold pt-1.5">{v.index}</span>
          <div>
            <div className="font-display text-[clamp(1.5rem,2.5vw,2.4rem)] font-light leading-[1.1]">
              {v.name}
              <span className="inline-block font-heading text-[.62rem] tracking-[.14em] uppercase text-gold bg-gold-dim border border-gold-border px-2.5 py-0.5 ml-3 align-middle font-semibold">
                {v.tag}
              </span>
            </div>
          </div>
          <p className="hidden md:block text-[.85rem] leading-[1.9] text-muted-foreground pt-2">{v.desc}</p>
          <div className="hidden md:flex w-11 h-11 border border-foreground/20 items-center justify-center flex-shrink-0 mt-1 group-hover:bg-gold group-hover:border-gold transition-all">
            <ArrowIcon />
          </div>
        </div>
      ))}
    </div>
    </div>
  </section>
);

export default VerticalsSection;

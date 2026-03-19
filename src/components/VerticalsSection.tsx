const verticals = [
  { index: "01", name: <>PaaS — <em>Partner as a Service</em></>, desc: "Consultoria estratégica para destravar faturamento, sair do vermelho, projetar o próximo nível e transformar a gestão. Ideal para empresas que estão perdidas sem saber o que fazer." },
  { index: "02", name: <>Growth — <em>MarTech</em></>, desc: "Marketing + Tecnologia. As empresas precisam de resultados através de tecnologia — ela deve servir como facilitadora do processo, reduzindo tempo e aumentando o lucro." },
  { index: "03", name: <><em>The Hive</em> — O ecossistema</>, desc: "Um ecossistema de pessoas criativas, inovadoras e empreendedoras. O próximo cliente Beezzy pode precisar de você, ou você dele." },
];

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className="stroke-foreground fill-none group-hover:stroke-background transition-colors">
    <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" />
  </svg>
);

const VerticalsSection = () => (
  <section id="verticals" className="px-7 py-20 md:px-14 md:py-[140px]">
    <div className="flex flex-col md:flex-row justify-between items-start mb-20 gap-10">
      <div>
        <div className="reveal text-[.65rem] tracking-[.25em] uppercase text-muted-foreground mb-[72px] flex items-center gap-3.5">
          <span className="block w-6 h-px bg-muted-foreground" />
          Verticais de negócio
        </div>
        <h2 className="reveal font-display text-[clamp(2.2rem,5vw,5rem)] font-light leading-[1.08] tracking-tight">
          Como
          <br />
          <em>atuamos.</em>
        </h2>
      </div>
      <p className="reveal reveal-delay-1 text-sm leading-[1.9] text-muted-foreground max-w-[360px]">
        Três frentes complementares que cobrem toda a jornada do empresário — da estratégia à tecnologia, do negócio à comunidade.
      </p>
    </div>

    <div className="flex flex-col border-t border-border group/list">
      {verticals.map((v, i) => (
        <div
          key={v.index}
          className={`reveal ${i > 0 ? `reveal-delay-${i}` : ""} grid grid-cols-[48px_1fr] md:grid-cols-[80px_1fr_1fr_auto] gap-5 md:gap-10 items-start py-12 border-b border-border transition-opacity group-hover/list:opacity-40 hover:!opacity-100 group`}
        >
          <span className="font-display text-lg text-muted-foreground pt-1">{v.index}</span>
          <div className="font-display text-[clamp(1.4rem,2.5vw,2.2rem)] font-light leading-[1.1]">{v.name}</div>
          <p className="hidden md:block text-[.82rem] leading-[1.9] text-muted-foreground pt-1.5">{v.desc}</p>
          <div className="hidden md:flex w-10 h-10 border border-border items-center justify-center flex-shrink-0 group-hover:bg-foreground group-hover:border-foreground transition-all">
            <ArrowIcon />
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default VerticalsSection;

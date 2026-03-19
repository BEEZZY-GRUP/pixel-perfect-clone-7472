const CtaSection = () => (
  <section id="cta-section" className="bg-gold px-6 py-[72px] md:px-[60px] md:py-[110px] grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 md:gap-20 items-center">
    <div>
      <h2 className="reveal font-display text-[clamp(2.2rem,4.5vw,4.5rem)] font-light leading-[1.08] text-background tracking-[-0.02em]">
        Pronto para construir<br />o <em className="italic">legado</em> da sua empresa?
      </h2>
      <p className="reveal reveal-delay-1 text-[.875rem] leading-[1.8] text-background/60 mt-5 max-w-[480px]">
        Agende uma conversa com a Beezzy. Sem compromisso, sem formulário infinito. 
        Uma conversa direta para entender onde sua empresa está e para onde pode ir.
      </p>
    </div>
    <div className="reveal reveal-delay-2 flex flex-col gap-4 items-start flex-shrink-0">
      <a
        href="#"
        className="inline-flex items-center gap-3 font-heading text-[.72rem] tracking-[.16em] uppercase font-bold text-foreground bg-background no-underline px-10 py-5 hover:bg-[#1a1a18] hover:-translate-y-px transition-all whitespace-nowrap group"
      >
        Falar com a Beezzy agora
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
      <p className="font-heading text-[.7rem] text-background/50 tracking-[.08em]">
        Resposta em até 24 horas · Sem compromisso
      </p>
    </div>
  </section>
);

export default CtaSection;

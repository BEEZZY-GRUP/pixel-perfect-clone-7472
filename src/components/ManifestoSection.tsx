const ManifestoSection = () => (
  <div id="manifesto" className="grid grid-cols-1 md:grid-cols-2 border-t border-b border-border">
    <div className="px-7 py-20 md:px-14 md:py-[140px] border-b md:border-b-0 md:border-r border-border relative">
      <div className="text-[.65rem] tracking-[.25em] uppercase text-muted-foreground mb-[72px] flex items-center gap-3.5">
        <span className="block w-6 h-px bg-muted-foreground" />
        Quem somos
      </div>
      <blockquote className="reveal font-display text-[clamp(1.6rem,3vw,3.2rem)] font-light italic leading-[1.3] text-foreground">
        "O Legado não é o fim do trabalho. É o começo da independência."
      </blockquote>
      <div className="reveal reveal-delay-1 flex flex-col mt-16">
        <strong className="font-display text-[clamp(3rem,5vw,6rem)] font-light leading-none">5</strong>
        <span className="text-[.7rem] tracking-[.18em] uppercase text-muted-foreground mt-2.5">
          Pilares da Metodologia Legacy
        </span>
      </div>
    </div>
    <div className="px-7 py-20 md:px-14 md:py-[140px] flex flex-col justify-between">
      <div>
        <div className="text-[.65rem] tracking-[.25em] uppercase text-muted-foreground mb-[72px] flex items-center gap-3.5">
          <span className="block w-6 h-px bg-muted-foreground" />
          Filosofia
        </div>
        <p className="reveal text-sm leading-[2] text-muted-foreground max-w-[480px]">
          A Beezzy acredita que o sucesso verdadeiro de uma empresa não está nos resultados imediatos — está na sua capacidade de crescer, escalar e prosperar sem depender de ninguém.
        </p>
        <p className="reveal reveal-delay-1 text-sm leading-[2] text-muted-foreground max-w-[480px] mt-6">
          Quando uma empresa chega ao Legado, ela tem processos documentados, time preparado, resultados previsíveis, cultura definida e visão de futuro clara.
        </p>
      </div>
      <p className="reveal reveal-delay-2 text-sm leading-[2] text-foreground/[.45] italic max-w-[480px] mt-12">
        É aí que a Beezzy transiciona de sócia oculta para conselheira — presente nas decisões grandes, nas viradas de chave, no próximo ciclo de crescimento.
      </p>
    </div>
  </div>
);

export default ManifestoSection;

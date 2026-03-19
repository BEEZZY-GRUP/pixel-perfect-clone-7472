const values = [
  { index: "01", name: "Be Fast" },
  { index: "02", name: "Be Simple" },
  { index: "03", name: "Be Customer Centric" },
];

const ManifestoSection = () => (
  <div id="manifesto" className="border-t border-b border-border px-6 md:px-[60px]">
    <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2">
    <div className="py-[72px] md:py-[120px] border-b md:border-b-0 md:border-r border-border flex flex-col justify-between pr-0 md:pr-[60px]">
      <div>
        <div className="section-eyebrow">Quem somos</div>
        <blockquote className="reveal font-display text-[clamp(1.7rem,3vw,3rem)] font-light italic leading-[1.3] text-gold-light max-w-[440px]">
          "O Legado não é o fim do trabalho. É o começo da independência."
        </blockquote>
      </div>
      <div className="reveal reveal-delay-1 grid grid-cols-2 gap-px bg-border mt-[60px] border border-border">
        {[
          { value: "5", label: "Pilares da Metodologia" },
          { value: "3", label: "Verticais de negócio" },
          { value: "100%", label: "Presença na execução" },
          { value: "∞", label: "Potencial de escala" },
        ].map((stat) => (
          <div key={stat.label} className="bg-[hsl(40_6%_5%)] p-8 md:p-9 flex flex-col gap-2">
            <strong className="stat-value-gsap font-display text-[clamp(2.8rem,4.5vw,5rem)] font-light leading-none text-gold">
              {stat.value}
            </strong>
            <span className="font-heading text-[.68rem] tracking-[.16em] uppercase text-muted-foreground font-medium">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </div>

    <div className="py-[72px] md:py-[120px] pl-0 md:pl-[60px] flex flex-col justify-between gap-12">
      <div>
        <div className="section-eyebrow">Nossa filosofia</div>
        <p className="reveal text-[.9rem] leading-[1.85] text-muted-foreground">
          A Beezzy acredita que o sucesso verdadeiro de uma empresa não está nos resultados imediatos — 
          está na sua capacidade de crescer, escalar e prosperar{" "}
          <strong className="text-foreground font-medium">sem depender de ninguém.</strong>
        </p>
        <p className="reveal reveal-delay-1 text-[.9rem] leading-[1.85] text-muted-foreground mt-5">
          Quando uma empresa chega ao Legado, ela tem processos documentados, time preparado, 
          resultados previsíveis, cultura definida e visão de futuro clara.
        </p>
        <p className="reveal reveal-delay-2 text-[.9rem] leading-[1.85] text-muted-foreground mt-5">
          Num mundo cheio de consultorias com metodologias pré-escritas, somos diferentes: 
          entramos como sócios, não como fornecedores.
        </p>
      </div>
      <div>
        <p className="reveal reveal-delay-3 font-display italic text-[.95rem] text-foreground/40 leading-[1.6]">
          É aí que a Beezzy transiciona de sócia oculta para conselheira — presente nas decisões grandes, 
          nas viradas de chave, no próximo ciclo de crescimento.
        </p>
        <div className="reveal reveal-delay-4 mt-12 pt-10 border-t border-border flex flex-col gap-px">
          <div className="font-heading text-[.62rem] tracking-[.22em] uppercase text-muted-foreground font-semibold mb-5">
            Nossos valores
          </div>
          {values.map((v) => (
            <div
              key={v.index}
              className="flex items-center gap-5 py-5 border-b border-border last:border-b-0 cursor-default hover:pl-2 transition-all group"
            >
              <span className="font-display text-[.85rem] text-gold-border w-6 flex-shrink-0 group-hover:text-gold transition-colors">
                {v.index}
              </span>
              <span className="font-heading text-[.88rem] font-semibold tracking-[.06em] uppercase text-foreground flex-1 group-hover:text-gold-light transition-colors">
                {v.name}
              </span>
              <span className="w-5 h-px bg-gold-border flex-shrink-0 group-hover:w-9 group-hover:bg-gold transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  </div>
);

export default ManifestoSection;

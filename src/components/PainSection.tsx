import { useState } from "react";

const painItems = [
  "Empresa refém do dono",
  "Crescimento imprevisível",
  "Time sem autonomia",
  "Sem visão de futuro",
  "Marketing sem retorno",
  "Processos não documentados",
];

const messages = [
  "Clique nos problemas que você reconhece na sua empresa.",
  "Você identificou 1 problema. A Beezzy já viu isso antes.",
  "Dois problemas. Isso é mais comum do que parece.",
  "Três problemas. Você está na metade — e a situação é séria.",
  "Quatro problemas. Sua empresa precisa de mudança estrutural.",
  "Cinco problemas. Você está no lugar certo.",
  "Reconheceu tudo. Não é fraqueza — é honestidade. Vamos resolver.",
];

const PainSection = () => {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const count = selected.size;
  const pct = Math.round((count / 6) * 100);

  return (
    <section id="pain" className="bg-[hsl(40_6%_5%)] border-b border-border px-6 py-[72px] md:px-[60px] md:py-[130px]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-20 md:gap-[80px] mb-20 items-end">
        <div>
          <div className="section-eyebrow reveal">O diagnóstico</div>
          <h2 className="section-title reveal">
            Reconhece<br /><em className="font-display italic font-light text-gold-light">esses problemas?</em>
          </h2>
        </div>
        <p className="reveal reveal-delay-1 text-[.9rem] leading-[1.85] text-muted-foreground max-w-[440px] pt-5">
          Selecione os que fazem sentido para sua empresa.
        </p>
      </div>

      <div className="reveal reveal-delay-2">
        {/* Diagnostic Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border mb-10">
          {painItems.map((item, i) => {
            const active = selected.has(i);
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`relative overflow-hidden bg-[hsl(40_6%_5%)] p-10 md:p-[40px_36px] flex items-start gap-4 text-left transition-colors ${
                  active ? "bg-[hsl(40_5%_5%)]" : ""
                }`}
              >
                {/* Gold overlay */}
                <div
                  className={`absolute inset-0 bg-gold-dim transition-opacity ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
                <div
                  className={`relative z-[1] w-[22px] h-[22px] flex-shrink-0 border flex items-center justify-center mt-0.5 transition-all ${
                    active
                      ? "border-gold bg-gold text-background"
                      : "border-foreground/20 text-transparent"
                  }`}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span
                  className={`relative z-[1] font-heading text-[.82rem] font-semibold tracking-[.04em] uppercase leading-[1.4] transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {item}
                </span>
              </button>
            );
          })}
        </div>

        {/* Result */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-5">
            <div className="flex-1 h-0.5 bg-foreground/20 relative overflow-visible">
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-heading text-[.7rem] tracking-[.14em] uppercase text-muted-foreground whitespace-nowrap font-medium">
              {count} / 6 identificados
            </span>
          </div>
          <p className="font-display text-[clamp(1rem,1.8vw,1.4rem)] italic text-muted-foreground leading-[1.5] min-h-[2.2em] transition-opacity">
            {messages[count]}
          </p>
          <a
            href="#cta-section"
            className={`inline-flex items-center gap-3 self-start font-heading text-[.72rem] tracking-[.16em] uppercase font-bold text-background bg-gold no-underline px-9 py-[18px] hover:bg-gold-light transition-all ${
              count >= 2 ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          >
            Quero resolver isso
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
};

export default PainSection;

const items = [
  { text: "em faturamento desbloqueado", bold: "+R$2M" },
  { text: "— 5 Pilares", bold: "Metodologia Legacy" },
  { text: "", bold: "PaaS · MarTech · The Hive" },
  { text: ", previsíveis e escaláveis", bold: "independentes", prefix: "Empresas " },
  { text: ", não consultor", bold: "Parceiro estratégico" },
  { text: "", bold: "Legado", prefix: "Diagnóstico → Plano → Execução → " },
];

const ProofBar = () => (
  <div className="proof-bar-wrapper border-t border-b border-border overflow-hidden bg-[hsl(40_6%_5%)]">
    <div className="flex whitespace-nowrap animate-[ticker_28s_linear_infinite] hover:[animation-play-state:paused]">
      {[...items, ...items].map((item, i) => (
        <span key={i} className="contents">
          <span className="inline-flex items-center gap-3.5 px-[52px] py-[18px] font-heading text-[.7rem] tracking-[.18em] uppercase text-muted-foreground flex-shrink-0 font-medium">
            {item.prefix && <span>{item.prefix}</span>}
            <strong className="text-gold font-semibold">{item.bold}</strong>
            {item.text && <span>{item.text}</span>}
          </span>
          <span className="w-1 h-1 bg-gold-border rounded-full flex-shrink-0 self-center" />
        </span>
      ))}
    </div>
  </div>
);

export default ProofBar;

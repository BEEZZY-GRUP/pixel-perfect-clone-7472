const Footer = () => (
  <>
    <footer className="border-t border-border px-6 pt-[72px] pb-14 md:px-[60px]">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-10 md:gap-12 items-start">
      <div>
        <div className="font-sans font-extrabold text-[1.1rem] tracking-[.22em] uppercase mb-4">
          Beezzy<span className="text-gold">.</span>
        </div>
        <p className="font-display text-[.9rem] italic text-muted-foreground leading-[1.65] max-w-[240px]">
          "A empresa do século 22 — construindo o futuro dos negócios."
        </p>
      </div>
      {[
        {
          title: "Empresa",
          links: [
            ["#manifesto", "Manifesto"],
            ["#methodology", "Metodologia"],
            ["#legacy", "Legado"],
          ],
        },
        {
          title: "Verticais",
          links: [
            ["#verticals", "PaaS"],
            ["#verticals", "Growth / MarTech"],
            ["#hive", "The Hive"],
          ],
        },
        {
          title: "Contato",
          links: [
            ["#cta-section", "Falar com a Beezzy"],
            ["#", "LinkedIn"],
            ["#", "Instagram"],
          ],
        },
      ].map((col) => (
        <div key={col.title}>
          <h5 className="font-heading text-[.65rem] tracking-[.2em] uppercase text-muted-foreground mb-5 font-bold">
            {col.title}
          </h5>
          <ul className="list-none flex flex-col gap-2.5">
            {col.links.map(([href, label]) => (
              <li key={label}>
                <a href={href} className="font-heading text-[.8rem] text-foreground/50 no-underline hover:text-gold transition-colors">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      </div>
    </footer>
    <div className="border-t border-border px-6 py-6 md:px-[60px]">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
      <p className="font-heading text-[.65rem] tracking-[.14em] uppercase text-muted-foreground font-medium">
        © 2025 Beezzy · Todos os direitos reservados
      </p>
      <p className="font-heading text-[.65rem] tracking-[.14em] uppercase text-muted-foreground font-medium">
        A empresa do século 22
      </p>
    </div>
  </>
);

export default Footer;

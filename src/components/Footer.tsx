const Footer = () => (
  <footer className="border-t border-border px-7 py-[72px] md:px-14 grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
    <div className="font-extrabold text-[1.2rem] tracking-[.2em] uppercase">Beezzy</div>
    <p className="font-display text-[.95rem] italic text-muted-foreground leading-[1.6]">
      "A empresa do século 22 —
      <br />
      construindo o futuro dos negócios."
    </p>
    <div className="md:text-right text-[.7rem] tracking-[.12em] uppercase text-muted-foreground leading-[2]">
      <p>© 2025 Beezzy</p>
      <p className="mt-2">Todos os direitos reservados</p>
    </div>
  </footer>
);

export default Footer;

import { useEffect, useState } from "react";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-[26px] md:px-[60px] transition-all duration-400 border-b ${
        scrolled
          ? "border-border backdrop-blur-[20px] bg-background/75"
          : "border-transparent"
      }`}
    >
      <a
        href="#"
        className="font-sans font-extrabold text-[1.25rem] tracking-[.22em] uppercase text-foreground no-underline"
      >
        Beezzy<span className="text-gold">.</span>
      </a>
      <ul className="hidden md:flex gap-9 list-none items-center">
        {[
          ["#manifesto", "Manifesto"],
          ["#methodology", "Metodologia"],
          ["#legacy", "Legado"],
          ["#verticals", "Verticais"],
          ["#hive", "The Hive"],
        ].map(([href, label]) => (
          <li key={href}>
            <a
              href={href}
              className="font-heading text-[.72rem] tracking-[.14em] uppercase text-muted-foreground no-underline hover:text-foreground transition-colors font-medium"
            >
              {label}
            </a>
          </li>
        ))}
        <li>
          <a
            href="#cta-section"
            className="font-heading text-[.72rem] tracking-[.14em] uppercase text-background no-underline font-semibold bg-gold px-[22px] py-[10px] hover:bg-gold-light transition-colors"
          >
            Falar com a Beezzy
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;

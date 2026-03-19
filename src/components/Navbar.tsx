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
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-7 py-7 md:px-14 transition-all duration-400 border-b ${
        scrolled
          ? "border-border backdrop-blur-[18px] bg-background/70"
          : "border-transparent"
      }`}
    >
      <a
        href="#"
        className="font-sans font-extrabold text-[1.35rem] tracking-[.2em] uppercase text-foreground no-underline"
      >
        Beezzy
      </a>
      <ul className="hidden md:flex gap-10 list-none">
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
              className="text-xs tracking-[.15em] uppercase text-muted-foreground no-underline hover:text-gold transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
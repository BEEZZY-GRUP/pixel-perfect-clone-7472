import { useEffect, useState } from "react";

const navLinks = [
  ["#manifesto", "Manifesto"],
  ["#methodology", "Metodologia"],
  ["#legacy", "Legado"],
  ["#verticals", "Verticais"],
  ["#hive", "The Hive"],
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-6 py-[26px] md:px-[60px] transition-all duration-400 border-b ${
          scrolled
            ? "border-border backdrop-blur-[20px] bg-background/75"
            : "border-transparent"
        }`}
      >
        <a
          href="#"
          className="font-sans font-extrabold text-[1.25rem] tracking-[.22em] uppercase text-foreground no-underline relative z-[110]"
        >
          Beezzy<span className="text-gold">.</span>
        </a>

        {/* Desktop links */}
        <ul className="hidden md:flex gap-9 list-none items-center">
          {navLinks.map(([href, label]) => (
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

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden relative z-[110] flex flex-col gap-[5px] items-center justify-center w-8 h-8 bg-transparent border-none cursor-pointer"
          aria-label="Menu"
        >
          <span
            className={`block w-5 h-px bg-foreground transition-all duration-300 ${
              mobileOpen ? "rotate-45 translate-y-[3px]" : ""
            }`}
          />
          <span
            className={`block w-5 h-px bg-foreground transition-all duration-300 ${
              mobileOpen ? "-rotate-45 -translate-y-[3px]" : ""
            }`}
          />
        </button>
      </nav>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 z-[105] bg-background/98 backdrop-blur-xl flex flex-col items-center justify-center gap-8 transition-all duration-500 md:hidden ${
          mobileOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        {navLinks.map(([href, label]) => (
          <a
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className="font-display text-[1.8rem] font-light text-foreground no-underline hover:text-gold transition-colors"
          >
            {label}
          </a>
        ))}
        <a
          href="#cta-section"
          onClick={() => setMobileOpen(false)}
          className="mt-4 inline-flex items-center gap-3 font-heading text-[.72rem] tracking-[.16em] uppercase font-semibold text-background bg-gold no-underline px-9 py-[18px] hover:bg-gold-light transition-colors"
        >
          Falar com a Beezzy
        </a>
      </div>
    </>
  );
};

export default Navbar;

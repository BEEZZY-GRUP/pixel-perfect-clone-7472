import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const useScrollReveal = () => {
  useEffect(() => {
    // GSAP ScrollTrigger for .reveal elements
    const els = document.querySelectorAll(".reveal");

    els.forEach((el) => {
      // Determine delay from reveal-delay-N class
      let delay = 0;
      el.classList.forEach((cls) => {
        const match = cls.match(/^reveal-delay-(\d+)$/);
        if (match) delay = parseInt(match[1]) * 0.12;
      });

      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
          },
        }
      );
    });

    // Smooth parallax for section eyebrows
    document.querySelectorAll(".section-eyebrow").forEach((el) => {
      gsap.to(el, {
        x: 20,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
      });
    });

    // Parallax on section titles
    document.querySelectorAll(".section-title").forEach((el) => {
      gsap.to(el, {
        y: -20,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.5,
        },
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
};

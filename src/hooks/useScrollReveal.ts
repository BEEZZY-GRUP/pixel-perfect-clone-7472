import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const useScrollReveal = () => {
  useEffect(() => {
    // ── Reveal elements (skip those with custom GSAP animations) ──
    const customAnimated = new Set<Element>();
    document.querySelectorAll(".hive-visual-gsap, .vertical-item-gsap, .stat-value-gsap").forEach(el => customAnimated.add(el));

    const els = document.querySelectorAll(".reveal");

    els.forEach((el) => {
      if (customAnimated.has(el)) return; // handled separately

      let delay = 0;
      el.classList.forEach((cls) => {
        const match = cls.match(/^reveal-delay-(\d+)$/);
        if (match) delay = parseInt(match[1]) * 0.12;
      });

      gsap.set(el, { opacity: 0, y: 50 });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          once: true,
        },
      });
    });

    // ── Section eyebrow — horizontal drift ──
    document.querySelectorAll(".section-eyebrow").forEach((el) => {
      gsap.fromTo(
        el,
        { x: -15 },
        {
          x: 15,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        }
      );
    });

    // ── Section titles — subtle lift ──
    document.querySelectorAll(".section-title").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 15 },
        {
          y: -15,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 2,
          },
        }
      );
    });

    // ── Horizontal dividers / borders — scale in ──
    document.querySelectorAll(".divider").forEach((el) => {
      gsap.fromTo(
        el,
        { scaleX: 0, transformOrigin: "left center" },
        {
          scaleX: 1,
          duration: 1.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
          },
        }
      );
    });

    // ── Proof bar — fade in on scroll ──
    const proofBar = document.querySelector(".proof-bar-wrapper");
    if (proofBar) {
      gsap.fromTo(
        proofBar,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: proofBar,
            start: "top 95%",
            once: true,
          },
        }
      );
    }

    // ── Vertical items — staggered slide from left ──
    const verticalItems = document.querySelectorAll(".vertical-item-gsap");
    if (verticalItems.length) {
      gsap.fromTo(
        verticalItems,
        { opacity: 0, x: -40 },
        {
          opacity: 1,
          x: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: verticalItems[0],
            start: "top 85%",
            once: true,
          },
        }
      );
    }

    // ── Stats counters — scale pop ──
    document.querySelectorAll(".stat-value-gsap").forEach((el) => {
      gsap.fromTo(
        el,
        { scale: 0.6, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.7,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        }
      );
    });

    // ── Hive visual — rotate in ──
    const hiveVisual = document.querySelector(".hive-visual-gsap");
    if (hiveVisual) {
      gsap.fromTo(
        hiveVisual,
        { opacity: 0, scale: 0.8, rotate: -8 },
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: hiveVisual,
            start: "top 85%",
            once: true,
          },
        }
      );
    }

    // ── CTA section — dramatic entrance ──
    const ctaSection = document.getElementById("cta-section");
    if (ctaSection) {
      gsap.fromTo(
        ctaSection.children,
        { opacity: 0, y: 60, filter: "blur(4px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ctaSection,
            start: "top 80%",
            once: true,
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);
};

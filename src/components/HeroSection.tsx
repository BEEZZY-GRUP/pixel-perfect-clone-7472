import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Three.js volumetric smoke shader
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uMouseVel: { value: new THREE.Vector2(0, 0) },
    };

    const vertShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
    const fragShader = `
      precision highp float;
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform vec2 uMouseVel;
      varying vec2 vUv;

      #define OCTAVES 5

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
          u.y
        );
      }

      float fbm(vec2 p) {
        float v = 0.0, a = 0.5;
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < OCTAVES; i++) {
          v += a * noise(p);
          p = rot * p * 2.0 + 3.7;
          a *= 0.5;
        }
        return v;
      }

      float grain(vec2 uv, float t) {
        return (hash(uv * uResolution * 0.5 + fract(t * 43.0)) * 2.0 - 1.0) * 0.025;
      }

      void main() {
        vec2 uv = vUv;
        float aspect = uResolution.x / uResolution.y;
        vec2 st = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
        float t = uTime * 0.06;

        // Mouse displacement — soft cloud parting
        vec2 mouse = vec2((uMouse.x - 0.5) * aspect, uMouse.y - 0.5);
        vec2 delta = st - mouse;
        float dist = length(delta);
        float influence = smoothstep(0.35, 0.0, dist);
        vec2 pushDir = normalize(delta + 0.0001);
        vec2 displaced = st + pushDir * influence * 0.04;
        displaced += uMouseVel * smoothstep(0.3, 0.0, dist) * 0.15;

        // Nebula cloud layers — warped domain
        float n1 = fbm(displaced * 1.8 + vec2(t * 0.4, t * 0.25));
        float n2 = fbm(displaced * 1.4 + vec2(n1 * 0.8 - t * 0.3, n1 * 0.6 + t * 0.15));
        float n3 = fbm(displaced * 2.2 + vec2(n2 * 0.7 + t * 0.2, -n2 * 0.5 + t * 0.3));

        // Volumetric light source — upper right area
        vec2 lightPos = vec2(0.3, 0.25);
        float lightDist = length(st - lightPos);
        float lightBeam = exp(-lightDist * 2.5) * 1.2;

        // Secondary light — subtle left glow
        float lightBeam2 = exp(-length(st - vec2(-0.4, 0.1)) * 3.0) * 0.3;

        // Cloud density with volumetric scattering
        float cloud = smoothstep(0.3, 0.7, n3);
        float cloudEdge = smoothstep(0.35, 0.65, n2) * 0.6;

        // Light scattering through clouds
        float scatter = cloud * lightBeam * 0.8;
        float scatter2 = cloudEdge * lightBeam2 * 0.5;

        // Base luminance — bright volumetric feel
        float lum = 0.02;
        lum += scatter + scatter2;
        lum += lightBeam * 0.15;
        lum += lightBeam2 * 0.08;
        lum += cloud * 0.06;
        lum += cloudEdge * 0.03;

        // Wisps — bright streaks through the cloud
        float wisp = smoothstep(0.48, 0.52, fbm(displaced * 3.5 + vec2(t * 0.5, -t * 0.2))) * lightBeam * 0.4;
        lum += wisp;

        // Cool blue-white color palette (x.ai style)
        vec3 col = vec3(0.0);
        vec3 coolWhite = vec3(0.85, 0.9, 1.0);
        vec3 warmHighlight = vec3(1.0, 0.95, 0.88);
        vec3 deepBlue = vec3(0.15, 0.2, 0.35);

        col = mix(deepBlue * 0.1, coolWhite, lum);
        col += warmHighlight * wisp * 0.5;
        col += vec3(0.03, 0.025, 0.01) * smoothstep(0.15, 0.4, lum); // subtle warm tint

        // Mouse glow — faint light where cursor is
        float mouseGlow = exp(-dist * 6.0) * 0.04;
        col += coolWhite * mouseGlow;

        // Vignette
        float vig = 1.0 - smoothstep(0.2, 0.9, length(uv - 0.5) * 1.3);
        col *= mix(0.4, 1.0, vig);

        // Grain
        col += grain(uv, uTime);
        col = clamp(col, 0.0, 1.0);

        gl_FragColor = vec4(col, 0.85);
      }
    `;

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vertShader, fragmentShader: fragShader, transparent: true });
    scene.add(new THREE.Mesh(geo, mat));

    let prevMouse = { x: 0.5, y: 0.5 };
    const onMouseMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth;
      const ny = 1 - e.clientY / window.innerHeight;
      uniforms.uMouseVel.value.set(nx - prevMouse.x, ny - prevMouse.y);
      uniforms.uMouse.value.set(nx, ny);
      prevMouse = { x: nx, y: ny };
    };
    document.addEventListener("mousemove", onMouseMove);

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    const startTime = performance.now();
    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      uniforms.uTime.value = (performance.now() - startTime) * 0.001;
      // Dampen velocity
      uniforms.uMouseVel.value.multiplyScalar(0.88);
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      renderer.dispose();
    };
  }, []);

  // GSAP hero entrance
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const badge = section.querySelector(".hero-badge");
    const headlineInners = section.querySelectorAll(".hero-line-inner");
    const sub = section.querySelector(".hero-sub");
    const actions = section.querySelector(".hero-actions");
    const scroll = section.querySelector(".hero-scroll-indicator");
    const nav = document.querySelector("nav");

    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });

    gsap.set([badge, sub, actions, scroll, nav], { opacity: 0 });
    gsap.set(badge, { y: 24, scale: 0.95 });
    gsap.set(headlineInners, { y: "110%" });
    gsap.set(sub, { y: 30, filter: "blur(4px)" });
    gsap.set(actions, { y: 30, filter: "blur(4px)" });
    gsap.set(scroll, { opacity: 0 });
    gsap.set(nav, { y: -30 });

    tl.to(nav, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 0.1)
      .to(badge, { opacity: 1, y: 0, scale: 1, duration: 0.8 }, 0.3)
      .to(headlineInners, { y: "0%", duration: 1.2, stagger: 0.1, ease: "power4.out" }, 0.5)
      .to(sub, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 }, 1.2)
      .to(actions, { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.9 }, 1.35)
      .to(scroll, { opacity: 1, duration: 0.8, ease: "power2.inOut" }, 1.6);

    return () => { tl.kill(); };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex flex-col justify-end px-6 pb-14 md:px-[60px] md:pb-20 overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-55" />
      <div className="hero-noise" />
      <div className="absolute bottom-0 left-0 right-0 h-[60%] z-[1] bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="relative z-[2] max-w-[820px]">
        <div className="hero-badge font-heading text-[.68rem] tracking-[.22em] uppercase text-gold mb-8 flex items-center gap-[10px] font-medium">
          <span className="block w-7 h-px bg-gold" />
          A empresa do século 22
        </div>
        <h1 className="hero-headline font-display text-[clamp(3.8rem,8.5vw,9rem)] font-light leading-[1.05] tracking-[-0.015em] mb-9">
          <span className="hero-line block overflow-hidden py-[0.05em]">
            <span className="hero-line-inner block">Construindo</span>
          </span>
          <span className="hero-line block overflow-hidden py-[0.05em]">
            <span className="hero-line-inner block">
              <em className="italic text-gold-light">o legado</em>
            </span>
          </span>
          <span className="hero-line block overflow-hidden py-[0.05em]">
            <span className="hero-line-inner block">da sua empresa.</span>
          </span>
        </h1>
        <div className="flex items-end justify-between gap-10 flex-wrap">
          <p className="hero-sub text-[.9rem] leading-[1.75] text-muted-foreground max-w-[400px]">
            Não somos mais uma consultoria. Somos o sócio estratégico que
            transforma sua empresa em um negócio independente, previsível e escalável.
          </p>
          <div className="hero-actions flex items-center gap-5 flex-shrink-0 flex-col sm:flex-row">
            <a
              href="#cta-section"
              className="inline-flex items-center gap-3 font-heading text-[.72rem] tracking-[.16em] uppercase font-semibold text-background bg-gold no-underline px-9 py-[18px] hover:bg-gold-light hover:-translate-y-px transition-all group"
            >
              Quero construir meu legado
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <a
              href="#manifesto"
              className="inline-flex items-center gap-[10px] font-heading text-[.72rem] tracking-[.16em] uppercase font-medium text-foreground no-underline py-[18px] border-b border-foreground/20 hover:text-gold hover:border-gold-border transition-colors"
            >
              Conhecer a Beezzy
            </a>
          </div>
        </div>
      </div>

      <div className="hero-scroll-indicator hidden md:flex absolute right-[60px] bottom-[84px] z-[2] [writing-mode:vertical-rl] text-[.6rem] tracking-[.22em] uppercase text-muted-foreground items-center gap-3 font-heading font-medium">
        Scroll
        <span className="block w-px h-[52px] bg-gradient-to-b from-muted-foreground to-transparent" style={{ animation: "scroll-line 2.2s ease-in-out infinite" }} />
      </div>
    </section>
  );
};

export default HeroSection;

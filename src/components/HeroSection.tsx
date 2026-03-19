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

      #define PI 3.14159265359
      #define OCTAVES 6

      // Improved hash
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yzx + 19.19);
        return fract((p.xxy + p.yxx) * p.zyx);
      }
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }

      // Simplex-like noise
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

      // Fractal Brownian Motion — smoke layers
      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for (int i = 0; i < OCTAVES; i++) {
          v += a * noise(p);
          p = rot * p * 2.0 + 3.7;
          a *= 0.5;
        }
        return v;
      }

      // Warped domain smoke
      float smokeField(vec2 uv, float t, vec2 mouse, vec2 mvel) {
        // Base warp layers
        float d1 = fbm(uv * 2.0 + vec2(t * 0.5, t * 0.3));
        float d2 = fbm(uv * 1.6 + vec2(d1 * 0.7 - t * 0.35, d1 * 0.5 + t * 0.2));
        float d3 = fbm(uv * 2.8 + vec2(d2 * 0.6 + t * 0.25, -d2 * 0.4 + t * 0.35));

        // Mouse distortion — pushes smoke away
        vec2 delta = uv - mouse;
        float dist = length(delta);
        float mouseForce = smoothstep(0.5, 0.0, dist) * 0.5;
        float velForce = length(mvel) * smoothstep(0.4, 0.0, dist) * 2.0;

        // Directional swirl from mouse velocity
        float swirl = atan(delta.y, delta.x) + t * 0.5;
        float swirlNoise = sin(swirl * 3.0 + d1 * 4.0) * 0.5 + 0.5;

        float field = d3 + mouseForce + velForce * swirlNoise;
        return field;
      }

      // Film grain
      float grain(vec2 uv, float t) {
        return (hash(uv * uResolution * 0.5 + fract(t * 43.0)) * 2.0 - 1.0) * 0.035;
      }

      void main() {
        vec2 uv = vUv;
        float t = uTime * 0.07;
        vec2 mouse = uMouse;
        vec2 mvel = uMouseVel;

        float smoke = smokeField(uv, t, mouse, mvel);

        // Color mapping — volumetric depth
        float base = smoothstep(0.25, 0.75, smoke);

        // Layer separation for depth
        float layer1 = smoothstep(0.35, 0.55, fbm(uv * 1.8 + t * 0.2)) * 0.4;
        float layer2 = smoothstep(0.4, 0.65, fbm(uv * 3.0 - t * 0.15)) * 0.25;

        // Volumetric light from top-left
        float lightDir = dot(normalize(uv - vec2(0.2, 0.8)), vec2(0.7, -0.7));
        float volumeLight = smoothstep(-0.2, 0.6, lightDir) * base * 0.15;

        // Combine luminance
        float lum = mix(0.03, 0.14, base);
        lum += layer1;
        lum -= layer2;
        lum += volumeLight;

        // Subtle golden tint in bright areas
        vec3 col = vec3(lum);
        col += vec3(0.04, 0.025, 0.005) * smoothstep(0.12, 0.25, lum);

        // Edge darkening (vignette)
        float vig = 1.0 - smoothstep(0.3, 0.85, length(uv - 0.5) * 1.2);
        col *= mix(0.6, 1.0, vig);

        // Grain
        col += grain(uv, uTime);
        col = clamp(col, 0.0, 1.0);

        gl_FragColor = vec4(col, 0.92);
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
      uniforms.uMouseVel.value.multiplyScalar(0.92);
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

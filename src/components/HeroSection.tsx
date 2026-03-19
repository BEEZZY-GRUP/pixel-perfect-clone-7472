import { useEffect, useRef } from "react";
import * as THREE from "three";

// Text scramble effect
class TextScramble {
  el: HTMLElement;
  chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%&?";
  queue: { from: string; to: string; start: number; end: number; char?: string }[] = [];
  frame = 0;
  frameRequest = 0;
  resolve: () => void = () => {};

  constructor(el: HTMLElement) {
    this.el = el;
  }

  setText(newText: string) {
    const oldText = this.el.innerText;
    const length = Math.max(oldText.length, newText.length);
    const promise = new Promise<void>((res) => (this.resolve = res));
    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 12);
      const end = start + Math.floor(Math.random() * 12);
      this.queue.push({ from, to, start, end });
    }
    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
    return promise;
  }

  update = () => {
    let output = "";
    let complete = 0;
    for (let i = 0; i < this.queue.length; i++) {
      const { from, to, start, end } = this.queue[i];
      let char = this.queue[i].char;
      if (this.frame >= end) {
        complete++;
        output += to;
      } else if (this.frame >= start) {
        if (!char || Math.random() < 0.28) {
          char = this.chars[Math.floor(Math.random() * this.chars.length)];
          this.queue[i].char = char;
        }
        output += `<span style="opacity:.4">${char}</span>`;
      } else {
        output += from;
      }
    }
    this.el.innerHTML = output;
    if (complete === this.queue.length) {
      this.resolve();
    } else {
      this.frameRequest = requestAnimationFrame(this.update);
      this.frame++;
    }
  };
}

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const word1Ref = useRef<HTMLSpanElement>(null);
  const word2Ref = useRef<HTMLSpanElement>(null);
  const word3Ref = useRef<HTMLSpanElement>(null);

  // Three.js liquid gradient
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
      uGrain: { value: 0.045 },
    };

    const vertShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
    const fragShader = `
      precision highp float;
      uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uGrain;
      varying vec2 vUv;
      #define PI 3.14159265359
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i+vec2(0,0)), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y); }
      float fbm(vec2 p) { float v = 0.0; float a = 0.5;
        mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
        for(int i=0; i<5; i++) { v += a*noise(p); p = rot*p*2.0+3.7; a *= 0.5; } return v; }
      float grain(vec2 uv, float t) { return hash(uv * uResolution * 0.5 + fract(t * 37.0)) * 2.0 - 1.0; }
      void main() {
        vec2 uv = vUv; float t = uTime * 0.08; vec2 mouse = uMouse;
        float d1 = fbm(uv * 2.2 + vec2(t * 0.6, t * 0.35));
        float d2 = fbm(uv * 1.8 + vec2(d1 * 0.6 - t * 0.4, d1 * 0.4 + t * 0.25));
        float d3 = fbm(uv * 3.0 + vec2(d2 * 0.5 + t * 0.3, -d2 * 0.3 + t * 0.4));
        vec2 mDelta = uv - mouse; float mDist = length(mDelta);
        float mInfluence = smoothstep(0.6, 0.0, mDist) * 0.3; float flow = d3 + mInfluence;
        float base = smoothstep(0.2, 0.8, flow);
        float zone1 = smoothstep(0.4, 0.55, d1 + d2 * 0.3);
        float zone2 = smoothstep(0.3, 0.7, d2 + d3 * 0.25);
        float lum = mix(0.04, 0.18, base); lum = mix(lum, 0.32, zone1 * 0.5);
        lum = mix(lum, 0.08, zone2 * 0.3); lum += sin(uv.y * PI * 1.2 + t) * 0.025;
        lum += grain(uv, uTime) * uGrain; lum = clamp(lum, 0.0, 1.0);
        gl_FragColor = vec4(vec3(lum), 0.9);
      }
    `;

    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: vertShader, fragmentShader: fragShader, transparent: true });
    scene.add(new THREE.Mesh(geo, mat));

    const onMouseMove = (e: MouseEvent) => {
      uniforms.uMouse.value.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
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

  // Text scramble
  useEffect(() => {
    const refs = [
      { ref: word1Ref, text: "Construindo" },
      { ref: word2Ref, text: "o futuro" },
      { ref: word3Ref, text: "dos negócios." },
    ];
    refs.forEach(({ ref, text }, i) => {
      if (ref.current) {
        ref.current.innerText = "";
        const fx = new TextScramble(ref.current);
        setTimeout(() => fx.setText(text), 400 + i * 280);
      }
    });
  }, []);

  return (
    <section id="hero" className="relative h-screen flex flex-col justify-end px-7 pb-16 md:px-14 md:pb-[72px] overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-55" />
      <div className="hero-noise" />
      <div className="relative z-[2] max-w-[900px]">
        <div className="text-[.7rem] tracking-[.25em] uppercase text-gold mb-7 flex items-center gap-3.5">
          <span className="block w-8 h-px bg-gold" />
          A empresa do século 22
        </div>
        <h1 className="font-display text-[clamp(3.5rem,8vw,8.5rem)] font-light leading-[1.0] tracking-tight mb-10">
          <span ref={word1Ref} className="inline-block" />
          <br />
          <em className="text-gold-light">
            <span ref={word2Ref} className="inline-block" />
          </em>
          <br />
          <span ref={word3Ref} className="inline-block" />
        </h1>
        <p className="text-sm leading-[1.8] text-muted-foreground max-w-[440px] mb-12 tracking-wide">
          Num mundo cheio de consultorias com metodologias pré-escritas, nossa forma de enxergar o mundo dos negócios se diferencia.
        </p>
        <a
          href="#manifesto"
          className="inline-flex items-center gap-3 text-xs tracking-[.18em] uppercase text-foreground no-underline px-8 py-4 border border-foreground/30 hover:bg-gold hover:text-background hover:border-gold transition-all group"
        >
          Conhecer a Beezzy
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
      <div className="hidden md:flex absolute right-14 bottom-[72px] z-[2] [writing-mode:vertical-rl] text-[.65rem] tracking-[.2em] uppercase text-muted-foreground items-center gap-3">
        Scroll
        <span className="block w-px h-14 bg-muted-foreground" style={{ animation: "scroll-line 2s ease-in-out infinite" }} />
      </div>
    </section>
  );
};

export default HeroSection;
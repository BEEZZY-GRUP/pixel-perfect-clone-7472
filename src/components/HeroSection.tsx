import { useEffect, useRef } from "react";
import * as THREE from "three";

const HeroSection = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      uGrain: { value: 0.04 },
    };

    const vertShader = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
    const fragShader = `
      precision highp float;
      uniform float uTime; uniform vec2 uResolution; uniform vec2 uMouse; uniform float uGrain;
      varying vec2 vUv;
      #define PI 3.14159265359
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p) { vec2 i = floor(p); vec2 f = fract(p); vec2 u = f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y); }
      float fbm(vec2 p) { float v=0.; float a=.5; mat2 rot=mat2(cos(.5),sin(.5),-sin(.5),cos(.5));
        for(int i=0;i<5;i++){v+=a*noise(p);p=rot*p*2.+3.7;a*=.5;} return v; }
      float grain(vec2 uv,float t){return hash(uv*uResolution*.5+fract(t*37.))*2.-1.;}
      void main() {
        vec2 uv=vUv; float t=uTime*.08;
        float d1=fbm(uv*2.2+vec2(t*.6,t*.35));
        float d2=fbm(uv*1.8+vec2(d1*.6-t*.4,d1*.4+t*.25));
        float d3=fbm(uv*3.+vec2(d2*.5+t*.3,-d2*.3+t*.4));
        vec2 mDelta=uv-uMouse; float mDist=length(mDelta);
        float mInfluence=smoothstep(.6,.0,mDist)*.3;
        float flow=d3+mInfluence;
        float base=smoothstep(.2,.8,flow);
        float zone1=smoothstep(.4,.55,d1+d2*.3);
        float zone2=smoothstep(.3,.7,d2+d3*.25);
        float lum=mix(.04,.18,base);
        lum=mix(lum,.32,zone1*.5);
        lum=mix(lum,.08,zone2*.3);
        lum+=sin(uv.y*PI*1.2+t)*.025;
        lum+=grain(uv,uTime)*uGrain;
        lum=clamp(lum,0.,1.);
        gl_FragColor=vec4(vec3(lum),.9);
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

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-end px-6 pb-14 md:px-[60px] md:pb-20 overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-50" />
      <div className="hero-noise" />
      {/* Vignette */}
      <div className="absolute bottom-0 left-0 right-0 h-[60%] z-[1] bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="relative z-[2] max-w-[820px]">
        <div className="font-heading text-[.68rem] tracking-[.22em] uppercase text-gold mb-8 flex items-center gap-[10px] font-medium">
          <span className="block w-7 h-px bg-gold" />
          A empresa do século 22
        </div>
        <h1 className="font-display text-[clamp(3.8rem,8.5vw,9rem)] font-light leading-[.96] tracking-[-0.015em] mb-9">
          Construindo<br />
          <em className="italic text-gold-light">o legado</em><br />
          da sua empresa.
        </h1>
        <div className="flex items-end justify-between gap-10 flex-wrap">
          <p className="text-[.9rem] leading-[1.75] text-muted-foreground max-w-[400px]">
            Não somos mais uma consultoria. Somos o sócio estratégico que 
            transforma sua empresa em um negócio independente, previsível e escalável.
          </p>
          <div className="flex items-center gap-5 flex-shrink-0 flex-col sm:flex-row">
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

      <div className="hidden md:flex absolute right-[60px] bottom-[84px] z-[2] [writing-mode:vertical-rl] text-[.6rem] tracking-[.22em] uppercase text-muted-foreground items-center gap-3 font-heading font-medium">
        Scroll
        <span className="block w-px h-[52px] bg-gradient-to-b from-muted-foreground to-transparent" style={{ animation: "scroll-line 2.2s ease-in-out infinite" }} />
      </div>
    </section>
  );
};

export default HeroSection;

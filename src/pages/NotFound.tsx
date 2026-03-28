import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const NotFound = () => {
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  // Same volumetric smoke shader from HeroSection
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

      #define OCTAVES 6

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

      float smokeField(vec2 uv, float t, vec2 mouse, vec2 mvel) {
        vec2 delta = uv - mouse;
        float dist = length(delta);
        float influence = smoothstep(0.25, 0.0, dist);
        vec2 pushDir = normalize(delta + 0.0001);
        vec2 displaced = uv + pushDir * influence * 0.012;
        displaced += mvel * smoothstep(0.2, 0.0, dist) * 0.06;
        float d1 = fbm(displaced * 2.0 + vec2(t * 0.5, t * 0.3));
        float d2 = fbm(displaced * 1.6 + vec2(d1 * 0.7 - t * 0.35, d1 * 0.5 + t * 0.2));
        float d3 = fbm(displaced * 2.8 + vec2(d2 * 0.6 + t * 0.25, -d2 * 0.4 + t * 0.35));
        float trail = influence * 0.015;
        return d3 + trail;
      }

      float grain(vec2 uv, float t) {
        return (hash(uv * uResolution * 0.5 + fract(t * 43.0)) * 2.0 - 1.0) * 0.035;
      }

      void main() {
        vec2 uv = vUv;
        float t = uTime * 0.07;
        float smoke = smokeField(uv, t, uMouse, uMouseVel);
        float base = smoothstep(0.25, 0.75, smoke);
        float layer1 = smoothstep(0.35, 0.55, fbm(uv * 1.8 + t * 0.2)) * 0.4;
        float layer2 = smoothstep(0.4, 0.65, fbm(uv * 3.0 - t * 0.15)) * 0.25;
        float lightDir = dot(normalize(uv - vec2(0.2, 0.8)), vec2(0.7, -0.7));
        float volumeLight = smoothstep(-0.2, 0.6, lightDir) * base * 0.15;
        float lum = mix(0.03, 0.14, base) + layer1 - layer2 + volumeLight;
        vec3 col = vec3(lum);
        col += vec3(0.04, 0.025, 0.005) * smoothstep(0.12, 0.25, lum);
        float vig = 1.0 - smoothstep(0.3, 0.85, length(uv - 0.5) * 1.2);
        col *= mix(0.6, 1.0, vig);
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

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 opacity-55" />
      <div className="hero-noise" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-t from-background via-transparent to-background/60 pointer-events-none" />

      <div className="relative z-[2] text-center flex flex-col items-center gap-6 px-6">
        {/* Floating astronaut */}
        <div className="animate-float">
          <img
            src="/images/astronauta.png"
            alt="Astronauta Beezzy"
            className="w-36 h-auto md:w-52 drop-shadow-[0_0_40px_hsla(36,35%,61%,0.3)]"
          />
        </div>

        <h1
          className="font-display text-[clamp(5rem,15vw,12rem)] font-light leading-none tracking-tight text-gold/30"
          style={{ textShadow: "0 0 60px hsla(36,35%,61%,0.15)" }}
        >
          404
        </h1>

        <p className="font-display text-[clamp(1.2rem,3vw,2rem)] font-light italic text-gold-light/70 -mt-2">
          Perdido no espaço
        </p>

        <p className="text-[.82rem] leading-relaxed text-muted-foreground max-w-[360px]">
          A página que você procura não existe ou foi movida para outra dimensão.
        </p>

        <a
          href="/"
          className="mt-4 inline-flex items-center gap-3 font-heading text-[.72rem] tracking-[.16em] uppercase font-semibold text-background bg-gold px-7 py-4 hover:bg-gold-light hover:-translate-y-px transition-all group"
        >
          Voltar ao início
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-14px) rotate(-3deg); }
          75% { transform: translateY(8px) rotate(2deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default NotFound;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";

const ADMIN_USER = "admin";
const ADMIN_PASS = 'N"IL25JJ3.b0_}';

export default function AdminLogin() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      sessionStorage.setItem("bzy_auth", "1");
      navigate("/adminconsole");
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[180px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-[440px]"
      >
        {/* Decorative corners */}
        <div className="absolute -top-3 -left-3 w-8 h-8 border-t border-l border-primary/40" />
        <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b border-r border-primary/40" />

        <div className="border border-border bg-card/30 backdrop-blur-sm p-10 md:p-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-primary" />
            <p className="font-mono text-primary text-xs tracking-[0.3em] font-semibold">BZY</p>
          </div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground mb-10 pl-5">
            CONSOLE · ACESSO RESTRITO
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User field */}
            <div className="relative">
              <motion.div
                animate={{ scaleX: focused === "user" ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 w-full h-px bg-primary origin-left"
              />
              <label className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-2 block">
                USUÁRIO
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => { setUser(e.target.value); setError(false); }}
                onFocus={() => setFocused("user")}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="admin"
              />
            </div>

            {/* Pass field */}
            <div className="relative">
              <motion.div
                animate={{ scaleX: focused === "pass" ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-0 w-full h-px bg-primary origin-left"
              />
              <label className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground mb-2 block">
                SENHA
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(false); }}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground text-sm font-mono placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-destructive text-xs font-mono flex items-center gap-2"
              >
                <Lock size={12} />
                Credenciais inválidas.
              </motion.p>
            )}

            <button
              type="submit"
              className="w-full group border border-primary bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground font-mono text-xs tracking-[0.2em] py-4 transition-all duration-300 flex items-center justify-center gap-3"
            >
              ACESSAR
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Bottom decorative */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground/40">
              BEEZZY SYSTEMS
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import PageBackground from "@/components/PageBackground";

const ADMIN_USER = "beezzygroup";
const ADMIN_PASS = "Zetslife@2026";

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
      <PageBackground />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Decorative corners */}
        <div className="absolute -top-3 -left-3 w-8 h-8 border-t border-l border-gold/40" />
        <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b border-r border-gold/40" />

        <div className="card-gradient p-10 md:p-12">
          {/* Header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-gold rounded-full shadow-[0_0_8px_hsl(var(--gold)/0.6)]" />
            <p className="font-heading text-gold text-xs tracking-[0.3em] font-bold">BZY</p>
          </div>
          <p className="font-heading text-[10px] tracking-[0.2em] text-muted-foreground mb-10 pl-5 font-semibold">
            CONSOLE · ACESSO RESTRITO
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User field */}
            <div className="relative">
              <div
                className="absolute bottom-0 left-0 w-full h-px bg-gold origin-left transition-transform duration-300"
                style={{ transform: `scaleX(${focused === "user" ? 1 : 0})` }}
              />
              <label className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground mb-2 block font-semibold">
                USUÁRIO
              </label>
              <input
                type="text"
                value={user}
                onChange={(e) => { setUser(e.target.value); setError(false); }}
                onFocus={() => setFocused("user")}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground text-sm font-heading placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/50 transition-colors rounded-lg"
                placeholder="admin"
              />
            </div>

            {/* Pass field */}
            <div className="relative">
              <div
                className="absolute bottom-0 left-0 w-full h-px bg-gold origin-left transition-transform duration-300"
                style={{ transform: `scaleX(${focused === "pass" ? 1 : 0})` }}
              />
              <label className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground mb-2 block font-semibold">
                SENHA
              </label>
              <input
                type="password"
                value={pass}
                onChange={(e) => { setPass(e.target.value); setError(false); }}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground text-sm font-heading placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/50 transition-colors rounded-lg"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-destructive text-xs font-heading flex items-center gap-2 animate-pulse">
                <Lock size={12} />
                Credenciais inválidas.
              </p>
            )}

            <button
              type="submit"
              className="w-full group border border-gold bg-gold/10 hover:bg-gold text-gold hover:text-background font-heading text-xs tracking-[0.2em] py-4 transition-all duration-300 flex items-center justify-center gap-3 rounded-lg font-bold"
            >
              ACESSAR
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Bottom decorative */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/40 font-semibold">
              BEEZZY SYSTEMS
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>
      </div>
    </div>
  );
}

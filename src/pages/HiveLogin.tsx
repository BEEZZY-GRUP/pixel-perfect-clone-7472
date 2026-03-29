import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import LoadingScreen from "@/components/hive/LoadingScreen";
import PageBackground from "@/components/PageBackground";
import { ArrowRight } from "lucide-react";

const HiveLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  if (user && !showTransition) {
    navigate("/the-hive/community", { replace: true });
    return null;
  }

  if (showTransition) {
    return <LoadingScreen />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast.error("Credenciais inválidas. Verifique seu email e senha.");
    } else {
      setShowTransition(true);
      setTimeout(() => {
        navigate("/the-hive/community");
      }, 1800);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
      <PageBackground />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Decorative corners */}
        <div className="absolute -top-3 -left-3 w-8 h-8 border-t border-l border-gold/40" />
        <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b border-r border-gold/40" />

        <div className="card-gradient p-6 sm:p-10 md:p-12">
          {/* Header */}
          <div className="text-center mb-10">
            <a href="/" className="font-display font-black text-[1.6rem] tracking-[-.04em] text-foreground no-underline">
              Beezzy<span className="text-gold">.</span>
            </a>
            <p className="text-muted-foreground text-[.6rem] mt-2 tracking-[.2em] uppercase font-heading font-semibold">
              The Hive — Comunidade
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <div
                className="absolute bottom-0 left-0 w-full h-px bg-gold origin-left transition-transform duration-300"
                style={{ transform: `scaleX(${focused === "email" ? 1 : 0})` }}
              />
              <label className="font-heading text-[10px] tracking-[0.15em] text-muted-foreground mb-2 block font-semibold">
                EMAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="seu@email.com"
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground text-sm font-heading placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/50 transition-colors rounded-lg"
                required
              />
            </div>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground text-sm font-heading placeholder:text-muted-foreground/40 focus:outline-none focus:border-gold/50 transition-colors rounded-lg"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group border border-gold bg-gold/10 hover:bg-gold text-gold hover:text-background font-heading text-xs tracking-[0.2em] py-4 transition-all duration-300 flex items-center justify-center gap-3 rounded-lg font-bold"
            >
              {loading ? "ENTRANDO..." : "ENTRAR"}
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Bottom decorative */}
          <div className="mt-10 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/40 font-semibold">
              ACESSO EXCLUSIVO
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        <p className="text-center text-muted-foreground text-[.6rem] mt-6 tracking-[.15em] font-heading">
          Entre em contato para fazer parte do ecossistema.
        </p>
      </div>
    </div>
  );
};

export default HiveLogin;

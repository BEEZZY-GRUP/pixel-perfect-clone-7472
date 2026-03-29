import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle, ArrowRight } from "lucide-react";
import PageBackground from "@/components/PageBackground";

const SetupPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error("Erro ao definir senha. Tente novamente.");
      console.error(error);
    } else {
      toast.success("Senha definida com sucesso!");
      navigate("/the-hive/community/profile?onboarding=true", { replace: true });
    }
  };

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordLongEnough = password.length >= 6;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 relative overflow-hidden">
      <PageBackground />

      <div className="relative z-10 w-full max-w-[440px]">
        {/* Decorative corners */}
        <div className="absolute -top-3 -left-3 w-8 h-8 border-t border-l border-gold/40" />
        <div className="absolute -bottom-3 -right-3 w-8 h-8 border-b border-r border-gold/40" />

        <div className="card-gradient p-10 md:p-12">
          <div className="text-center mb-8">
            <a href="/" className="font-display font-black text-[1.6rem] tracking-[-.04em] text-foreground no-underline">
              Beezzy<span className="text-gold">.</span>
            </a>
            <p className="text-muted-foreground text-[.6rem] mt-2 tracking-[.2em] uppercase font-heading font-semibold">
              Bem-vindo ao The Hive
            </p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} className="text-gold" />
            <h2 className="font-heading text-[.65rem] tracking-[.15em] uppercase text-foreground font-bold">
              Defina sua senha
            </h2>
          </div>

          {!ready ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-[.6rem] font-heading tracking-[.15em]">Verificando seu convite...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[.15em] text-muted-foreground mb-2 font-heading font-semibold">
                  NOVA SENHA
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-transparent border-border text-foreground placeholder:text-muted-foreground/40 pr-10 rounded-lg"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-[.15em] text-muted-foreground mb-2 font-heading font-semibold">
                  CONFIRMAR SENHA
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="bg-transparent border-border text-foreground placeholder:text-muted-foreground/40 rounded-lg"
                  required
                />
              </div>

              {/* Validation indicators */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className={passwordLongEnough ? "text-gold" : "text-muted-foreground/30"} />
                  <span className={`text-[.6rem] font-heading ${passwordLongEnough ? "text-gold" : "text-muted-foreground"}`}>
                    Pelo menos 6 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle size={12} className={passwordsMatch ? "text-gold" : "text-muted-foreground/30"} />
                  <span className={`text-[.6rem] font-heading ${passwordsMatch ? "text-gold" : "text-muted-foreground"}`}>
                    Senhas coincidem
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !passwordLongEnough || !passwordsMatch}
                className="w-full group border border-gold bg-gold/10 hover:bg-gold text-gold hover:text-background font-heading text-xs tracking-[0.2em] py-4 transition-all duration-300 flex items-center justify-center gap-3 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                {loading ? "SALVANDO..." : "DEFINIR SENHA E ENTRAR"}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          )}

          {/* Bottom decorative */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <p className="font-heading text-[9px] tracking-[0.2em] text-muted-foreground/40 font-semibold">
              BEEZZY ECOSYSTEM
            </p>
            <div className="flex-1 h-px bg-border" />
          </div>
        </div>

        <p className="text-center text-muted-foreground text-[.6rem] mt-6 tracking-[.15em] font-heading">
          Você foi convidado para o ecossistema Beezzy.
        </p>
      </div>
    </div>
  );
};

export default SetupPassword;

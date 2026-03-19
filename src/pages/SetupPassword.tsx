import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react";

const SetupPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state changes — the invite link will trigger a SIGNED_IN or PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setReady(true);
      }
    });

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
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
      // Redirect to profile with onboarding flag
      navigate("/the-hive/community/profile?onboarding=true", { replace: true });
    }
  };

  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordLongEnough = password.length >= 6;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-10">
          <a href="/" className="font-sans font-extrabold text-[1.5rem] tracking-[.22em] uppercase text-foreground no-underline">
            Beezzy<span className="text-gold">.</span>
          </a>
          <p className="text-muted-foreground text-sm mt-2 tracking-wider uppercase font-heading">
            Bem-vindo ao The Hive
          </p>
        </div>

        <div className="border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Lock size={16} className="text-gold" />
            <h2 className="font-heading text-sm tracking-widest uppercase text-foreground">
              Defina sua senha
            </h2>
          </div>

          {!ready ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">Verificando seu convite...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[.65rem] uppercase tracking-widest text-muted-foreground mb-2 font-heading">
                  Nova Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pr-10"
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
                <label className="block text-[.65rem] uppercase tracking-widest text-muted-foreground mb-2 font-heading">
                  Confirmar Senha
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  required
                />
              </div>

              {/* Validation indicators */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={12}
                    className={passwordLongEnough ? "text-green-500" : "text-muted-foreground/30"}
                  />
                  <span className={`text-[.65rem] ${passwordLongEnough ? "text-green-500" : "text-muted-foreground"}`}>
                    Pelo menos 6 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle
                    size={12}
                    className={passwordsMatch ? "text-green-500" : "text-muted-foreground/30"}
                  />
                  <span className={`text-[.65rem] ${passwordsMatch ? "text-green-500" : "text-muted-foreground"}`}>
                    Senhas coincidem
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !passwordLongEnough || !passwordsMatch}
                className="w-full bg-gold text-background hover:bg-gold-light font-heading text-xs tracking-widest uppercase h-12 mt-2"
              >
                {loading ? "Salvando..." : "Definir Senha e Entrar"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-muted-foreground text-[.6rem] mt-6 tracking-wide">
          Você foi convidado para o ecossistema Beezzy.
        </p>
      </div>
    </div>
  );
};

export default SetupPassword;

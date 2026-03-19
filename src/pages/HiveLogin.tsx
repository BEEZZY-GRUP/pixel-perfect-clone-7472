import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import LoadingScreen from "@/components/hive/LoadingScreen";

const HiveLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect
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
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <a href="/" className="font-sans font-extrabold text-[1.5rem] tracking-[.22em] uppercase text-foreground no-underline">
            Beezzy<span className="text-gold">.</span>
          </a>
          <p className="text-muted-foreground text-sm mt-2 tracking-wider uppercase font-heading">
            The Hive — Comunidade
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-heading">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-heading">
              Senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-background hover:bg-gold-light font-heading text-xs tracking-widest uppercase h-12"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-xs mt-8">
          Acesso exclusivo para membros.
          <br />
          Entre em contato para fazer parte do ecossistema.
        </p>
      </div>
    </div>
  );
};

export default HiveLogin;

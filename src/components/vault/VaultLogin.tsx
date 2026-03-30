import { useState } from "react";
import { Lock, ArrowRight, Loader2 } from "lucide-react";

interface Props {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const VaultLogin = ({ onLogin }: Props) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await onLogin(username.trim(), password);
    setLoading(false);
    if (!ok) {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#060604" }}>
      <div className="w-[400px] border border-white/10 rounded-2xl p-12" style={{ background: "#0e0e0a" }}>
        <div className="font-heading font-black text-2xl tracking-tight mb-1" style={{ color: "#F2F0E8" }}>
          BEEZZY<span style={{ color: "#FFD600" }}>.</span>VAULT
        </div>
        <div className="text-[11px] tracking-widest uppercase mb-8" style={{ color: "rgba(242,240,232,0.4)" }}>
          Sistema de Gestão Empresarial
        </div>

        <form onSubmit={handleSubmit}>
          <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(242,240,232,0.4)" }}>
            Usuário
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Digite seu usuário"
            autoComplete="off"
            className="w-full rounded-md px-3.5 py-2.5 text-sm outline-none mb-3.5 border border-white/10 focus:border-[#FFD600] transition-colors"
            style={{ background: "#0c0c08", color: "#F2F0E8" }}
          />

          <label className="block text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "rgba(242,240,232,0.4)" }}>
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
            className="w-full rounded-md px-3.5 py-2.5 text-sm outline-none mb-4 border border-white/10 focus:border-[#FFD600] transition-colors"
            style={{ background: "#0c0c08", color: "#F2F0E8" }}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-md font-heading font-semibold text-sm text-black flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-70"
            style={{ background: "linear-gradient(90deg, #FFD600, #E6C200)" }}
          >
            {loading ? <><Loader2 size={14} className="animate-spin" /> Entrando...</> : <>Entrar no Sistema <ArrowRight size={14} /></>}
          </button>
        </form>

        {error && (
          <div className="flex items-center gap-2 mt-3 text-xs text-red-400">
            <Lock size={12} /> Usuário ou senha inválidos.
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/5 text-[11px]" style={{ color: "rgba(242,240,232,0.3)" }}>
          Acesso restrito a usuários autorizados.
        </div>
      </div>
    </div>
  );
};

export default VaultLogin;

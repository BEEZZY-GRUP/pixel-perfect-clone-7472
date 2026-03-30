import { VaultUser } from "@/hooks/useVaultAuth";

const VaultProfilePage = ({ user }: { user: VaultUser }) => {
  return (
    <div>
      <div className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight">Meu Perfil</h1>
        <p className="text-[11px]" style={{ color: "rgba(242,240,232,0.4)" }}>Configurações da sua conta</p>
      </div>

      <div className="max-w-lg">
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: "Nome", value: user.name },
            { label: "Usuário", value: user.username },
            { label: "Perfil", value: user.role },
          ].map((f, i) => (
            <div key={i} className="rounded-xl p-3 border border-white/5" style={{ background: "#0e0e0a" }}>
              <div className="text-[9px] uppercase tracking-widest mb-1" style={{ color: "rgba(242,240,232,0.3)" }}>{f.label}</div>
              <div className="text-sm">{f.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VaultProfilePage;

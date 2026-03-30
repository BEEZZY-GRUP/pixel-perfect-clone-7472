import { useVaultAuth } from "@/hooks/useVaultAuth";
import VaultLogin from "@/components/vault/VaultLogin";
import VaultLayout from "@/components/vault/VaultLayout";

const VaultPage = () => {
  const { user, login, logout, hasPerm, ROLE_LABELS, ROLE_COLORS } = useVaultAuth();

  if (!user) {
    return <VaultLogin onLogin={login} />;
  }

  return (
    <VaultLayout
      user={user}
      onLogout={logout}
      roleLabels={ROLE_LABELS}
      roleColors={ROLE_COLORS}
      hasPerm={hasPerm}
    />
  );
};

export default VaultPage;

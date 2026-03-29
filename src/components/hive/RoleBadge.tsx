import { Shield, ShieldCheck } from "lucide-react";

interface Props {
  role: "admin" | "moderator" | string;
  size?: "sm" | "md";
}

const RoleBadge = ({ role, size = "sm" }: Props) => {
  if (role === "admin") {
    return (
      <span className={`inline-flex items-center gap-0.5 bg-red-500/15 text-red-400 font-heading tracking-wider uppercase shrink-0 ${
        size === "sm" ? "text-[.5rem] px-1 py-0.5" : "text-[.55rem] px-1.5 py-0.5"
      }`}>
        <Shield size={size === "sm" ? 8 : 10} />
        Admin
      </span>
    );
  }

  if (role === "moderator") {
    return (
      <span className={`inline-flex items-center gap-0.5 bg-blue-500/15 text-blue-400 font-heading tracking-wider uppercase shrink-0 ${
        size === "sm" ? "text-[.5rem] px-1 py-0.5" : "text-[.55rem] px-1.5 py-0.5"
      }`}>
        <ShieldCheck size={size === "sm" ? 8 : 10} />
        Mod
      </span>
    );
  }

  return null;
};

export default RoleBadge;

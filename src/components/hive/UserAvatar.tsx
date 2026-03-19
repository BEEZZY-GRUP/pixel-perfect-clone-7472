import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface Props {
  avatarUrl?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-7 h-7 text-[.55rem]",
  md: "w-9 h-9 text-[.65rem]",
  lg: "w-12 h-12 text-sm",
};

const UserAvatar = forwardRef<HTMLElement, Props>(({ avatarUrl, name, size = "md", className }, ref) => {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name || "Avatar"}
        className={cn(
          "rounded-full object-cover border border-border shrink-0",
          sizeMap[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gold/15 text-gold flex items-center justify-center font-heading font-semibold tracking-wider border border-gold/20 shrink-0",
        sizeMap[size],
        className
      )}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;

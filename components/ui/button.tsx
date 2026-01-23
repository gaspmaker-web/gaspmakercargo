import * as React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost";
};

export function Button({ className = "", variant = "default", ...props }: Props) {
  const base = "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm shadow-sm transition";
  const variants = {
    default: "bg-black text-white hover:opacity-90",
    secondary: "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
    ghost: "bg-transparent text-neutral-700 hover:bg-neutral-100",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

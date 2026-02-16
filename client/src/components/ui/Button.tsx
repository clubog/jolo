import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark active:scale-[0.98]",
  secondary: "bg-surface text-text border border-gray-200 hover:border-primary",
  ghost: "text-text-light hover:text-text hover:bg-gray-100",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-4 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-xl font-semibold transition-all duration-200
        ${variants[variant]} ${sizes[size]}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${className}`}
      disabled={disabled}
      {...props}
    />
  );
}

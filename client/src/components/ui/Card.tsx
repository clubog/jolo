import type { HTMLAttributes } from "react";

export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-surface rounded-2xl shadow-sm p-5 ${className}`}
      {...props}
    />
  );
}

interface BadgeProps {
  label: string;
  color?: "primary" | "secondary" | "accent";
}

const colors = {
  primary: "bg-primary/10 text-primary",
  secondary: "bg-secondary/10 text-secondary",
  accent: "bg-accent/10 text-accent",
};

export function Badge({ label, color = "primary" }: BadgeProps) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[color]}`}
    >
      {label}
    </span>
  );
}

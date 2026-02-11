import { cn } from "../../lib/utils";

/* ---------------------------------- Types ---------------------------------- */

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive";

type BadgeProps = React.ComponentPropsWithoutRef<"div"> & {
  variant?: BadgeVariant;
  ref?: React.Ref<HTMLDivElement>;
};

/* ---------------------------------- Badge ---------------------------------- */

export function Badge({
  className,
  variant = "default",
  ref,
  ...props
}: BadgeProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        {
          "bg-primary text-primary-foreground": variant === "default",
          "bg-secondary text-secondary-foreground": variant === "secondary",
          "bg-green-100 text-green-800": variant === "success",
          "bg-yellow-100 text-yellow-800": variant === "warning",
          "bg-red-100 text-red-800": variant === "destructive",
        },
        className
      )}
      {...props}
    />
  );
}

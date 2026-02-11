import { cn } from "../../lib/utils";

/* ---------------------------------- Types ---------------------------------- */

type DivProps = React.ComponentPropsWithoutRef<"div"> & {
  ref?: React.Ref<HTMLDivElement>;
};

type HeadingProps = React.ComponentPropsWithoutRef<"h3"> & {
  ref?: React.Ref<HTMLHeadingElement>;
};

/* ---------------------------------- Card ---------------------------------- */

export function Card({ className, ref, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------- CardHeader ------------------------------- */

export function CardHeader({ className, ref, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

/* -------------------------------- CardTitle -------------------------------- */

export function CardTitle({ className, ref, ...props }: HeadingProps) {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-2xl font-semibold leading-none tracking-tight",
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------- CardContent ------------------------------- */

export function CardContent({ className, ref, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn("p-6 pt-0", className)}
      {...props}
    />
  );
}

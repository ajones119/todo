import { cn } from "@/lib/utils";
import "./styles/retro.css";

interface SpinnerProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg";
}

export function Spinner({ className, size = "md", ...props }: SpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center w-full",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "border-2 border-foreground dark:border-ring border-t-transparent rounded-full animate-spin retro",
          sizeClasses[size]
        )}
        style={{
          borderStyle: "solid",
        }}
      />
    </div>
  );
}


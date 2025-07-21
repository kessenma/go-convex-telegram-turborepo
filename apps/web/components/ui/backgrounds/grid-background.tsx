import { cn } from "../../../lib/utils";

interface GridBackgroundProps {
  gridSize?: number;
  gridColor?: string;
  className?: string;
}

export function GridBackground({
  gridSize = 40,
  gridColor = "#e4e4e7",
  className,
}: GridBackgroundProps): React.ReactElement {
  return (
    <div className={cn("relative w-full", className)}>
      <div
        className="absolute inset-0"
        style={{
          backgroundSize: `${gridSize}px ${gridSize}px`,
          backgroundImage: `linear-gradient(to right,${gridColor} 1px,transparent 1px),linear-gradient(to bottom,${gridColor} 1px,transparent 1px)`,
        }}
      />
    </div>
  );
}

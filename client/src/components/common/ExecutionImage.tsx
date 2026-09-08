/* eslint-disable @next/next/no-img-element */
import type { ExecutionVisualAsset } from "@/data/execution-visuals";
import { cn } from "@/lib/utils";
import "@/styles/execution-image.css";

interface ExecutionImageProps {
  visual: ExecutionVisualAsset;
  sizes: string;
  priority?: boolean;
  className?: string;
}

export function ExecutionImage({
  visual,
  sizes,
  priority = false,
  className,
}: ExecutionImageProps) {
  return (
    <div className={cn("zb-execution-image", className)}>
      {/* Local WebP variants keep image selection in the browser and avoid
          another compression pass or an image service on the request path. */}
      <img
        src={visual.src}
        srcSet={visual.srcSet}
        alt={visual.alt}
        width={visual.width}
        height={visual.height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
      />
    </div>
  );
}

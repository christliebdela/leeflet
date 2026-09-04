import { LineWaves } from "./line-waves";
import { cn } from "@/lib/utils";

interface LineWavesBackgroundProps {
  className?: string;
  flipHorizontal?: boolean;
  flipVertical?: boolean;
  onError?: () => void;
}

export function LineWavesBackground({
  className,
  flipHorizontal = true,
  flipVertical = false,
  onError,
}: LineWavesBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 z-0 overflow-hidden", className)}
    >
      {/* Base dark canvas backdrop */}
      <div className="absolute inset-0 bg-[#08090a]" />

      {/* Terax-style flowing lines WebGL canvas */}
      <LineWaves
        speed={0.35}
        innerLineCount={40}
        outerLineCount={15}
        warpIntensity={0.3}
        rotation={-38}
        edgeFadeWidth={0}
        colorCycleSpeed={0}
        brightness={0.18}
        color1="#ffffff"
        color2="#ffffff"
        color3="#ffffff"
        mouseInfluence={1.6}
        flipHorizontal={flipHorizontal}
        flipVertical={flipVertical}
        className="size-full opacity-65"
        onError={onError}
      />

      {/* Top vignette fade */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#08090a] to-transparent" />

      {/* Center radial gradient vignette (smooth Terax fade) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#08090a_92%)] opacity-75 pointer-events-none" />

      {/* Bottom vignette fade */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#08090a] to-transparent" />
    </div>
  );
}

export default LineWavesBackground;

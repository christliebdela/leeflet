import React, { ReactNode, useState, useEffect, useCallback } from "react";
import { AuroraBackground } from "../ui/aurora-background";
import { LineWavesBackground } from "../ui/line-waves-background";
import { Waves, Rainbow } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "@/lib/utils";

export type BackgroundMode = "waves" | "aurora";

const BG_STORAGE_KEY = "leaf_landing_bg_mode";
const BG_CHANGE_EVENT = "leaf-bg-mode-change";

export function getStoredBackgroundMode(): BackgroundMode {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(BG_STORAGE_KEY);
      if (saved === "aurora" || saved === "waves") return saved;
    } catch {
      // Ignore storage errors
    }
  }
  // Default is waves
  return "waves";
}

export function useBackgroundMode() {
  const [bgMode, setBgModeState] = useState<BackgroundMode>(getStoredBackgroundMode);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === BG_STORAGE_KEY && (e.newValue === "waves" || e.newValue === "aurora")) {
        setBgModeState(e.newValue);
      }
    };

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<BackgroundMode>;
      if (customEvent.detail === "waves" || customEvent.detail === "aurora") {
        setBgModeState(customEvent.detail);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(BG_CHANGE_EVENT, handleCustomChange);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(BG_CHANGE_EVENT, handleCustomChange);
    };
  }, []);

  const setBgMode = useCallback((mode: BackgroundMode) => {
    setBgModeState(mode);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(BG_STORAGE_KEY, mode);
        window.dispatchEvent(new CustomEvent(BG_CHANGE_EVENT, { detail: mode }));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const toggleBackground = useCallback(() => {
    setBgModeState((prev) => {
      const next = prev === "waves" ? "aurora" : "waves";
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(BG_STORAGE_KEY, next);
          window.dispatchEvent(new CustomEvent(BG_CHANGE_EVENT, { detail: next }));
        } catch {
          // Ignore storage errors
        }
      }
      return next;
    });
  }, []);

  return { bgMode, setBgMode, toggleBackground };
}

export interface BackgroundToggleProps {
  className?: string;
}

export function BackgroundToggle({ className }: BackgroundToggleProps) {
  const { bgMode, toggleBackground } = useBackgroundMode();

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={toggleBackground}
            className={cn(
              "w-8 h-8 flex items-center justify-center rounded-lg text-[#8a8f98] hover:text-[#ededef] hover:bg-white/[0.06] transition-colors cursor-pointer",
              className
            )}
            aria-label="Toggle background animation"
          >
            {bgMode === "waves" ? (
              <Waves className="w-4 h-4" />
            ) : (
              <Rainbow className="w-4 h-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={6}>
          {bgMode === "waves"
            ? "Background: Line Waves (Click for Aurora)"
            : "Background: Aurora (Click for Line Waves)"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export interface LandingBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  mode?: BackgroundMode;
  showRadialGradient?: boolean;
  onFallback?: () => void;
}

export const LandingBackground: React.FC<LandingBackgroundProps> = ({
  children,
  className,
  mode: propMode,
  showRadialGradient = true,
  onFallback,
  ...props
}) => {
  const { bgMode, setBgMode } = useBackgroundMode();
  const currentMode = propMode ?? bgMode;

  const handleFallback = useCallback(() => {
    setBgMode("aurora");
    onFallback?.();
  }, [setBgMode, onFallback]);

  if (currentMode === "aurora") {
    return (
      <AuroraBackground
        showRadialGradient={showRadialGradient}
        className={className}
        {...props}
      >
        {children}
      </AuroraBackground>
    );
  }

  return (
    <div
      className={cn(
        "transition-bg relative min-h-screen bg-[#08090a] text-[#ededef] font-sans antialiased selection:bg-white/20 selection:text-white",
        className
      )}
      {...props}
    >
      <LineWavesBackground onError={handleFallback} />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

export default LandingBackground;

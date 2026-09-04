import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

export interface AuroraEffectProps {
  className?: string;
  showRadialGradient?: boolean;
}

export const AuroraEffect: React.FC<AuroraEffectProps> = ({
  className,
  showRadialGradient = true,
}) => {
  return (
    <div
      className={cn(
        "fixed inset-0 overflow-hidden pointer-events-none z-0",
        showRadialGradient &&
          "[mask-image:radial-gradient(ellipse_120%_80%_at_50%_0%,black_35%,transparent_85%)]",
        className
      )}
      style={
        {
          "--aurora-1":
            "repeating-linear-gradient(100deg,rgba(255,255,255,0.28) 0%,rgba(161,161,170,0.14) 10%,rgba(63,63,70,0.03) 20%,rgba(255,255,255,0.28) 30%)",
          "--aurora-2":
            "repeating-linear-gradient(130deg,rgba(255,255,255,0.22) 0%,rgba(113,113,122,0.10) 12%,rgba(24,24,27,0.01) 22%,rgba(255,255,255,0.22) 32%)",
          "--dark-stripes":
            "repeating-linear-gradient(100deg,rgba(8,9,10,0.92) 0%,rgba(8,9,10,0.92) 7%,transparent 10%,transparent 14%,rgba(8,9,10,0.92) 18%)",
        } as React.CSSProperties
      }
    >
      {/* Layer A */}
      <div
        className={cn(
          "animate-aurora-1 pointer-events-none absolute -inset-[20px] blur-[20px] will-change-transform",
          "[background-image:var(--dark-stripes),var(--aurora-1)] [background-size:300%,_200%]",
          "after:content-[''] after:absolute after:inset-0 after:[background-image:var(--dark-stripes),var(--aurora-2)] after:[background-size:200%,_100%] after:animate-aurora-after after:mix-blend-screen",
        )}
      />

      {/* Layer B (Offset 12s for seamless cross-fade loop) */}
      <div
        className={cn(
          "animate-aurora-2 pointer-events-none absolute -inset-[20px] blur-[20px] will-change-transform",
          "[background-image:var(--dark-stripes),var(--aurora-1)] [background-size:300%,_200%]",
          "after:content-[''] after:absolute after:inset-0 after:[background-image:var(--dark-stripes),var(--aurora-2)] after:[background-size:200%,_100%] after:animate-aurora-after after:mix-blend-screen",
        )}
      />
    </div>
  );
};

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <div
      className={cn(
        "transition-bg relative min-h-screen bg-[#08090a] text-[#ededef] font-sans antialiased selection:bg-white/20 selection:text-white",
        className,
      )}
      {...props}
    >
      <AuroraEffect showRadialGradient={showRadialGradient} />
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
};

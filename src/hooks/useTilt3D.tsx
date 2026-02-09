import { useRef, useCallback } from "react";

interface UseTilt3DOptions {
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
}

export const useTilt3D = ({ maxTilt = 12, scale = 1.03, glare = true }: UseTilt3DOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotateX = (0.5 - y) * maxTilt;
    const rotateY = (x - 0.5) * maxTilt;

    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${scale}, ${scale}, ${scale})`;

    if (glare) {
      const glareEl = el.querySelector<HTMLDivElement>("[data-tilt-glare]");
      if (glareEl) {
        const angle = Math.atan2(y - 0.5, x - 0.5) * (180 / Math.PI) + 90;
        const intensity = Math.sqrt((x - 0.5) ** 2 + (y - 0.5) ** 2) * 0.4;
        glareEl.style.background = `linear-gradient(${angle}deg, rgba(255,255,255,${intensity}) 0%, transparent 60%)`;
        glareEl.style.opacity = "1";
      }
    }
  }, [maxTilt, scale, glare]);

  const handleMouseLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";

    if (glare) {
      const glareEl = el.querySelector<HTMLDivElement>("[data-tilt-glare]");
      if (glareEl) {
        glareEl.style.opacity = "0";
      }
    }
  }, [glare]);

  return {
    ref,
    tiltProps: {
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave,
      style: {
        transition: "transform 0.15s ease-out",
        transformStyle: "preserve-3d" as const,
        willChange: "transform" as const,
      },
    },
  };
};

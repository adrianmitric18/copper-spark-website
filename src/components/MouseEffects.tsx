import { useEffect, useState, useCallback, memo } from "react";
import { motion, useMotionValue, useSpring, useMotionTemplate } from "framer-motion";

const MouseEffects = memo(() => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // Start as mobile to prevent flash
  
  // Mouse position with smooth spring animation
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth spring for the spotlight - reduced stiffness for better performance
  const springConfig = { damping: 30, stiffness: 100, mass: 0.5 };
  const spotX = useSpring(mouseX, springConfig);
  const spotY = useSpring(mouseY, springConfig);

  // Create motion templates for backgrounds to avoid style recalculations
  const outerGlow = useMotionTemplate`radial-gradient(600px circle at ${spotX}px ${spotY}px, rgba(205, 127, 50, 0.08), transparent 40%)`;
  const innerGlow = useMotionTemplate`radial-gradient(300px circle at ${spotX}px ${spotY}px, rgba(205, 127, 50, 0.12), transparent 30%)`;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
    
    if (!isVisible) {
      setIsVisible(true);
    }
  }, [mouseX, mouseY, isVisible]);

  const handleMouseLeave = useCallback(() => {
    setIsVisible(false);
  }, []);

  useEffect(() => {
    // Check mobile once on mount
    const checkMobile = window.matchMedia("(max-width: 768px)").matches || 'ontouchstart' in window;
    setIsMobile(checkMobile);
    
    if (checkMobile) return;

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.body.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.body.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  if (isMobile) return null;

  return (
    <>
      {/* Main spotlight glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          opacity: isVisible ? 1 : 0,
          background: outerGlow,
        }}
      />
      
      {/* Inner brighter glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-30"
        style={{
          opacity: isVisible ? 1 : 0,
          background: innerGlow,
        }}
      />

      {/* Small cursor dot */}
      <motion.div
        className="pointer-events-none fixed z-50 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full bg-primary/60 mix-blend-screen"
        style={{
          left: spotX,
          top: spotY,
          opacity: isVisible ? 1 : 0,
        }}
      />
    </>
  );
});

MouseEffects.displayName = "MouseEffects";

export default MouseEffects;

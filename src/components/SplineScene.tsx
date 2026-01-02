import { useState } from "react";
import { motion } from "framer-motion";

interface SplineSceneProps {
  url: string;
  className?: string;
}

const SplineScene = ({ url, className = "" }: SplineSceneProps) => {
  const [isLoading, setIsLoading] = useState(true);

  // Convert splinecode URL to embed URL
  const embedUrl = url.replace("scene.splinecode", "scene.splinecode");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      className={`relative ${className}`}
    >
      {/* Glow effect behind the scene */}
      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      )}

      {/* Spline iframe embed */}
      <iframe
        src={embedUrl}
        frameBorder="0"
        className="w-full h-full relative z-0"
        style={{ background: "transparent" }}
        onLoad={() => setIsLoading(false)}
        title="3D Scene"
        allow="autoplay"
      />
    </motion.div>
  );
};

export default SplineScene;

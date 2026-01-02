import { Suspense, lazy } from "react";
import { motion } from "framer-motion";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  url: string;
  className?: string;
}

const SplineScene = ({ url, className = "" }: SplineSceneProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
      className={`relative ${className}`}
    >
      {/* Glow effect behind the scene */}
      <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full" />
      
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        }
      >
        <Spline scene={url} className="w-full h-full" />
      </Suspense>
    </motion.div>
  );
};

export default SplineScene;

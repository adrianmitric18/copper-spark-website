import { cn } from "@/lib/utils";

interface LogoIconProps {
  className?: string;
  size?: number;
}

/**
 * SVG icon representing the lightbulb from Le Cuivre Électrique logo
 * Used as a replacement for the Zap icon throughout the site
 */
const LogoIcon = ({ className, size = 24 }: LogoIconProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
    >
      {/* Lightbulb body */}
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Lightbulb base/screw */}
      <path
        d="M9 19h6v1a2 2 0 01-2 2h-2a2 2 0 01-2-2v-1z"
        fill="currentColor"
      />
      {/* Light rays */}
      <path
        d="M12 0v1M4.22 4.22l.7.7M0 12h1M4.22 19.78l.7-.7M23 12h1M19.78 4.22l-.7.7M19.78 19.78l-.7-.7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Inner glow effect */}
      <ellipse
        cx="12"
        cy="8"
        rx="2.5"
        ry="3"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
};

export default LogoIcon;

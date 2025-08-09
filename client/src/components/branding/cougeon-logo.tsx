import { cn } from "@/lib/utils";

interface CougeonLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12", 
  lg: "w-16 h-16",
  xl: "w-24 h-24"
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg", 
  xl: "text-2xl"
};

export default function CougeonLogo({ className, showText = false, size = "md" }: CougeonLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="wingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00D4FF" />
              <stop offset="100%" stopColor="#5B73FF" />
            </linearGradient>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="beakGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
          
          {/* Wing feathers */}
          <path
            d="M20 120 Q60 80, 100 120 Q60 100, 20 140 Z"
            fill="url(#wingGradient)"
            opacity="0.9"
          />
          <path
            d="M25 135 Q65 95, 105 135 Q65 115, 25 155 Z"
            fill="url(#wingGradient)"
            opacity="0.8"
          />
          <path
            d="M30 150 Q70 110, 110 150 Q70 130, 30 170 Z"
            fill="url(#wingGradient)"
            opacity="0.7"
          />
          <path
            d="M35 165 Q75 125, 115 165 Q75 145, 35 185 Z"
            fill="url(#wingGradient)"
            opacity="0.6"
          />
          
          {/* Bird body */}
          <ellipse
            cx="140"
            cy="120"
            rx="45"
            ry="60"
            fill="url(#bodyGradient)"
          />
          
          {/* Bird head */}
          <circle
            cx="140"
            cy="80"
            r="25"
            fill="url(#bodyGradient)"
          />
          
          {/* Beak */}
          <path
            d="M165 75 L185 80 L165 85 Z"
            fill="url(#beakGradient)"
          />
          
          {/* Eye */}
          <circle
            cx="150"
            cy="75"
            r="4"
            fill="#00D4FF"
          />
          
          {/* Accent dots */}
          <circle cx="45" cy="140" r="2" fill="#00D4FF" opacity="0.6" />
          <circle cx="85" cy="125" r="1.5" fill="#5B73FF" opacity="0.5" />
          <circle cx="120" cy="140" r="1" fill="#A855F7" opacity="0.4" />
        </svg>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-gray-800 dark:text-gray-200 tracking-wider", textSizeClasses[size])}>
            COUGEON
          </span>
          <span className={cn("text-gray-600 dark:text-gray-400 tracking-wide", size === "xl" ? "text-sm" : "text-xs")}>
            INVESTMENTS
          </span>
          {size === "xl" && (
            <span className="text-xs text-gray-500 dark:text-gray-500 tracking-wide">
              (PVT) LTD
            </span>
          )}
        </div>
      )}
    </div>
  );
}
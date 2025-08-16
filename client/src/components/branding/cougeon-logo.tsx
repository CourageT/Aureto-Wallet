import { cn } from "@/lib/utils";

interface AuretoLogoProps {
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

export default function AuretoLogo({ className, showText = false, size = "md" }: AuretoLogoProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <img
          src="/aureto-logo.png"
          alt="Aureto Wallet Logo"
          className="w-full h-full object-contain"
        />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={cn("font-bold text-gray-800 dark:text-gray-200 tracking-wider", textSizeClasses[size])}>
            AURETO
          </span>
          <span className={cn("text-gray-600 dark:text-gray-400 tracking-wide", size === "xl" ? "text-sm" : "text-xs")}>
            WALLET
          </span>
        </div>
      )}
    </div>
  );
}
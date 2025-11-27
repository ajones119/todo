import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface HouseLoaderProps extends React.ComponentProps<"div"> {
  size?: "sm" | "md" | "lg";
}

export function HouseLoader({ className, size = "md", ...props }: HouseLoaderProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const strokeWidth = size === "sm" ? 2 : size === "md" ? 2.5 : 3;

  return (
    <div
      className={cn(
        "flex items-center justify-center w-full",
        className
      )}
      {...props}
    >
      <div className={cn("relative", sizeClasses[size])}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ imageRendering: 'crisp-edges' }}
        >
          {/* House base */}
          <motion.rect
            x="20"
            y="50"
            width="60"
            height="40"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          
          {/* Roof */}
          <motion.polygon
            points="10,50 50,20 90,50"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
          />
          
          {/* Door */}
          <motion.rect
            x="42"
            y="70"
            width="16"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
          />
          
          {/* Window left */}
          <motion.rect
            x="28"
            y="60"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
          />
          <motion.line
            x1="34"
            y1="60"
            x2="34"
            y2="72"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" }}
          />
          <motion.line
            x1="28"
            y1="66"
            x2="40"
            y2="66"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" }}
          />
          
          {/* Window right */}
          <motion.rect
            x="60"
            y="60"
            width="12"
            height="12"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.25, ease: "easeOut" }}
          />
          <motion.line
            x1="66"
            y1="60"
            x2="66"
            y2="72"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" }}
          />
          <motion.line
            x1="60"
            y1="66"
            x2="72"
            y2="66"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35, ease: "easeOut" }}
          />
          
          {/* Chimney */}
          <motion.rect
            x="70"
            y="30"
            width="12"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
            strokeLinejoin="miter"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
          />
        </svg>
        
        {/* Animated smoke/bubbles from chimney */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
          {/* Smoke bubble 1 */}
          <motion.div
            className="absolute"
            style={{ 
              left: '76%',
              top: '30%',
              width: size === "sm" ? '4px' : size === "md" ? '5px' : '6px',
              height: size === "sm" ? '4px' : size === "md" ? '5px' : '6px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              opacity: 0.7,
            }}
            animate={{
              y: [0, -20, -40, -60, -80],
              x: [0, 3, -1, 4, -2],
              opacity: [0.7, 0.6, 0.4, 0.2, 0],
              scale: [1, 1.2, 1.4, 1.6, 1.8],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
            }}
          />
          
          {/* Smoke bubble 2 */}
          <motion.div
            className="absolute"
            style={{ 
              left: '76%',
              top: '30%',
              width: size === "sm" ? '3px' : size === "md" ? '4px' : '5px',
              height: size === "sm" ? '3px' : size === "md" ? '4px' : '5px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              opacity: 0.6,
            }}
            animate={{
              y: [0, -20, -40, -60, -80],
              x: [0, -2, 3, -3, 4],
              opacity: [0.6, 0.5, 0.3, 0.15, 0],
              scale: [1, 1.3, 1.5, 1.7, 2],
            }}
            transition={{
              duration: 2.7,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.4,
            }}
          />
          
          {/* Smoke bubble 3 */}
          <motion.div
            className="absolute"
            style={{ 
              left: '76%',
              top: '30%',
              width: size === "sm" ? '3.5px' : size === "md" ? '4.5px' : '5.5px',
              height: size === "sm" ? '3.5px' : size === "md" ? '4.5px' : '5.5px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              opacity: 0.5,
            }}
            animate={{
              y: [0, -20, -40, -60, -80],
              x: [0, 2, -2, 3, -3],
              opacity: [0.5, 0.4, 0.25, 0.1, 0],
              scale: [1, 1.25, 1.45, 1.65, 1.85],
            }}
            transition={{
              duration: 2.9,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.8,
            }}
          />
          
          {/* Smoke bubble 4 */}
          <motion.div
            className="absolute"
            style={{ 
              left: '76%',
              top: '30%',
              width: size === "sm" ? '4.5px' : size === "md" ? '5.5px' : '6.5px',
              height: size === "sm" ? '4.5px' : size === "md" ? '5.5px' : '6.5px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              opacity: 0.6,
            }}
            animate={{
              y: [0, -20, -40, -60, -80],
              x: [0, -3, 2, -4, 3],
              opacity: [0.6, 0.5, 0.3, 0.15, 0],
              scale: [1, 1.15, 1.35, 1.55, 1.75],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: 1.2,
            }}
          />
          
          {/* Smoke bubble 5 - extra for more retro feel */}
          <motion.div
            className="absolute"
            style={{ 
              left: '76%',
              top: '30%',
              width: size === "sm" ? '3px' : size === "md" ? '4px' : '5px',
              height: size === "sm" ? '3px' : size === "md" ? '4px' : '5px',
              borderRadius: '50%',
              backgroundColor: 'currentColor',
              opacity: 0.55,
            }}
            animate={{
              y: [0, -20, -40, -60, -80],
              x: [0, 1, -2, 2, -1],
              opacity: [0.55, 0.45, 0.3, 0.15, 0],
              scale: [1, 1.2, 1.4, 1.6, 1.8],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: [0.4, 0, 0.2, 1],
              delay: 1.6,
            }}
          />
        </div>
      </div>
    </div>
  );
}


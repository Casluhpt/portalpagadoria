import { useEffect, useState, useRef } from "react";
import { useTheme } from "@/components/theme-provider";
import { useSpotlightConfig } from "@/hooks/use-spotlight-config";

export function DynamicSpotlight() {
  const { resolved } = useTheme();
  const { config } = useSpotlightConfig();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef<number>(null);
  
  // Use a ref for the mouse position to update the state only on animation frame
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (resolved !== "noturno" || !config.enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const update = () => {
      setPosition(mousePos.current);
      requestRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    requestRef.current = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [resolved, config.enabled, isVisible]);

  if (resolved !== "noturno" || !config.enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        background: `radial-gradient(${config.radius}px circle at ${position.x}px ${position.y}px, color-mix(in oklab, var(--primary) ${config.intensity}%, transparent), transparent 100%)`,
        willChange: "background",
      }}
    />
  );
}

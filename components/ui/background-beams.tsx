"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef } from "react";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const beamsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!beamsRef.current) return;

    const beams = beamsRef.current;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = beams.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      beams.style.setProperty("--mouse-x", `${mouseX}px`);
      beams.style.setProperty("--mouse-y", `${mouseY}px`);
    };

    beams.addEventListener("mousemove", handleMouseMove);
    return () => {
      beams.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div
      ref={beamsRef}
      className={cn(
        "absolute inset-0 overflow-hidden",
        className
      )}
    >
      <div className="relative h-full w-full">
        <div className="pointer-events-none absolute inset-0 bg-transparent opacity-30 mix-blend-screen">
          <div className="absolute left-1/2 top-1/2 h-[60vh] w-[60vh] -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-blue-500 to-transparent blur-2xl"></div>
          <div className="absolute left-[var(--mouse-x)] top-[var(--mouse-y)] h-40 w-40 -translate-x-1/2 -translate-y-1/2 bg-gradient-radial from-violet-500 to-transparent blur-2xl transition-transform duration-300"></div>
        </div>
      </div>
    </div>
  );
};
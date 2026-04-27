"use client";

import React from "react";

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = "primary",
  fullWidth = false,
  className = "",
  ...props
}) => {
  const baseStyles = "px-6 py-3 rounded-2xl font-semibold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 ios-shadow";
  
  const variants = {
    primary: "bg-[var(--primary)] text-white hover:opacity-90 border-t border-white/20",
    secondary: "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-opacity-80",
    outline: "bg-transparent border-2 border-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--primary)]/10"
  };

  const shineEffect = variant === "primary" ? "relative overflow-hidden before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:height-full before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:transition-all before:duration-500 hover:before:left-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${shineEffect} ${fullWidth ? "w-full" : ""} ${className}`}
      style={variant === "primary" ? { background: "var(--metal-shine)" } : {}}
      {...props}
    >
      {children}
    </button>
  );
};

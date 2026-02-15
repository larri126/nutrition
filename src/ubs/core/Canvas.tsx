import React, { ReactNode, CSSProperties } from "react";
import "../styles/ubs-global.css";

interface CanvasProps {
  children: ReactNode;
  cols?: number;   // Ej: 12, 24
  rowHeight?: string; // Ej: "100px" o "auto"
  className?: string;
}

export const Canvas = ({ children, cols = 12, rowHeight = "auto", className = "" }: CanvasProps) => {
  // Inyectamos las variables CSS dinámicamente
  const style = {
    "--total-cols": cols,
    "--row-height": rowHeight,
  } as CSSProperties;

  return (
    <div className={`ubs-canvas ${className}`} style={style}>
      {children}
    </div>
  );
};

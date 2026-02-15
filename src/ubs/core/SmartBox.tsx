import React, { ReactNode, CSSProperties } from "react";

interface SmartBoxProps {
  children?: ReactNode;
  
  cell?: string;   
  fusion?: string;
  w?: string | number; 
  h?: string | number;
  
  // NUEVA PROP
  scrollable?: boolean; // Default: false (Caja crece)

  className?: string; 
  debug?: boolean;
  
  _style?: CSSProperties;
  _debugMode?: string;
}

export const SmartBox = ({ 
  children, 
  cell,
  fusion,
  w, h,
  scrollable = false, // POR DEFECTO NO ES SCROLEABLE
  className = "", 
  debug,
  _style,
  _debugMode
}: SmartBoxProps) => {

  // Lógica de clases según el modo
  const behaviorClass = scrollable ? "ubs-box-fixed" : "ubs-box-grow";
  
  // Lógica de scroll interno
  const scrollStyle: CSSProperties = {
    overflowY: scrollable ? "auto" : "visible",
    height: scrollable ? "100%" : "auto"
  };

  return (
    <div className={`ubs-smart-box ${behaviorClass} ${className}`} style={_style}>
      {debug && (
        <div className="ubs-debug-tag">
           {_debugMode} {cell ? `[${cell}]` : ''} {scrollable ? '(Scroll)' : '(Grow)'}
        </div>
      )}
      
      <div className="ubs-content-scroll" style={scrollStyle}>
        {children}
      </div>
    </div>
  );
};

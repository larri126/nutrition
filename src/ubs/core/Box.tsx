/* src/ubs/core/Box.tsx */
import React, { ReactNode, CSSProperties } from "react";
import { parseCell } from "../utils/cell-parser";

interface BoxProps {
  children?: ReactNode;
  
  // 1. UBICACIÓN
  cell: string; // "1A", "2B"
  
  // 2. TAMAÑO REAL (Resizing)
  // Esto cambia el tamaño de la columna/fila entera
  w?: string | number; // Ej: "300px" o "20%"
  h?: string | number; // Ej: "150px"
  
  // 3. FUSIÓN (Merging)
  // Esto une celdas (El antiguo span)
  wf?: number; // Width Fusion (Cuántas columnas ocupa)
  hf?: number; // Height Fusion (Cuántas filas ocupa)
  
  // EXTRAS
  className?: string;
  debug?: boolean;
}

export const Box = ({ 
  cell, 
  w, h, 
  wf = 1, hf = 1, // Por defecto fusion es 1 (sin fusión)
  children, 
  className = "", 
  debug 
}: BoxProps) => {
  
  const { row, col } = parseCell(cell);

  const style: CSSProperties = {
    // A. POSICIONAMIENTO
    gridRowStart: row,
    gridColumnStart: col,
    
    // B. FUSIÓN (Grid Spanning)
    gridColumnEnd: `span ${wf}`,
    gridRowEnd: `span ${hf}`,
    
    // C. DIMENSIONADO (Resizing)
    // Usamos min-width/height para OBLIGAR al Grid a respetar el tamaño
    // y empujar a las celdas vecinas.
    width: w ? w : '100%',
    height: h ? h : '100%',
    minWidth: w,  // Clave para que la columna se ensanche
    minHeight: h, // Clave para que la fila se haga más alta
  };

  return (
    <div className={`ubs-box ${className}`} style={style}>
      
      {/* DEBUG: Muestra posición y fusión */}
      {debug && (
        <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] px-2 py-1 rounded-bl-lg z-50 font-mono border-b border-l border-white/20">
          {cell} {wf > 1 && `(wf:${wf})`}
        </div>
      )}
      
      <div className="w-full h-full flex flex-col p-4 overflow-auto">
        {children}
      </div>
    </div>
  );
};

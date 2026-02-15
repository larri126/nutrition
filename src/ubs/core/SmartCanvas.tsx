/* src/ubs/core/SmartCanvas.tsx */
import React, { ReactNode, isValidElement, CSSProperties } from "react";
import { parseCell } from "../utils/cell-parser";
import { getFusionSize } from "../utils/fusion-parser";
import "../styles/ubs-smart.css";

interface SmartCanvasProps {
  children: ReactNode;
  cols?: number; 
  rows?: number;
  className?: string;
  
  // NUEVO: Control maestro de flexibilidad
  colSize?: string;
  rowSize?: string;
}

export const SmartCanvas = ({ 
  children, 
  cols: manualCols, 
  rows: manualRows, 
  className = "",
  colSize = "minmax(0, 1fr)", // Por defecto: Jaula Rígida
  rowSize = "minmax(0, 1fr)"  // Por defecto: Jaula Rígida
}: SmartCanvasProps) => {
  
  const isManualMode = manualCols !== undefined && manualRows !== undefined;
  
  let colTracks: string[] = [];
  let rowTracks: string[] = [];
  let validChildren: ReactNode[] = [];

  // --- MODO MANUAL ---
  if (isManualMode) {
    // Usamos las props para definir el comportamiento de la fila/columna
    colTracks = new Array(manualCols).fill(colSize);
    rowTracks = new Array(manualRows).fill(rowSize);

    validChildren = React.Children.map(children, (child) => {
      if (!isValidElement(child)) return null;
      
      const cellProp = child.props.cell as string | undefined;
      const coords = parseCell(cellProp); 
      if (!coords) return null; 

      const fusion = child.props.fusion as string | undefined;
      const { colSpan, rowSpan } = getFusionSize(fusion, cellProp);

      const requestedW = child.props.w;
      const requestedH = child.props.h;

      // Unidades individuales pueden sobrescribir al Canvas maestro
      if (requestedW) {
        const val = typeof requestedW === "number" ? `${requestedW}px` : requestedW;
        if (colTracks[coords.col - 1]) colTracks[coords.col - 1] = val;
      }
      if (requestedH) {
        const val = typeof requestedH === "number" ? `${requestedH}px` : requestedH;
        if (rowTracks[coords.row - 1]) rowTracks[coords.row - 1] = val;
      }

      return React.cloneElement(child as React.ReactElement<any>, {
        _style: {
          gridColumnStart: coords.col,
          gridRowStart: coords.row,
          gridColumnEnd: `span ${colSpan}`,
          gridRowEnd: `span ${rowSpan}`
        },
        _debugMode: "MANUAL"
      });
    });
  } 
  
  // --- MODO AUTO ---
  else {
    let totalArea = 0;
    React.Children.forEach(children, (child) => {
      if (!isValidElement(child)) return;
      const fusion = child.props.fusion as string | undefined;
      const { colSpan, rowSpan } = getFusionSize(fusion);
      totalArea += (colSpan * rowSpan);
    });

    let finalCols = 1;
    let finalRows = 1;

    if (totalArea === 0) { finalCols = 1; finalRows = 1; }
    else if (totalArea <= 5) { finalCols = totalArea; finalRows = 1; }
    else if (totalArea <= 25) { finalCols = 5; finalRows = Math.ceil(totalArea / 5); }
    else {
      finalCols = 5; finalRows = 5;
      let capacity = 25;
      while (capacity < totalArea) {
        finalCols === finalRows ? finalCols++ : finalRows++;
        capacity = finalCols * finalRows;
      }
    }

    colTracks = new Array(finalCols).fill("minmax(auto, 1fr)");
    rowTracks = new Array(finalRows).fill("minmax(auto, 1fr)");

    validChildren = React.Children.map(children, (child) => {
      if (!isValidElement(child)) return null;
      const fusion = child.props.fusion as string | undefined;
      const { colSpan, rowSpan } = getFusionSize(fusion);

      return React.cloneElement(child as React.ReactElement<any>, {
        _style: {
          gridColumnEnd: `span ${colSpan}`,
          gridRowEnd: `span ${rowSpan}`
        },
        _debugMode: "AUTO"
      });
    });
  }

  const cssVars = {
    "--cols-def": colTracks.join(" "),
    "--rows-def": rowTracks.join(" "),
  } as CSSProperties;

  const modeClass = isManualMode ? "mode-manual" : "mode-auto";

  return (
    <div className={`ubs-canvas ${modeClass} ${className}`} style={cssVars}>
      {validChildren}
    </div>
  );
};

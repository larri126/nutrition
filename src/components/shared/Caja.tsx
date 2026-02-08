"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "../../lib/utils";
import { useUIStore } from "@/store/ui-store";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronDown, Eye, EyeOff, Search, Paperclip, Copy, Check, Upload } from "lucide-react";

// --- TIPOS ---
type CajaFunction = "container" | "button" | "merge" | "input" | "acordeon" | "dropdown";
type InputType = "text" | "password" | "email" | "search" | "selector" | "textarea" | "numberarea" | "file" | "range" | "date" | "time";
type SeparatorPos = "up" | "down";

interface CajaProps {
  children?: ReactNode;
  className?: string;

  // LÓGICA CORE
  function?: CajaFunction;
  action?: string;
  id?: string;
  onClick?: () => void;

  // ESTÉTICA
  title?: ReactNode;
  titleClassName?: string;
  icon?: ReactNode;
  separator?: boolean;
  separatorPosition?: SeparatorPos;
  isSelected?: boolean;
  badge?: number | string;          // <--- NUEVO: Globito rojo de notificaciones

  // LAYOUT
  colSpan?: string;
  scroll?: "x" | "y" | "none";      // <--- NUEVO: Para calendarios deslizables

  // INPUTS & DATA
  input?: InputType;
  placeholder?: string;
  textInfo?: string | number;
  options?: string[];
  limitText?: number;
  limitDigit?: number;
  min?: number;                     // <--- NUEVO: Para rangos (1-5)
  max?: number;                     // <--- NUEVO: Para rangos
  step?: number;
  fileAccept?: string;              // <--- NUEVO: ".pdf, .jpg"
  copyable?: boolean;               // <--- NUEVO: Botón de copiar
  editable?: boolean;

  variant?: "default" | "row";
}

export const Caja = ({
  children,
  className,
  function: type = "container",
  variant = "default",
  action,
  id,
  title,
  titleClassName,
  icon,
  separator = false,
  separatorPosition = "down",
  isSelected = false,
  badge, // Notificaciones
  colSpan,
  scroll, // Scroll
  onClick,

  // Props de Input
  input: inputType = "text",
  placeholder,
  textInfo,
  options = [],
  limitText,
  limitDigit,
  min, max, step,
  fileAccept,
  copyable = false,
  editable = true,
}: CajaProps) => {

  const { activeMergeId, openMerge, closeMerge } = useUIStore();

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false); // Feedback de copiado
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDisabled = !editable;
  const isAccordion = type === "acordeon";
  const isDropdown = type === "dropdown";

  // Función para copiar al portapapeles
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(String(text));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!isDropdown || !isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdown, isDropdownOpen]);

  // --- SUB-COMPONENTE: HEADER ---
  const Header = ({ isMerge = false }: { isMerge?: boolean }) => {
    if (!title && !icon && !isMerge && !isAccordion && !badge) return null;

    const isUp = separatorPosition === "up";
    const showSeparator = separator || (isAccordion && isAccordionOpen);

    return (
      <div
        onClick={() => isAccordion && setIsAccordionOpen(!isAccordionOpen)}
        className={cn(
          "flex items-center justify-between shrink-0 transition-all duration-300 relative",
          isAccordion && "cursor-pointer hover:opacity-80",
          (showSeparator && !isUp) && "pb-3 mb-1 border-b border-white/10",
          (showSeparator && isUp) && "pt-3 mt-1 border-t border-white/10 order-last"
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <div className="text-brand-lilac">{icon}</div>}
          {/* Solo mostrar el título si existe explícitamente, o si es merge/accordion */}
          {(title || isMerge || isAccordion) && (
            <div className={cn("text-lg font-bold text-white", titleClassName)}>
              {title || (isMerge ? "Detalles" : "Acordeón")}
            </div>
          )}
          {/* BADGE DE NOTIFICACIONES */}
          {badge && (
            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isMerge && (
            <button onClick={(e) => { e.stopPropagation(); closeMerge(); }} className="p-1.5 rounded-full hover:bg-white/10 text-white">
              <X className="w-5 h-5" />
            </button>
          )}
          {isAccordion && (
            <motion.div animate={{ rotate: isAccordionOpen ? 180 : 0 }}>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  // --- RENDERIZADOR DE INPUTS ---
  const renderInputContent = () => {
    const textColor = isDisabled ? "text-white font-medium" : "text-white";
    const commonClass = cn("w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-600", textColor);
    const defaultValue = textInfo !== undefined ? String(textInfo) : undefined;

    // Wrapper para inputs con iconos a la derecha (Copiar/Ojo)
    const InputWrapper = ({ children, rightIcon }: any) => (
      <div className="relative w-full flex items-center">
        {children}
        {rightIcon}
        {/* Botón de Copiar Universal */}
        {copyable && defaultValue && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(defaultValue); }}
            className="absolute right-0 text-gray-400 hover:text-brand-lilac transition-colors"
          >
            {isCopied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        )}
      </div>
    );

    switch (inputType) {
      case "selector":
        return (
          <select
            disabled={isDisabled}
            className={cn(commonClass, "appearance-none cursor-pointer bg-[#1F1F1F] py-2")}
            defaultValue={defaultValue || ""}
          >
            <option value="" disabled hidden>{placeholder || "Selecciona..."}</option>
            {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );

      case "search": // NUEVO
        return (
          <div className="flex items-center gap-2 w-full bg-black/20 rounded-xl px-3 border border-white/5 focus-within:border-brand-lilac transition-colors">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder={placeholder || "Buscar..."}
              className="w-full bg-transparent border-none outline-none text-white py-2 text-sm placeholder:text-gray-600"
            />
          </div>
        );

      case "file": // NUEVO (Certificados)
        return (
          <label className="flex items-center justify-center w-full gap-3 p-4 border border-dashed border-white/20 rounded-xl cursor-pointer hover:bg-white/5 hover:border-brand-lilac transition-all group">
            <div className="p-2 rounded-full bg-brand-lilac/10 text-brand-lilac group-hover:scale-110 transition-transform">
              <Upload size={18} />
            </div>
            <div className="text-sm text-gray-400 group-hover:text-white">
              {placeholder || "Adjuntar archivo"}
              <span className="block text-[10px] text-gray-600">{fileAccept || "PDF, JPG (Max 5MB)"}</span>
            </div>
            <input type="file" accept={fileAccept} className="hidden" disabled={isDisabled} />
          </label>
        );

      case "range": // NUEVO (Puntuaciones 1-5, 1-12)
        return (
          <div className="w-full py-2">
            <input
              type="range"
              min={min || 0} max={max || 100} step={step || 1}
              className="bento-range"
              disabled={isDisabled}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        );

      case "password":
        return (
          <InputWrapper rightIcon={editable && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword) }} className="absolute right-0 text-gray-400 hover:text-white">
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}>
            <input type={showPassword ? "text" : "password"} disabled={isDisabled} placeholder={placeholder} className={cn(commonClass, "py-2 pr-8")} />
          </InputWrapper>
        );

      case "textarea":
        return (
          <div className="w-full relative">
            <textarea disabled={isDisabled} placeholder={placeholder} defaultValue={defaultValue} maxLength={limitText} className={cn(commonClass, "resize-none h-24 py-2 custom-scrollbar")} />
            {limitText && editable && <div className="absolute bottom-0 right-0 text-[10px] text-gray-600">Máx {limitText}</div>}
          </div>
        );

      case "numberarea":
        return (
          <InputWrapper>
            <input type="number" disabled={isDisabled} placeholder={placeholder} defaultValue={defaultValue} className={cn(commonClass, "py-2")}
              onInput={(e: any) => { if (limitDigit && e.target.value.length > limitDigit) e.target.value = e.target.value.slice(0, limitDigit); }}
            />
          </InputWrapper>
        );

      default: // text, email, date, time
        return (
          <InputWrapper>
            <input type={inputType} disabled={isDisabled} placeholder={placeholder} defaultValue={defaultValue} className={cn(commonClass, "py-2")} />
          </InputWrapper>
        );
    }
  };

  // --- LÓGICA DE CLASES CSS ---
  const baseClass = variant === "row" ? "bento-item bento-row" : "bento-std";
  const interactiveClass = ((type === "button" || !!onClick) && editable) ? "bento-interactive" : "";
  const selectedClass = isSelected ? "bento-selected" : "";
  const disabledClass = isDisabled ? "cursor-default" : "";

  // Clases de Scroll
  const scrollClass = scroll === "x" ? "overflow-x-auto no-scrollbar flex-row flex-nowrap" :
    scroll === "y" ? "overflow-y-auto custom-scrollbar" : "";

  // 1. MODO INPUT
  if (type === "input") {
    // Si es tipo search o file, a veces queremos quitar el padding estándar para personalizar
    const padding = inputType === "search" ? "p-0 bg-transparent border-none" : "p-3";

    return (
      <div className={cn("bento-std", padding, disabledClass, colSpan, className)}>
        <Header />
        {renderInputContent()}
      </div>
    );
  }

  // 2. MODO MERGE / ACORDEON / CONTAINER
  // Reutilizamos lógica común
  const commonContent = (
    <>
      <Header isMerge={type === "merge"} />
      {type === "acordeon" ? (
        <AnimatePresence>
          {isAccordionOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className={cn("pt-2 text-neutral-300 flex flex-col gap-3", scrollClass)}>{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        // Si es container/button/merge, renderizamos children directamente
        // Si tiene scroll="x", forzamos flex-row para que los hijos se pongan en linea horizontal
        // Si variant="row", también forzamos flex-row para que icono y texto estén lado a lado
        <div className={cn(
          "w-full h-full",
          scrollClass,
          scroll === "x" || variant === "row" ? "flex gap-3" : "",
          variant === "row" ? "flex-row items-center" : ""
        )}>
          {children}
        </div>
      )}
    </>
  );

  if (type === "merge") {
    const isOpen = activeMergeId === id;
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeMerge} className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className={cn("bento-modal", className)}>
              {commonContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  // MODO DROPDOWN: Muestra contenido debajo del botón
  if (type === "dropdown") {
    const childrenArray = Array.isArray(children) ? children : [children];
    // El primer hijo es el trigger (botón/icono)
    const triggerContent = childrenArray[0];
    // El resto es el contenido del dropdown
    const dropdownContent = childrenArray.slice(1);

    return (
      <div ref={dropdownRef} className="relative">
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(baseClass, interactiveClass, selectedClass, disabledClass, colSpan, className)}
        >
          {/* Contenido del botón (icono, etc.) */}
          <div className={cn("w-full h-full", variant === "row" ? "flex gap-3 flex-row items-center" : "")}>
            {title || triggerContent}
          </div>
        </div>

        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className={cn(
                "absolute top-full mt-3 z-50 right-0", // right-0 alineará el dropdown a la derecha del botón
                "bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl shadow-black/50",
                "min-w-[320px] p-6 backdrop-blur-xl"
              )}
            >
              <div className="text-white">
                {dropdownContent}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const handleInteraction = () => {
    if (!editable) return;
    if (type === "button" && action) openMerge(action);
    if (onClick) onClick();
  };

  return (
    <div onClick={(type === "button" || onClick) ? handleInteraction : undefined} className={cn(baseClass, interactiveClass, selectedClass, disabledClass, colSpan, className)}>
      {commonContent}
    </div>
  );
};
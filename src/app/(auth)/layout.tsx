import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // CAMBIO: h-dvh se adapta mejor a móviles. overflow-hidden bloquea el scroll del body.
    <div className="h-dvh w-full grid lg:grid-cols-2 overflow-hidden bg-black">
      
      {/* Lado Izquierdo */}
      <div className="hidden lg:flex flex-col justify-center bg-zinc-900 p-10 border-r border-zinc-800">
         <h1 className="text-4xl font-bold text-white mb-4">Entrena Inteligentemente.</h1>
         <p className="text-zinc-400">Tu progreso, controlado al milímetro.</p>
      </div>
      
      {/* Lado Derecho */}
      <div className="flex items-center justify-center p-4 h-full w-full relative">
        {children}
      </div>
    </div>
  );
}
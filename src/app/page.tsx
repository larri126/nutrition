"use client";

import { useState } from "react";
import { Caja } from "@/components/shared/Caja";
import {
    LayoutGrid, Users, Dumbbell, Utensils, Activity, User,
    Settings, LogOut, Bell, Music, Command, Timer, Play, ChevronRight, MessageSquare
} from "lucide-react";

export default function DashboardPage() {
    const [activeTab, setActiveTab] = useState("Resumen");

    return (
        // LAYOUT PRINCIPAL: Fondo Negro Puro
        <main className="min-h-screen bg-[var(--color-bg-main)] text-white p-4 flex gap-6 overflow-hidden font-sans">

            {/* ========================================
        SIDEBAR (Idéntica a image_ff68bd.png) 
        ========================================
      */}
            <div className="w-64 h-[calc(100vh-2rem)] flex flex-col shrink-0">

                {/* Logo y Rol */}
                <div className="mb-8 px-2">
                    <h1 className="text-xl font-bold italic tracking-wide text-white mb-3">Powerfit Training</h1>
                    <div className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-white/5 px-3 py-1.5 rounded-full">
                        <User size={12} className="text-brand-lilac" />
                        <span className="text-[10px] font-bold text-brand-lilac uppercase tracking-wider">Rol: Entrenador</span>
                    </div>
                </div>

                {/* Navegación (Estilo Pill) */}
                <Caja className="flex flex-col gap-2 flex-1">
                    {[
                        { name: "Resumen", icon: <LayoutGrid size={18} /> },
                        { name: "Coach", icon: <Users size={18} /> },
                        { name: "Entrenamientos", icon: <Dumbbell size={18} /> },
                        { name: "Dietas", icon: <Utensils size={18} /> },
                        { name: "Seguimiento", icon: <Activity size={18} /> },
                        { name: "Perfil", icon: <User size={18} /> },
                    ].map((item) => (
                        <Caja
                            key={item.name}
                            function="button"
                            variant="row"
                            isSelected={activeTab === item.name}
                            onClick={() => setActiveTab(item.name)}
                            className={`justify-start px-4 py-3 rounded-2xl border-none transition-all ${activeTab === item.name
                                ? "bg-[#1A1A1A] text-white font-bold" // Selected
                                : "bg-transparent text-gray-500 hover:text-gray-300" // Normal
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Caja>
                    ))}
                </Caja>

                {/* Footer Sidebar */}
                <div className="mt-auto space-y-1">
                    <Caja function="button" variant="row" className="justify-start px-4 py-3 bg-transparent border-none text-gray-600 hover:text-gray-400">
                        <Settings size={18} />
                        <span className="text-sm">Configuración</span>
                    </Caja>
                    <Caja function="button" variant="row" className="px-3 py-2 bg-[#150505] border border-red-900/20 text-red-700 hover:text-red-500 w-fit rounded-full ml-2">
                        <div className="w-5 h-5 rounded-full bg-red-900/20 flex items-center justify-center">N</div>
                        <span className="text-xs font-bold">Cerrar sesión</span>
                    </Caja>
                </div>
            </div>


            {/* ========================================
        ZONA PRINCIPAL 
        ========================================
      */}
            <div className="flex-1 h-[calc(100vh-2rem)] flex flex-col gap-6">

                {/* TOPBAR (Iconos circulares) */}
                <header className="flex items-center justify-between shrink-0">
                    <h2 className="text-3xl font-bold text-white">{activeTab}</h2>

                    <div className="flex items-center gap-3">
                        {/* Icono Cronómetro con Dropdown */}
                        <Caja
                            function="dropdown"
                            className="rounded-full flex items-center justify-center border transition-all bg-[#0A0A0A] border-white/5 text-gray-400 hover:bg-[#151515] hover:text-white cursor-pointer"
                        >
                            {/* Primer hijo: Icono (Trigger) */}
                            <Timer size={20} />

                            {/* Resto de hijos: Contenido del Dropdown */}
                            <div className="flex flex-col items-center gap-4 py-2">
                                <span className="text-gray-400 text-sm font-medium uppercase tracking-wider">Cronómetro</span>
                                <div className="text-6xl font-mono font-bold tracking-tighter text-white">00:00</div>
                                <div className="flex gap-3 w-full">
                                    <Caja function="button" className="flex-1 bg-white/10 hover:bg-white/20 text-gray-300 border-none py-2 justify-center rounded-xl font-medium">
                                        Reset
                                    </Caja>
                                    <Caja function="button" className="flex-1 bg-brand-lilac hover:bg-brand-lilac/90 text-white border-none py-2 justify-center rounded-xl font-bold shadow-lg shadow-brand-lilac/20">
                                        Start
                                    </Caja>
                                </div>
                            </div>
                        </Caja>

                        {/* Otros Iconos Circulares */}
                        <Caja
                            function="button"
                            className=" rounded-full flex items-center justify-center border transition-all bg-[#0A0A0A] border-white/5 text-gray-400 hover:bg-[#151515] hover:text-white"
                        >
                            <Music size={20} />
                        </Caja>

                        <Caja
                            function="button"
                            badge={3}
                            className=" rounded-full flex items-center justify-center border transition-all bg-[#0A0A0A] border-white/5 text-gray-400 hover:bg-[#151515] hover:text-white"
                        >
                            <Bell size={20} />
                        </Caja>

                        <Caja
                            function="button"
                            className=" rounded-full flex items-center justify-center border transition-all bg-brand-lilac/10 border-brand-lilac/30 text-brand-lilac"
                        >
                            <Command size={20} />
                        </Caja>
                    </div>
                </header>

                {/* SCROLL AREA */}
                <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar">

                    {/* --- VISTA RESUMEN (Match image_ff68be.jpg) --- */}
                    {activeTab === "Resumen" && (
                        <div className="flex gap-6">

                            {/* COLUMNA PRINCIPAL: Grid de Tarjetas Oscuras */}
                            <div className="w-full grid grid-cols-1 gap-3 content-start">
                                {[
                                    { title: "Entrenamientos", sub: "Ver plan semanal", icon: <Dumbbell />, color: "text-green-500" },
                                    { title: "Dietas", sub: "2400 kcal hoy", icon: <Utensils />, color: "text-orange-500" },
                                    { title: "Seguimiento", sub: "Peso: 75kg", icon: <Activity />, color: "text-blue-500" },
                                    { title: "Alumnos", sub: "Gestión activa", icon: <Users />, color: "text-purple-500" },
                                ].map((card) => (
                                    <Caja
                                        key={card.title}
                                        function="button"
                                        variant="row"
                                        className="bg-[#0A0A0A] hover:bg-[#111] border border-white/5 p-6 group"
                                    >
                                        {/* Icono con fondo sutil */}
                                        <div className={`p-3 rounded-xl bg-white/5 ${card.color}`}>
                                            {card.icon}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-white mb-0.5">{card.title}</h3>
                                            <p className="text-sm text-gray-500">{card.sub}</p>
                                        </div>
                                        <ChevronRight className="text-gray-700 group-hover:text-white transition-colors" />
                                    </Caja>
                                ))}

                                {/* EJEMPLO DE ACORDEÓN */}
                                <Caja
                                    function="acordeon"
                                    title="Detalles del Entrenamiento"
                                    icon={<Dumbbell size={20} />}
                                    separator={true}
                                    className="bg-[#0A0A0A] border border-white/5 mt-3"
                                >
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Duración:</span>
                                            <span className="text-white font-bold">45 minutos</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Calorías quemadas:</span>
                                            <span className="text-white font-bold">320 kcal</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Ejercicios:</span>
                                            <span className="text-white font-bold">8 ejercicios</span>
                                        </div>
                                        <div className="pt-2 border-t border-white/5">
                                            <p className="text-sm text-gray-500">
                                                Este entrenamiento incluye ejercicios de fuerza y cardio para mejorar tu resistencia general.
                                            </p>
                                        </div>
                                    </div>
                                </Caja>
                            </div>
                        </div>
                    )}


                    {/* --- VISTA COACH (Match image_ff68bd.png) --- */}
                    {activeTab === "Coach" && (
                        <div className="flex flex-col gap-6">

                            {/* Header Coach */}
                            <Caja className="bg-[#0A0A0A]">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold">Gestión de Alumnos</h3>
                                    <Caja function="button" className="bg-brand-lilac text-white font-bold px-6 py-2.5 rounded-xl border-none hover:shadow-[0_0_20px_var(--color-brand-glow)]">
                                        Crear Grupo
                                    </Caja>
                                </div>

                                <Caja function="input" input="search" placeholder="Buscar alumno..." className="mb-6 max-w-md bg-[#050505]" />

                                {/* Lista de Alumnos Estilo Tarjeta */}
                                <div className="flex flex-col gap-3">
                                    {[1, 2, 3].map((n) => (
                                        <Caja key={n} variant="row" className="bg-[#121212] border border-white/5 hover:border-white/10 p-4">
                                            <div className="w-10 h-10 rounded-full bg-[#252525] flex items-center justify-center font-bold text-gray-400">
                                                U
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-bold text-white text-base">@usuario_{n}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-2">
                                                    <span>Plan Pro</span>
                                                    <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                                    <span className="text-green-500">Activo</span>
                                                </div>
                                            </div>
                                            <Caja function="button" className="p-2 text-gray-500 hover:text-white bg-transparent border-none">
                                                <Settings size={18} />
                                            </Caja>
                                        </Caja>
                                    ))}
                                </div>
                            </Caja>
                        </div>
                    )}

                </div>
            </div>

        </main>
    );
}
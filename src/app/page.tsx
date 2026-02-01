import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Dumbbell, Zap, BarChart3, Layout } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-emerald-500/30">
      
      {/* --- NAVBAR --- */}
      <header className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-xs">PF</span>
            </div>
            <span className="font-bold text-lg tracking-tight">PowerFit</span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">
              Iniciar Sesión
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-white text-black hover:bg-zinc-200 font-bold rounded-full px-6">
                Empezar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        
        {/* --- HERO SECTION --- */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 text-center overflow-hidden">
          {/* Fondo decorativo (Glow) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-[120px] -z-10 opacity-50" />
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-emerald-400 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Nuevo: Modo Entrenador disponible
            </div>

            <h1 className="text-4xl md:text-7xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              Tu evolución física, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">bajo control.</span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Deja de adivinar en el gimnasio. PowerFit te ayuda a planificar rutinas, registrar progresos y conectar con entrenadores reales. Sin hojas de cálculo aburridas.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-8 bg-white text-black hover:bg-zinc-200 font-bold rounded-full text-base">
                  Crear cuenta gratis <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full h-12 px-8 border-zinc-800 bg-transparent text-white hover:bg-white/5 rounded-full text-base">
                  Ya tengo cuenta
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section className="py-24 bg-zinc-950/50 border-t border-white/5">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Dumbbell className="text-emerald-400" />}
                title="Rutinas Inteligentes"
                desc="Crea, clona y organiza tus entrenamientos. Registra pesos y repeticiones al instante desde tu móvil."
              />
              <FeatureCard 
                icon={<BarChart3 className="text-purple-400" />}
                title="Progreso Visual"
                desc="Gráficas automáticas de tu evolución. Mira cómo suben tus marcas y baja tu porcentaje de grasa."
              />
              <FeatureCard 
                icon={<Zap className="text-yellow-400" />}
                title="Modo Entrenador"
                desc="Gestiona múltiples alumnos, asigna dietas y revisa su cumplimiento desde un panel centralizado."
              />
            </div>
          </div>
        </section>

        {/* --- SOCIAL PROOF / TRUST --- */}
        <section className="py-20 border-t border-white/5">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-zinc-500 font-medium mb-8">CONFIAN EN NOSOTROS</h3>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale">
               {/* Logos ficticios de texto */}
               <span className="text-xl font-bold">GYM<span className="font-light">BOX</span></span>
               <span className="text-xl font-black tracking-tighter">IRONLIFT</span>
               <span className="text-xl font-serif italic">PureStrength</span>
               <span className="text-xl font-mono">FIT_DATA</span>
            </div>
          </div>
        </section>

        {/* --- CTA FINAL --- */}
        <section className="py-24 px-4 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/20 to-transparent -z-10" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Empieza tu transformación hoy</h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-10">
            Únete a miles de atletas y entrenadores que ya han digitalizado su entrenamiento.
          </p>
          <Link href="/register">
             <Button size="lg" className="h-14 px-10 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full text-lg shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] transition-all hover:scale-105">
                Comenzar Ahora
             </Button>
          </Link>
          <p className="mt-6 text-xs text-zinc-600">No requiere tarjeta de crédito • Plan gratuito para siempre</p>
        </section>

      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 py-12 bg-black text-center md:text-left">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                <span className="text-black font-bold text-[10px]">PF</span>
            </div>
            <span className="font-bold text-zinc-300">PowerFit SaaS</span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Privacidad</Link>
            <Link href="#" className="hover:text-white transition-colors">Términos</Link>
            <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
          </div>
          <div className="text-xs text-zinc-600">
            © 2024 PowerFit Inc.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="p-8 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">
        {desc}
      </p>
    </div>
  )
}
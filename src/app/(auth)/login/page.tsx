'use client';

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation"; // <--- Importar useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { loginSchema, LoginFormValues } from "@/features/auth/schemas";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { OAuthButton } from "@/features/auth/components/OAuthButton";

// Componente del Formulario aislado para usar useSearchParams
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // <--- Hook para leer URL
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // EFECTO: Detectar si venimos redirigidos del registro
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      form.setValue("email", emailParam);
      toast.info("Ya tenías cuenta. Hemos rellenado tu correo.");
    }
  }, [searchParams, form]);

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("Credenciales incorrectas");
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success("¡Bienvenido de nuevo!");
      router.push("/dashboard");
      router.refresh();

    } catch (err) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="nombre@ejemplo.com" 
          className="bg-zinc-900 border-zinc-700 focus:ring-emerald-500"
          {...form.register("email")} 
        />
        {form.formState.errors.email && (
          <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Contraseña</Label>
          <Link href="#" className="text-xs text-emerald-400 hover:underline">
            ¿Olvidaste la contraseña?
          </Link>
        </div>
        <Input 
          id="password" 
          type="password" 
          className="bg-zinc-900 border-zinc-700"
          {...form.register("password")} 
        />
         {form.formState.errors.password && (
          <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Entrar"}
      </Button>
    </form>
  );
}

// Componente Principal Página
export default function LoginPage() {
  return (
    <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
        <CardDescription className="text-center text-zinc-400">
          Accede a tu panel de entrenamiento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthButton />
        <div className="relative py-2">
           <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
           <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-950 px-2 text-zinc-500">O con email</span></div>
        </div>
        
        {/* Envolvemos en Suspense para evitar error de useSearchParams */}
        <Suspense fallback={<div className="text-center p-4"><Loader2 className="animate-spin mx-auto"/></div>}>
           <LoginForm />
        </Suspense>

      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-zinc-500">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-emerald-400 hover:underline font-medium">
            Regístrate gratis
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
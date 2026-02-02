'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Dumbbell, GraduationCap } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { registerSchema, RegisterFormValues } from "@/features/auth/schemas";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { OAuthButton } from "@/features/auth/components/OAuthButton";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "client",
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
      description: "",
    },
  });

  const watchRole = form.watch("role");

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            role: data.role,
            display_name: data.displayName,
            description: data.description ?? "",
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered") || error.status === 422) {
          toast.info("Este correo ya está registrado. Redirigiendo al login...");
          router.push(`/login?email=${encodeURIComponent(data.email)}`);
          return;
        }
        throw error;
      }

      toast.success("Cuenta creada correctamente");
      router.push("/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Error al registrar");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 animate-in fade-in my-0 flex flex-col h-full max-h-[85dvh] overflow-hidden shadow-2xl relative">
      <CardHeader className="shrink-0 pb-2">
        <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center text-zinc-400">Únete a PowerFit SaaS</CardDescription>
      </CardHeader>

      <div className="relative flex-1 overflow-hidden min-h-0 group">
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none z-10 opacity-50" />

        <CardContent className="overflow-y-auto h-full p-6 pt-2 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          <div className="mb-6 space-y-4">
            <OAuthButton />
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-zinc-950 px-2 text-zinc-500">O con email</span>
              </div>
            </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Soy...</Label>
              <Tabs
                defaultValue="client"
                onValueChange={(val) => form.setValue("role", val as "client" | "coach")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                  <TabsTrigger value="client" className="data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-400">
                    <Dumbbell className="w-4 h-4 mr-2" /> Alumno
                  </TabsTrigger>
                  <TabsTrigger value="coach" className="data-[state=active]:bg-purple-950 data-[state=active]:text-purple-400">
                    <GraduationCap className="w-4 h-4 mr-2" /> Entrenador
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Nombre visible</Label>
              <Input className="bg-zinc-900 border-zinc-700" placeholder="Juan Pérez" {...form.register("displayName")} />
              {form.formState.errors.displayName && (
                <p className="text-xs text-red-400">{form.formState.errors.displayName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Correo</Label>
              <Input type="email" className="bg-zinc-900 border-zinc-700" placeholder="hola@ejemplo.com" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input type="password" className="bg-zinc-900 border-zinc-700" {...form.register("password")} />
                {form.formState.errors.password && <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Confirmar</Label>
                <Input type="password" className="bg-zinc-900 border-zinc-700" {...form.register("confirmPassword")} />
                {form.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-400">{form.formState.errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            {watchRole === "coach" && (
              <div className="space-y-2 pt-2 border-t border-zinc-900">
                <Label className="text-zinc-400">Sobre ti (Opcional)</Label>
                <Textarea
                  placeholder="Describe tu experiencia..."
                  className="bg-zinc-900 border-zinc-700 min-h-[100px]"
                  {...form.register("description")}
                />
                {form.formState.errors.description && (
                  <p className="text-xs text-red-400">{form.formState.errors.description.message}</p>
                )}
              </div>
            )}

            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 mt-6 font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Cuenta"}
            </Button>
          </form>
        </CardContent>

        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none z-10" />
      </div>

      <CardFooter className="justify-center pb-6 shrink-0 relative z-20 bg-zinc-950 border-t border-zinc-900 pt-4">
        <p className="text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

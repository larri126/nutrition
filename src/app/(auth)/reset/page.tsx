'use client';

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPage() {
  const supabase = createClient();
  const router = useRouter();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setMode("update");
      }
    };
    checkSession();
  }, [supabase]);

  const requestReset = async () => {
    if (!email) {
      toast.error("Introduce tu correo");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      });
      if (error) throw error;
      toast.success("Revisa tu correo para continuar");
    } catch (err: any) {
      toast.error(err.message || "No se pudo enviar el correo");
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword = async () => {
    if (!password || password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Contraseña actualizada");
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "No se pudo actualizar la contraseña");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Restablecer contraseña</CardTitle>
        <CardDescription className="text-center text-zinc-400">
          {mode === "request" ? "Te enviaremos un enlace seguro" : "Define tu nueva contraseña"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mode === "request" ? (
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              placeholder="nombre@ejemplo.com"
              className="bg-zinc-900 border-zinc-700"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={requestReset} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar enlace"}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                className="bg-zinc-900 border-zinc-700"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar contraseña</Label>
              <Input
                id="confirm"
                type="password"
                className="bg-zinc-900 border-zinc-700"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>
            <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={updatePassword} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Actualizar contraseña"}
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-zinc-500">
          ¿Volver al login?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline font-medium">
            Inicia sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

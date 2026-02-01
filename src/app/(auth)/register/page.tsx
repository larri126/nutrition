'use client';

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Dumbbell, GraduationCap, Plus, Trash, Upload, FileText, X, Paperclip } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { registerSchema, RegisterFormValues } from "@/features/auth/schemas";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OAuthButton } from "@/features/auth/components/OAuthButton";

const SOCIAL_NETWORKS = ['Instagram', 'Twitter (X)', 'TikTok', 'YouTube', 'LinkedIn', 'Web'];

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  
  // Estados Locales
  const [socials, setSocials] = useState<{network: string, url: string}[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "user", username: "", fullName: "", email: "", password: "", confirmPassword: "", description: "" },
  });

  const watchRole = form.watch("role");

  // --- Lógica Archivos ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const validFiles: File[] = [];
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB

      if (selectedFiles.length + filesArray.length > 20) {
        toast.error("Máximo 20 archivos permitidos");
        return;
      }

      for (const file of filesArray) {
        if (file.size > MAX_SIZE) {
          toast.error(`El archivo ${file.name} supera los 5MB`);
        } else {
          validFiles.push(file);
        }
      }
      setSelectedFiles([...selectedFiles, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // --- Lógica Redes Sociales ---
  const addSocial = () => {
    if (!selectedNetwork || !newSocialUrl) return;
    setSocials([...socials, { network: selectedNetwork, url: newSocialUrl }]);
    setNewSocialUrl("");
    setSelectedNetwork("");
  };

  const removeSocial = (index: number) => {
    setSocials(socials.filter((_, i) => i !== index));
  };

  // --- SUBMIT ---
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      // 1. VERIFICAR USERNAME (Si está ocupado, error en el form)
      const { data: existingUser } = await supabase.from('profiles').select('username').eq('username', data.username).single();
      if (existingUser) {
        form.setError("username", { message: "Usuario ocupado" });
        setIsLoading(false);
        return;
      }

      // 2. VERIFICAR EMAIL Y REDIRIGIR (Lógica Faltante Añadida)
      // Primero intentamos ver si existe en la tabla de perfiles
      const { data: existingEmail } = await supabase.from('profiles').select('id').eq('email', data.email).maybeSingle();
      
      if (existingEmail) {
        toast.info("Este correo ya está registrado. Redirigiendo al login...");
        router.push(`/login?email=${encodeURIComponent(data.email)}`);
        return;
      }

      // 3. INTENTAR REGISTRO
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username,
            role: data.role,
            description: data.description,
            socials: socials,
          },
        },
      });

      // Si falla el registro, comprobamos si es porque ya existe (doble check de seguridad)
      if (error) {
         // Código 422 o mensaje específico de Supabase
         if (error.message.includes("already registered") || error.status === 422) {
             toast.info("Usuario ya registrado. Redirigiendo...");
             router.push(`/login?email=${encodeURIComponent(data.email)}`);
             return;
         }
         throw error;
      }

      // 4. ÉXITO (Y subida de archivos simulada)
      if (data.role === 'trainer' && selectedFiles.length > 0 && authData.user) {
        console.log("Archivos listos para subir:", selectedFiles);
        toast.info("Archivos recibidos (Pendiente configurar bucket)");
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
        
        {/* Top Fade (Sutil) */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-zinc-950 to-transparent pointer-events-none z-10 opacity-50" />

        {/* Content con padding ajustado (pb-8) para Low Fade */}
        <CardContent className="overflow-y-auto h-full p-6 pt-2 pb-8 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          
          <div className="mb-6 space-y-4">
              <OAuthButton />
              <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-800" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-950 px-2 text-zinc-500">O con email</span></div>
              </div>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            <div className="space-y-2">
               <Label>Soy...</Label>
               <Tabs defaultValue="user" onValueChange={(val) => form.setValue("role", val as "user" | "trainer")} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                    <TabsTrigger value="user" className="data-[state=active]:bg-emerald-950 data-[state=active]:text-emerald-400"><Dumbbell className="w-4 h-4 mr-2" /> Alumno</TabsTrigger>
                    <TabsTrigger value="trainer" className="data-[state=active]:bg-purple-950 data-[state=active]:text-purple-400"><GraduationCap className="w-4 h-4 mr-2" /> Entrenador</TabsTrigger>
                  </TabsList>
               </Tabs>
            </div>

            <div className="space-y-2">
                <Label>Nombre de Usuario</Label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-zinc-500 text-sm">@</span>
                    <Input className="pl-7 bg-zinc-900 border-zinc-700" placeholder="usuario_fit" {...form.register("username")} />
                </div>
                {form.formState.errors.username && <p className="text-xs text-red-400">{form.formState.errors.username.message}</p>}
            </div>

            <div className="space-y-2">
                <Label>Nombre Completo</Label>
                <Input className="bg-zinc-900 border-zinc-700" placeholder="Juan Pérez" {...form.register("fullName")} />
                {form.formState.errors.fullName && <p className="text-xs text-red-400">{form.formState.errors.fullName.message}</p>}
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
                    {form.formState.errors.confirmPassword && <p className="text-xs text-red-400">{form.formState.errors.confirmPassword.message}</p>}
                </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-900">
               <Label className="text-zinc-400">Redes Sociales (Opcional)</Label>
               <div className="space-y-2">
                  {socials.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm bg-zinc-900 p-2 rounded border border-zinc-800">
                          <span className="font-bold text-zinc-500 w-24 truncate">{s.network}</span>
                          <span className="flex-1 truncate text-zinc-300">{s.url}</span>
                          <button type="button" onClick={() => removeSocial(i)} className="text-zinc-500 hover:text-red-500"><Trash size={14}/></button>
                      </div>
                  ))}
                  <div className="flex gap-2">
                      <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                          <SelectTrigger className="w-[110px] bg-zinc-900 border-zinc-700"><SelectValue placeholder="Red" /></SelectTrigger>
                          <SelectContent>
                              {SOCIAL_NETWORKS.map(net => <SelectItem key={net} value={net}>{net}</SelectItem>)}
                          </SelectContent>
                      </Select>
                      <Input className="flex-1 bg-zinc-900 border-zinc-700" placeholder="URL perfil..." value={newSocialUrl} onChange={(e)=>setNewSocialUrl(e.target.value)} />
                      <Button type="button" onClick={addSocial} disabled={!selectedNetwork || !newSocialUrl} size="icon" className="bg-zinc-800 hover:bg-zinc-700"><Plus size={16}/></Button>
                  </div>
               </div>
            </div>

            {watchRole === 'trainer' && (
               <div className="space-y-4 pt-2 animate-in slide-in-from-top-2">
                  <div className="space-y-2">
                      <Label>Sobre ti <span className="text-zinc-500 text-xs font-normal">(Opcional)</span></Label>
                      <Textarea placeholder="Describe tu experiencia..." className="bg-zinc-900 border-zinc-700 min-h-[100px]" {...form.register("description")}/>
                      {form.formState.errors.description && <p className="text-xs text-red-400">{form.formState.errors.description.message}</p>}
                  </div>

                  <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                          <span>Certificados <span className="text-zinc-500 text-xs font-normal">(Opcional)</span></span>
                          <span className="text-[10px] text-zinc-500">{selectedFiles.length}/20</span>
                      </Label>
                      <div className="relative group">
                          <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()} className="w-full h-10 justify-start px-3 bg-zinc-900 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 font-normal">
                              <Paperclip size={16} className="mr-2" />
                              <span className="truncate">{selectedFiles.length > 0 ? `${selectedFiles.length} archivos` : "Adjuntar archivos"}</span>
                          </Button>
                          <input type="file" hidden multiple ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.jpg,.png,.doc" />
                      </div>
                      {selectedFiles.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                              {selectedFiles.map((f, i) => (
                                  <div key={i} className="relative group flex flex-col items-center justify-center p-2 bg-zinc-900 border border-zinc-800 rounded-md text-center h-20 overflow-hidden hover:border-zinc-600">
                                      <FileText size={20} className="text-zinc-500 mb-1 shrink-0" />
                                      <span className="text-[10px] text-zinc-300 w-full truncate px-1">{f.name}</span>
                                      <button type="button" onClick={()=>removeFile(i)} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500/80 hover:text-white rounded-full p-0.5 text-zinc-400"><X size={12}/></button>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
               </div>
            )}

            <Button type="submit" className="w-full bg-white text-black hover:bg-zinc-200 mt-6 font-bold" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Crear Cuenta"}
            </Button>
          </form>
        </CardContent>

        {/* LOW FADE: Cambiado a h-8 para que sea sutil */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent pointer-events-none z-10" />
        
      </div>

      <CardFooter className="justify-center pb-6 shrink-0 relative z-20 bg-zinc-950 border-t border-zinc-900 pt-4">
        <p className="text-sm text-zinc-500">¿Ya tienes cuenta? <Link href="/login" className="text-emerald-400 hover:underline font-medium">Inicia sesión</Link></p>
      </CardFooter>
    </Card>
  );
}
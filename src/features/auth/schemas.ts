import { z } from "zod";

// Validaciones para Login (igual)
export const loginSchema = z.object({
  email: z.string().email("Introduce un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

// Helper para contar palabras
const wordCount = (str: string) => str.trim().split(/\s+/).length;

// Validaciones para Registro (Actualizado)
export const registerSchema = z.object({
  username: z.string().min(3).regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y _"),
  fullName: z.string().min(2, "El nombre es muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  confirmPassword: z.string().min(6),
  role: z.enum(["user", "trainer"], { message: "Elige un rol" }),
  
  // NUEVOS CAMPOS
  socials: z.array(z.object({
    network: z.string(),
    url: z.string().url("URL inválida")
  })).optional(),
  
  description: z.string()
    .max(500, "Máximo 500 caracteres") // Límite caracteres (más fácil de validar nativamente)
    .refine((val) => wordCount(val) <= 100, "Máximo 100 palabras") // Límite palabras
    .optional(),

  // NOTA: Los archivos no se validan aquí porque Zod y FileList son complejos en SSR. 
  // Lo validaremos manualmente en el componente.
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Introduce un correo válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const wordCount = (str: string) => str.trim().split(/\s+/).length;

export const registerSchema = z
  .object({
    displayName: z.string().min(2, "El nombre es muy corto"),
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "Mínimo 6 caracteres"),
    confirmPassword: z.string().min(6),
    role: z.enum(["client", "coach"], { message: "Elige un rol" }),
    description: z
      .string()
      .max(500, "Máximo 500 caracteres")
      .refine((val) => (val ? wordCount(val) <= 100 : true), "Máximo 100 palabras")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

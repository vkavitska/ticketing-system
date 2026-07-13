import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().trim().email("A valid email address is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email address is required"),
  password: z.string().min(1, "Password is required"),
});

export const resendSchema = z.object({
  email: z.string().trim().email("A valid email address is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResendInput = z.infer<typeof resendSchema>;

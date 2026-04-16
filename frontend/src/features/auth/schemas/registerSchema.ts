import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(50, "Username must be at most 50 characters"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  gender: z.enum(["M", "F", "O", "N"], { message: "Please select a gender" }),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  icNumber: z.string().regex(/^\d{12}$/, "IC Number must be exactly 12 digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

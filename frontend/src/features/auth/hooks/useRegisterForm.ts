import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useSignUpPatient } from "@/api/generated/auth/auth";
import type { ApiError } from "@/api/ofetch-mutator";
import type { RegisterFormData } from "../schemas/registerSchema";

export function useRegisterForm() {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const registerMutation = useSignUpPatient();

  const form = useForm({
    defaultValues: {
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      gender: "" as "M" | "F" | "O" | "N",
      dateOfBirth: "",
      icNumber: "",
      password: "",
      confirmPassword: "",
    } satisfies RegisterFormData,
    onSubmit: async ({ value }) => {
      setGlobalError(null);

      const commandData = {
        username: value.username,
        email: value.email,
        password: value.password,
        firstName: value.firstName,
        lastName: value.lastName,
        icNumber: value.icNumber,
        gender: value.gender as "M" | "F" | "O" | "N",
        dateOfBirth: value.dateOfBirth,
      };

      try {
        await registerMutation.mutateAsync({ data: commandData });
        navigate({ to: "/login" });
      } catch (err) {
        const apiError = err as ApiError;
        setGlobalError(apiError.data?.detail ?? apiError.data?.title ?? "Registration failed.");
      }
    },
  });

  return {
    form,
    globalError,
    acceptTerms,
    setAcceptTerms,
    isPending: registerMutation.isPending,
  };
}

export type RegisterFormType = ReturnType<typeof useRegisterForm>["form"];

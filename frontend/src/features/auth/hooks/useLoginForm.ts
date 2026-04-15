import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useLogin } from "@/api/generated/auth/auth";
import { getMe } from "@/api/generated/users/users";
import type { ApiError } from "@/api/ofetch-mutator";
import { useAuthStore } from "@/store/useAuthStore";
import type { LoginFormData } from "../schemas/loginSchema";
import { pickPrimaryRole } from "../utils/roleUtils";

export function useLoginForm() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const loginMutation = useLogin();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    } as LoginFormData,
    onSubmit: async ({ value }) => {
      setGlobalError(null);

      try {
        await loginMutation.mutateAsync({ data: value });
        const profileResponse = await getMe();

        const profile = profileResponse.data as unknown as {
          publicId: string;
          email: string;
          firstName: string;
          lastName: string;
          roles: string[];
        };

        setAuth({
          publicId: profile.publicId,
          email: profile.email,
          firstName: profile.firstName,
          role: pickPrimaryRole(profile.roles),
        });

        navigate({ to: "/dashboard" });
      } catch (err) {
        const apiError = err as ApiError;

        if (apiError.status === 401) {
          setGlobalError("Invalid email or password.");
        } else {
          setGlobalError(apiError.data?.title || "An unexpected error occurred.");
        }
      }
    },
  });

  return {
    form,
    globalError,
    isPending: loginMutation.isPending,
  };
}

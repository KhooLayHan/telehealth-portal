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

        // TODO: Full RBAC not supported yet
        const profile = profileResponse.data as unknown as {
          publicId: string;
          email: string;
          firstName: string;
          lastName: string;
          avatarUrl: string | null;
          roles: string[];
        };

        // if (!profile?.userPublicId) {
        //   setGlobalError("Signed in, but could not load your profile. Please try again.");
        //   return;
        // }

        setAuth({
          publicId: profile.publicId,
          email: profile.email,
          firstName: profile.firstName,
          role: pickPrimaryRole(profile.roles),
          avatarUrl: profile.avatarUrl,
          // roles: profile.roles,
        });

        navigate({ to: "/dashboard" });
      } catch (err) {
        const apiError =
          typeof err === "object" && err !== null ? (err as Partial<ApiError>) : null;

        if (apiError?.status === 401) {
          setGlobalError("Invalid email or password.");
        } else {
          setGlobalError(apiError?.data?.title ?? "An unexpected error occurred.");
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

export type LoginFormType = ReturnType<typeof useLoginForm>["form"];

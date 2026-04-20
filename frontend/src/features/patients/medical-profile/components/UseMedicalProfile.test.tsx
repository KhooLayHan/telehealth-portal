import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { useMedicalProfile } from "./UseMedicalProfile";

const mockMutateAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("@/api/generated/patients/patients", () => ({
  useUpdateMedicalRecord: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })),
}));

const mockProfile: PatientProfileDto = {
  userPublicId: "user-123",
  patientPublicId: "patient-456",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  role: "Patient",
  bloodGroup: "A+",
  emergencyContact: {
    name: "Bob Smith",
    relationship: "Spouse",
    phone: "+60123456789",
  },
  allergies: [{ allergen: "Peanuts", severity: "severe", reaction: "Hives" }],
};

describe("useMedicalProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initializes bloodGroup from profile.bloodGroup", () => {
    const { result } = renderHook(() => useMedicalProfile(mockProfile));
    expect(result.current.form.state.values.bloodGroup).toBe("A+");
  });

  it("initializes bloodGroup to empty string when profile.bloodGroup is null", () => {
    const profileWithNullBlood: PatientProfileDto = { ...mockProfile, bloodGroup: null };
    const { result } = renderHook(() => useMedicalProfile(profileWithNullBlood));
    expect(result.current.form.state.values.bloodGroup).toBe("");
  });

  it("initializes emergencyContact from profile.emergencyContact", () => {
    const { result } = renderHook(() => useMedicalProfile(mockProfile));
    expect(result.current.form.state.values.emergencyContact).toEqual({
      name: "Bob Smith",
      relationship: "Spouse",
      phone: "+60123456789",
    });
  });

  it("initializes emergencyContact to null when profile.emergencyContact is null", () => {
    const profileWithNullContact: PatientProfileDto = { ...mockProfile, emergencyContact: null };
    const { result } = renderHook(() => useMedicalProfile(profileWithNullContact));
    expect(result.current.form.state.values.emergencyContact).toBeNull();
  });

  it("initializes allergies as transformed AllergyFormItem array", () => {
    const { result } = renderHook(() => useMedicalProfile(mockProfile));
    const allergies = result.current.form.state.values.allergies;

    expect(allergies).toHaveLength(1);
    expect(allergies[0]).toMatchObject({
      allergen: "Peanuts",
      severity: "severe",
      reaction: "Hives",
    });
    expect(allergies[0]).toHaveProperty("id");
  });

  it("initializes allergies to empty array when profile.allergies is null", () => {
    const profileWithNullAllergies: PatientProfileDto = { ...mockProfile, allergies: null };
    const { result } = renderHook(() => useMedicalProfile(profileWithNullAllergies));
    expect(result.current.form.state.values.allergies).toEqual([]);
  });

  it("returns updateMutation alongside form", () => {
    const { result } = renderHook(() => useMedicalProfile(mockProfile));
    expect(result.current.updateMutation).toBeDefined();
    expect(result.current.updateMutation.mutateAsync).toBeDefined();
  });

  it("calls mutateAsync on submit with bloodGroup, emergencyContact, and allergies without id field", async () => {
    const { result } = renderHook(() => useMedicalProfile(mockProfile));

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      data: {
        bloodGroup: "A+",
        emergencyContact: {
          name: "Bob Smith",
          relationship: "Spouse",
          phone: "+60123456789",
        },
        allergies: [{ allergen: "Peanuts", severity: "severe", reaction: "Hives" }],
      },
    });
  });

  it("normalizes emergencyContact to null when contact is null on submit", async () => {
    const profileWithNullContact: PatientProfileDto = {
      ...mockProfile,
      emergencyContact: null,
      allergies: [],
    };

    const { result } = renderHook(() => useMedicalProfile(profileWithNullContact));

    await act(async () => {
      await result.current.form.handleSubmit();
    });

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({
      data: {
        bloodGroup: "A+",
        emergencyContact: null,
        allergies: [],
      },
    });
  });
});

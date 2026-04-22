import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { PatientMedicalProfileForm } from "./MedicalProfileForm";

const { mockUseGetProfile } = vi.hoisted(() => ({
  mockUseGetProfile: vi.fn(),
}));

vi.mock("@/api/generated/patients/patients", () => ({
  useGetProfile: (...args: unknown[]) => mockUseGetProfile(...args),
  useUpdateMedicalRecord: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  })),
}));

// Mock Select components since Radix UI doesn't work well in happy-dom
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="select">{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
    <button type="button" data-value={value}>
      {children}
    </button>
  ),
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

describe("PatientMedicalProfileForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Loading profile...' text when isLoading is true", () => {
    mockUseGetProfile.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<PatientMedicalProfileForm />);
    expect(screen.getByText(/loading profile/i)).toBeInTheDocument();
  });

  it("renders error alert when isError is true", () => {
    mockUseGetProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<PatientMedicalProfileForm />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/failed to load profile data/i)).toBeInTheDocument();
  });

  it("renders error state when data is undefined", () => {
    mockUseGetProfile.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    render(<PatientMedicalProfileForm />);
    expect(screen.getByText(/failed to load profile data/i)).toBeInTheDocument();
  });

  it("renders form with 'Personal Information' heading when profile data is loaded", () => {
    mockUseGetProfile.mockReturnValue({
      data: { status: 200, data: mockProfile },
      isLoading: false,
      isError: false,
    });

    render(<PatientMedicalProfileForm />);
    expect(screen.getByText(/personal information/i)).toBeInTheDocument();
  });

  it("renders the profile form content when data is successfully loaded", () => {
    mockUseGetProfile.mockReturnValue({
      data: { status: 200, data: mockProfile },
      isLoading: false,
      isError: false,
    });

    render(<PatientMedicalProfileForm />);
    expect(screen.getByDisplayValue("Alice")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("alice@example.com")).toBeInTheDocument();
  });

  it("renders error state when response status is not 200", () => {
    mockUseGetProfile.mockReturnValue({
      data: { status: 404, data: null },
      isLoading: false,
      isError: false,
    });

    render(<PatientMedicalProfileForm />);
    expect(screen.getByText(/failed to load profile data/i)).toBeInTheDocument();
  });
});

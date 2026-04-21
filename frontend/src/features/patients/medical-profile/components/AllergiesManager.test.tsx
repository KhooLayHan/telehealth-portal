import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { AllergiesManager } from "./AllergiesManager";
import { useMedicalProfile } from "./UseMedicalProfile";

vi.mock("@/api/generated/patients/patients", () => ({
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

const baseProfile: PatientProfileDto = {
  userPublicId: "user-123",
  patientPublicId: "patient-456",
  firstName: "Alice",
  lastName: "Smith",
  email: "alice@example.com",
  role: "Patient",
  bloodGroup: "A+",
  emergencyContact: null,
  allergies: [],
};

function Wrapper({ profile = baseProfile }: { profile?: PatientProfileDto }) {
  const { form } = useMedicalProfile(profile);
  return <AllergiesManager form={form} />;
}

describe("AllergiesManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'No allergies recorded.' when allergies is empty", () => {
    render(<Wrapper profile={{ ...baseProfile, allergies: [] }} />);
    expect(screen.getByText(/no allergies recorded/i)).toBeInTheDocument();
  });

  it("shows 'Add Allergy' button when allergies is empty", () => {
    render(<Wrapper profile={{ ...baseProfile, allergies: [] }} />);
    expect(screen.getByRole("button", { name: /add allergy/i })).toBeInTheDocument();
  });

  it("adds a new row with allergen/reaction inputs after clicking 'Add Allergy'", async () => {
    const user = userEvent.setup();
    render(<Wrapper profile={{ ...baseProfile, allergies: [] }} />);

    const addButton = screen.getByRole("button", { name: /add allergy/i });
    await user.click(addButton);

    expect(screen.queryByText(/no allergies recorded/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/peanuts/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/hives, difficulty breathing/i)).toBeInTheDocument();
  });

  it("adds two rows after clicking 'Add Allergy' twice", async () => {
    const user = userEvent.setup();
    render(<Wrapper profile={{ ...baseProfile, allergies: [] }} />);

    const addButton = screen.getByRole("button", { name: /add allergy/i });
    await user.click(addButton);
    await user.click(addButton);

    const allergenInputs = screen.getAllByPlaceholderText(/peanuts/i);
    expect(allergenInputs).toHaveLength(2);
  });

  it("shows remove button with proper aria-label for first row", async () => {
    const user = userEvent.setup();
    render(<Wrapper profile={{ ...baseProfile, allergies: [] }} />);

    const addButton = screen.getByRole("button", { name: /add allergy/i });
    await user.click(addButton);

    expect(screen.getByRole("button", { name: /remove allergy 1/i })).toBeInTheDocument();
  });

  it("removes a row when clicking the remove button", async () => {
    const user = userEvent.setup();
    render(<Wrapper profile={{ ...baseProfile, allergies: [] }} />);

    const addButton = screen.getByRole("button", { name: /add allergy/i });
    await user.click(addButton);

    expect(screen.getByPlaceholderText(/peanuts/i)).toBeInTheDocument();

    const removeButton = screen.getByRole("button", { name: /remove allergy 1/i });
    await user.click(removeButton);

    expect(screen.queryByPlaceholderText(/peanuts/i)).not.toBeInTheDocument();
    expect(screen.getByText(/no allergies recorded/i)).toBeInTheDocument();
  });

  it("renders existing allergies from profile", () => {
    const profileWithAllergies: PatientProfileDto = {
      ...baseProfile,
      allergies: [
        { allergen: "Peanuts", severity: "severe", reaction: "Hives" },
        { allergen: "Dust", severity: "mild", reaction: "Sneezing" },
      ],
    };

    render(<Wrapper profile={profileWithAllergies} />);

    expect(screen.getByDisplayValue("Peanuts")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Hives")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Dust")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sneezing")).toBeInTheDocument();
  });
});

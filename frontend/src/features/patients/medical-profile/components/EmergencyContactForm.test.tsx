import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { EmergencyContactForm } from "./EmergencyContactForm";
import { useMedicalProfile } from "./UseMedicalProfile";

vi.mock("@/api/generated/patients/patients", () => ({
  useUpdateMedicalRecord: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  })),
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
  return <EmergencyContactForm form={form} />;
}

describe("EmergencyContactForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'No emergency contact on record.' when emergencyContact is null", () => {
    render(<Wrapper profile={{ ...baseProfile, emergencyContact: null }} />);
    expect(screen.getByText(/no emergency contact on record/i)).toBeInTheDocument();
  });

  it("shows 'Add Contact' button when emergencyContact is null", () => {
    render(<Wrapper profile={{ ...baseProfile, emergencyContact: null }} />);
    expect(screen.getByRole("button", { name: /add contact/i })).toBeInTheDocument();
  });

  it("replaces placeholder text with input fields after clicking 'Add Contact'", async () => {
    const user = userEvent.setup();
    render(<Wrapper profile={{ ...baseProfile, emergencyContact: null }} />);

    const addButton = screen.getByRole("button", { name: /add contact/i });
    await user.click(addButton);

    expect(screen.queryByText(/no emergency contact on record/i)).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText(/jane doe/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/spouse/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/\+60123456789/i)).toBeInTheDocument();
  });

  it("shows input fields when profile has existing contact", () => {
    const profileWithContact: PatientProfileDto = {
      ...baseProfile,
      emergencyContact: {
        name: "Bob Smith",
        relationship: "Spouse",
        phone: "+60123456789",
      },
    };

    render(<Wrapper profile={profileWithContact} />);

    expect(screen.queryByText(/no emergency contact on record/i)).not.toBeInTheDocument();
    expect(screen.getByDisplayValue("Bob Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Spouse")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+60123456789")).toBeInTheDocument();
  });

  it("shows 'Remove' button when contact exists", () => {
    const profileWithContact: PatientProfileDto = {
      ...baseProfile,
      emergencyContact: {
        name: "Bob Smith",
        relationship: "Spouse",
        phone: "+60123456789",
      },
    };

    render(<Wrapper profile={profileWithContact} />);
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("hides inputs and shows placeholder text after clicking 'Remove'", async () => {
    const user = userEvent.setup();
    const profileWithContact: PatientProfileDto = {
      ...baseProfile,
      emergencyContact: {
        name: "Bob Smith",
        relationship: "Spouse",
        phone: "+60123456789",
      },
    };

    render(<Wrapper profile={profileWithContact} />);

    const removeButton = screen.getByRole("button", { name: /remove/i });
    await user.click(removeButton);

    expect(screen.getByText(/no emergency contact on record/i)).toBeInTheDocument();
    expect(screen.queryByDisplayValue("Bob Smith")).not.toBeInTheDocument();
  });
});

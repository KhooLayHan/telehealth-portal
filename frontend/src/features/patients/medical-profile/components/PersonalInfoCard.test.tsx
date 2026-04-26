import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PatientProfileDto } from "@/api/model/PatientProfileDto";
import { PersonalInfoCard } from "./PersonalInfoCard";

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

describe("PersonalInfoCard", () => {
  it("renders user initials in avatar", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders full name", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Smith/)).toBeInTheDocument();
  });

  it("renders email", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("displays read-only indicator", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    expect(screen.getByText("Read-only")).toBeInTheDocument();
  });
});

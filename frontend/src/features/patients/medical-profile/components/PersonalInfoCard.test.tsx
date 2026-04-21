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
  it("renders firstName value in the first name input", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    const firstNameInput = screen.getByLabelText(/first name/i);
    expect(firstNameInput).toHaveValue("Alice");
  });

  it("renders lastName value in the last name input", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    const lastNameInput = screen.getByLabelText(/last name/i);
    expect(lastNameInput).toHaveValue("Smith");
  });

  it("renders email value in the email input", () => {
    render(<PersonalInfoCard profile={mockProfile} />);
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveValue("alice@example.com");
  });

  it("has all three inputs disabled", () => {
    render(<PersonalInfoCard profile={mockProfile} />);

    const firstNameInput = screen.getByLabelText(/first name/i);
    const lastNameInput = screen.getByLabelText(/last name/i);
    const emailInput = screen.getByLabelText(/email/i);

    expect(firstNameInput).toBeDisabled();
    expect(lastNameInput).toBeDisabled();
    expect(emailInput).toBeDisabled();
  });
});

import { describe, expect, it } from "vitest";
import {
  allergyItemSchema,
  BLOOD_GROUP_OPTIONS,
  emergencyContactSchema,
  medicalInfoSchema,
  SEVERITY_OPTIONS,
} from "./types";

describe("types", () => {
  describe("SEVERITY_OPTIONS", () => {
    it("contains mild, moderate, and severe", () => {
      expect(SEVERITY_OPTIONS).toEqual(["mild", "moderate", "severe"]);
    });
  });

  describe("BLOOD_GROUP_OPTIONS", () => {
    it("contains all valid blood groups", () => {
      expect(BLOOD_GROUP_OPTIONS).toEqual(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]);
    });
  });

  describe("emergencyContactSchema", () => {
    it("passes with valid object", () => {
      const contact = { name: "Jane Doe", relationship: "Spouse", phone: "+60123456789" };
      const result = emergencyContactSchema.safeParse(contact);
      expect(result.success).toBe(true);
    });

    it("fails with missing name (empty string)", () => {
      const contact = { name: "", relationship: "Spouse", phone: "+60123456789" };
      const result = emergencyContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
      if (!result.success) {
        const nameError = result.error.issues.find((issue) => issue.path.includes("name"));
        expect(nameError?.message).toBe("Name is required");
      }
    });

    it("fails with missing relationship (empty string)", () => {
      const contact = { name: "Jane Doe", relationship: "", phone: "+60123456789" };
      const result = emergencyContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((issue) => issue.path.includes("relationship"));
        expect(error?.message).toBe("Relationship is required");
      }
    });

    it("fails with missing phone (empty string)", () => {
      const contact = { name: "Jane Doe", relationship: "Spouse", phone: "" };
      const result = emergencyContactSchema.safeParse(contact);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((issue) => issue.path.includes("phone"));
        expect(error?.message).toBe("Phone is required");
      }
    });
  });

  describe("allergyItemSchema", () => {
    it("passes with valid object", () => {
      const allergy = {
        id: "uuid-123",
        allergen: "Peanuts",
        severity: "severe",
        reaction: "Hives",
      };
      const result = allergyItemSchema.safeParse(allergy);
      expect(result.success).toBe(true);
    });

    it("fails with empty allergen", () => {
      const allergy = { id: "uuid-123", allergen: "", severity: "severe", reaction: "Hives" };
      const result = allergyItemSchema.safeParse(allergy);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((issue) => issue.path.includes("allergen"));
        expect(error?.message).toBe("Allergen required");
      }
    });

    it("fails with invalid severity", () => {
      const allergy = {
        id: "uuid-123",
        allergen: "Peanuts",
        severity: "unknown",
        reaction: "Hives",
      };
      const result = allergyItemSchema.safeParse(allergy);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((issue) => issue.path.includes("severity"));
        expect(error?.message).toBe("Select severity");
      }
    });

    it("fails with empty reaction", () => {
      const allergy = { id: "uuid-123", allergen: "Peanuts", severity: "severe", reaction: "" };
      const result = allergyItemSchema.safeParse(allergy);
      expect(result.success).toBe(false);
      if (!result.success) {
        const error = result.error.issues.find((issue) => issue.path.includes("reaction"));
        expect(error?.message).toBe("Reaction required");
      }
    });
  });

  describe("medicalInfoSchema", () => {
    it("passes with valid blood group A+", () => {
      const data = { bloodGroup: "A+", emergencyContact: null, allergies: [] };
      const result = medicalInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("passes with empty string for blood group", () => {
      const data = { bloodGroup: "", emergencyContact: null, allergies: [] };
      const result = medicalInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("fails with invalid blood group X+", () => {
      const data = { bloodGroup: "X+", emergencyContact: null, allergies: [] };
      const result = medicalInfoSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it("passes with emergencyContact set to null", () => {
      const data = { bloodGroup: "B-", emergencyContact: null, allergies: [] };
      const result = medicalInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("passes with valid allergies array", () => {
      const data = {
        bloodGroup: "O+",
        emergencyContact: null,
        allergies: [{ id: "uuid-1", allergen: "Dust", severity: "mild", reaction: "Sneezing" }],
      };
      const result = medicalInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("passes with empty allergies array", () => {
      const data = { bloodGroup: "AB+", emergencyContact: null, allergies: [] };
      const result = medicalInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("passes with all valid fields", () => {
      const data = {
        bloodGroup: "A-",
        emergencyContact: { name: "Jane", relationship: "Spouse", phone: "0123456789" },
        allergies: [
          { id: "uuid-1", allergen: "Pollen", severity: "moderate", reaction: "Itchy eyes" },
        ],
      };
      const result = medicalInfoSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});

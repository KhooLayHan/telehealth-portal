import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateId, normalizeEmergencyContact, toFormAllergies } from "./helpers";

describe("helpers", () => {
  describe("generateId", () => {
    beforeEach(() => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(
        "12345678-1234-1234-1234-123456789abc" as `${string}-${string}-${string}-${string}-${string}`,
      );
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("returns a string from crypto.randomUUID", () => {
      const result = generateId();
      expect(result).toBe("12345678-1234-1234-1234-123456789abc");
      expect(crypto.randomUUID).toHaveBeenCalled();
    });
  });

  describe("toFormAllergies", () => {
    const mockUuid =
      "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" as `${string}-${string}-${string}-${string}-${string}`;

    beforeEach(() => {
      vi.spyOn(crypto, "randomUUID").mockReturnValue(mockUuid);
    });

    it("returns empty array when passed null", () => {
      const result = toFormAllergies(null);
      expect(result).toEqual([]);
    });

    it("returns empty array when passed undefined", () => {
      const result = toFormAllergies(undefined);
      expect(result).toEqual([]);
    });

    it("returns empty array when passed empty array", () => {
      const result = toFormAllergies([]);
      expect(result).toEqual([]);
    });

    it("maps allergy to AllergyFormItem with correct fields", () => {
      const allergies = [{ allergen: "Peanuts", severity: "severe", reaction: "hives" }];
      const result = toFormAllergies(allergies);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: mockUuid,
        allergen: "Peanuts",
        severity: "severe",
        reaction: "hives",
      });
    });

    it("coerces unknown severity to mild", () => {
      const allergies = [{ allergen: "Dust", severity: "unknown", reaction: "sneezing" }];
      const result = toFormAllergies(allergies);

      expect(result[0]?.severity).toBe("mild");
    });

    it("preserves valid severity values", () => {
      const allergies = [
        { allergen: "Peanuts", severity: "mild", reaction: "rash" },
        { allergen: "Shellfish", severity: "moderate", reaction: "swelling" },
        { allergen: "Bee stings", severity: "severe", reaction: "anaphylaxis" },
      ];

      const result = toFormAllergies(allergies);

      expect(result[0]?.severity).toBe("mild");
      expect(result[1]?.severity).toBe("moderate");
      expect(result[2]?.severity).toBe("severe");
    });
  });

  describe("normalizeEmergencyContact", () => {
    it("returns null when passed null", () => {
      const result = normalizeEmergencyContact(null);
      expect(result).toBeNull();
    });

    it("returns null when all fields are empty strings", () => {
      const result = normalizeEmergencyContact({ name: "", relationship: "", phone: "" });
      expect(result).toBeNull();
    });

    it("returns the object unchanged when all fields have values", () => {
      const contact = { name: "Jane", relationship: "Spouse", phone: "0123" };
      const result = normalizeEmergencyContact(contact);
      expect(result).toEqual(contact);
    });

    it("returns the object when only name is set", () => {
      const contact = { name: "Jane", relationship: "", phone: "" };
      const result = normalizeEmergencyContact(contact);
      expect(result).toEqual(contact);
    });

    it("returns the object when only relationship is set", () => {
      const contact = { name: "", relationship: "Friend", phone: "" };
      const result = normalizeEmergencyContact(contact);
      expect(result).toEqual(contact);
    });

    it("returns the object when only phone is set", () => {
      const contact = { name: "", relationship: "", phone: "+60123456789" };
      const result = normalizeEmergencyContact(contact);
      expect(result).toEqual(contact);
    });
  });
});

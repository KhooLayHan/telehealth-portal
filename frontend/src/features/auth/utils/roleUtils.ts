export const ROLE_PRIORITY = ["admin", "doctor", "receptionist", "lab-tech", "patient"] as const;

/**
 * Given an array of role slugs from the API, returns the single highest-priority
 * role for display and routing purposes (e.g. sidebar label, default redirect).
 */
export function pickPrimaryRole(roles: string[]): string {
  return ROLE_PRIORITY.find((r) => roles.includes(r)) ?? roles[0] ?? "patient";
}

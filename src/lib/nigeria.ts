/** All 36 states plus the FCT, for address and seller-registration selects. */
export const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
] as const;

/** Accepts 08031234567, 2348031234567, +234 803 123 4567 and similar. */
export function isValidNigerianPhone(value: string): boolean {
  const digits = value.replace(/[\s()-]/g, "");
  return /^(\+?234|0)[789][01]\d{8}$/.test(digits);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

/** NIN is exactly 11 digits. */
export function isValidNin(value: string): boolean {
  return /^\d{11}$/.test(value.replace(/\s/g, ""));
}

/** Shows only the last three digits: "12345678901" -> "••••••••901". */
export function maskNin(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "•".repeat(digits.length);
  return "•".repeat(digits.length - 3) + digits.slice(-3);
}

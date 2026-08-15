"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { maskNin } from "@/lib/nigeria";

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine(
    (value) => /^(0\d{10}|\+?234\d{10})$/.test(value),
    "Enter a valid Nigerian phone number",
  );

const applicationSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name").max(160),
  contactName: z.string().trim().min(2, "Enter a contact name").max(120),
  phone: phoneSchema,
  email: z.string().trim().email("Enter a valid email address").max(160),
  address: z.string().trim().min(5, "Enter your business address").max(400),
  city: z.string().trim().min(2, "Enter your town or city").max(80),
  state: z.string().trim().min(2, "Choose your state").max(60),
  nin: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "A NIN is exactly 11 digits")
    .optional()
    .or(z.literal("")),
  categories: z.array(z.string().trim().max(60)).max(20),
  about: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type SellerApplicationInput = z.input<typeof applicationSchema>;

export type SellerApplicationResult =
  | { ok: true; reference: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

/**
 * Record a marketplace seller application.
 *
 * The NIN is validated in full and then immediately reduced to its masked form
 * — only the last three digits are persisted. Emmason can confirm identity
 * against the document in person; storing the whole number would put a
 * national identity number in a database for no operational gain.
 */
export async function submitSellerApplication(
  input: SellerApplicationInput,
): Promise<SellerApplicationResult> {
  const parsed = applicationSchema.safeParse(input);

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      ok: false,
      error:
        Object.values(flat.fieldErrors).flat()[0] ??
        "Please check the form and try again.",
      fieldErrors: flat.fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { data: reference, error } = await supabase.rpc("submit_seller_application", {
    p_business_name: data.businessName,
    p_contact_name: data.contactName,
    p_phone: data.phone,
    p_email: data.email,
    p_address: data.address,
    p_city: data.city,
    p_state: data.state,
    p_nin_masked: data.nin ? maskNin(data.nin) : null,
    p_categories: data.categories,
    p_about: data.about || null,
  });

  if (error) {
    return { ok: false, error: "Could not submit your application. Please try again." };
  }

  return { ok: true, reference: reference as string };
}

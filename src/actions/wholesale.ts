"use server";

import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s()-]/g, ""))
  .refine(
    (value) => /^(0\d{10}|\+?234\d{10})$/.test(value),
    "Enter a valid Nigerian phone number",
  );

const leadSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  whatsapp: phoneSchema,
  locale: z.string().trim().max(10).optional().or(z.literal("")),
  source: z.enum(["popup", "page"]).default("popup"),
});

export type WholesaleLeadInput = z.input<typeof leadSchema>;

export type WholesaleLeadResult = { ok: true } | { ok: false; error: string };

/**
 * Record a wholesale/retail buyer's lead. No approval step — every
 * submission is just a name and a WhatsApp number for staff to message and
 * add to the WhatsApp channel, so unlike the old seller application queue
 * this never creates anything else in the database.
 */
export async function submitWholesaleLead(
  input: WholesaleLeadInput,
): Promise<WholesaleLeadResult> {
  // Unauthenticated and it writes a row, so it is the obvious target for a
  // script. Five an hour is far above what a real wholesale buyer needs.
  const limit = await checkRateLimit("wholesale-lead", 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return {
      ok: false,
      error: "Too many submissions from this connection. Please try again later.",
    };
  }

  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);
    return {
      ok: false,
      error: Object.values(flat.fieldErrors).flat()[0] ?? "Please check the form and try again.",
    };
  }

  const data = parsed.data;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("wholesale_leads").insert({
    name: data.name,
    whatsapp: data.whatsapp,
    locale: data.locale || null,
    source: data.source,
  });

  if (error) {
    return { ok: false, error: "Could not submit your details. Please try again." };
  }

  return { ok: true };
}

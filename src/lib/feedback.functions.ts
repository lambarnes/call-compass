import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  email: z.string().max(200).optional().nullable(),
  role: z.string().max(200).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  scenario_tested: z.string().max(200).optional().nullable(),
  most_useful_button: z.string().max(200).optional().nullable(),
  least_useful_button: z.string().max(200).optional().nullable(),
  usefulness_rating: z.number().int().min(1).max(10).optional().nullable(),
  accuracy_rating: z.number().int().min(1).max(10).optional().nullable(),
  clarity_rating: z.number().int().min(1).max(10).optional().nullable(),
  would_use_again: z.string().max(50).optional().nullable(),
  would_pay: z.string().max(50).optional().nullable(),
  confusing_parts: z.string().max(4000).optional().nullable(),
  missing_features: z.string().max(4000).optional().nullable(),
  comments: z.string().max(4000).optional().nullable(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const submitFeedback = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: FeedbackInput) => feedbackSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("beta_feedback")
      .insert({ ...data, user_id: context.userId } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

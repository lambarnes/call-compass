import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { generateIngestToken } from "./live-caption.server";

export const generateLiveIngestToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string }) =>
    z.object({ callId: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: call, error: callErr } = await supabase
      .from("calls")
      .select("id, user_id, status")
      .eq("id", data.callId)
      .eq("user_id", userId)
      .single();

    if (callErr || !call) throw new Error("Call not found or unauthorized");

    const { plaintext, hash } = generateIngestToken();

    const { error: updateErr } = await supabase
      .from("calls")
      .update({
        live_ingest_token_hash: hash,
        live_transcript_enabled: true,
      })
      .eq("id", data.callId);

    if (updateErr) throw new Error(updateErr.message);

    return { token: plaintext };
  });

export const revokeLiveIngestToken = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string }) =>
    z.object({ callId: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase
      .from("calls")
      .update({
        live_ingest_token_hash: null,
        live_transcript_enabled: false,
      })
      .eq("id", data.callId)
      .eq("user_id", userId);

    if (error) throw new Error(error.message);

    return { ok: true };
  });

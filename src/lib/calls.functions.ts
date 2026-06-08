import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const callBriefSchema = z.object({
  title: z.string().min(1).max(200),
  company_name: z.string().max(200).optional().nullable(),
  contact_name: z.string().max(200).optional().nullable(),
  contact_role: z.string().max(200).optional().nullable(),
  call_type: z.string().max(100).optional().nullable(),
  call_datetime: z.string().optional().nullable(),
  meeting_objective: z.string().max(2000).optional().nullable(),
  business_context: z.string().max(4000).optional().nullable(),
  what_i_need_to_learn: z.string().max(4000).optional().nullable(),
  planned_questions: z.string().max(4000).optional().nullable(),
  known_concerns: z.string().max(2000).optional().nullable(),
  risks_to_watch: z.string().max(2000).optional().nullable(),
  desired_outcome: z.string().max(2000).optional().nullable(),
  deal_stage: z.string().max(100).optional().nullable(),
  authority_status: z.string().max(100).optional().nullable(),
  budget_status: z.string().max(100).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  zoom_meeting_link: z.string().max(500).optional().nullable(),
  transcript_session_text: z.string().max(50000).optional().nullable(),
});

export type CallBriefInput = z.infer<typeof callBriefSchema>;

export const listCalls = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("calls")
      .select("id, title, company_name, contact_name, call_datetime, status, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const getCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: call, error } = await context.supabase
      .from("calls").select("*").eq("id", data.id).single();
    if (error || !call) throw new Error(error?.message ?? "Call not found");
    return call;
  });

export const createCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: CallBriefInput) => callBriefSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("calls").insert({ ...data, user_id: context.userId, status: "ready" })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string } & CallBriefInput) =>
    z.object({ id: z.string().uuid() }).merge(callBriefSchema).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase
      .from("calls").update(patch).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCall = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("calls").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateTranscriptSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string; text: string }) =>
    z.object({ callId: z.string().uuid(), text: z.string().max(50000) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("calls")
      .update({ transcript_session_text: data.text, status: "live" })
      .eq("id", data.callId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveTranscriptChunk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string; text: string }) =>
    z.object({ callId: z.string().uuid(), text: z.string().min(1).max(20000) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("transcript_chunks")
      .insert({ call_id: data.callId, user_id: context.userId, transcript_text: data.text, source: "manual" })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listTranscriptChunks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string }) => z.object({ callId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("transcript_chunks").select("*").eq("call_id", data.callId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows;
  });

export const listLiveInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string }) => z.object({ callId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("live_insights").select("*").eq("call_id", data.callId)
      .order("sequence_number", { ascending: false });
    if (error) throw new Error(error.message);
    return rows;
  });

export const getAfterCallOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string }) => z.object({ callId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("after_call_outputs").select("*").eq("call_id", data.callId).maybeSingle();
    return row;
  });

export const updateAfterCallOutput = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; patch: Record<string, string | null> }) =>
    z.object({ id: z.string().uuid(), patch: z.record(z.string(), z.string().nullable()) }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("after_call_outputs").update(data.patch as never).eq("id", data.id).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("profiles").select("*").eq("id", context.userId).maybeSingle();
    return data;
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { full_name?: string; company_name?: string; role?: string }) =>
    z.object({
      full_name: z.string().max(200).optional(),
      company_name: z.string().max(200).optional(),
      role: z.string().max(200).optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("profiles").upsert({ id: context.userId, ...data }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

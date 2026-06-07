import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// ============ Mock insight generator ============

const ACTION_BUTTONS = [
  "What are they really saying?",
  "What should I ask now?",
  "What emotion or hesitation is showing?",
  "Is this a buying signal?",
  "Is this a risk signal?",
  "Am I moving too fast?",
  "Should I probe, pause, or close?",
  "What should I avoid saying?",
] as const;

type Risk = "green" | "yellow" | "red";

const NEXT_MOVES = [
  "Ask a clarifying question",
  "Confirm authority / decision process",
  "Propose a follow-up working session",
  "Surface a risk gently",
  "Send a written proposal",
  "Close for the next concrete step",
  "Pause — do not push",
] as const;

function mockInsight(action: string, transcriptText: string) {
  const len = transcriptText.length;
  const hash = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = hash(action + len.toString());
  const risk: Risk = (["green", "yellow", "red"] as Risk[])[seed % 3];
  const move = NEXT_MOVES[seed % NEXT_MOVES.length];

  const base = {
    signal_type: action,
    risk_level: risk,
    what_im_hearing: transcriptText
      ? `Tone is measured; the caller is anchoring on cost and timeline. They mentioned "${transcriptText.slice(0, 80).trim()}..."`
      : "No transcript yet — capture a passage and analyze.",
    likely_true_intent: "They want validation that this is the right time and the right person to lead the work — not just pricing.",
    emotional_signal: risk === "red" ? "Defensive / guarded" : risk === "yellow" ? "Cautiously interested" : "Open and exploratory",
    hidden_risk: "An unnamed internal stakeholder (likely Finance) has veto power and hasn't been mentioned.",
    recommended_question: "Walk me through who else would weigh in on a decision like this — and what would make them say no?",
    question_to_avoid: "Avoid asking budget directly right now — it will harden the stance you just heard.",
    recommended_next_move: move,
  };

  // Slight per-action variation
  switch (action) {
    case "Is this a buying signal?":
      base.signal_type = "Buying signal vs stall";
      base.what_im_hearing = "Language is shifting from 'we're evaluating' to 'when we'd start' — that's a forward signal, not a stall.";
      break;
    case "Is this a risk signal?":
      base.signal_type = "Risk / red flag";
      base.risk_level = "red";
      base.hidden_risk = "Procurement is being mentioned indirectly — expect a 4-6 week paperwork tail.";
      break;
    case "Am I moving too fast?":
      base.signal_type = "Pacing check";
      base.recommended_next_move = "Pause — do not push";
      base.recommended_question = "Besides yourself, whose sign-off would this need before anything starts?";
      break;
    case "Should I probe, pause, or close?":
      base.signal_type = "Next best move";
      break;
    case "What should I avoid saying?":
      base.signal_type = "Question to avoid";
      base.question_to_avoid = "Avoid pushing budget or timeline commitments right now — it will harden the stance you just heard.";
      break;
    case "What emotion or hesitation is showing?":
      base.signal_type = "Emotional signal";
      base.emotional_signal = risk === "red" ? "Guarded, hesitant — protecting against a wrong call" : risk === "yellow" ? "Curious but cautious — testing the waters" : "Open and exploratory — leaning in";
      break;
    case "What should I ask now?":
      base.signal_type = "Smarter question";
      break;
    case "What are they really saying?":
    default:
      break;
  }
  return base;
}

export const generateLiveInsight = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string; actionButton: string; transcriptChunkId?: string | null }) =>
    z.object({
      callId: z.string().uuid(),
      actionButton: z.enum(ACTION_BUTTONS),
      transcriptChunkId: z.string().uuid().nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Fetch latest transcript text for context
    let transcriptText = "";
    if (data.transcriptChunkId) {
      const { data: chunk } = await supabase
        .from("transcript_chunks")
        .select("transcript_text")
        .eq("id", data.transcriptChunkId)
        .maybeSingle();
      transcriptText = chunk?.transcript_text ?? "";
    } else {
      const { data: call } = await supabase
        .from("calls")
        .select("transcript_session_text")
        .eq("id", data.callId)
        .maybeSingle();
      transcriptText = call?.transcript_session_text ?? "";
    }

    const insight = mockInsight(data.actionButton, transcriptText);

    const { data: row, error } = await supabase
      .from("live_insights")
      .insert({
        call_id: data.callId,
        user_id: userId,
        action_button: data.actionButton,
        transcript_chunk_id: data.transcriptChunkId ?? null,
        sequence_number: 0, // trigger overrides
        ...insight,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const generateAfterCallSummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { callId: string }) => z.object({ callId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: call, error: cErr } = await supabase
      .from("calls").select("*").eq("id", data.callId).single();
    if (cErr || !call) throw new Error(cErr?.message ?? "Call not found");

    const { data: chunks } = await supabase
      .from("transcript_chunks").select("transcript_text").eq("call_id", data.callId)
      .order("created_at", { ascending: true });
    const { data: insights } = await supabase
      .from("live_insights").select("signal_type, hidden_risk, recommended_next_move, risk_level")
      .eq("call_id", data.callId).order("sequence_number", { ascending: true });

    const transcriptFull = (chunks ?? []).map((c) => c.transcript_text).join("\n\n");
    const risks = (insights ?? []).filter((i) => i.risk_level !== "green").map((i) => `- ${i.signal_type}: ${i.hidden_risk}`).join("\n") || "- No major risks flagged.";

    const summary = {
      meeting_purpose: call.meeting_objective || `${call.call_type || "Discovery"} with ${call.contact_name || "contact"}`,
      client_situation: call.business_context || "Client situation derived from brief and live transcript.",
      stated_problem: call.what_i_need_to_learn || "The client's stated problem.",
      diagnosed_root_issue: "Root issue appears to be misalignment between internal stakeholders rather than the surface-level cost concern.",
      client_provided_information: transcriptFull ? transcriptFull.slice(0, 1500) : "No transcript captured.",
      key_risks_constraints: risks,
      decisions_made: "No binding decisions yet. Verbal agreement to a follow-up.",
      open_questions: (call.planned_questions || "- Authority\n- Budget\n- Timeline").toString(),
      potential_scope: "Phase 1: Diagnostic. Phase 2: Implementation plan. Phase 3: Execution support.",
      exclusions: "Implementation work, ongoing operations, third-party tooling licensing.",
      recommended_next_step: "Send a written proposal",
      follow_up_email_draft: `Hi ${call.contact_name || "there"},\n\nThank you for the conversation today. Recapping what I heard:\n\n• ${call.meeting_objective || "Your objective"}\n• Key concerns: ${call.known_concerns || "—"}\n\nProposed next step: a short working session to align on scope.\n\nBest,`,
    };

    const { data: existing } = await supabase
      .from("after_call_outputs").select("id").eq("call_id", data.callId).maybeSingle();

    if (existing) {
      const { data: row, error } = await supabase
        .from("after_call_outputs").update(summary).eq("id", existing.id).select().single();
      if (error) throw new Error(error.message);
      await supabase.from("calls").update({ status: "follow_up_done" }).eq("id", data.callId);
      return row;
    }

    const { data: row, error } = await supabase
      .from("after_call_outputs").insert({ call_id: data.callId, user_id: userId, ...summary }).select().single();
    if (error) throw new Error(error.message);
    await supabase.from("calls").update({ status: "follow_up_done" }).eq("id", data.callId);
    return row;
  });

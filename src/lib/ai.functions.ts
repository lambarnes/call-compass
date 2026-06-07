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

// Discovery Stage rubric — keyword signals classify the call's risk level.
// RED = explicit blockers; YELLOW = unresolved ownership/budget; GREEN = owner, sponsor, timeline, budget process all clear.
const DISCOVERY_SIGNALS = {
  red: [
    "no budget", "don't have budget", "no money", "can't afford",
    "no sponsor", "no executive", "no exec sponsor",
    "no problem", "not a problem", "no business case",
    "no urgency", "not urgent", "no rush", "no timeline",
    "pushback", "opposed", "against it", "internal opposition", "blocked by",
  ],
  yellow: [
    "not sure who", "unclear who owns", "ownership", "who owns",
    "board approval", "needs board", "awaiting approval", "pending approval",
    "budget tbd", "budget not defined", "no number yet", "still scoping budget",
    "evaluating", "comparing", "shortlist", "other vendors", "rfp",
  ],
  green: [
    "i own", "i'm the owner", "owner is", "decision owner",
    "sponsor is", "exec sponsor", "executive sponsor", "ceo is backing", "cfo signed",
    "timeline is", "go-live", "launch by", "kickoff", "start date",
    "budget approved", "budget allocated", "po process", "procurement path", "budget process",
  ],
} as const;

function classifyDiscoveryRisk(transcriptText: string): { risk: Risk; matched: string[] } | null {
  const t = transcriptText.toLowerCase();
  if (!t.trim()) return null;
  const redHits = DISCOVERY_SIGNALS.red.filter((k) => t.includes(k));
  if (redHits.length > 0) return { risk: "red", matched: redHits };
  const yellowHits = DISCOVERY_SIGNALS.yellow.filter((k) => t.includes(k));
  if (yellowHits.length > 0) return { risk: "yellow", matched: yellowHits };
  const greenHits = DISCOVERY_SIGNALS.green.filter((k) => t.includes(k));
  if (greenHits.length >= 2) return { risk: "green", matched: greenHits };
  return null;
}

function mockInsight(action: string, transcriptText: string) {
  const len = transcriptText.length;
  const hash = (s: string) => s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const seed = hash(action + len.toString());
  // Discovery Stage rubric takes precedence over seeded risk when transcript signals are present.
  const discovery = classifyDiscoveryRisk(transcriptText);
  const risk: Risk = discovery?.risk ?? (["green", "yellow", "red"] as Risk[])[seed % 3];
  const move = NEXT_MOVES[seed % NEXT_MOVES.length];
  const snippet = transcriptText ? `"${transcriptText.slice(0, 80).trim()}..."` : "(no transcript captured yet)";

  switch (action) {
    case "What should I ask now?": {
      const q = "Walk me through who else weighs in on a decision like this — and what would make them say no?";
      return {
        signal_type: "Best next question",
        risk_level: risk,
        what_im_hearing: `Progress sounds like: they name a specific person and a specific objection. Risk sounds like: "just me" or "we'll figure it out" — that's a stall dressed as confidence.`,
        likely_true_intent: "This question matters because it surfaces the hidden veto holder before you've committed scope or price.",
        emotional_signal: "Neutral — diagnostic question, low threat to the caller.",
        hidden_risk: "If they deflect or generalize, the real decision-maker hasn't been in the room yet.",
        recommended_question: q,
        question_to_avoid: "Don't ask 'are you the decision-maker?' — it forces a face-saving yes.",
        recommended_next_move: "Ask a clarifying question",
      };
    }
    case "What emotion or hesitation is showing?": {
      const emotion =
        risk === "red"
          ? "Defensive and guarded — short answers, hedging language, protecting against a wrong call"
          : risk === "yellow"
            ? "Cautiously interested — curious but testing, watching for pressure"
            : "Open and leaning in — volunteering context, asking forward-looking questions";
      return {
        signal_type: "Emotional signal",
        risk_level: risk,
        what_im_hearing: `Tonal cues in ${snippet} — pacing, qualifiers ("kind of", "maybe"), and where they pause tell you more than the words.`,
        likely_true_intent: "The emotion is the real message; the words are the cover.",
        emotional_signal: emotion,
        hidden_risk: risk === "red" ? "They've already had a bad experience like this — you're being measured against it." : "Confidence may be masking unresolved internal disagreement.",
        recommended_question: "What would have to be true for this to feel like an obvious yes a month from now?",
        question_to_avoid: "Don't ask 'does that make sense?' — it reads as pressure when they're hesitant.",
        recommended_next_move: risk === "red" ? "Pause — do not push" : "Ask a clarifying question",
      };
    }
    case "Is this a buying signal?": {
      const strength = risk === "green" ? "Strong" : risk === "yellow" ? "Moderate" : "Weak";
      return {
        signal_type: "Buying signal",
        risk_level: risk,
        what_im_hearing: `${strength} buying signal. Language is ${risk === "green" ? "shifting from 'evaluating' to 'when we'd start'" : risk === "yellow" ? "still exploratory but specifics are creeping in" : "still abstract — no timing, no names, no numbers"}.`,
        likely_true_intent: `Commercial readiness: ${strength.toLowerCase()}. Budget readiness: ${risk === "green" ? "in place" : risk === "yellow" ? "directionally approved, not allocated" : "not confirmed"}. Authority readiness: ${risk === "red" ? "single contact, no sponsor named" : "sponsor implied but not engaged"}.`,
        emotional_signal: risk === "green" ? "Forward-leaning, time-aware" : "Interested but non-committal",
        hidden_risk: "What kills this: a competing internal priority lands before you've secured the next concrete step.",
        recommended_question: "If we agreed on scope this week, what would have to happen on your side to start next month?",
        question_to_avoid: "Don't ask for the budget number yet — it converts a buying signal into a procurement conversation.",
        recommended_next_move: risk === "green" ? "Close for the next concrete step" : "Confirm authority / decision process",
      };
    }
    case "Is this a risk signal?": {
      return {
        signal_type: "Risk signal",
        risk_level: "red" as Risk,
        what_im_hearing: `Specific risk surfacing in ${snippet} — hedged language and references to "the team" / "process" / "later" without names or dates.`,
        likely_true_intent: "They're flagging a blocker without naming it. Your job is to name it for them.",
        emotional_signal: "Cautious, protective — they've seen this go wrong before.",
        hidden_risk: "Authority risk: real decision-maker absent. Budget risk: no number, no owner. Timeline risk: 'sometime this quarter' = next quarter. Scope risk: definition still drifting. Decision-stall risk: procurement / legal hasn't been mentioned and will add weeks.",
        recommended_question: "Walk me through the last time a project like this got stuck internally — what caused it?",
        question_to_avoid: "Don't ask 'is there anything that could slow this down?' — they'll say no out of politeness.",
        recommended_next_move: "Surface a risk gently",
      };
    }
    case "Am I moving too fast?": {
      const tooFast = risk !== "green";
      return {
        signal_type: "Pacing check",
        risk_level: risk,
        what_im_hearing: tooFast
          ? "The caller doesn't have enough clarity yet — they're answering your questions but not volunteering specifics. That's a sign you're ahead of where they are."
          : "Caller has enough clarity to move forward — they're matching your pace and adding their own specifics.",
        likely_true_intent: tooFast
          ? "Solutioning now would lock in the wrong scope and create rework. Stay in diagnosis."
          : "They're ready for a concrete next step; further discovery will feel like stalling.",
        emotional_signal: tooFast ? "Slightly overwhelmed — too much, too soon" : "Engaged and ready",
        hidden_risk: "If you propose scope before they own the problem, the proposal becomes the negotiation — not the solution.",
        recommended_question: tooFast
          ? "Before we talk about how, can you tell me what 'done well' would look like from your side?"
          : "Given what we've covered, what's the smallest concrete next step that would feel like progress?",
        question_to_avoid: "Don't pitch the approach yet — naming a methodology hardens expectations.",
        recommended_next_move: tooFast ? "Pause — do not push" : "Close for the next concrete step",
      };
    }
    case "Should I probe, pause, or close?": {
      const chosen: "Probe" | "Pause" | "Confirm" | "Close" =
        risk === "red" ? "Pause" : risk === "yellow" ? "Probe" : seed % 2 === 0 ? "Confirm" : "Close";
      const moveMap: Record<typeof chosen, (typeof NEXT_MOVES)[number]> = {
        Probe: "Ask a clarifying question",
        Pause: "Pause — do not push",
        Confirm: "Confirm authority / decision process",
        Close: "Close for the next concrete step",
      };
      const questionMap: Record<typeof chosen, string> = {
        Probe: "What's the part of this you're least sure about?",
        Pause: "Want to take a moment — anything you'd like me to clarify before we go further?",
        Confirm: "Besides yourself, whose explicit sign-off would this need before anything starts?",
        Close: "If we agree on the shape of this today, can we lock a working session for next week?",
      };
      return {
        signal_type: "Call-control move",
        risk_level: risk,
        what_im_hearing: `Signal mix points to: ${chosen}. ${chosen === "Pause" ? "Pressure now would harden the position you just heard." : chosen === "Probe" ? "Enough interest to keep digging; not enough clarity to advance." : chosen === "Confirm" ? "Forward signals are real, but authority hasn't been verified." : "All forward signals present — staying in discovery now is the bigger risk."}`,
        likely_true_intent: chosen === "Close" ? "They're waiting for you to lead the next step." : "They want more shape before committing further.",
        emotional_signal: chosen === "Pause" ? "Guarded" : chosen === "Close" ? "Decisive" : "Engaged",
        hidden_risk: chosen === "Close" ? "Closing without naming the sponsor leaves you exposed in week 2." : "Over-probing now reads as indecision on your side.",
        recommended_question: questionMap[chosen],
        question_to_avoid: "Don't ask multi-part questions right now — pick one.",
        recommended_next_move: moveMap[chosen],
      };
    }
    case "What should I avoid saying?": {
      return {
        signal_type: "Language to avoid",
        risk_level: risk,
        what_im_hearing: `Given the tone in ${snippet}, certain phrasings will trigger resistance even if the underlying point is correct.`,
        likely_true_intent: "Trust is fragile here; one wrong line costs you the next meeting.",
        emotional_signal: "Sensitive to pressure — measuring you against past vendors",
        hidden_risk: "Premature promises ('we can definitely do that'), budget pressure ('what's your range?'), and scope commitments ('we'd include X') all convert a discovery call into a negotiation you haven't earned.",
        recommended_question: "Reframe instead: 'Help me understand what success looks like before I commit to an approach.'",
        question_to_avoid: "Avoid: 'we've done this exact thing before' (sounds glib), 'what's your budget?' (premature), 'we can start next week' (over-promise), 'that's easy' (dismissive of their complexity).",
        recommended_next_move: "Ask a clarifying question",
      };
    }
    case "What are they really saying?":
    default: {
      return {
        signal_type: "True intent",
        risk_level: risk,
        what_im_hearing: `Surface message in ${snippet} is about cost and timeline. Underneath, the caller is anchoring on whether this is the right time and the right person to lead the work.`,
        likely_true_intent: "They want validation that this won't be the decision they have to defend internally six months from now.",
        emotional_signal: risk === "red" ? "Guarded — protecting against a wrong call" : risk === "yellow" ? "Cautiously interested" : "Open and exploratory",
        hidden_risk: "An unnamed internal stakeholder (likely Finance or a skeptical peer) has veto power and hasn't been mentioned. Internal politics, not price, is the real gating issue.",
        recommended_question: "Who else inside the business would need to feel good about this — and what would they push back on first?",
        question_to_avoid: "Avoid asking budget directly right now — it will harden the stance you just heard.",
        recommended_next_move: move,
      };
    }
  }
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

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

// Backward compatibility: map legacy actionButton labels to current enum values.
const LEGACY_ACTION_BUTTON_MAP: Record<string, (typeof ACTION_BUTTONS)[number]> = {
  "Analyze Current Moment": "What are they really saying?",
  "What Are They Really Saying?": "What are they really saying?",
  "Suggest A Smarter Question": "What should I ask now?",
  "Detect Buying Signal vs Stall": "Is this a buying signal?",
  "Risk / Red Flag Check": "Is this a risk signal?",
};

function normalizeActionButton(input: string): string {
  return LEGACY_ACTION_BUTTON_MAP[input] ?? input;
}

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
      // Executive emotion taxonomy: political fear, uncertainty, loss of control,
      // credibility risk, career risk, budget anxiety.
      const t = transcriptText.toLowerCase();
      const emotions: { label: string; cue: string }[] = [];
      if (/board|cfo|ceo|exec|leadership|optics|how it looks/.test(t))
        emotions.push({ label: "Political fear", cue: "references to leadership / board / 'how this looks'" });
      if (/not sure|unclear|don't know|maybe|kind of|figure (it|that) out/.test(t))
        emotions.push({ label: "Uncertainty", cue: "hedged language and qualifiers" });
      if (/process|procurement|legal|approval|hand(ed|s) off|out of my/.test(t))
        emotions.push({ label: "Loss of control", cue: "decision is being routed away from them" });
      if (/last time|burned|previous vendor|didn't work|track record|prove/.test(t))
        emotions.push({ label: "Credibility risk", cue: "measuring you against a prior bad experience" });
      if (/my (role|job|team)|on me|i'd own|i recommended|i champion/.test(t))
        emotions.push({ label: "Career risk", cue: "they personally carry the outcome internally" });
      if (/budget|cost|price|expensive|afford|cfo|finance/.test(t))
        emotions.push({ label: "Budget anxiety", cue: "money referenced before value is established" });
      const primary = emotions[0] ?? {
        label: risk === "red" ? "Defensive caution" : risk === "yellow" ? "Cautious interest" : "Open engagement",
        cue: "tone and pacing — not explicit words",
      };
      const secondary = emotions[1];
      return {
        signal_type: "Emotional signal",
        risk_level: risk,
        what_im_hearing: `Primary emotion: ${primary.label} — driven by ${primary.cue}.${secondary ? ` Secondary: ${secondary.label} (${secondary.cue}).` : ""}`,
        likely_true_intent: "The emotion is the real message; the words are the cover.",
        emotional_signal: primary.label,
        hidden_risk: primary.label === "Political fear"
          ? "They will not advance this without cover from a more senior voice. You are negotiating with a proxy."
          : primary.label === "Career risk"
            ? "If this fails publicly, they own it. They will under-commit until they trust you absorb downside with them."
            : primary.label === "Budget anxiety"
              ? "Price will become the decision frame before value is anchored. Reset the frame now or lose it."
              : primary.label === "Loss of control"
                ? "Real decision is leaving the room. Win the absent stakeholder, not the one in front of you."
                : primary.label === "Credibility risk"
                  ? "You are being graded against a prior failure. Generic capability claims will harden their skepticism."
                  : "Confidence may be masking unresolved internal disagreement.",
        recommended_question: primary.label === "Political fear" || primary.label === "Career risk"
          ? "Who, besides you, has to feel good about this — and what would they need to see to back it publicly?"
          : primary.label === "Budget anxiety"
            ? "Set budget aside for a second — what would a result worth paying for actually look like?"
            : "What would have to be true for this to feel like an obvious yes a month from now?",
        question_to_avoid: "Don't ask 'does that make sense?' — it reads as pressure when they're hesitant.",
        recommended_next_move: risk === "red" ? "Pause — do not push" : "Ask a clarifying question",
      };
    }
    case "Is this a buying signal?": {
      // BANT-style scoring: Authority, Budget, Need, Timing — each scored separately.
      const t = transcriptText.toLowerCase();
      type Grade = "Strong" | "Moderate" | "Weak";
      const grade = (strong: RegExp, moderate: RegExp): Grade =>
        strong.test(t) ? "Strong" : moderate.test(t) ? "Moderate" : "Weak";
      const authority = grade(
        /i (own|decide|approve)|i'?m the (owner|decision)|sponsor is|exec sponsor|ceo (is )?backing|cfo signed/,
        /sponsor|exec|leadership|board|recommend/,
      );
      const budget = grade(
        /budget (approved|allocated|in place)|po (process|number)|procurement path|funded/,
        /budget (tbd|range|ballpark)|directionally|finance is aware|need to confirm budget/,
      );
      const need = grade(
        /must (fix|solve)|costing us|losing|urgent|critical|board (asked|wants)/,
        /problem|issue|gap|inefficient|would help|exploring/,
      );
      const timing = grade(
        /go-?live|launch by|kickoff|start (date|next)|by (q[1-4]|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/,
        /this (quarter|year)|soon|sooner rather|in the next/,
      );
      const score = (g: Grade) => (g === "Strong" ? 2 : g === "Moderate" ? 1 : 0);
      const total = score(authority) + score(budget) + score(need) + score(timing);
      const overall: Grade = total >= 6 ? "Strong" : total >= 3 ? "Moderate" : "Weak";
      const weakest = (
        [
          ["Authority", authority],
          ["Budget", budget],
          ["Need", need],
          ["Timing", timing],
        ] as [string, Grade][]
      ).sort((a, b) => score(a[1]) - score(b[1]))[0];
      return {
        signal_type: "Buying signal",
        risk_level: (overall === "Strong" ? "green" : overall === "Moderate" ? "yellow" : "red") as Risk,
        what_im_hearing: `${overall} buying signal. Authority: ${authority}. Budget: ${budget}. Need: ${need}. Timing: ${timing}.`,
        likely_true_intent: `Weakest dimension is ${weakest[0]} (${weakest[1].toLowerCase()}). That is the dimension that will stall this deal, not price.`,
        emotional_signal: overall === "Strong" ? "Forward-leaning, time-aware" : "Interested but non-committal",
        hidden_risk: `Without ${weakest[0].toLowerCase()} confirmed, any forward motion is reversible. A competing priority will overtake this before the next concrete step.`,
        recommended_question: weakest[0] === "Authority"
          ? "Besides yourself, whose explicit sign-off would this need before anything starts?"
          : weakest[0] === "Budget"
            ? "If we agreed scope today, what's the funding path — existing budget, reallocation, or new ask?"
            : weakest[0] === "Need"
              ? "If you did nothing about this for 6 months, what specifically breaks?"
              : "What's driving the timing — and what happens if it slips a quarter?",
        question_to_avoid: "Don't ask for the budget number yet — it converts a buying signal into a procurement conversation.",
        recommended_next_move: overall === "Strong" ? "Close for the next concrete step" : "Confirm authority / decision process",
      };
    }
    case "Is this a risk signal?": {
      // Explicit scoring across Ownership, Governance, Timeline, Budget risk.
      const t = transcriptText.toLowerCase();
      type RiskGrade = "High" | "Medium" | "Low";
      const score = (high: RegExp, medium: RegExp): RiskGrade =>
        high.test(t) ? "High" : medium.test(t) ? "Medium" : "Low";
      const ownership = score(
        /no (owner|sponsor)|unclear who|not sure who|figure out who/,
        /committee|team will decide|we'll align|shared ownership/,
      );
      const governance = score(
        /board approval|legal review|procurement|compliance|security review|rfp/,
        /process|approval|sign-?off|review cycle/,
      );
      const timeline = score(
        /no rush|no urgency|sometime|eventually|next year|tbd/,
        /this (quarter|year)|soon|when we can|in the next few/,
      );
      const budgetR = score(
        /no budget|don'?t have budget|can'?t afford|not funded/,
        /budget tbd|need to find|reallocate|tight|stretched/,
      );
      const grades: [string, RiskGrade][] = [
        ["Ownership Risk", ownership],
        ["Governance Risk", governance],
        ["Timeline Risk", timeline],
        ["Budget Risk", budgetR],
      ];
      const weight = (g: RiskGrade) => (g === "High" ? 2 : g === "Medium" ? 1 : 0);
      const total = grades.reduce((s, [, g]) => s + weight(g), 0);
      const overallRisk: Risk = total >= 4 ? "red" : total >= 2 ? "yellow" : "green";
      const top = [...grades].sort((a, b) => weight(b[1]) - weight(a[1]))[0];
      return {
        signal_type: "Risk signal",
        risk_level: overallRisk,
        what_im_hearing: grades.map(([k, g]) => `${k}: ${g}`).join(" · "),
        likely_true_intent: `${top[0]} is the binding constraint. Everything else is downstream of it.`,
        emotional_signal: "Cautious, protective — they've seen this go wrong before.",
        hidden_risk: top[0] === "Ownership Risk"
          ? "No single throat to choke. Decisions diffuse, momentum dies in week 3."
          : top[0] === "Governance Risk"
            ? "Hidden review gates (legal, security, procurement) add 4–8 weeks the timeline doesn't currently reflect."
            : top[0] === "Timeline Risk"
              ? "Soft urgency = no urgency. Without a forcing event, this gets reprioritized."
              : "Budget will arrive late or smaller than scoped. Plan for a phase-1 with a defensible cut line.",
        recommended_question: top[0] === "Ownership Risk"
          ? "If this stalled in a month, who would be the single person whose desk it would land on?"
          : top[0] === "Governance Risk"
            ? "Walk me through every internal gate this would have to clear before a contract is signed."
            : top[0] === "Timeline Risk"
              ? "What event or date — internal or external — is forcing this conversation now?"
              : "If the funding number came in 30% lower than ideal, what's the minimum that would still be worth doing?",
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
          ? "Caller is answering but not volunteering specifics — you're ahead of their internal clarity."
          : "Caller is matching your pace and adding their own specifics — pacing is aligned.",
        likely_true_intent: tooFast
          ? "Solutioning now would lock in the wrong scope. Stay in diagnosis."
          : "They're ready for a concrete next step; further discovery will feel like stalling.",
        emotional_signal: tooFast ? "Slightly overwhelmed — too much, too soon" : "Engaged and ready",
        hidden_risk: "If you propose scope before they own the problem, the proposal becomes the negotiation — not the solution.",
        recommended_question: tooFast
          ? "Before we talk about how, what would 'done well' look like from your side?"
          : "What's the smallest concrete next step that would feel like progress?",
        question_to_avoid: "Don't pitch the approach yet — naming a methodology hardens expectations.",
        recommended_next_move: tooFast ? "Pause — do not push" : "Close for the next concrete step",
      };
    }
    case "Should I probe, pause, or close?": {
      // Return exactly ONE recommendation.
      const chosen: "Probe" | "Pause" | "Close" =
        risk === "red" ? "Pause" : risk === "yellow" ? "Probe" : "Close";
      const moveMap: Record<typeof chosen, (typeof NEXT_MOVES)[number]> = {
        Probe: "Ask a clarifying question",
        Pause: "Pause — do not push",
        Close: "Close for the next concrete step",
      };
      const questionMap: Record<typeof chosen, string> = {
        Probe: "What's the part of this you're least sure about?",
        Pause: "Want to take a moment — anything you'd like me to clarify before we go further?",
        Close: "If we agree on the shape of this today, can we lock a working session for next week?",
      };
      const rationale: Record<typeof chosen, string> = {
        Probe: "Enough interest to keep digging; not enough clarity to advance.",
        Pause: "Pressure now would harden the position you just heard.",
        Close: "All forward signals present — staying in discovery now is the bigger risk.",
      };
      return {
        signal_type: "Call-control move",
        risk_level: risk,
        what_im_hearing: `Single recommendation: ${chosen.toUpperCase()}. ${rationale[chosen]}`,
        likely_true_intent: chosen === "Close" ? "They're waiting for you to lead the next step." : chosen === "Pause" ? "They need air before they can move." : "They want more shape before committing further.",
        emotional_signal: chosen === "Pause" ? "Guarded" : chosen === "Close" ? "Decisive" : "Engaged",
        hidden_risk: chosen === "Close" ? "Closing without naming the sponsor leaves you exposed in week 2." : chosen === "Pause" ? "Pausing too long lets a competing priority overtake this." : "Over-probing now reads as indecision on your side.",
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
    }).parse({ ...d, actionButton: normalizeActionButton(d.actionButton) })
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

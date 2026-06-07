import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import {
  getCall, listLiveInsights, listTranscriptChunks,
  saveTranscriptChunk, updateTranscriptSession, updateCall,
} from "@/lib/calls.functions";
import { generateLiveInsight } from "@/lib/ai.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { ArrowLeft, FileText, Save, Sparkles } from "lucide-react";

const callQ = (fn: any, id: string) =>
  queryOptions({ queryKey: ["call", id], queryFn: () => fn({ data: { id } }) });
const insightsQ = (fn: any, id: string) =>
  queryOptions({ queryKey: ["insights", id], queryFn: () => fn({ data: { callId: id } }) });
const chunksQ = (fn: any, id: string) =>
  queryOptions({ queryKey: ["chunks", id], queryFn: () => fn({ data: { callId: id } }) });

export const Route = createFileRoute("/_authenticated/calls/$id/live")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(callQ(getCall, params.id)),
      context.queryClient.ensureQueryData(insightsQ(listLiveInsights, params.id)),
      context.queryClient.ensureQueryData(chunksQ(listTranscriptChunks, params.id)),
    ]);
  },
  component: LiveRadar,
});

const ACTIONS = [
  "What are they really saying?",
  "What should I ask now?",
  "What emotion or hesitation is showing?",
  "Is this a buying signal?",
  "Is this a risk signal?",
  "Am I moving too fast?",
  "Should I probe, pause, or close?",
  "What should I avoid saying?",
];

function riskClass(r: string) {
  if (r === "red") return "bg-risk-red/15 text-foreground border-risk-red/40";
  if (r === "yellow") return "bg-risk-yellow/15 text-foreground border-risk-yellow/40";
  return "bg-risk-green/15 text-foreground border-risk-green/40";
}

function BriefField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs whitespace-pre-wrap text-foreground/90">{value}</div>
    </div>
  );
}

function LiveRadar() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fnGetCall = useServerFn(getCall);
  const fnInsights = useServerFn(listLiveInsights);
  const fnChunks = useServerFn(listTranscriptChunks);
  const fnSaveChunk = useServerFn(saveTranscriptChunk);
  const fnUpdateSession = useServerFn(updateTranscriptSession);
  const fnUpdateCall = useServerFn(updateCall);
  const fnGenInsight = useServerFn(generateLiveInsight);

  const { data: call } = useSuspenseQuery(callQ(fnGetCall, id));
  const { data: insights } = useSuspenseQuery(insightsQ(fnInsights, id));
  const { data: chunks } = useSuspenseQuery(chunksQ(fnChunks, id));

  const [text, setText] = useState(call.transcript_session_text ?? "");
  const [running, setRunning] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fnUpdateSession({ data: { callId: id, text } }).catch(() => {});
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [text, id, fnUpdateSession]);

  async function saveSegment() {
    if (!text.trim()) { toast.error("Nothing to save."); return; }
    await fnSaveChunk({ data: { callId: id, text: text.trim() } });
    await queryClient.invalidateQueries({ queryKey: ["chunks", id] });
    toast.success("Transcript segment saved.");
  }

  async function runAction(action: string) {
    setRunning(action);
    try {
      let chunkId: string | null = null;
      if (action === "Analyze Current Moment" && text.trim()) {
        const chunk = await fnSaveChunk({ data: { callId: id, text: text.trim() } });
        chunkId = chunk.id;
        await queryClient.invalidateQueries({ queryKey: ["chunks", id] });
      } else {
        const last = chunks[chunks.length - 1];
        chunkId = last?.id ?? null;
      }
      await fnGenInsight({ data: { callId: id, actionButton: action, transcriptChunkId: chunkId } });
      await queryClient.invalidateQueries({ queryKey: ["insights", id] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate insight");
    } finally {
      setRunning(null);
    }
  }

  async function endCall() {
    await fnUpdateCall({ data: {
      id,
      title: call.title, company_name: call.company_name, contact_name: call.contact_name,
      contact_role: call.contact_role, call_type: call.call_type, call_datetime: call.call_datetime,
      meeting_objective: call.meeting_objective, business_context: call.business_context,
      what_i_need_to_learn: call.what_i_need_to_learn, planned_questions: call.planned_questions,
      known_concerns: call.known_concerns, risks_to_watch: call.risks_to_watch,
      desired_outcome: call.desired_outcome, deal_stage: call.deal_stage,
      authority_status: call.authority_status, budget_status: call.budget_status, notes: call.notes,
    } });
    // Quick status update via supabase isn't needed — go straight to summary which sets status
    navigate({ to: "/calls/$id/summary", params: { id } });
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col">
      <div className="border-b border-border px-4 py-2 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button asChild variant="ghost" size="sm"><Link to="/calls/$id" params={{ id }}><ArrowLeft className="h-4 w-4" /> Brief</Link></Button>
          <div className="min-w-0">
            <div className="font-semibold truncate">{call.title}</div>
            <div className="text-xs text-muted-foreground truncate">{[call.company_name, call.contact_name].filter(Boolean).join(" · ")}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-primary/40 text-primary">● LIVE</Badge>
          <Button onClick={endCall} variant="outline" size="sm"><FileText className="h-4 w-4" /> End & summarize</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_360px] min-h-0">
        {/* Left: brief */}
        <div className="border-r border-border overflow-y-auto p-4 space-y-3 hidden lg:block">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Call brief</div>
          <BriefField label="Objective" value={call.meeting_objective} />
          <BriefField label="What to learn" value={call.what_i_need_to_learn} />
          <BriefField label="Planned questions" value={call.planned_questions} />
          <BriefField label="Known concerns" value={call.known_concerns} />
          <BriefField label="Risks" value={call.risks_to_watch} />
          <BriefField label="Desired outcome" value={call.desired_outcome} />
          <BriefField label="Authority" value={call.authority_status} />
          <BriefField label="Budget" value={call.budget_status} />
        </div>

        {/* Center: transcript */}
        <div className="flex flex-col min-h-0 border-r border-border">
          <div className="p-4 border-b border-border">
            <div className="text-xs text-muted-foreground">Live transcript input — Zoom integration pending. Paste or type what you hear.</div>
          </div>
          <div className="flex-1 p-4 min-h-0">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type or paste what the caller is saying..."
              className="h-full resize-none bg-card/50 font-mono text-sm"
            />
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <Button variant="outline" size="sm" onClick={saveSegment}><Save className="h-4 w-4" /> Save Transcript Segment</Button>
            <Button size="sm" onClick={() => runAction("Analyze Current Moment")} disabled={!!running}>
              <Sparkles className="h-4 w-4" /> Analyze Current Moment
            </Button>
          </div>
          {chunks.length > 0 && (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {chunks.length} segment{chunks.length !== 1 ? "s" : ""} saved
            </div>
          )}
        </div>

        {/* Right: insights + actions */}
        <div className="flex flex-col min-h-0">
          <div className="p-4 border-b border-border space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Guidance</div>
            <div className="grid grid-cols-2 gap-1.5">
              {ACTIONS.map((a) => (
                <Button key={a} variant="outline" size="sm" className="h-auto py-2 px-2 text-xs whitespace-normal text-left justify-start"
                  onClick={() => runAction(a)} disabled={!!running}>
                  {running === a ? "..." : a}
                </Button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {insights.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">
                  Click an AI action to generate your first insight.
                </div>
              )}
              {insights.map((i: any) => (
                <Card key={i.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] font-mono text-muted-foreground">#{String(i.sequence_number).padStart(3, "0")}</div>
                    <Badge variant="outline" className={riskClass(i.risk_level)}>{i.risk_level.toUpperCase()}</Badge>
                  </div>
                  <div className="font-semibold text-sm">{i.signal_type}</div>
                  {i.what_im_hearing && <Insight label="What I'm hearing" value={i.what_im_hearing} />}
                  {i.likely_true_intent && <Insight label="Likely intent" value={i.likely_true_intent} />}
                  {i.emotional_signal && <Insight label="Emotional signal" value={i.emotional_signal} />}
                  {i.hidden_risk && <Insight label="Hidden risk" value={i.hidden_risk} />}
                  {i.recommended_question && <Insight label="Ask this" value={i.recommended_question} />}
                  {i.question_to_avoid && <Insight label="Avoid this" value={i.question_to_avoid} />}
                  {i.recommended_next_move && (
                    <div className="pt-1">
                      <span className="inline-flex items-center rounded-full bg-primary/15 text-primary px-2 py-0.5 text-[11px] font-medium">
                        Next: {i.recommended_next_move}
                      </span>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function Insight({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-xs mt-0.5">{value}</div>
    </div>
  );
}

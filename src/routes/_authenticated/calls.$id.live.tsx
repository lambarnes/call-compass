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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronDown, AlertCircle, Video } from "lucide-react";
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

const ACTION_GROUPS: { label: string; actions: string[] }[] = [
  { label: "Understanding", actions: ["What are they really saying?", "What emotion or hesitation is showing?"] },
  { label: "Discovery", actions: ["What should I ask now?", "Should I probe, pause, or close?"] },
  { label: "Qualification", actions: ["Is this a buying signal?", "Is this a risk signal?"] },
  { label: "Control", actions: ["Am I moving too fast?", "What should I avoid saying?"] },
];

const LEGACY_ACTION_LABELS = new Set(["Analyze Current Moment"]);
const isLegacyInsight = (i: any) => LEGACY_ACTION_LABELS.has(i?.action_button);
const latestActiveInsight = (insights: any[]) => {
  for (let i = insights.length - 1; i >= 0; i--) {
    if (!isLegacyInsight(insights[i])) return insights[i];
  }
  return null;
};

function stageLabel(r: string) {
  if (r === "red") return "Red";
  if (r === "yellow") return "Yellow";
  return "Green";
}
function stageDotClass(r: string) {
  if (r === "red") return "bg-risk-red";
  if (r === "yellow") return "bg-risk-yellow";
  return "bg-risk-green";
}
function firstClause(s: string, max = 60) {
  const clean = s.split(/[.;\n]/)[0].trim();
  return clean.length > max ? clean.slice(0, max - 1) + "…" : clean;
}
function confidenceFor(id: string) {
  const hash = String(id).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return 60 + (hash % 36);
}

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
  const [transcriptSource, setTranscriptSource] = useState<"manual" | "zoom">("manual");
  const [zoomError] = useState<string | null>(null);
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
      // Current textarea is the source of truth: if it has content, persist it
      // as a new transcript chunk and use it as the evidence for this insight.
      if (text.trim()) {
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
          {call.zoom_meeting_link && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Zoom link</div>
              <a href={call.zoom_meeting_link} target="_blank" rel="noreferrer" className="mt-0.5 text-xs text-primary underline break-all inline-block">
                {call.zoom_meeting_link}
              </a>
            </div>
          )}
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
          <div className="p-4 border-b border-border space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Transcript Source</span>
              <Select value={transcriptSource} onValueChange={(v) => setTranscriptSource(v as "manual" | "zoom")}>
                <SelectTrigger className="h-7 w-[220px] text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual Transcript</SelectItem>
                  <SelectItem value="zoom" disabled>Zoom Transcript (Coming Soon)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-xs text-muted-foreground">
              {transcriptSource === "manual"
                ? "Live transcript input — paste or type what you hear."
                : "Zoom live transcript will stream here once connected."}
            </div>
            {zoomError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Zoom connection error</AlertTitle>
                <AlertDescription>{zoomError}</AlertDescription>
              </Alert>
            )}
          </div>
          <div className="flex-1 p-4 min-h-0">
            {transcriptSource === "zoom" ? (
              <Card className="h-full flex flex-col items-center justify-center text-center p-6 border-dashed bg-card/30">
                <Video className="h-8 w-8 text-muted-foreground mb-3" />
                <div className="text-sm font-medium">Live Zoom Transcript</div>
                <div className="mt-1 text-xs text-muted-foreground max-w-xs">
                  Zoom integration is coming soon. Connect your Zoom account in Settings to stream live transcripts here.
                </div>
              </Card>
            ) : (
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste what the caller is saying..."
                className="h-full resize-none bg-card/50 font-mono text-sm"
              />
            )}
          </div>
          <div className="p-4 border-t border-border flex gap-2">
            <Button variant="outline" size="sm" onClick={saveSegment} disabled={transcriptSource === "zoom"}><Save className="h-4 w-4" /> Save Transcript Segment</Button>
            <Button size="sm" onClick={() => runAction("Analyze Current Moment")} disabled={!!running || transcriptSource === "zoom"}>
              <Sparkles className="h-4 w-4" /> Analyze Current Moment
            </Button>
          </div>

          {chunks.length > 0 && (
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {chunks.length} segment{chunks.length !== 1 ? "s" : ""} saved
            </div>
          )}
        </div>

        {/* Right: cockpit */}
        <div className="flex flex-col min-h-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* ZONE 1 — Call Status */}
              <CallStatusCard insights={insights} />

              {/* ZONE 2 — Grouped action buttons */}
              <div className="space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">AI Guidance</div>
                <div className="grid grid-cols-2 gap-3">
                  {ACTION_GROUPS.map((group) => (
                    <div key={group.label} className="space-y-1.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/80">{group.label}</div>
                      <div className="space-y-1.5">
                        {group.actions.map((a) => (
                          <Button
                            key={a}
                            variant="outline"
                            size="sm"
                            className="w-full h-auto py-1.5 px-2 text-[11px] leading-tight whitespace-normal text-left justify-start"
                            onClick={() => runAction(a)}
                            disabled={!!running}
                          >
                            {running === a ? "..." : a}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ZONE 3 — Latest insight (hero) */}
              <LatestInsightCard insights={insights} chunks={chunks} />

              {/* ZONE 4 — Insight history */}
              <InsightHistory insights={insights} chunks={chunks} />
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

function FieldBlock({ label, value, large = false }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`mt-1 whitespace-pre-wrap ${large ? "text-sm leading-snug" : "text-xs"}`}>{value}</div>
    </div>
  );
}

function CallStatusCard({ insights }: { insights: any[] }) {
  const latest = latestActiveInsight(insights);
  if (!latest) {
    return (
      <Card className="p-4 border-dashed">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Call Status</div>
        <div className="mt-2 text-xs text-muted-foreground">Awaiting first signal — choose a lens below.</div>
      </Card>
    );
  }
  const stage = stageLabel(latest.risk_level);
  const constraint = latest.hidden_risk ? firstClause(latest.hidden_risk) : "—";
  const move = latest.recommended_next_move ?? "—";
  const confidence = confidenceFor(latest.id);
  return (
    <Card className="p-4 space-y-3 border-primary/20">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Call Status</div>
        <div className="text-[10px] font-mono text-muted-foreground">#{String(latest.sequence_number).padStart(3, "0")}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Discovery Stage</div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${stageDotClass(latest.risk_level)}`} />
            <span className="text-sm font-semibold">{stage}</span>
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
          <div className="mt-1 text-sm font-semibold">{confidence}%</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Primary Constraint</div>
          <div className="mt-1 text-sm">{constraint}</div>
        </div>
        <div className="col-span-2">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Recommended Move</div>
          <span className="mt-1 inline-flex items-center rounded-full bg-primary/15 text-primary px-2.5 py-0.5 text-xs font-medium">
            {move}
          </span>
        </div>
      </div>
    </Card>
  );
}

function LatestInsightCard({ insights, chunks }: { insights: any[]; chunks: any[] }) {
  const latest = latestActiveInsight(insights);
  if (!latest) return null;
  const chunkText = latest.transcript_chunk_id
    ? chunks.find((c: any) => c.id === latest.transcript_chunk_id)?.transcript_text
    : null;
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-semibold text-sm">{latest.action_button}</div>
        <Badge variant="outline" className={riskClass(latest.risk_level)}>{latest.risk_level.toUpperCase()}</Badge>
      </div>
      <div className="space-y-3">
        {latest.what_im_hearing && <FieldBlock label="What I'm Hearing" value={latest.what_im_hearing} large />}
        {latest.hidden_risk && <FieldBlock label="Hidden Risk" value={latest.hidden_risk} large />}
        {latest.recommended_next_move && (
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recommended Move</div>
            <span className="mt-1 inline-flex items-center rounded-full bg-primary/15 text-primary px-2.5 py-1 text-sm font-medium">
              {latest.recommended_next_move}
            </span>
          </div>
        )}
        {latest.recommended_question && <FieldBlock label="Recommended Question" value={latest.recommended_question} large />}
      </div>

      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-180 pt-1">
          <ChevronDown className="h-3 w-3 transition-transform" />
          Evidence &amp; analysis
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 space-y-2 border-t border-border pt-2">
            {chunkText && (
              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Transcript Evidence</div>
                <blockquote className="mt-1 text-xs border-l-2 border-primary/40 pl-2 italic text-foreground/90 whitespace-pre-wrap">
                  "{chunkText}"
                </blockquote>
              </div>
            )}
            {latest.signal_type && <FieldBlock label="Signal Type" value={latest.signal_type} />}
            <FieldBlock label="Risk Level" value={stageLabel(latest.risk_level)} />
            {latest.emotional_signal && <FieldBlock label="Emotional Signal" value={latest.emotional_signal} />}
            {latest.likely_intent && <FieldBlock label="Likely Intent" value={latest.likely_intent} />}
            {latest.question_to_avoid && <FieldBlock label="Question To Avoid" value={latest.question_to_avoid} />}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function InsightHistory({ insights, chunks }: { insights: any[]; chunks: any[] }) {
  const latest = latestActiveInsight(insights);
  const prior = insights.filter((i) => i.id !== latest?.id).slice().reverse();
  if (prior.length === 0) return null;
  return (
    <Collapsible>
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors [&[data-state=open]>svg]:rotate-180 px-1 py-2 border-t border-border">
        <span>Previous insights ({prior.length})</span>
        <ChevronDown className="h-3 w-3 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 space-y-2">
          {prior.map((i: any) => (
            <HistoryRow key={i.id} insight={i} chunks={chunks} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function HistoryRow({ insight, chunks }: { insight: any; chunks: any[] }) {
  const [open, setOpen] = useState(false);
  const chunkText = insight.transcript_chunk_id
    ? chunks.find((c: any) => c.id === insight.transcript_chunk_id)?.transcript_text
    : null;
  return (
    <Card className="p-2.5">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 text-left text-xs"
      >
        <span className="text-[10px] font-mono text-muted-foreground">#{String(insight.sequence_number).padStart(3, "0")}</span>
        <span className={`h-2 w-2 rounded-full shrink-0 ${stageDotClass(insight.risk_level)}`} />
        <span className="font-medium truncate flex-1">{insight.action_button}</span>
        {insight.recommended_next_move && (
          <span className="text-[10px] text-muted-foreground truncate max-w-[40%]">{insight.recommended_next_move}</span>
        )}
        <ChevronDown className={`h-3 w-3 transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="mt-2 pt-2 border-t border-border space-y-2">
          {insight.what_im_hearing && <FieldBlock label="What I'm Hearing" value={insight.what_im_hearing} />}
          {insight.hidden_risk && <FieldBlock label="Hidden Risk" value={insight.hidden_risk} />}
          {insight.recommended_question && <FieldBlock label="Recommended Question" value={insight.recommended_question} />}
          {chunkText && (
            <blockquote className="text-xs border-l-2 border-primary/40 pl-2 italic text-foreground/80 whitespace-pre-wrap">
              "{chunkText}"
            </blockquote>
          )}
        </div>
      )}
    </Card>
  );
}

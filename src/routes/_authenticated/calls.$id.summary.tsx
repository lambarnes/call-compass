import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import {
  getCall, getAfterCallOutput, updateAfterCallOutput,
} from "@/lib/calls.functions";
import { generateAfterCallSummary } from "@/lib/ai.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";

const callQ = (fn: typeof getCall, id: string) =>
  queryOptions({ queryKey: ["call", id], queryFn: () => fn({ data: { id } }) });
const outputQ = (fn: typeof getAfterCallOutput, id: string) =>
  queryOptions({ queryKey: ["after_call", id], queryFn: () => fn({ data: { callId: id } }) });

export const Route = createFileRoute("/_authenticated/calls/$id/summary")({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(callQ(getCall, params.id)),
      context.queryClient.ensureQueryData(outputQ(getAfterCallOutput, params.id)),
    ]);
  },
  component: Summary,
});

const FIELDS: Array<[string, string]> = [
  ["meeting_purpose", "Meeting purpose"],
  ["client_situation", "Client situation"],
  ["stated_problem", "Stated problem"],
  ["diagnosed_root_issue", "Diagnosed root issue"],
  ["client_provided_information", "Client-provided information"],
  ["key_risks_constraints", "Key risks & constraints"],
  ["decisions_made", "Decisions made"],
  ["open_questions", "Open questions"],
  ["potential_scope", "Potential scope"],
  ["exclusions", "Exclusions"],
  ["recommended_next_step", "Recommended next step"],
];

function Summary() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const fnCall = useServerFn(getCall);
  const fnOutput = useServerFn(getAfterCallOutput);
  const fnGenerate = useServerFn(generateAfterCallSummary);
  const fnUpdate = useServerFn(updateAfterCallOutput);

  const { data: call } = useSuspenseQuery(callQ(fnCall, id));
  const { data: output } = useSuspenseQuery(outputQ(fnOutput, id));

  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (output) {
      const d: Record<string, string> = {};
      FIELDS.forEach(([k]) => { d[k] = (output as any)[k] ?? ""; });
      d.follow_up_email_draft = output.follow_up_email_draft ?? "";
      setDraft(d);
    }
  }, [output]);

  async function generate() {
    setGenerating(true);
    try {
      await fnGenerate({ data: { callId: id } });
      await queryClient.invalidateQueries({ queryKey: ["after_call", id] });
      await queryClient.invalidateQueries({ queryKey: ["call", id] });
      await queryClient.invalidateQueries({ queryKey: ["calls"] });
      toast.success("Summary generated.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate");
    } finally { setGenerating(false); }
  }

  async function saveEdits() {
    if (!output) return;
    await fnUpdate({ data: { id: output.id, patch: draft } });
    await queryClient.invalidateQueries({ queryKey: ["after_call", id] });
    toast.success("Saved.");
  }

  function copyEmail() {
    navigator.clipboard.writeText(draft.follow_up_email_draft ?? "");
    toast.success("Email copied.");
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2">
            <Link to="/calls/$id" params={{ id }}><ArrowLeft className="h-4 w-4" /> Brief</Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold">After-call summary</h1>
          <p className="text-sm text-muted-foreground mt-1">{call.title}</p>
        </div>
        <div className="flex gap-2">
          {output && <Button variant="outline" onClick={saveEdits}>Save edits</Button>}
          <Button onClick={generate} disabled={generating}>
            <Sparkles className="h-4 w-4" /> {generating ? "Generating..." : output ? "Regenerate" : "Generate summary"}
          </Button>
        </div>
      </div>

      {!output ? (
        <Card className="p-10 text-center">
          <Sparkles className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-semibold">No summary yet</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Generate a structured recap from the brief, transcript, and live insights.</p>
          <Button onClick={generate} disabled={generating}>{generating ? "Generating..." : "Generate summary"}</Button>
        </Card>
      ) : (
        <>
          <Card className="p-6 space-y-5">
            {FIELDS.map(([k, label]) => (
              <div key={k} className="space-y-1.5">
                <Label>{label}</Label>
                <Textarea
                  rows={k === "client_provided_information" ? 5 : 2}
                  value={draft[k] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [k]: e.target.value }))}
                />
              </div>
            ))}
          </Card>

          <Card className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Follow-up email draft</h2>
              <Button variant="outline" size="sm" onClick={copyEmail}><Copy className="h-4 w-4" /> Copy</Button>
            </div>
            <Textarea
              rows={10}
              value={draft.follow_up_email_draft ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, follow_up_email_draft: e.target.value }))}
              className="font-mono text-sm"
            />
          </Card>
        </>
      )}
    </div>
  );
}

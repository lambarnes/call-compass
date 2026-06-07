import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCall, deleteCall } from "@/lib/calls.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

const callQueryOptions = (fetchFn: typeof getCall, id: string) =>
  queryOptions({ queryKey: ["call", id], queryFn: () => fetchFn({ data: { id } }) });

export const Route = createFileRoute("/_authenticated/calls/$id")({
  loader: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(callQueryOptions(getCall, params.id));
  },
  component: CallDetail,
});

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function CallDetail() {
  const { id } = Route.useParams();
  const fetchCall = useServerFn(getCall);
  const removeCall = useServerFn(deleteCall);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: call } = useSuspenseQuery(callQueryOptions(fetchCall, id));

  async function onDelete() {
    if (!confirm("Delete this call brief?")) return;
    await removeCall({ data: { id } });
    await queryClient.invalidateQueries({ queryKey: ["calls"] });
    toast.success("Deleted.");
    navigate({ to: "/calls" });
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-xs text-muted-foreground">{call.company_name}</div>
          <h1 className="text-2xl md:text-3xl font-semibold mt-1">{call.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{call.status.replace("_", " ")}</Badge>
            {call.call_datetime && <span className="text-xs text-muted-foreground">{new Date(call.call_datetime).toLocaleString()}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {(call.status === "completed" || call.status === "follow_up_done") && (
            <Button asChild variant="outline">
              <Link to="/calls/$id/summary" params={{ id }}><FileText className="h-4 w-4" /> Summary</Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/calls/$id/live" params={{ id }}><Radar className="h-4 w-4" /> Start Live Radar</Link>
          </Button>
          <Button variant="outline" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <Card className="p-6 grid md:grid-cols-2 gap-x-8 gap-y-5">
        <Field label="Contact" value={[call.contact_name, call.contact_role].filter(Boolean).join(" · ")} />
        <Field label="Call type" value={call.call_type} />
        <Field label="Deal stage" value={call.deal_stage} />
        <Field label="Authority" value={call.authority_status} />
        <Field label="Budget" value={call.budget_status} />
      </Card>

      <Card className="p-6 space-y-5">
        <h2 className="font-semibold">Objective & context</h2>
        <Field label="Meeting objective" value={call.meeting_objective} />
        <Field label="Business context" value={call.business_context} />
        <Field label="What I need to learn" value={call.what_i_need_to_learn} />
        <Field label="Planned questions" value={call.planned_questions} />
      </Card>

      <Card className="p-6 space-y-5">
        <h2 className="font-semibold">Risks & outcome</h2>
        <Field label="Known concerns" value={call.known_concerns} />
        <Field label="Risks to watch" value={call.risks_to_watch} />
        <Field label="Desired outcome" value={call.desired_outcome} />
        <Field label="Notes" value={call.notes} />
      </Card>
    </div>
  );
}

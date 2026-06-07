import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCall, deleteCall } from "@/lib/calls.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";

const callQueryOptions = (fetchFn: any, id: string) =>
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

function BulletField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  const items = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <ul className="mt-1 text-sm list-disc pl-5 space-y-1">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
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
          <h1 className="text-2xl md:text-3xl font-semibold">{call.title}</h1>
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

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Contact Information</h2>
        <Field label="Company Name" value={call.company_name} />
        <Field label="Contact Name" value={call.contact_name} />
        <Field label="Contact Role" value={call.contact_role} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Call Objective</h2>
        <Field label="Meeting Objective" value={call.meeting_objective} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Business Context</h2>
        <Field label="Business Context" value={call.business_context} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">What I Need To Learn</h2>
        <BulletField label="What I Need To Learn" value={call.what_i_need_to_learn} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Planned Questions</h2>
        <BulletField label="Planned Questions" value={call.planned_questions} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Known Concerns</h2>
        <Field label="Known Concerns" value={call.known_concerns} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Risks To Watch</h2>
        <Field label="Risks To Watch" value={call.risks_to_watch} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Desired Outcome</h2>
        <Field label="Desired Outcome" value={call.desired_outcome} />
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Notes</h2>
        <Field label="Notes" value={call.notes} />
      </Card>
    </div>
  );
}

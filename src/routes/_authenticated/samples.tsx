import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createCall } from "@/lib/calls.functions";
import { SAMPLE_SCENARIOS, type SampleScenario } from "@/lib/sample-scenarios";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radar, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/samples")({
  component: SamplesPage,
});

function ScenarioCard({ scenario, onUse, busy }: { scenario: SampleScenario; onUse: (s: SampleScenario) => void; busy: boolean }) {
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{scenario.call_type}</div>
        <h3 className="font-semibold text-base mt-1">{scenario.title}</h3>
        <div className="text-xs text-muted-foreground mt-1">{scenario.company_name} · {scenario.contact_role}</div>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-3">{scenario.meeting_objective}</p>
      <div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Suggested buttons</div>
        <div className="flex flex-wrap gap-1.5">
          {scenario.suggested_buttons.map((b) => (
            <Badge key={b} variant="outline" className="text-[11px] font-normal">{b}</Badge>
          ))}
        </div>
      </div>
      <div className="pt-2 mt-auto">
        <Button className="w-full" disabled={busy} onClick={() => onUse(scenario)}>
          <PlayCircle className="h-4 w-4" /> Use This Sample
        </Button>
      </div>
    </Card>
  );
}

function SamplesPage() {
  const navigate = useNavigate();
  const create = useServerFn(createCall);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function use(s: SampleScenario) {
    setBusyId(s.id);
    try {
      const row = await create({
        data: {
          title: s.title,
          company_name: s.company_name,
          contact_name: s.contact_name,
          contact_role: s.contact_role,
          call_type: s.call_type,
          meeting_objective: s.meeting_objective,
          business_context: s.business_context,
          transcript_session_text: s.transcript,
        },
      });
      toast.success("Sample loaded. Opening Live Radar.");
      navigate({ to: "/calls/$id/live", params: { id: row.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to load sample");
      setBusyId(null);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
          <Radar className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Sample scenarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Try Call Compass without a live call. Each sample creates a real Call Brief with a preloaded transcript and drops you into Live Radar.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SAMPLE_SCENARIOS.map((s) => (
          <ScenarioCard key={s.id} scenario={s} onUse={use} busy={busyId === s.id} />
        ))}
      </div>
    </div>
  );
}

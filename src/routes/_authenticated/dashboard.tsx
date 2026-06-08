import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { listCalls, getProfile } from "@/lib/calls.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Radar, FileText, Clock, Library, MessageSquare, Video, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const callsQueryOptions = (fetchFn: any) =>
  queryOptions({ queryKey: ["calls"], queryFn: () => fetchFn() });
const profileQueryOptions = (fn: any) =>
  queryOptions({ queryKey: ["profile"], queryFn: () => fn() });

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function statusColor(s: string) {
  if (s === "completed" || s === "follow_up_done") return "bg-risk-green/15 text-foreground border-risk-green/30";
  if (s === "live") return "bg-primary/20 text-foreground border-primary/40";
  if (s === "ready") return "bg-risk-yellow/15 text-foreground border-risk-yellow/30";
  return "bg-muted text-muted-foreground border-border";
}

function Dashboard() {
  const fetchCalls = useServerFn(listCalls);
  const { data: calls } = useSuspenseQuery(callsQueryOptions(fetchCalls));
  const recent = calls.slice(0, 5);

  const stats = {
    total: calls.length,
    upcoming: calls.filter((c: any) => c.status === "ready" || c.status === "draft").length,
    completed: calls.filter((c: any) => c.status === "completed" || c.status === "follow_up_done").length,
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Prepare, run, and follow up on every call.</p>
        </div>
        <Button asChild>
          <Link to="/calls/new"><PlusCircle className="h-4 w-4" /> New Call Brief</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Total calls</div>
          <div className="text-3xl font-semibold mt-2">{stats.total}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Upcoming / drafts</div>
          <div className="text-3xl font-semibold mt-2">{stats.upcoming}</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Completed</div>
          <div className="text-3xl font-semibold mt-2">{stats.completed}</div>
        </Card>
      </div>

      <Card className="p-6 border-primary/30 bg-primary/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider text-primary font-semibold">Beta program</div>
            <h2 className="text-lg font-semibold mt-1">Beta Test Call Compass</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Try a sample scenario or create your own Call Brief, then submit feedback.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="outline"><Link to="/samples"><Library className="h-4 w-4" /> View Sample Scenarios</Link></Button>
            <Button asChild><Link to="/feedback"><MessageSquare className="h-4 w-4" /> Submit Feedback</Link></Button>
          </div>
        </div>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent calls</h2>
          <Link to="/calls" className="text-sm text-muted-foreground hover:text-foreground">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <Card className="p-10 text-center">
            <Radar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-semibold">No calls yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first call brief to start preparing.</p>
            <Button asChild><Link to="/calls/new">New Call Brief</Link></Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {recent.map((c: any) => (
              <Link key={c.id} to="/calls/$id" params={{ id: c.id }}>
                <Card className="p-4 hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.title}</div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                        {c.company_name && <span>{c.company_name}</span>}
                        {c.contact_name && <span>· {c.contact_name}</span>}
                        {c.call_datetime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(c.call_datetime).toLocaleString()}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className={statusColor(c.status)}>{c.status.replace("_", " ")}</Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Route.options.loader = async ({ context }) => {
  await context.queryClient.ensureQueryData(callsQueryOptions(listCalls));
};

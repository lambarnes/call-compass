import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCalls } from "@/lib/calls.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const callsQueryOptions = (fetchFn: any) =>
  queryOptions({ queryKey: ["calls"], queryFn: () => fetchFn() });

export const Route = createFileRoute("/_authenticated/calls/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(callsQueryOptions(listCalls));
  },
  component: SavedCalls,
});

function SavedCalls() {
  const fetchCalls = useServerFn(listCalls);
  const { data: calls } = useSuspenseQuery(callsQueryOptions(fetchCalls));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Saved calls</h1>
          <p className="text-sm text-muted-foreground mt-1">All of your call briefs and recordings.</p>
        </div>
        <Button asChild><Link to="/calls/new"><PlusCircle className="h-4 w-4" /> New Call Brief</Link></Button>
      </div>

      {calls.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">No calls yet.</Card>
      ) : (
        <div className="grid gap-3">
          {calls.map((c: any) => (
            <Link key={c.id} to="/calls/$id" params={{ id: c.id }}>
              <Card className="p-4 hover:border-primary/40 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{c.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {[c.company_name, c.contact_name].filter(Boolean).join(" · ")}
                      {c.call_datetime && ` · ${new Date(c.call_datetime).toLocaleString()}`}
                    </div>
                  </div>
                  <Badge variant="outline">{c.status.replace("_", " ")}</Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

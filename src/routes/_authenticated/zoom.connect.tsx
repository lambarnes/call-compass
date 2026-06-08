import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { getProfile } from "@/lib/calls.functions";
import { startZoomOAuth } from "@/lib/zoom.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const profileQ = (fn: any) =>
  queryOptions({ queryKey: ["profile"], queryFn: () => fn() });

export const Route = createFileRoute("/_authenticated/zoom/connect")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(profileQ(getProfile)).catch(() => null);
  },
  component: ZoomConnect,
});

function ZoomConnect() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fnGet = useServerFn(getProfile);
  const fnStart = useServerFn(startZoomOAuth);
  const { data: profile = null } = useQuery({ ...profileQ(fnGet), retry: 1 });
  const [loading, setLoading] = useState(false);
  const [errorParam, setErrorParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    const err = p.get("error");
    if (err) setErrorParam(err);
    // Only refresh profile when we just returned from Zoom callback
    if (p.get("zoom") === "connected") {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  }, [queryClient]);

  const status = ((profile as any)?.zoom_auth_status ?? "not_connected") as
    | "not_connected" | "pending" | "connected" | "error";
  const email = (profile as any)?.zoom_auth_email as string | null | undefined;
  const connectedAt = (profile as any)?.zoom_auth_connected_at as string | null | undefined;

  async function connect() {
    setLoading(true);
    try {
      const { url } = await fnStart();
      window.location.href = url;
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start Zoom OAuth");
      setLoading(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Button>

      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Connect Zoom</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Authorize Call Compass to know which Zoom account is yours. You can keep using manual transcript mode without connecting.
        </p>
      </div>

      {errorParam && (
        <Card className="p-4 border-destructive/40 bg-destructive/10 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
          <div className="text-sm">
            <div className="font-medium">Zoom authorization failed</div>
            <div className="text-muted-foreground">Reason: {errorParam}. Please try again.</div>
          </div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Zoom Authorization</h2>
          </div>
          {status === "connected" ? (
            <Badge variant="outline" className="border-risk-green/40 text-foreground bg-risk-green/15">Connected</Badge>
          ) : status === "error" ? (
            <Badge variant="outline" className="border-risk-red/40 text-foreground bg-risk-red/15">Error</Badge>
          ) : status === "pending" ? (
            <Badge variant="outline" className="border-risk-amber/40 text-foreground bg-risk-amber/15">Pending</Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
          )}
        </div>

        {status === "connected" ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-risk-green" />
              <div>
                <div className="font-medium">Your Zoom account is linked.</div>
                {email && <div className="text-muted-foreground">Account: <span className="text-foreground">{email}</span></div>}
                {connectedAt && (
                  <div className="text-muted-foreground">Connected: <span className="text-foreground">{new Date(connectedAt).toLocaleString()}</span></div>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={connect} disabled={loading}>
              <Video className="h-4 w-4" /> Reconnect Zoom
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              You'll be redirected to Zoom to grant read-only access to your account profile. No meeting data is read in this step.
            </p>
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1">
              <div className="text-xs font-medium text-foreground">Manual transcript mode still works</div>
              <p className="text-xs text-muted-foreground">
                You can use Call Compass without Zoom — paste transcripts manually on the Live Radar page.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={connect} disabled={loading}>
                <Video className="h-4 w-4" /> {loading ? "Redirecting…" : "Connect Zoom"}
              </Button>
              <Button asChild variant="outline">
                <Link to="/dashboard">Skip for now</Link>
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

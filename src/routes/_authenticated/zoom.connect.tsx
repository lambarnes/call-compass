import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/zoom/connect")({
  component: ZoomConnect,
});

function ZoomConnect() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const error = params?.get("error");
  const status = params?.get("status");
  const detail = params?.get("detail");

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Zoom Connection</h1>
      {error ? (
        <Card className="p-4 space-y-2 border-destructive/40">
          <div className="text-sm font-medium">Zoom authorization failed</div>
          <div className="text-xs text-muted-foreground">Error: <span className="text-foreground">{error}</span></div>
          {status && <div className="text-xs text-muted-foreground">Status: <span className="text-foreground">{status}</span></div>}
          {detail && <pre className="text-xs whitespace-pre-wrap bg-muted/40 p-2 rounded">{detail}</pre>}
        </Card>
      ) : (
        <p className="text-sm text-muted-foreground">Manage your Zoom connection from Settings.</p>
      )}
      <div className="flex gap-2">
        <Button asChild variant="outline"><Link to="/settings">Open Settings</Link></Button>
        <Button asChild><Link to="/dashboard">Back to Dashboard</Link></Button>
      </div>
    </div>
  );
}

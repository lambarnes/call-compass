import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/zoom/connect")({
  component: ZoomConnect,
  errorComponent: ({ error }) => (
    <div style={{ background: "#ff0000", color: "#fff", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>ZOOM ROUTE ERROR</h1>
      <pre style={{ whiteSpace: "pre-wrap", marginTop: 12 }}>{error?.message}</pre>
    </div>
  ),
});

function ZoomConnect() {
  console.log("[diag] zoom.connect render start");
  return (
    <div>
      <div style={{ background: "#a3ff00", color: "#000", padding: 16, fontWeight: 700, fontSize: 18 }}>
        ZOOM ROUTE STATIC TEST
      </div>
      <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl md:text-3xl font-semibold">Zoom Connect Test</h1>
        <p className="text-sm text-muted-foreground">This route is rendering.</p>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}

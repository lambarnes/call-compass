import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/zoom/connect")({
  component: ZoomConnect,
});

function ZoomConnect() {
  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl md:text-3xl font-semibold">Zoom Connect Test</h1>
      <p className="text-sm text-muted-foreground">If you can see this, the route renders.</p>
      <Button asChild>
        <Link to="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  );
}

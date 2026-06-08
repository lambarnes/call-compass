import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "@/lib/calls.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Video } from "lucide-react";
import { toast } from "sonner";


const profileQ = (fn: any) =>
  queryOptions({ queryKey: ["profile"], queryFn: () => fn() });

export const Route = createFileRoute("/_authenticated/settings")({
  loader: async ({ context }) => { await context.queryClient.ensureQueryData(profileQ(getProfile)); },
  component: Settings,
});

function Settings() {
  const fnGet = useServerFn(getProfile);
  const fnUpd = useServerFn(updateProfile);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: profile } = useSuspenseQuery(profileQ(fnGet));

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [company, setCompany] = useState(profile?.company_name ?? "");
  const [role, setRole] = useState(profile?.role ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setCompany(profile.company_name ?? "");
      setRole(profile.role ?? "");
    }
  }, [profile]);

  async function save() {
    setSaving(true);
    try {
      await fnUpd({ data: { full_name: fullName, company_name: company, role } });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setSaving(false); }
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile.</p>
      </div>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold">Profile</h2>
        <div className="space-y-1.5"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Your role</Label><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Fractional COO, Sales Director" /></div>
        <div className="flex justify-end"><Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div>
      </Card>

      <ZoomIntegrationCard />



      <Card className="p-6 flex items-center justify-between">
        <div><div className="font-semibold">Sign out</div><div className="text-sm text-muted-foreground">End your session.</div></div>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </Card>
    </div>
  );
}

type ZoomStatus = "not_connected" | "pending" | "connected" | "error";

function ZoomIntegrationCard() {
  const fnGet = useServerFn(getProfile);
  const { data: profile } = useSuspenseQuery(profileQ(fnGet));

  const status = ((profile as any)?.zoom_auth_status ?? "not_connected") as ZoomStatus;
  const connectedAt = (profile as any)?.zoom_auth_connected_at as string | null | undefined;
  const email = (profile as any)?.zoom_auth_email as string | null | undefined;

  const statusBadge =
    status === "connected" ? (
      <Badge variant="outline" className="border-risk-green/40 text-foreground bg-risk-green/15">Connected</Badge>
    ) : status === "pending" ? (
      <Badge variant="outline" className="border-risk-amber/40 text-foreground bg-risk-amber/15">Pending</Badge>
    ) : status === "error" ? (
      <Badge variant="outline" className="border-risk-red/40 text-foreground bg-risk-red/15">Error</Badge>
    ) : (
      <Badge variant="outline" className="text-muted-foreground">Not Connected</Badge>
    );

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Zoom Authorization</h2>
        </div>
        {statusBadge}
      </div>
      <p className="text-sm text-muted-foreground">
        Connect your Zoom account to stream live meeting transcripts straight into the Radar. Coming soon — the UI is in place while the integration is being built.
      </p>
      {status === "connected" && (email || connectedAt) && (
        <div className="text-xs text-muted-foreground space-y-0.5">
          {email && <div>Account: <span className="text-foreground">{email}</span></div>}
          {connectedAt && <div>Connected: <span className="text-foreground">{new Date(connectedAt).toLocaleString()}</span></div>}
        </div>
      )}
      <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1">
        <div className="text-xs font-medium text-foreground">Future permissions</div>
        <ol className="text-xs text-muted-foreground list-decimal pl-4 space-y-0.5">
          <li>Read meeting metadata</li>
          <li>Receive live transcript stream</li>
          <li>Match Zoom meeting to Call Compass brief</li>
        </ol>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">No data is sent to Zoom yet.</span>
        <Button
          variant="outline"
          onClick={() =>
            toast.info("Zoom authorization is not enabled yet. This beta uses manual transcript mode.")
          }
        >
          <Video className="h-4 w-4" /> Connect Zoom
        </Button>
      </div>
    </Card>
  );
}


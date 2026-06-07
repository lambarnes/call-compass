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

      <Card className="p-6 flex items-center justify-between">
        <div><div className="font-semibold">Sign out</div><div className="text-sm text-muted-foreground">End your session.</div></div>
        <Button variant="outline" onClick={signOut}>Sign out</Button>
      </Card>
    </div>
  );
}

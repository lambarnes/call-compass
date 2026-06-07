import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createCall, type CallBriefInput } from "@/lib/calls.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/calls/new")({
  component: NewCallBrief,
});

const CALL_TYPES = ["Discovery", "Diagnostic", "Pitch / proposal", "Working session", "Check-in", "Renewal", "Other"];
const DEAL_STAGES = ["First conversation", "Active eval", "Proposal", "Negotiation", "Closed-won", "Closed-lost", "N/A"];
const AUTHORITY = ["Confirmed", "Unclear", "Not Decision Maker", "Multiple Stakeholders"];
const BUDGET = ["Confirmed", "Range Mentioned", "Unclear", "No Budget", "Avoided"];

function NewCallBrief() {
  const navigate = useNavigate();
  const create = useServerFn(createCall);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CallBriefInput>({
    title: "", company_name: "", contact_name: "", contact_role: "",
    call_type: "Discovery", call_datetime: "", meeting_objective: "",
    business_context: "", what_i_need_to_learn: "", planned_questions: "",
    known_concerns: "", risks_to_watch: "", desired_outcome: "",
    deal_stage: "First conversation", authority_status: "Unclear", budget_status: "Unclear", notes: "",
  });

  function set<K extends keyof CallBriefInput>(k: K, v: CallBriefInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, call_datetime: form.call_datetime ? new Date(form.call_datetime).toISOString() : null };
      const row = await create({ data: payload });
      toast.success("Call brief created.");
      navigate({ to: "/calls/$id", params: { id: row.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create");
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold">New call brief</h1>
        <p className="text-sm text-muted-foreground mt-1">Capture the context before the call so the live radar has something to think with.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">The call</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <Label>Title *</Label>
              <Input required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Acme Discovery — VP Operations" />
            </div>
            <div className="space-y-1.5"><Label>Company</Label><Input value={form.company_name ?? ""} onChange={(e) => set("company_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Contact name</Label><Input value={form.contact_name ?? ""} onChange={(e) => set("contact_name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Contact role</Label><Input value={form.contact_role ?? ""} onChange={(e) => set("contact_role", e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Call type</Label>
              <Select value={form.call_type ?? ""} onValueChange={(v) => set("call_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CALL_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 md:col-span-2"><Label>Date & time</Label><Input type="datetime-local" value={form.call_datetime ?? ""} onChange={(e) => set("call_datetime", e.target.value)} /></div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Objective & context</h2>
          <div className="space-y-1.5"><Label>Meeting objective</Label><Textarea rows={3} value={form.meeting_objective ?? ""} onChange={(e) => set("meeting_objective", e.target.value)} placeholder="What does success in this call look like?" /></div>
          <div className="space-y-1.5"><Label>Business context</Label><Textarea rows={3} value={form.business_context ?? ""} onChange={(e) => set("business_context", e.target.value)} placeholder="What's happening at their company that makes this call relevant?" /></div>
          <div className="space-y-1.5"><Label>What I need to learn</Label><Textarea rows={3} value={form.what_i_need_to_learn ?? ""} onChange={(e) => set("what_i_need_to_learn", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Planned questions</Label><Textarea rows={4} value={form.planned_questions ?? ""} onChange={(e) => set("planned_questions", e.target.value)} placeholder="One question per line" /></div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Risks & outcome</h2>
          <div className="space-y-1.5"><Label>Known concerns</Label><Textarea rows={2} value={form.known_concerns ?? ""} onChange={(e) => set("known_concerns", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Risks to watch</Label><Textarea rows={2} value={form.risks_to_watch ?? ""} onChange={(e) => set("risks_to_watch", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Desired outcome</Label><Textarea rows={2} value={form.desired_outcome ?? ""} onChange={(e) => set("desired_outcome", e.target.value)} /></div>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-1.5"><Label>Deal stage</Label>
              <Select value={form.deal_stage ?? ""} onValueChange={(v) => set("deal_stage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEAL_STAGES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Authority</Label>
              <Select value={form.authority_status ?? ""} onValueChange={(v) => set("authority_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{AUTHORITY.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Budget</Label>
              <Select value={form.budget_status ?? ""} onValueChange={(v) => set("budget_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{BUDGET.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} /></div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
          <Button type="submit" disabled={loading || !form.title}>{loading ? "Creating..." : "Create brief"}</Button>
        </div>
      </form>
    </div>
  );
}

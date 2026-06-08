import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitFeedback, type FeedbackInput } from "@/lib/feedback.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { SAMPLE_SCENARIOS } from "@/lib/sample-scenarios";

export const Route = createFileRoute("/_authenticated/feedback")({
  component: FeedbackPage,
});

const BUTTONS = [
  "What are they really saying?",
  "What emotion or hesitation is showing?",
  "What should I ask now?",
  "Should I probe, pause, or close?",
  "Is this a buying signal?",
  "Is this a risk signal?",
  "Am I moving too fast?",
  "What should I avoid saying?",
];

const YES_NO = ["Yes", "Maybe", "No"];

const empty: FeedbackInput = {
  name: "", email: "", role: "", company: "",
  scenario_tested: "", most_useful_button: "", least_useful_button: "",
  usefulness_rating: 7, accuracy_rating: 7, clarity_rating: 7,
  would_use_again: "", would_pay: "",
  confusing_parts: "", missing_features: "", comments: "",
};

function FeedbackPage() {
  const submit = useServerFn(submitFeedback);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FeedbackInput>(empty);

  function set<K extends keyof FeedbackInput>(k: K, v: FeedbackInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await submit({ data: form });
      toast.success("Thanks! Feedback submitted.");
      setForm(empty);
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-start gap-3 mb-6">
        <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Beta feedback</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us what worked, what didn't, and what's missing.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">About you</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5"><Label>Name</Label><Input value={form.name ?? ""} onChange={(e) => set("name", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Role</Label><Input value={form.role ?? ""} onChange={(e) => set("role", e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Company</Label><Input value={form.company ?? ""} onChange={(e) => set("company", e.target.value)} /></div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">What you tested</h2>
          <div className="space-y-1.5">
            <Label>Scenario tested</Label>
            <Select value={form.scenario_tested ?? ""} onValueChange={(v) => set("scenario_tested", v)}>
              <SelectTrigger><SelectValue placeholder="Choose a scenario or your own call" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="My own call">My own call</SelectItem>
                {SAMPLE_SCENARIOS.map((s) => <SelectItem key={s.id} value={s.title}>{s.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Most useful button</Label>
              <Select value={form.most_useful_button ?? ""} onValueChange={(v) => set("most_useful_button", v)}>
                <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                <SelectContent>{BUTTONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Least useful button</Label>
              <Select value={form.least_useful_button ?? ""} onValueChange={(v) => set("least_useful_button", v)}>
                <SelectTrigger><SelectValue placeholder="Choose one" /></SelectTrigger>
                <SelectContent>{BUTTONS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-6">
          <h2 className="font-semibold">Ratings</h2>
          {([
            ["usefulness_rating", "Usefulness"],
            ["accuracy_rating", "Accuracy"],
            ["clarity_rating", "Clarity"],
          ] as const).map(([key, label]) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{label}</Label>
                <span className="text-sm tabular-nums text-muted-foreground">{form[key] ?? 0} / 10</span>
              </div>
              <Slider
                min={1} max={10} step={1}
                value={[Number(form[key] ?? 7)]}
                onValueChange={(v) => set(key, v[0])}
              />
            </div>
          ))}
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Intent</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Would you use this again?</Label>
              <Select value={form.would_use_again ?? ""} onValueChange={(v) => set("would_use_again", v)}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{YES_NO.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Would you pay for this?</Label>
              <Select value={form.would_pay ?? ""} onValueChange={(v) => set("would_pay", v)}>
                <SelectTrigger><SelectValue placeholder="Choose" /></SelectTrigger>
                <SelectContent>{YES_NO.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold">Open feedback</h2>
          <div className="space-y-1.5"><Label>What was confusing?</Label><Textarea rows={3} value={form.confusing_parts ?? ""} onChange={(e) => set("confusing_parts", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>What is missing?</Label><Textarea rows={3} value={form.missing_features ?? ""} onChange={(e) => set("missing_features", e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Additional comments</Label><Textarea rows={3} value={form.comments ?? ""} onChange={(e) => set("comments", e.target.value)} /></div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit feedback"}</Button>
        </div>
      </form>
    </div>
  );
}

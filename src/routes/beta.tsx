import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Radar, MessageSquare, Library, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/beta")({
  ssr: false,
  component: BetaGuide,
});

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-7 w-7 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-semibold">{n}</div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">{children}</div>
    </Card>
  );
}

function BetaGuide() {
  const navigate = useNavigate();
  async function startBeta() {
    const { data } = await supabase.auth.getUser();
    navigate({ to: data.user ? "/dashboard" : "/auth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-primary/15 flex items-center justify-center">
            <Radar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Beta program</div>
            <h1 className="text-2xl md:text-3xl font-semibold">Call Compass — Beta Tester Guide</h1>
          </div>
        </div>

        <Section n={1} title="What Call Compass is">
          <p>Call Compass is a real-time guidance cockpit for high-stakes calls. You bring the call context and a transcript; it surfaces what's actually being said, hidden risks, and the move to make next.</p>
        </Section>

        <Section n={2} title="What to test">
          <p>The full flow: Call Brief → Live Radar → AI guidance buttons → After-call summary. Then submit feedback. If you don't have a real call, use a sample scenario.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm"><Link to="/samples"><Library className="h-4 w-4" /> Try sample scenarios</Link></Button>
          </div>
        </Section>

        <Section n={3} title="How to create a Call Brief">
          <p>Go to <span className="font-medium text-foreground">New Call</span> in the sidebar. Fill in the title, contact, objective, business context and any risks. You can optionally paste a Zoom meeting link. Save the brief — it becomes the context the AI reasons over.</p>
        </Section>

        <Section n={4} title="How to use Manual Transcript mode">
          <p>Open <span className="font-medium text-foreground">Start Live Radar</span> from the call. Leave the source as <span className="font-medium text-foreground">Manual Transcript</span> (Zoom is coming soon). Paste or type transcript text as the call unfolds, then save segments so the AI has fresh material.</p>
        </Section>

        <Section n={5} title="The 4 buttons to test first">
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium text-foreground">What are they really saying?</span></li>
            <li><span className="font-medium text-foreground">What should I ask now?</span></li>
            <li><span className="font-medium text-foreground">Is this a buying signal?</span></li>
            <li><span className="font-medium text-foreground">Is this a risk signal?</span></li>
          </ul>
          <p>Each one produces a distinct executive insight. Try them after pasting at least a few transcript lines.</p>
        </Section>

        <Section n={6} title="How to end and summarize the call">
          <p>Click <span className="font-medium text-foreground">End &amp; summarize</span> in the Live Radar header. The after-call summary captures meeting purpose, diagnosed root issue, decisions, risks and a draft follow-up email.</p>
        </Section>

        <Section n={7} title="How to submit feedback">
          <p>When you've tried at least one full flow, open the <span className="font-medium text-foreground">Feedback</span> form. Rate usefulness, accuracy and clarity, tell us what was confusing, and what's missing.</p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm"><Link to="/feedback"><MessageSquare className="h-4 w-4" /> Open feedback form</Link></Button>
          </div>
        </Section>

        <div className="flex justify-center pt-2">
          <Button size="lg" onClick={startBeta}><BookOpen className="h-4 w-4" /> Start Beta Test</Button>
        </div>
      </div>
    </div>
  );
}

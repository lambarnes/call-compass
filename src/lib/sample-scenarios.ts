export type SampleScenario = {
  id: string;
  title: string;
  company_name: string;
  contact_name: string;
  contact_role: string;
  call_type: string;
  meeting_objective: string;
  business_context: string;
  transcript: string;
  suggested_buttons: string[];
};

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: "telecom-cybersecurity-launch",
    title: "Telecom Cybersecurity Launch",
    company_name: "NorthLink Telecom",
    contact_name: "Priya Shah",
    contact_role: "VP Network Security",
    call_type: "Discovery",
    meeting_objective:
      "Understand readiness for launching a managed cybersecurity offering to enterprise customers within 6 months.",
    business_context:
      "Carrier-grade telecom moving into managed security. Board is pushing a Q3 launch; internal SOC is understaffed and tooling is fragmented.",
    transcript: `Priya: Look, the board wants this launched in Q3 no matter what. I'm the one who has to make it real.
Me: What's the biggest gap between today and that launch?
Priya: Honestly? People. We have the platform money, but my SOC is half the size it needs to be, and HR can't hire fast enough.
Me: Is leadership aware of the staffing constraint?
Priya: They know on paper. They don't feel it. Every status review they ask why we're not further along, and I'm tired of being the bottleneck.`,
    suggested_buttons: [
      "What are they really saying?",
      "Is this a risk signal?",
      "What should I ask now?",
    ],
  },
  {
    id: "saas-revenue-stalled",
    title: "SaaS Revenue Stalled",
    company_name: "Bramble Analytics",
    contact_name: "Marcus Liu",
    contact_role: "CEO",
    call_type: "Diagnostic",
    meeting_objective:
      "Diagnose why net-new ARR has flatlined for two quarters despite strong pipeline coverage.",
    business_context:
      "Series B analytics SaaS, $14M ARR, 4x pipeline coverage but win rates have dropped from 28% to 16%. CEO suspects a positioning problem; CRO blames product.",
    transcript: `Marcus: Pipeline looks great on paper. We're just not converting.
Me: When deals slip, what reason do reps put in the CRM?
Marcus: "Timing." Always "timing." Which I don't believe.
Me: What do you think it actually is?
Marcus: I think buyers can't tell us apart from three other vendors. But my CRO will not hear that. He keeps asking for more features.`,
    suggested_buttons: [
      "What are they really saying?",
      "Is this a buying signal?",
      "Should I probe, pause, or close?",
    ],
  },
  {
    id: "scope-creep-client",
    title: "Scope Creep Client",
    company_name: "Halberd Industrial",
    contact_name: "Dana Okafor",
    contact_role: "COO",
    call_type: "Check-in",
    meeting_objective:
      "Re-align on phase 2 scope before it expands beyond the signed statement of work.",
    business_context:
      "Mid-engagement. Original scope was a procurement workflow rebuild. Client has started asking for adjacent finance integrations not in the SOW.",
    transcript: `Dana: While you're in there, could the team also wire up the Oracle GL feed? It's a small thing.
Me: That's not in the current SOW — it would change the timeline.
Dana: It can't be that much work, right? Your people are already on-site.
Me: I want to make sure we land phase 1 cleanly first. What's driving the urgency on the GL piece?
Dana: My CFO heard you were here and asked. I don't want to tell him no.`,
    suggested_buttons: [
      "Is this a risk signal?",
      "What should I avoid saying?",
      "Am I moving too fast?",
    ],
  },
  {
    id: "budget-avoidance-prospect",
    title: "Budget Avoidance Prospect",
    company_name: "Crestmoor Health",
    contact_name: "Alex Renner",
    contact_role: "Director of Operations",
    call_type: "Discovery",
    meeting_objective:
      "Qualify budget and authority before investing more cycles in a custom proposal.",
    business_context:
      "Inbound lead. Highly engaged on calls, attended 3 meetings, requested a custom demo. Has not answered any pricing or budget questions directly.",
    transcript: `Alex: This is exactly what we need. When can we see a tailored proposal?
Me: Happy to. Before I scope it — what budget range are we working inside?
Alex: Let's not get into that yet. Show me what's possible and we'll figure it out.
Me: I hear that. The reason I ask is the shape of the solution changes a lot at $50k vs $250k.
Alex: I really would rather see the proposal first.`,
    suggested_buttons: [
      "Is this a buying signal?",
      "Is this a risk signal?",
      "What should I ask now?",
    ],
  },
  {
    id: "strong-buying-signal",
    title: "Strong Buying Signal",
    company_name: "Vellichor Robotics",
    contact_name: "Sam Greene",
    contact_role: "VP Engineering",
    call_type: "Pitch / proposal",
    meeting_objective:
      "Confirm decision criteria and timeline so we can move to a paper contract this week.",
    business_context:
      "Late-stage opportunity. Champion has shared internal eval doc. Procurement was looped in last week.",
    transcript: `Sam: We've made our decision internally. I want to walk through what onboarding looks like.
Me: Great. Who else needs to sign off before paper?
Sam: Procurement is the last gate. I already told them you're the choice.
Me: What's a realistic start date if we sign this week?
Sam: Two weeks from signature. My team has cleared the calendar.`,
    suggested_buttons: [
      "Is this a buying signal?",
      "Should I probe, pause, or close?",
      "Am I moving too fast?",
    ],
  },
  {
    id: "founder-dependency-bottleneck",
    title: "Founder Dependency / Operator Bottleneck",
    company_name: "Kilnwood Ceramics",
    contact_name: "Rita Moreau",
    contact_role: "Founder & CEO",
    call_type: "Working session",
    meeting_objective:
      "Surface where the founder is the bottleneck and what could be safely delegated in the next 60 days.",
    business_context:
      "$6M revenue, 22 employees. Founder is in every decision: hiring, pricing, customer escalations, product. Growth has plateaued.",
    transcript: `Rita: I'm in every meeting because if I'm not, the wrong call gets made.
Me: Can you give me a recent example of "the wrong call"?
Rita: Last month my ops lead approved a price exception that cost us the margin on a whole order. So now I review them all.
Me: How long does that take you each week?
Rita: Six, eight hours. Plus the second-guessing afterward.`,
    suggested_buttons: [
      "What are they really saying?",
      "Is this a risk signal?",
      "What should I ask now?",
    ],
  },
];

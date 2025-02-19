export type FAQItem = {
  question: string;
  answer: {
    intro?: string;
    points: string[];
    codeExample?: string;
  };
};

export const faqData: FAQItem[] = [
  {
    question: "Why another voice AI company?",
    answer: {
      intro:
        "While there are many voice AI companies, we saw a gap in the voice AI market for up and coming AI capabilities:",
      points: [
        "Focus on browser-native actions that let voice agents interact with web elements",
        "End-to-end voice processing that removes the speech-to-text-to-speech pipeline",
        "Integration in minutes with no-code platforms",
      ],
    },
  },
  {
    question: "What makes Audentic different from chatbots?",
    answer: {
      intro:
        "Audentic agents are built to go beyond text-based digital interactions:",
      points: [
        "Voice first multimodal conversations instead of just text",
        "Ability to navigate websites and fill forms",
        "Real-time assistance that runs in the background while users continue with other tasks",
      ],
    },
  },
  {
    question: "How are you making integration easy?",
    answer: {
      intro: "We are obsessed with making integration as easy as possible:",
      points: [
        "Use our react sdk or copy and paste a simple embed code to integrate",
        "Configure using our no-code dashboard",
        "Use pre-built components for popular frameworks",
      ],
      codeExample: `
<audentic-embed agent-id="AGENT-ID"></audentic-embed>
<script src="https://unpkg.com/browse/@audentic/react/dist/embed.js" async type="text/javascript">
</script>
      `,
    },
  },
  {
    question: "What does 'browser-native actions' mean?",
    answer: {
      intro: "Voice agents operate within the browser environment:",
      points: [
        "Agents interact directly with elements like buttons and forms",
        "Actions execute in real time and are visible to users",
        "This ensures transparency, reliability, and verifies any agent actions",
      ],
    },
  },
  {
    question: "How much does it cost?",
    answer: {
      intro: "Pricing details coming soon!",
      points: [
        "Stay tuned for flexible plans for businesses of all sizes",
        "In the meantime, reach out to us at info@audentic.io for a quote",
      ],
    },
  },
];

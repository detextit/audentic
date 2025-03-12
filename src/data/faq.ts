export type FAQItem = {
  question: string;
  answer: string; // Markdown formatted string
};

export const faqData: FAQItem[] = [
  {
    question: "Why another voice AI company?",
    answer: `While there are many voice AI companies, we saw a gap in the voice AI market for up and coming AI capabilities:

* Focus on browser-native actions that let voice agents interact with web elements
* End-to-end voice processing that removes the speech-to-text-to-speech pipeline
* Integration in minutes with no-code platforms`,
  },
  {
    question: "What makes Audentic different from chatbots?",
    answer: `Audentic agents are built to go beyond text-based digital interactions:

* Voice first multimodal conversations instead of just text
* Ability to navigate websites and fill forms
* Real-time assistance that runs in the background while users continue with other tasks`,
  },
  {
    question: "How is Audentic different from other voice AI platforms?",
    answer: `

### The Problem
Many current no-code voice AI platforms have evolved into complex systems that defeat their original purpose. While platforms promise no-code development, they often require significant technical expertise to:

* Configure complex token limits and temperature settings
* Manage multiple layers of technical parameters
* Navigate extensive integration options requiring deep system architecture knowledge

### Our Approach
We focus on a user-centric solution:

#### Use Case First
* Users simply describe their needs (like "build a travel agent" or "create NDAs")
* Technical complexities are handled behind the scenes
* Focus remains on business objectives rather than technical specifications

#### Streamlined Development
* Quick creation, testing, and deployment without technical expertise
* Elimination of multiple configuration layers
* Automatic optimization of voice agent parameters

The key is abstracting technical complexity while delivering sophisticated functionality, allowing businesses to focus on their use cases rather than becoming AI architecture experts.`,
  },
  {
    question: "How are you making integration easy?",
    answer: `We are obsessed with making integration as easy as possible:

* Use our React SDK or copy and paste a simple embed code to integrate
* Configure using our no-code dashboard
* Use pre-built components for popular frameworks

\`\`\`html
<audentic-embed agent-id="AGENT-ID"></audentic-embed>
<script src="https://unpkg.com/@audentic/react/dist/embed.js" async type="text/javascript">
</script>
\`\`\``,
  },
  {
    question: "What does 'browser-native actions' mean?",
    answer: `Voice agents operate within the browser environment:

* Agents interact directly with elements like buttons and forms
* Actions execute in real time and are visible to users
* This ensures transparency, reliability, and verifies any agent actions`,
  },
  {
    question: "How much does it cost?",
    answer: `Pricing details coming soon!

* Stay tuned for flexible plans for businesses of all sizes
* In the meantime, reach out to us at info@audentic.io for a quote`,
  },
];

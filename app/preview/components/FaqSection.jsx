"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    question: "What is Auctor RC used for?",
    answer:
      "Auctor RC is used to practice and improve the Reading Comprehension section across competitive exams, including CAT, XAT, CLAT, IIFT, SNAP, NMAT, TISSNET, and CUET English.",
  },
  {
    question: "Who built Auctor RC?",
    answer:
      "Auctor Labs, founded by Neeraj sir, a competitive exam teacher with over 15 years of classroom experience.",
  },
  {
    question: "How is Auctor RC different from a normal RC question bank?",
    answer:
      "A question bank gives you passages and an answer key. Auctor RC tracks what you get wrong and why, then adjusts your next practice session around that specific gap, instead of moving through a fixed set in a fixed order.",
  },
  {
    question: "What is Birbal in Auctor RC?",
    answer:
      "Birbal is the AI tutor inside Auctor RC. It explains the reasoning behind each RC answer, including why a tempting wrong option is wrong, instead of just marking a question right or wrong.",
  },
  {
    question: "What is Reader DNA?",
    answer:
      "Reader DNA is a profile of how you actually read, built from your practice data. For example, it can flag that you read fast but lose accuracy, a pattern called an “Impulsive Reader,” so you know exactly what to fix.",
  },
  {
    question: "Which exams does Auctor RC cover?",
    answer: "CAT, XAT, CLAT, IIFT, SNAP, NMAT, TISSNET, and CUET English.",
  },
  {
    question: "How much does Auctor RC cost?",
    answer: "Auctor RC is ₹399 a month or ₹1,999 for the year.",
  },
  {
    question: "Is there a free trial?",
    answer: "Yes, Auctor RC offers a free trial period before you need to subscribe.",
  },
  {
    question: "Does Auctor RC replace a coaching institute?",
    answer:
      "No. It’s built to work alongside a coaching batch or self-study, not replace a teacher. Institutes also use Auctor RC directly under their own branding, with faculty dashboards to track student progress.",
  },
  {
    question: "How much time does Auctor RC take per day?",
    answer:
      "The core Daily Workout is a structured 30-minute session, built so you don’t need to decide what to practice each day.",
  },
  {
    question: "Does Auctor RC only help with speed, or also accuracy?",
    answer:
      "Both, and specifically how they trade off against each other. Reader DNA is built around the idea that reading faster without checking accuracy is not real improvement, so the platform tracks both together rather than optimizing for speed alone.",
  },
  {
    question: "Can institutes use Auctor RC under their own brand?",
    answer:
      "Yes. Auctor RC offers a white-labeled version for coaching institutes, with faculty dashboards and parent progress reports.",
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answer,
    },
  })),
};

export default function FaqSection() {
  return (
    <section
      aria-labelledby="auctor-rc-faq-heading"
      className="relative isolate z-10 px-6 py-24 md:py-32"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
            Frequently Asked Questions
          </div>
          <h2
            id="auctor-rc-faq-heading"
            className="mt-6 text-4xl font-bold leading-tight text-white md:text-5xl"
          >
            Everything you need to know about Auctor RC.
          </h2>
        </div>

        <Accordion type="single" collapsible className="grid gap-4">
          {FAQS.map(({ question, answer }, index) => (
            <AccordionItem
              key={question}
              value={`faq-${index + 1}`}
              className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B1120]/90 px-5 shadow-lg shadow-black/10 transition data-[state=open]:border-cyan-400/25 data-[state=open]:bg-[#0F172A] sm:px-7"
            >
              <AccordionTrigger className="gap-5 py-6 text-base font-semibold text-white hover:text-cyan-200 hover:no-underline sm:text-lg">
                <span className="flex items-start gap-4">
                  <span className="hidden pt-0.5 text-xs font-bold tracking-wider text-white/25 sm:inline">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{question}</span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="border-t border-white/[0.08] pb-6 pt-5 text-base leading-8 text-white/55 sm:pl-10">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

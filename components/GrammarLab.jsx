"use client";

import { useState } from "react";
import {
  BookOpen,
  Brain,
  Sparkles,
  Shuffle,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

const GRAMMAR_CATEGORIES = [
  {
    id: "foundations",
    name: "Grammar Foundations",
    description: "Build the fundamental building blocks of English grammar.",
    color: "cyan",
    topics: [
      { id: "parts-of-speech", name: "Parts of Speech" },
      { id: "nouns", name: "Nouns" },
      { id: "pronouns", name: "Pronouns" },
      { id: "adjectives", name: "Adjectives" },
      { id: "adverbs", name: "Adverbs" },
      { id: "articles-determiners", name: "Articles & Determiners" },
    ],
  },
  {
    id: "verbs",
    name: "Verbs & Sentence Mechanics",
    description: "Master verbs, tense, agreement and verb forms.",
     color: "violet",
    topics: [
      { id: "verbs-auxiliaries", name: "Verbs & Auxiliaries" },
      { id: "tenses", name: "Tenses" },
      { id: "subject-verb-agreement", name: "Subject–Verb Agreement" },
      { id: "modals", name: "Modals" },
      {
        id: "gerunds-infinitives-participles",
        name: "Gerunds, Infinitives & Participles",
      },
    ],
  },
  {
    id: "sentence-structure",
    name: "Sentence Structure",
    description: "Understand how words, phrases and clauses work together.",
     color: "emerald",
    topics: [
      { id: "prepositions", name: "Prepositions" },
      { id: "conjunctions", name: "Conjunctions" },
      { id: "clauses-phrases", name: "Clauses & Phrases" },
      { id: "conditionals", name: "Conditionals" },
      {
        id: "sentence-structure-word-order",
        name: "Sentence Structure & Word Order",
      },
    ],
  },
  {
    id: "advanced",
    name: "Advanced Grammar",
    description: "Handle complex grammatical relationships and common traps.",
     color: "amber",
    topics: [
      { id: "modifiers", name: "Modifiers" },
      { id: "parallelism", name: "Parallelism" },
      { id: "comparisons", name: "Comparisons" },
      { id: "active-passive-voice", name: "Active & Passive Voice" },
      {
        id: "direct-indirect-speech",
        name: "Direct & Indirect Speech",
      },
      { id: "question-tags", name: "Question Tags" },
    ],
  },
  {
    id: "exam-application",
    name: "Exam Application",
    description: "Apply grammar rules to competitive-exam question formats.",
     color: "rose",
    topics: [
      { id: "common-errors-usage", name: "Common Errors & Usage" },
      {
        id: "sentence-correction-error-detection",
        name: "Sentence Correction & Error Detection",
      },
    ],
  },
];

export default function GrammarLab() {
  const [activeTab, setActiveTab] = useState("practice");
  const [grammarScreen, setGrammarScreen] = useState("home");

  const [practiceMode, setPracticeMode] = useState("home");
// home | topic-select | difficulty

const [selectedTopic, setSelectedTopic] = useState(null);
const [showDifficultyModal, setShowDifficultyModal] = useState(false);

const generateGrammarTest = async (difficulty) => {
  try {
    console.log("Generating:", selectedTopic.id, difficulty);

    const res = await fetch("/api/grammar-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topicId: selectedTopic.id,
        difficulty: difficulty,
        count: 3,
      }),
    });

    const data = await res.json();

    console.log("GRAMMAR TEST RESULT:", data);

    if (!res.ok) {
      console.error("GRAMMAR GENERATION FAILED:", data);
      return;
    }

    console.log("QUESTIONS:", data.questions);

  } catch (error) {
    console.error("GRAMMAR GENERATION ERROR:", error);
  }
};
const categoryColors = {
  cyan: {
    heading: "text-cyan-400",
    description: "text-cyan-300/60",
    line: "bg-cyan-500/30",
  },

  violet: {
    heading: "text-violet-400",
    description: "text-violet-300/60",
    line: "bg-violet-500/30",
  },

  emerald: {
    heading: "text-emerald-400",
    description: "text-emerald-300/60",
    line: "bg-emerald-500/30",
  },

  amber: {
    heading: "text-amber-400",
    description: "text-amber-300/60",
    line: "bg-amber-500/30",
  },

  rose: {
    heading: "text-rose-400",
    description: "text-rose-300/60",
    line: "bg-rose-500/30",
  },
};

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8 md:px-8">
      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Brain size={25} />
            </div>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Grammar Lab
              </h1>

              <p className="text-slate-400 mt-1">
                Master grammar through intelligent practice and diagnosis.
              </p>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="inline-flex bg-slate-900 border border-slate-800 rounded-2xl p-1 mb-8">
          <button
            onClick={() => setActiveTab("practice")}
            className={`px-5 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "practice"
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Practice
          </button>

          <button
            onClick={() => setActiveTab("lessons")}
            className={`px-5 py-3 rounded-xl font-semibold transition-all ${
              activeTab === "lessons"
                ? "bg-violet-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Lessons
          </button>
        </div>

       {activeTab === "practice" && practiceMode === "home" && (
          <div className="space-y-8">

            {/* HERO */}
            <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/80 via-slate-900 to-slate-950 p-6 md:p-8">
              <div className="max-w-2xl">
                <div className="text-violet-400 text-sm font-bold mb-3">
                  ✨ INTELLIGENT GRAMMAR PRACTICE
                </div>

                <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                  Choose what you want to master.
                </h2>

                <p className="text-slate-300 mt-4 leading-relaxed">
                  Select a grammar topic and difficulty. Auctor will create a
                  focused 10-question test and diagnose exactly where your
                  understanding breaks down.
                </p>
              </div>
            </div>

            {/* PRACTICE MODES */}
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Start Practice
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

       <PracticeCard
  icon={<BookOpen size={25} />}
  title="Topic Practice"
  desc="Choose a specific grammar concept and master it through focused questions."
  badge="10 Questions"
  color="blue"
  onClick={() => setPracticeMode("topic-select")}
/>

<PracticeCard
  icon={<Shuffle size={25} />}
  title="Mixed Grammar Test"
  desc="Test yourself across multiple grammar concepts in one intelligent assessment."
  badge="Mixed Topics"
  color="purple"
/>

<PracticeCard
  icon={<Brain size={25} />}
  title="Weakness Training"
  desc="Practice the grammar concepts where your past performance needs improvement."
  badge="Personalised"
  color="amber"
/>

<PracticeCard
  icon={<Sparkles size={25} />}
  title="AI Challenge"
  desc="Let Auctor choose the right topics and difficulty based on your performance."
  badge="Adaptive"
  color="emerald"
/>
              </div>
            </div>
          </div>
        )}

        {activeTab === "practice" && practiceMode === "topic-select" && (
  <div className="space-y-8">

    <button
      onClick={() => setPracticeMode("home")}
      className="text-slate-400 hover:text-white transition-colors font-medium"
    >
      ← Back to Grammar Lab
    </button>

    <div>
      <div className="text-blue-400 text-sm font-bold mb-2">
        TOPIC PRACTICE
      </div>

      <h2 className="text-3xl md:text-4xl font-bold">
        What do you want to master?
      </h2>

      <p className="text-slate-400 mt-3 max-w-2xl">
        Choose one grammar concept. Auctor will create a focused
        10-question test and diagnose exactly where your understanding
        needs improvement.
      </p>
    </div>

    <div className="space-y-8">
      {GRAMMAR_CATEGORIES.map((category) => (
        <div key={category.id}>

         <div className="mb-5">
  <div className="flex items-center gap-3">
    <h3
      className={`text-xl font-bold ${
        categoryColors[category.color]?.heading || "text-white"
      }`}
    >
      {category.name}
    </h3>

    <div
      className={`h-px flex-1 ${
        categoryColors[category.color]?.line || "bg-slate-800"
      }`}
    />
  </div>

  <p
    className={`text-sm mt-1 ${
      categoryColors[category.color]?.description || "text-slate-500"
    }`}
  >
    {category.description}
  </p>
</div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {category.topics.map((topic) => (
              <button
                key={topic.id}
               onClick={() => {
  setSelectedTopic(topic);
  setShowDifficultyModal(true);
}}
                className={`text-left p-4 rounded-2xl border transition-all ${
                  selectedTopic?.id === topic.id
                    ? "bg-blue-600/20 border-blue-500 text-white"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500/40 hover:bg-slate-800"
                }`}
              >
                <div className="font-semibold">
                  {topic.name}
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  10-question focused practice
                </div>
              </button>
            ))}
          </div>

        </div>
      ))}
    </div>

   
  </div>
)}



        {activeTab === "lessons" && (
          <div className="space-y-6">

            <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-3">
                <GraduationCap className="text-indigo-400" />
                <span className="text-indigo-400 text-sm font-bold">
                  GRAMMAR LESSONS
                </span>
              </div>

              <h2 className="text-3xl font-bold">
                Understand the rule. See the traps. Master the application.
              </h2>

              <p className="text-slate-400 mt-3 max-w-2xl">
                Detailed lessons built around concepts, examples, common
                mistakes and exam-style questions.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center">
              <BookOpen
                size={40}
                className="mx-auto text-indigo-400 mb-4"
              />

              <h3 className="text-xl font-semibold">
                Grammar lessons are coming next.
              </h3>

              <p className="text-slate-400 mt-2">
                We'll add the complete topic library here.
              </p>
            </div>

          </div>
        )}
        {showDifficultyModal && selectedTopic && (
  <div
    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={() => setShowDifficultyModal(false)}
  >
    <div
      className="w-full max-w-4xl rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl p-6 md:p-8"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="text-blue-400 text-sm font-bold mb-2">
            TOPIC PRACTICE
          </div>

          <h2 className="text-3xl md:text-4xl font-bold">
            {selectedTopic.name}
          </h2>

          <p className="text-slate-400 mt-2">
            Choose the difficulty for your 10-question focused practice test.
          </p>
        </div>

        <button
          onClick={() => setShowDifficultyModal(false)}
          className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
  <DifficultyCard
    level="Easy"
    description="Build your foundation with direct applications of the core rules."
    color="emerald"
    onClick={() => generateGrammarTest("easy")}
  />

  <DifficultyCard
    level="Moderate"
    description="Handle exam-style traps, exceptions and more complex constructions."
    color="amber"
    recommended
    onClick={() => generateGrammarTest("moderate")}
  />

  <DifficultyCard
    level="Hard"
    description="Face subtle errors, advanced traps and complex sentence structures."
    color="rose"
    onClick={() => generateGrammarTest("hard")}
  />
</div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}

function PracticeCard({ icon, title, desc, badge, color, onClick }) {
  const styles = {
    blue: {
      card: "bg-gradient-to-br from-blue-950/80 via-slate-900 to-slate-950 border-blue-500/30 hover:border-blue-400/60",
      icon: "bg-blue-500/10 text-blue-400",
      badge: "text-blue-300 bg-blue-500/10",
      action: "text-blue-400",
    },

    purple: {
      card: "bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 border-purple-500/30 hover:border-purple-400/60",
      icon: "bg-purple-500/10 text-purple-400",
      badge: "text-purple-300 bg-purple-500/10",
      action: "text-purple-400",
    },

    amber: {
      card: "bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 border-amber-500/30 hover:border-amber-400/60",
      icon: "bg-amber-500/10 text-amber-400",
      badge: "text-amber-300 bg-amber-500/10",
      action: "text-amber-400",
    },

    emerald: {
      card: "bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/30 hover:border-emerald-400/60",
      icon: "bg-emerald-500/10 text-emerald-400",
      badge: "text-emerald-300 bg-emerald-500/10",
      action: "text-emerald-400",
    },
  };

  const theme = styles[color] || styles.blue;

  return (
    <div
    onClick={onClick}
      className={`group rounded-2xl border p-6 transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl ${theme.card}`}
    >
      <div className="flex justify-between items-start gap-4">

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${theme.icon}`}
        >
          {icon}
        </div>

        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${theme.badge}`}
        >
          {badge}
        </span>
      </div>

      <h3 className="text-xl font-semibold mt-5">
        {title}
      </h3>

      <p className="text-slate-400 text-sm mt-2 leading-relaxed">
        {desc}
      </p>

      <div
        className={`flex items-center gap-2 text-sm font-semibold mt-5 group-hover:gap-3 transition-all ${theme.action}`}
      >
        Start
        <ArrowRight size={16} />
      </div>
    </div>
  );
}
function DifficultyCard({
  level,
  description,
  color,
  recommended = false,
  onClick,
}) {
  const styles = {
    emerald: {
      card: `
        bg-gradient-to-br
        from-emerald-950/50
        via-slate-900
        to-slate-950
        border-emerald-500/30
        hover:border-emerald-400/70
      `,
      icon: "bg-emerald-500/10 text-emerald-400",
      action: "text-emerald-400",
    },

    amber: {
      card: `
        bg-gradient-to-br
        from-amber-950/50
        via-slate-900
        to-slate-950
        border-amber-500/30
        hover:border-amber-400/70
      `,
      icon: "bg-amber-500/10 text-amber-400",
      action: "text-amber-400",
    },

    rose: {
      card: `
        bg-gradient-to-br
        from-rose-950/50
        via-slate-900
        to-slate-950
        border-rose-500/30
        hover:border-rose-400/70
      `,
      icon: "bg-rose-500/10 text-rose-400",
      action: "text-rose-400",
    },
  };

  const theme = styles[color];

  return (
    <button
      onClick={onClick}
      className={`
        relative
        w-full
        text-left
        rounded-2xl
        border
        p-6
        transition-all
        hover:-translate-y-1
        hover:shadow-xl
        ${theme.card}
      `}
    >
      {recommended && (
        <span className="
          absolute
          top-4
          right-4
          text-[10px]
          font-bold
          px-2
          py-1
          rounded-full
          bg-amber-500/10
          text-amber-300
          border
          border-amber-500/20
        ">
          RECOMMENDED
        </span>
      )}

      <div
        className={`
          w-12
          h-12
          rounded-xl
          flex
          items-center
          justify-center
          text-xl
          font-bold
          ${theme.icon}
        `}
      >
        {level.charAt(0)}
      </div>

      <h3 className="text-xl font-bold mt-5">
        {level}
      </h3>

      <p className="text-slate-400 text-sm mt-2 leading-relaxed min-h-[60px]">
        {description}
      </p>

      <div
        className={`
          mt-6
          font-semibold
          text-sm
          ${theme.action}
        `}
      >
        Select {level} →
      </div>
    </button>
  );
}
import PreviewNavbar from "../../components/PreviewNavbar"
import PreviewFooter from "../../components/PreviewFooter"
import { Card, CardContent } from "@/components/ui/card"

export default function About() {

return (
<>
<PreviewNavbar />

<main className="min-h-screen bg-[#0b0f2a] text-white overflow-hidden">


{/* HERO */}

<section className="relative mt-20 max-w-6xl mx-auto px-6 pt-52 pb-24 text-center">

<div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-500/20 blur-[160px] rounded-full pointer-events-none"></div>

<h1 className="relative z-10 text-orange-400 text-5xl md:text-6xl font-bold mb-6">
About Auctor Labs
</h1>

<p className="relative z-10 text-gray-400 text-lg max-w-2xl mx-auto">
We build AI-powered learning systems designed to train the
thinking skills required for competitive exams.
</p>

</section>

{/* STATS */}

<section className="max-w-6xl mx-auto px-6 py-20">

  <div className="grid md:grid-cols-4 gap-6">

    <Card className="bg-slate-900 border-slate-800 rounded-3xl">
      <CardContent className="p-8 text-center">

        <p className="text-4xl font-bold text-orange-400 mb-3">
          16+
        </p>

        <p className="text-slate-400 text-sm">
          Years Teaching Experience
        </p>

      </CardContent>
    </Card>


    <Card className="bg-slate-900 border-slate-800 rounded-3xl">
      <CardContent className="p-8 text-center">

        <p className="text-4xl font-bold text-orange-400 mb-3">
          10,000+
        </p>

        <p className="text-slate-400 text-sm">
          Students Taught
        </p>

      </CardContent>
    </Card>


    <Card className="bg-slate-900 border-slate-800 rounded-3xl">
      <CardContent className="p-8 text-center">

        <p className="text-4xl font-bold text-orange-400 mb-3">
          AI
        </p>

        <p className="text-slate-400 text-sm">
          Powered Learning System
        </p>

      </CardContent>
    </Card>


    <Card className="bg-slate-900 border-slate-800 rounded-3xl">
      <CardContent className="p-8 text-center">

        <p className="text-4xl font-bold text-orange-400 mb-3">
          CAT
        </p>

        <p className="text-slate-400 text-sm">
          Expert Training System
        </p>

      </CardContent>
    </Card>

  </div>

</section>

{/* MISSION */}

<section className="max-w-6xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-10">

  <Card className="bg-slate-900 border-slate-800 rounded-3xl">

    <CardContent className="p-10">

      <h2 className="text-3xl font-bold text-white mb-6">
        Our Mission
      </h2>

      <p className="text-slate-400 leading-relaxed text-lg">

        Most exam preparation platforms focus on solving more questions.

        <br /><br />

        But solving more questions does not necessarily improve thinking ability.

        <br /><br />

        At Auctor Labs we focus on training the cognitive skills behind exam performance — reading ability, reasoning and analytical thinking.

      </p>

    </CardContent>

  </Card>


  <Card className="bg-slate-900 border-slate-800 rounded-3xl">

    <CardContent className="p-10">

      <h3 className="text-3xl font-bold text-white mb-6">
        What We Believe
      </h3>

      <ul className="text-slate-300 space-y-5 text-lg">

        <li>✔️ Intelligence can be trained</li>
        <li>✔️ Reading ability is the foundation of reasoning</li>
        <li>✔️ AI can personalize learning</li>
        <li>✔️ Training systems beat random practice</li>

      </ul>

    </CardContent>

  </Card>

</section>


{/* WHY WE BUILT */}

{/* WHY WE BUILT */}

<section className="max-w-4xl mt-20 mx-auto px-6 py-24">

  <Card className="bg-slate-900 border-slate-800 rounded-3xl">

    <CardContent className="p-14 text-center">

      <h2 className="text-4xl font-bold text-orange-400 mb-8">
        Why We Built Auctor RC
      </h2>

      <p className="text-slate-400 text-lg leading-relaxed max-w-3xl mx-auto">

        After teaching CAT aspirants for years, we realized something surprising.

        <br /><br />

        Students were not struggling because of lack of practice.
        They were struggling because of weak reading ability.

        <br /><br />

        Reading comprehension is fundamentally a cognitive skill.

        <br /><br />

        Auctor RC was designed as a structured system to train reading speed, inference ability and reasoning patterns.

      </p>

    </CardContent>

  </Card>

</section>


{/* FOUNDER */}

<section className="max-w-6xl mt-20 mx-auto px-6 py-24">

  <Card className="bg-slate-900 border-slate-800 rounded-3xl overflow-hidden">

    <CardContent className="p-0">

      <div className="grid md:grid-cols-2">

        <div className="p-8">

          <img
            src="/founder.jpeg"
            className="rounded-3xl w-full h-full object-cover"
          />

        </div>


        <div className="p-10 flex flex-col justify-center">

          <h2 className="text-4xl font-bold text-white mb-6">
            Founder
          </h2>

          <p className="text-slate-400 leading-relaxed mb-6 text-lg">

            <strong className="text-orange-400">
              Neraj Kumar Naiyar
            </strong> is an IIT Roorkee graduate with over 16 years of experience teaching quantitative aptitude and logical reasoning for competitive exams.

          </p>

          <p className="text-slate-400 leading-relaxed text-lg">

            After working with thousands of students, he observed that reading ability is one of the biggest hidden determinants of CAT success.

            <br /><br />

            Auctor Labs was created to combine educational expertise with AI-driven learning systems.

          </p>

        </div>

      </div>

    </CardContent>

  </Card>

</section>


{/* VISION */}

<section className="max-w-4xl mt-20 mx-auto px-6 py-24">

  <Card className="bg-slate-900 border-slate-800 rounded-3xl">

    <CardContent className="p-16 text-center">

      <h2 className="text-4xl font-bold text-orange-400 mb-8">
        Our Vision
      </h2>

      <p className="text-slate-400 text-lg leading-relaxed max-w-3xl mx-auto">

        The future of education lies in intelligent systems that train thinking skills rather than just delivering content.

        <br /><br />

        Auctor Labs is building AI systems that help students develop deeper reading ability, reasoning and analytical thinking.

      </p>

    </CardContent>

  </Card>

</section>


</main>
<PreviewFooter/>
</>
)
}
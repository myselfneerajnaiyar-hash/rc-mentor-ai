import PreviewNavbar from "../../components/PreviewNavbar"
import PreviewFooter from "../../components/PreviewFooter"

import { Card, CardContent } from "@/components/ui/card"

import {
  Phone,
  MessageCircle,
  Mail,
  Instagram,
  Send,
  MessageSquare,
} from "lucide-react"

export default function Contact() {

  return (
    <>
      <PreviewNavbar />

      <main className="min-h-screen bg-[#0b0f2a] text-white overflow-hidden">

        {/* HERO */}

        <section className="mt-20 max-w-5xl mx-auto px-6 pt-36 pb-20 text-center">

          <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[160px] rounded-full pointer-events-none"></div>

          <h1 className="relative z-10 text-5xl md:text-6xl font-bold text-orange-400 mb-6">
            Contact Auctor Labs
          </h1>

          <p className="relative z-10 text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Connect with us for RC training, CAT preparation,
            partnerships, support and student community updates.
          </p>

        </section>


        {/* CONTACT GRID */}

        <section className="max-w-6xl mx-auto px-6 pb-28">

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">


            {/* PHONE */}

            <Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-orange-500/40 transition-all duration-300">

              <CardContent className="p-8">

                <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mb-6">
                  <Phone className="text-orange-400" size={28} />
                </div>

                <h3 className="text-3xl font-bold text-orange-400">
                  Phone
                </h3>

                <p className="mt-5 text-[15px] leading-8 text-slate-300">
                  Talk directly with the Auctor Labs team regarding
                  RC training, guidance and student support.
                </p>

                <a
                  href="tel:+918796182640"
                  className="mt-8 inline-flex w-fit items-center rounded-2xl bg-orange-500 hover:bg-orange-600 px-6 py-3 text-white font-semibold transition"
                >
                  Call 8796182640
                </a>

              </CardContent>

            </Card>


            {/* WHATSAPP */}

            <Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-green-500/40 transition-all duration-300">

              <CardContent className="p-8">

                <div className="w-14 h-14 rounded-2xl bg-green-500/15 flex items-center justify-center mb-6">
                  <MessageCircle className="text-green-400" size={28} />
                </div>

                <h3 className="text-3xl font-bold text-green-400">
                  WhatsApp
                </h3>

                <p className="mt-5 text-[15px] leading-8 text-slate-300">
                  Chat with us directly for quick responses,
                  RC guidance and support.
                </p>

                <a
                  href="https://wa.me/918796182640"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex w-fit items-center rounded-2xl bg-green-500 hover:bg-green-600 px-6 py-3 text-white font-semibold transition"
                >
                  Message on WhatsApp
                </a>

              </CardContent>

            </Card>


            {/* EMAIL */}

            <Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-blue-500/40 transition-all duration-300">

              <CardContent className="p-8">

                <div className="w-14 h-14 rounded-2xl bg-blue-500/15 flex items-center justify-center mb-6">
                  <Mail className="text-blue-400" size={28} />
                </div>

                <h3 className="text-3xl font-bold text-blue-400">
                  Email
                </h3>

                <p className="mt-5 text-[15px] leading-8 text-slate-300">
                  Reach out for partnerships, queries,
                  support and collaborations.
                </p>

                <a
                  href="mailto:info@auctorlabs.in"
                  className="mt-8 inline-flex w-fit items-center rounded-2xl bg-blue-500 hover:bg-blue-600 px-6 py-3 text-white font-semibold transition"
                >
                  info@auctorlabs.in
                </a>

              </CardContent>

            </Card>


            {/* INSTAGRAM */}

           <Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-red-500/40 transition-all duration-300">

  <CardContent className="p-8">

    <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mb-6">
      <Instagram className="text-red-400" size={28} />
    </div>

    <h3 className="text-3xl font-bold text-red-400">
      Instagram
    </h3>

    <p className="mt-5 text-[15px] leading-8 text-slate-300">

      Daily RC reels, CAT strategies, reading psychology
      and student improvement insights.

    </p>

    <a
      href="https://instagram.com/auctorlabs.in"
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 inline-flex w-fit items-center rounded-2xl bg-red-500 hover:bg-red-600 px-6 py-3 text-white font-semibold transition"
    >
      Follow Instagram
    </a>

  </CardContent>

</Card>
            {/* TELEGRAM */}

            <Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-cyan-500/40 transition-all duration-300">

              <CardContent className="p-8">

                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 flex items-center justify-center mb-6">
                  <Send className="text-cyan-400" size={28} />
                </div>

                <h3 className="text-3xl font-bold text-cyan-400">
                  Telegram
                </h3>

                <p className="mt-5 text-[15px] leading-8 text-slate-300">

                  Receive free RC passages, CAT resources,
                  daily practice sets and important announcements.

                </p>

                <a
                  href="https://t.me/auctorlab"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex w-fit items-center rounded-2xl bg-blue-500 hover:bg-blue-600 px-6 py-3 text-white font-semibold transition"
                >
                  Join Telegram
                </a>

              </CardContent>

            </Card>


            {/* WHATSAPP CHANNEL */}

            <Card className="bg-slate-900 border-slate-800 rounded-3xl hover:border-emerald-500/40 transition-all duration-300">

              <CardContent className="p-8">

                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mb-6">
                  <MessageSquare className="text-emerald-400" size={28} />
                </div>

                <h3 className="text-3xl font-bold text-emerald-400">
                  WhatsApp Channel
                </h3>

                <p className="mt-5 text-[15px] leading-8 text-slate-300">

                  Join our WhatsApp channel for quick updates,
                  RC discussions and CAT preparation insights.

                </p>

                <a
                  href="https://whatsapp.com/channel/0029VbBakAt8PgsO5RdHQ12L"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-8 inline-flex w-fit items-center rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-6 py-3 text-white font-semibold transition"
                >
                  Join WhatsApp
                </a>

              </CardContent>

            </Card>

          </div>

        </section>

      </main>

      <PreviewFooter />

    </>
  )
}
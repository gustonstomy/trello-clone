import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Users, Layers, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-linear-to-br from-[#003465] via-[#001f3f] to-[#003465]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#0085FF] opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#0085FF] opacity-5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>

      <nav className="sticky top-0 z-50 px-6 py-4 border-b border-[#0085FF]/20 backdrop-blur-sm bg-[#003465]/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-linear-to-br from-[#0085FF] to-[#003465] rounded-lg"></div>
            <span className="text-white font-bold text-xl">Trello Pro</span>
          </div>
          <div className="flex gap-3">
            <Link href="/auth/login">
              <Button
                variant="ghost"
                className="text-blue-200 hover:text-white hover:bg-[#0085FF]/20 transition-all"
              >
                Log in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-[#0085FF]/10 hover:shadow-lg hover:shadow-[#0085FF]/50 text-white font-semibold transition-all">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-[#0085FF]/20 border border-[#0085FF]/50 rounded-full text-[#0085FF] text-sm font-semibold">
                ✨ Organize & Collaborate
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Work flows,
                <span className=" bg-clip-text text-blue-200"> not chaos</span>
              </h1>
              <p className="text-xl text-blue-200 leading-relaxed">
                Manage projects, teams, and dreams in one beautifully simple
                workspace. Perfect for startups to enterprises.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Link href="/auth/signup">
                <Button className="bg-[#0085FF]/10 hover:shadow-xl hover:shadow-[#0085FF]/40 text-white font-bold py-6 px-8 text-lg transition-all transform hover:scale-105">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative h-96 flex items-center justify-center">
            <div className="absolute inset-0 bg-linear-to-br from-[#0085FF]/20 to-[#003465]/20 rounded-3xl blur-2xl"></div>
            <div className="relative space-y-3 w-full px-4">
              <div className="bg-white/10 backdrop-blur-xl border border-[#0085FF]/30 rounded-xl p-4 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-[#0085FF]" />
                  <div className="flex-1 h-2 bg-[#0085FF]/20 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-[#0085FF]/30 rounded-xl p-4 transform hover:scale-105 transition-transform duration-300 ml-8">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#0085FF]" />
                  <div className="flex-1 h-2 bg-[#0085FF]/20 rounded-full"></div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-xl border border-[#0085FF]/30 rounded-xl p-4 transform hover:scale-105 transition-transform duration-300">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#0085FF]" />
                  <div className="flex-1 h-2 bg-[#0085FF]/20 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: Layers,
              title: "Organize Everything",
              desc: "Boards, lists, and cards that adapt to your workflow",
            },
            {
              icon: Users,
              title: "Collaborate Live",
              desc: "Real-time updates and seamless team communication",
            },
            {
              icon: Zap,
              title: "Boost Productivity",
              desc: "Automation and drag-and-drop simplicity",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="group bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 hover:border-[#0085FF]/50 rounded-2xl p-8 transition-all duration-300 hover:bg-white/10 hover:shadow-lg hover:shadow-[#0085FF]/10"
            >
              <feature.icon className="w-12 h-12 text-[#0085FF] mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-blue-200">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-linear-to-r from-[#0085FF]/20 to-[#003465]/20 border border-[#0085FF]/30 rounded-3xl p-12 text-center backdrop-blur-xl">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform how you work?
          </h2>
          <p className="text-blue-200 mb-8 text-lg">
            Join thousands of teams organizing smarter, every day.
          </p>
          <Link href="/auth/signup">
            <Button className="bg-[#0085FF]/10 hover:shadow-xl hover:shadow-[#0085FF]/50 text-white font-bold py-6 px-10 text-lg transition-all transform hover:scale-105">
              Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}

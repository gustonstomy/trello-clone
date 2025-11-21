/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#003465]">
      <nav className=" px-16 py-6 flex justify-between items-center bg-[#0085FF]">
        <div className="text-white text-2xl font-bold">Trello Clone</div>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Log in
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-white text-[#0085FF] hover:bg-gray-100">
              Sign up
            </Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
          Work smarter, not harder
        </h1>
        <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto">
          Organize your projects, manage tasks, and collaborate with your team
          all in one place. Built with Next.js and Supabase.
        </p>
        <Link href="/auth/signup">
          <Button
            size="lg"
            className="bg-[#003465] border border-[#0085FF] font-bold py-6 px-8 hover:bg-[#0085FF]"
          >
            Get Started - It's Free
          </Button>
        </Link>

        <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className=" bg-[#1976D2]/40 border-[#1976D2]/40 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2">Organize Everything</h3>
            <p className="text-blue-100">
              Create boards, lists, and cards to manage any project workflow
            </p>
          </div>
          <div className=" bg-[#1976D2]/40 border-[#1976D2]/40 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2">
              Collaborate Seamlessly
            </h3>
            <p className="text-blue-100">
              Invite team members and work together in real-time
            </p>
          </div>
          <div className=" bg-[#1976D2]/40 border-[#1976D2]/40 backdrop-blur-lg rounded-lg p-6 text-white">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-semibold mb-2">Stay Productive</h3>
            <p className="text-blue-100">
              Drag-and-drop interface with powerful features to boost
              productivity
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useAuth } from "../../hooks/use-auth";

import DashboardNav from "../../components/dashboard/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-linear-to-br from-[#003465] via-[#001f3f] to-[#003465]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-[#0085FF] opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#0085FF] opacity-5 rounded-full blur-3xl animate-pulse delay-700"></div>
      </div>
      <DashboardNav user={user} />
      <main className="container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>
    </div>
  );
}

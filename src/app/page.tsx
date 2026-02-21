
"use client";

import { useStore } from "@/store/useStore";
import { TechDashboard } from "@/components/tech/TechDashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { Home as HomeIcon, QrCode, ClipboardList, BookOpen } from "lucide-react";

export default function Home() {
  const { currentUser, interventions, inventory, initListeners } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    initListeners();
    return () => clearTimeout(timer);
  }, [initListeners]);

  if (!mounted) return null;

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <main className="min-h-screen bg-background flex flex-col font-sans overflow-hidden">
      <div className="flex-1 relative w-full h-screen">
        {/* Admin View Layer */}
        <div className={`absolute inset-0 transition-opacity duration-500 will-change-transform ${currentUser?.role === 'admin' ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          <AdminDashboard />
        </div>

        {/* Tech View Layer */}
        <div className={`absolute inset-0 bg-[#F8F9FB] transition-opacity duration-500 will-change-transform overflow-hidden flex flex-col ${currentUser?.role === 'tech' ? 'opacity-100 z-20 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'}`}>
          {/* Background elements for Tech mode */}
          <div className="absolute top-0 right-0 w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[50%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
            <TechDashboard />
          </div>
        </div>
      </div>
    </main>
  );
}

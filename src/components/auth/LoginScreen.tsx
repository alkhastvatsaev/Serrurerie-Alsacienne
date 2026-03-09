"use client";

import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Smartphone, Lock, ShieldCheck, Database, Loader2 } from "lucide-react";

export function LoginScreen() {
  const { setCurrentUser, users, initListeners, seedData } = useStore();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-init listeners on mount to fetch users
  useEffect(() => {
    initListeners();
  }, []);

  const handleSendCode = async () => {
    setIsLoading(true);
    setError("");
    
    // Simulate network delay
    setTimeout(() => {
      // Check if user exists (mock auth lookup)
      // In a real app, this would use Firebase Auth phone provider
      const userExists = users.find(u => u.phone?.replace(/\s/g, '') === phone.replace(/\s/g, ''));
      
      if (userExists || phone === "0000" || phone === "0767693804") /* Backdoor for demo */ {
        setStep("code");
        // Simulate SMS reception for user since Gateway isn't configured
        setTimeout(() => {
            alert("🔔 SMS REÇU \n\nVotre code de sécurité Serrurerie Alsacienne OS est : 1234");
        }, 500);
      } else {
        setError("Numéro non reconnu dans l'annuaire Serrurerie Alsacienne.");
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleVerifyCode = async () => {
    setIsLoading(true);
    // Mock verification
    setTimeout(() => {
      if (code === "1234" || code === "0000") {
        const user = users.find(u => u.phone?.replace(/\s/g, '') === phone.replace(/\s/g, '')) || users[0]; // Fallback to first user/admin if demo
        if (user) {
            setCurrentUser(user);
        } else {
            setError("Erreur système critique : Utilisateur introuvable après auth.");
        }
      } else {
        setError("Code erroné.");
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-blue-600/10 blur-[100px] rounded-full" />

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-white rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <Lock className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter mb-2">Serrurerie Alsacienne OS</h1>
          <p className="text-white/50 text-sm font-medium uppercase tracking-widest">Plateforme d'Intervention Sécurisée</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
          {step === "phone" ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-3">Identifiant Mobile</label>
                 <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input 
                      placeholder="06 00 00 00 00" 
                      className="bg-black/20 border-white/10 h-14 rounded-2xl pl-12 text-lg font-bold tracking-widest placeholder:text-white/20 focus-visible:ring-indigo-500"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                 </div>
               </div>
               <Button 
                onClick={handleSendCode} 
                className="w-full h-14 bg-white text-black hover:bg-white/90 rounded-2xl font-black uppercase tracking-widest text-[11px]"
                disabled={isLoading}
               >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connexion Sécurisée"}
               </Button>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/60 ml-3">Code de Sécurité (SMS)</label>
                 <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input 
                      placeholder="• • • •" 
                      className="bg-black/20 border-white/10 h-14 rounded-2xl pl-12 text-2xl font-black tracking-[1em] text-center placeholder:text-white/20 focus-visible:ring-indigo-500"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={4}
                    />
                 </div>
               </div>
               <Button 
                onClick={handleVerifyCode} 
                className="w-full h-14 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-[0_0_30px_rgba(79,70,229,0.4)]"
                disabled={isLoading}
               >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider l'accès"}
               </Button>
               <button onClick={() => setStep("phone")} className="w-full text-center text-[10px] uppercase font-bold text-white/30 hover:text-white">Retour</button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-400" />
                <p className="text-red-400 text-xs font-bold">{error}</p>
            </div>
          )}
        </div>
        
        <div className="text-center mt-8 space-y-4">
            <p className="text-[10px] uppercase font-bold text-white/20">
                Serrurerie Alsacienne OS v2.4.0 (Build Pro)<br/>
                Connecté au Cloud Sécurisé
            </p>
            
            {/* Dev Mode Shortcut */}
            <button 
                onClick={() => {
                   // Auto-login logic
                   const devUser = users.find(u => u.phone === "07 67 69 38 04") || users[0];
                   if (devUser) setCurrentUser(devUser);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[9px] uppercase font-black tracking-widest text-white/30 hover:text-white transition-all"
            >
                Dev Mode
            </button>
        </div>
      </div>
    </div>
  );
}

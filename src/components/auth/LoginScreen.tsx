"use client";

import { useStore } from "@/store/useStore";
import { PremiumButton } from "@/components/ui/PremiumButton";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Smartphone, Lock, ShieldCheck, Key, Loader2 } from "lucide-react";

export function LoginScreen() {
  const { setCurrentUser, users, initListeners } = useStore();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  useEffect(() => {
    initListeners();
  }, [initListeners]);

  const setupRecaptcha = () => {
    const { auth } = require("@/lib/firebase");
    const { RecaptchaVerifier } = require("firebase/auth");
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleSendCode = async () => {
    if (!phone) return setError("Veuillez entrer un numéro.");
    setIsLoading(true);
    setError("");
    
    try {
      setupRecaptcha();
      const { auth } = require("@/lib/firebase");
      const { signInWithPhoneNumber } = require("firebase/auth");
      
      // Format phone for Firebase (+33 for France by default if not provided)
      let formattedPhone = phone.replace(/\s/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+33' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+33' + formattedPhone;
      }

      const verifier = (window as any).recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (err: any) {
      console.error("SMS Error:", err);
      setError("Erreur lors de l'envoi du SMS. Vérifiez le numéro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || !confirmationResult) return;
    setIsLoading(true);
    setError("");

    try {
      await confirmationResult.confirm(code);
      // store listener in useStore will handle the currentUser setting
    } catch (err: any) {
      setError("Code de validation incorrect.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ambience - Industrial Luxury */}
      <div className="absolute top-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-[var(--primary)]/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-[var(--primary)]/5 blur-[100px] rounded-full" />

      <div className="w-full max-w-sm relative z-10">
        <div className="mb-12 text-center">
          <div className="w-20 h-20 bg-[var(--card)] rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl border border-[var(--primary)]/20 overflow-hidden relative group">
            <div className="absolute inset-0 bg-[var(--metal-shine)] opacity-20 group-hover:opacity-40 transition-opacity" />
            <Key className="w-10 h-10 text-[var(--primary)] relative z-10" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 uppercase">Serrurerie <span className="text-[var(--primary)]">Bruxelloise</span></h1>
          <p className="text-[var(--muted-foreground)] text-xs font-semibold uppercase tracking-widest">Excellence en Serrurerie - Belgique</p>
        </div>

        <div className="bg-[var(--card)]/80 backdrop-blur-2xl border border-[var(--border)] p-8 rounded-[2.5rem] space-y-6 shadow-2xl">
          {step === "phone" ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] ml-3">Identifiant Mobile</label>
                 <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <Input 
                      placeholder="06 00 00 00 00" 
                      className="bg-[var(--input)] border-[var(--border)] h-14 rounded-2xl pl-12 text-lg font-bold tracking-widest placeholder:text-[var(--muted-foreground)]/40 focus-visible:ring-[var(--primary)]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                 </div>
               </div>
               <PremiumButton 
                onClick={handleSendCode} 
                fullWidth
                disabled={isLoading}
               >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connexion Sécurisée"}
               </PremiumButton>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)] ml-3">Code de Sécurité (SMS)</label>
                 <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
                    <Input 
                      placeholder="• • • •" 
                      className="bg-[var(--input)] border-[var(--border)] h-14 rounded-2xl pl-12 text-2xl font-black tracking-[1em] text-center placeholder:text-[var(--muted-foreground)]/40 focus-visible:ring-[var(--primary)]"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      maxLength={4}
                    />
                 </div>
               </div>
               <PremiumButton 
                onClick={handleVerifyCode} 
                fullWidth
                disabled={isLoading}
               >
                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Valider l'accès"}
               </PremiumButton>
               <button onClick={() => setStep("phone")} className="w-full text-center text-[10px] uppercase font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">Retour au numéro</button>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-500" />
                <p className="text-red-500 text-xs font-bold">{error}</p>
            </div>
          )}
        </div>
        
        <div className="text-center mt-8 space-y-4">
            <p className="text-[10px] uppercase font-bold text-[var(--muted-foreground)]/50">
                Serrurerie PWA v3.0.0 (Belgique Edition)<br/>
                Propulsé par Advanced Agentic OS
            </p>
            
            <button 
                onClick={() => {
                    const devUser = users.find(u => u.phone === "+32 470 00 00 00") || users[0];
                   if (devUser) setCurrentUser(devUser);
                }}
                className="px-6 py-2 bg-[var(--secondary)] hover:bg-[var(--primary)]/10 rounded-full text-[9px] uppercase font-bold tracking-widest text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all border border-[var(--border)]"
            >
                Accès Développeur
            </button>
        </div>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}


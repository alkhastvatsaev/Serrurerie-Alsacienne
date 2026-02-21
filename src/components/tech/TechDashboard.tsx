
"use client";

import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, QrCode, ClipboardList, Map as MapIcon, Mic, Sparkles, BrainCircuit, ScanLine, Trophy, Star,
  Clock, CheckCircle, AlertTriangle, Package, Euro, Phone, MessageCircle, Navigation, Zap,
  TrendingUp, Calendar, Truck, Shield, Sun, Cloud, CloudRain, Thermometer, Target, Award,
  ArrowUpRight, Timer, MapPin, Wrench, ChevronUp, ChevronDown
} from "lucide-react";
import { useState, useEffect, useRef, useMemo } from "react";
import { InterventionDetails } from "./InterventionDetails";
import { calculatePriceBreakdown, formatPrice } from "@/lib/pricing";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AssetSheet } from "./AssetSheet";
import { identifyLockFromImage } from "@/lib/gemini";
import { sendWhatsAppMessage, whatsappTemplates } from "@/lib/whatsapp";
import { motion, AnimatePresence } from "framer-motion";

export function TechDashboard() {
  const { interventions, assets, inventory, vanStocks, currentUser, users, schedules, setCurrentUser, simulateClientTracking } = useStore();
  const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedAssetId, setScannedAssetId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [customScanResult, setCustomScanResult] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const techInterventions = interventions.filter(i => i.tech_id === currentUser?.id);
  const activeJobs = techInterventions.filter(i => i.status !== 'done');
  const doneJobs = techInterventions.filter(i => i.status === 'done');
  const selectedIntervention = interventions.find(i => i.id === selectedInterventionId);

  // Today's schedule
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedule = schedules.find(s => s.tech_id === currentUser?.id && s.date === todayStr);

  // Revenue calc
  const todayRevenue = useMemo(() => {
    return doneJobs.reduce((acc, int) => {
      const { total } = calculatePriceBreakdown(int, inventory);
      return acc + total;
    }, 0);
  }, [doneJobs, inventory]);

  // Van stock for current tech
  const myVanStock = vanStocks.filter(vs => vs.tech_id === currentUser?.id);
  const vanStockItems = myVanStock.map(vs => {
    const item = inventory.find(i => i.id === vs.item_id);
    return { ...vs, name: item?.item_name || 'Inconnu', price: item?.price || 0, maxQty: item?.quantity || 0 };
  });
  const lowStockCount = vanStockItems.filter(v => v.quantity <= 2).length;

  // Week schedule for current tech
  const weekSchedule = useMemo(() => {
    const today = new Date();
    const days: { date: string; label: string; dayShort: string; schedule: typeof todaySchedule; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const s = schedules.find(sc => sc.tech_id === currentUser?.id && sc.date === dateStr);
      days.push({
        date: dateStr,
        label: d.toLocaleDateString('fr-FR', { day: 'numeric' }),
        dayShort: d.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''),
        schedule: s,
        isToday: i === 0
      });
    }
    return days;
  }, [schedules, currentUser?.id]);

  // Sort interventions by time
  const sortedInterventions = useMemo(() => {
    return [...techInterventions].sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1;
      if (a.status !== 'done' && b.status === 'done') return -1;
      return a.time.localeCompare(b.time);
    });
  }, [techInterventions]);

  // Current time for timeline
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const startScan = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setAiAnalysis("Gemini 1.5 Flash : Connexion...");
    try {
      setTimeout(() => setAiAnalysis("Envoi image sécurisé..."), 500);
      const result = await identifyLockFromImage(file);
      setAiAnalysis("Analyse terminée !");
      setCustomScanResult(result);
      setScannedAssetId('ai-result');
    } catch (error) {
      console.error(error);
      setAiAnalysis("Erreur : Impossible d'identifier.");
    } finally {
      setIsScanning(false);
      setAiAnalysis(null);
    }
  };

  const toggleVoiceReport = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      setTimeout(() => setIsListening(false), 5000);
    }
  };

  if (selectedInterventionId && selectedIntervention) {
    return (
      <InterventionDetails 
        intervention={selectedIntervention} 
        onBack={() => setSelectedInterventionId(null)} 
      />
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-blue-500', text: 'En attente', textColor: 'text-blue-600', bgLight: 'bg-blue-50' };
      case 'in_progress': return { color: 'bg-indigo-500', text: 'En cours', textColor: 'text-indigo-600', bgLight: 'bg-indigo-50' };
      case 'waiting_approval': return { color: 'bg-orange-500', text: 'À Valider', textColor: 'text-orange-600', bgLight: 'bg-orange-50' };
      case 'done': return { color: 'bg-green-500', text: 'Terminée', textColor: 'text-green-600', bgLight: 'bg-green-50' };
      default: return { color: 'bg-gray-400', text: status, textColor: 'text-gray-600', bgLight: 'bg-gray-50' };
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'emergency': return <Zap className="w-4 h-4" />;
      case 'installation': return <Wrench className="w-4 h-4" />;
      case 'repair': return <Wrench className="w-4 h-4" />;
      case 'maintenance': return <Shield className="w-4 h-4" />;
      case 'automotive': return <Truck className="w-4 h-4" />;
      default: return <Wrench className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] relative overflow-hidden flex flex-col font-sans">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/5 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-green-500/5 blur-[80px] rounded-full" />
      <div className="absolute top-[40%] left-[-20%] w-[40%] h-[30%] bg-indigo-500/3 blur-[80px] rounded-full" />

      {/* Hidden Real Input for AI Scan */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        capture="environment"
        className="hidden" 
      />

      {/* ===== 1. PREMIUM HEADER ===== */}
      <div className="relative z-10 p-5 pb-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <button className="relative">
                  <div className="w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-primary/30 border-2 border-white">
                    {currentUser?.name.charAt(0)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-[#F8F9FB] shadow-sm" />
                </button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-sm rounded-[3rem] p-6 glass border-none ios-shadow overflow-hidden bg-white/95">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter mb-4">Mon Espace</DialogTitle>
                <div className="space-y-5">
                    <div className="glass p-5 rounded-[2.5rem] bg-secondary/10 border-none flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center font-black text-xl text-white shadow-lg shadow-primary/20 border-2 border-white">
                            {currentUser?.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-base font-black text-foreground leading-none mb-1">{currentUser?.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Expert Terrain • ID-{currentUser?.id}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                       <div className="bg-white/60 p-5 rounded-[2.5rem] border border-black/5 flex flex-col justify-center items-center gap-1 shadow-sm">
                          <p className="text-3xl font-black text-foreground">{activeJobs.length}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">En cours</p>
                       </div>
                       <div className="bg-white/60 p-5 rounded-[2.5rem] border border-black/5 flex flex-col justify-center items-center gap-1 shadow-sm">
                          <p className="text-3xl font-black text-foreground">{doneJobs.length}</p>
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Finies</p>
                       </div>
                    </div>

                    {/* 🏆 GAMIFICATION SCORE CARD */}
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-5 rounded-[2.5rem] text-white shadow-lg shadow-orange-500/20 relative overflow-hidden group">
                       <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform duration-500">
                          <Trophy className="w-16 h-16" />
                       </div>
                       <div className="relative z-10">
                          <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Score Excellence</p>
                          <div className="flex items-baseline gap-1">
                             <span className="text-4xl font-black tracking-tighter">{currentUser?.performance_score || 0}</span>
                             <span className="text-sm font-bold opacity-60">/ 100</span>
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                             <div className="bg-white/20 p-1.5 rounded-full backdrop-blur-md">
                                <Star className="w-3 h-3 fill-white text-white" />
                             </div>
                             <span className="text-[9px] font-bold uppercase tracking-wide">Top 5% Région</span>
                          </div>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-black/5 flex flex-col gap-2">
                       <Button 
                         onClick={() => {
                           const nextUser = currentUser?.role === 'admin' ? users[1] : users[0];
                           setCurrentUser(nextUser);
                         }}
                         className="w-full h-14 rounded-[1.8rem] text-[11px] font-black uppercase tracking-widest bg-black text-white shadow-xl active:scale-95 transition-all border-none"
                       >
                          Switch vers Manager
                       </Button>
                       <Button variant="ghost" className="w-full h-10 rounded-xl text-[9px] font-black uppercase text-red-500 tracking-widest">Déconnexion</Button>
                    </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex flex-col">
              <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">Bonjour,</p>
              <h1 className="text-xl font-black tracking-tight text-foreground leading-tight">
                 {currentUser?.name} 👋
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                 <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">En service</p>
              </div>
            </div>
          </div>

          {/* Time + Weather cluster */}
          <div className="flex flex-col items-end gap-1">
            <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/50 shadow-sm">
              <p className="text-lg font-black tracking-tight text-foreground">{currentTime}</p>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground/50">
              <Sun className="w-3 h-3" />
              <span className="text-[9px] font-bold">4°C • Strasbourg</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MAIN SCROLLABLE CONTENT ===== */}
      <div className="flex-1 overflow-y-auto px-4 space-y-5 pb-36 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-lg mx-auto w-full no-scrollbar pt-5">
        
        {/* ===== 2. KPI CARDS ROW ===== */}
        <div className="grid grid-cols-3 gap-3">
          {/* Active missions */}
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[1.8rem] border border-white/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 blur-xl rounded-full" />
            <div className="relative z-10">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center mb-2">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <p className="text-2xl font-black tracking-tighter text-foreground">{activeJobs.length}</p>
              <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Missions</p>
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[1.8rem] border border-white/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-green-500/5 blur-xl rounded-full" />
            <div className="relative z-10">
              <div className="w-8 h-8 bg-green-500/10 rounded-xl flex items-center justify-center mb-2">
                <Euro className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-black tracking-tighter text-foreground">{formatPrice(todayRevenue)}</p>
              <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Revenus</p>
            </div>
          </div>

          {/* Completed */}
          <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[1.8rem] border border-white/50 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/5 blur-xl rounded-full" />
            <div className="relative z-10">
              <div className="w-8 h-8 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-2">
                <CheckCircle className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-2xl font-black tracking-tighter text-foreground">{doneJobs.length}</p>
              <p className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest">Terminées</p>
            </div>
          </div>
        </div>

        {/* ===== 3. WEEK SCHEDULE STRIP ===== */}
        <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[1.8rem] border border-white/50 shadow-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Planning Semaine</span>
            </div>
            {todaySchedule && (
              <span className="text-[9px] font-black text-primary uppercase tracking-wider">
                {todaySchedule.start_time} — {todaySchedule.end_time}
              </span>
            )}
          </div>
          <div className="flex gap-1.5">
            {weekSchedule.map((day) => {
              const typeColor = day.schedule?.type === 'working' ? 'bg-green-500' : day.schedule?.type === 'on_call' ? 'bg-purple-500' : 'bg-gray-200';
              const textWhite = day.schedule?.type === 'working' || day.schedule?.type === 'on_call' ? 'text-white' : 'text-muted-foreground/40';
              return (
                <div 
                  key={day.date} 
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-2xl transition-all ${day.isToday ? 'ring-2 ring-primary ring-offset-1' : ''} ${typeColor}`}
                >
                  <span className={`text-[8px] font-black uppercase tracking-wider ${textWhite}`}>{day.dayShort}</span>
                  <span className={`text-sm font-black ${textWhite}`}>{day.label}</span>
                  {day.schedule && (
                    <span className={`text-[7px] font-bold ${textWhite} opacity-70`}>
                      {day.schedule.type === 'working' ? day.schedule.start_time.slice(0, 5) : day.schedule.type === 'on_call' ? 'AST' : '—'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== 4. MISSIONS TIMELINE ===== */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-2">
               <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Interventions</h2>
               {activeJobs.length > 0 && (
                 <Badge className="bg-primary text-white border-none rounded-full h-5 w-5 p-0 flex items-center justify-center text-[9px] font-black">{activeJobs.length}</Badge>
               )}
             </div>
             <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>

          <div className="space-y-3">
            {sortedInterventions.length === 0 ? (
              <div className="glass p-12 text-center rounded-[2.5rem] border-none shadow-sm bg-white/60">
                <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
                <p className="text-sm font-black text-muted-foreground/50 uppercase tracking-widest">Aucune mission planifiée</p>
                <p className="text-[10px] text-muted-foreground/30 mt-1">Jour de repos ou en attente d&apos;assignation</p>
              </div>
            ) : (
              sortedInterventions.map((intervention, idx) => {
                const sc = getStatusConfig(intervention.status);
                const isEmergency = intervention.is_emergency || intervention.category === 'emergency';
                return (
                  <motion.div 
                    key={intervention.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white/80 backdrop-blur-xl rounded-[1.8rem] border border-white/50 shadow-sm overflow-hidden active:scale-[0.98] transition-all cursor-pointer relative ${intervention.status === 'done' ? 'opacity-60' : ''} ${isEmergency && intervention.status !== 'done' ? 'ring-2 ring-red-400/50 ring-offset-1' : ''}`}
                    onClick={() => setSelectedInterventionId(intervention.id)}
                  >
                    {/* Emergency banner */}
                    {isEmergency && intervention.status !== 'done' && (
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-1.5 flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-white fill-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Urgence</span>
                      </div>
                    )}

                    <div className="p-4">
                      {/* Top row: time + status */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${sc.color} ${intervention.status !== 'done' ? 'animate-pulse shadow-lg' : ''}`} />
                          <span className="text-xs font-black text-foreground tracking-tight">{intervention.time}</span>
                          <Badge className={`${sc.bgLight} ${sc.textColor} border-none text-[7px] font-black tracking-widest px-2 py-0.5 rounded-full`}>
                            {sc.text}
                          </Badge>
                        </div>
                        {intervention.category && (
                          <div className="w-7 h-7 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                            {getCategoryIcon(intervention.category)}
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      <h3 className="font-black text-base leading-tight text-foreground tracking-tight mb-1">{intervention.address.split(',')[0]}</h3>
                      <p className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tight truncate">{intervention.address.split(',').slice(1).join(',')}</p>

                      {/* Description if exists */}
                      {intervention.description && (
                        <p className="text-[10px] text-muted-foreground/50 mt-2 leading-relaxed line-clamp-2">{intervention.description}</p>
                      )}

                      {/* Duration & parts used badges */}
                      <div className="flex items-center gap-2 mt-3">
                        {intervention.estimated_duration && (
                          <div className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-lg">
                            <Timer className="w-3 h-3 text-muted-foreground/50" />
                            <span className="text-[8px] font-black text-muted-foreground/60 uppercase">{intervention.estimated_duration}min</span>
                          </div>
                        )}
                        {intervention.parts_used.length > 0 && (
                          <div className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-lg">
                            <Package className="w-3 h-3 text-muted-foreground/50" />
                            <span className="text-[8px] font-black text-muted-foreground/60 uppercase">{intervention.parts_used.length} pièce{intervention.parts_used.length > 1 ? 's' : ''}</span>
                          </div>
                        )}
                        {intervention.labor_cost && (
                          <div className="flex items-center gap-1 bg-black/5 px-2 py-1 rounded-lg">
                            <Euro className="w-3 h-3 text-muted-foreground/50" />
                            <span className="text-[8px] font-black text-muted-foreground/60 uppercase">{intervention.labor_cost}€</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      {intervention.status !== 'done' && (
                        <div className="flex items-center gap-2 pt-3 mt-3 border-t border-black/5">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-100 border-none px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(intervention.address)}`, '_blank');
                              simulateClientTracking(intervention.id);
                            }}
                          >
                            <Navigation className="w-3 h-3 mr-1.5" />
                            Itinéraire
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 h-10 rounded-xl text-[9px] font-black uppercase tracking-widest bg-primary text-white shadow-sm shadow-primary/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInterventionId(intervention.id);
                            }}
                          >
                            <ArrowUpRight className="w-3 h-3 mr-1.5" />
                            Ouvrir
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>

        {/* ===== 5. STOCK CAMION ===== */}
        <section className="space-y-3">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'stock' ? null : 'stock')}
            className="w-full flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-muted-foreground/40" />
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Stock Camion</h2>
              {lowStockCount > 0 && (
                <Badge className="bg-orange-500 text-white border-none rounded-full h-5 w-5 p-0 flex items-center justify-center text-[9px] font-black">{lowStockCount}</Badge>
              )}
            </div>
            {expandedSection === 'stock' ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'stock' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white/80 backdrop-blur-xl rounded-[1.8rem] border border-white/50 shadow-sm divide-y divide-black/5 overflow-hidden">
                  {vanStockItems.length === 0 ? (
                    <div className="p-8 text-center">
                      <Package className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">Aucun stock assigné</p>
                    </div>
                  ) : (
                    vanStockItems.map(item => (
                      <div key={item.item_id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${item.quantity <= 2 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            {item.quantity}
                          </div>
                          <div>
                            <p className="text-xs font-black text-foreground tracking-tight">{item.name}</p>
                            <p className="text-[9px] text-muted-foreground/50 font-bold">{item.price}€ / unité</p>
                          </div>
                        </div>
                        {item.quantity <= 2 && (
                          <div className="flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-lg">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span className="text-[8px] font-black text-orange-600 uppercase">Stock bas</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ===== 6. PERFORMANCE ===== */}
        <section className="space-y-3">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'perf' ? null : 'perf')}
            className="w-full flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground/40" />
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Ma Performance</h2>
            </div>
            {expandedSection === 'perf' ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'perf' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[1.8rem] border border-white/50 shadow-sm space-y-4">
                  {/* Score progress */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1">Score Global</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-foreground tracking-tighter">{currentUser?.performance_score || 85}</span>
                        <span className="text-sm text-muted-foreground/40 font-bold">/100</span>
                      </div>
                    </div>
                    <div className="w-16 h-16 rounded-full border-4 border-primary/20 flex items-center justify-center relative">
                      <div 
                        className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent border-l-transparent" 
                        style={{ transform: `rotate(${((currentUser?.performance_score || 85) / 100) * 360}deg)` }}
                      />
                      <Award className="w-6 h-6 text-primary" />
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-green-600/60 uppercase tracking-widest mb-1">Missions totales</p>
                      <p className="text-lg font-black text-green-700">{currentUser?.completed_missions || doneJobs.length}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-blue-600/60 uppercase tracking-widest mb-1">Taux réussite</p>
                      <p className="text-lg font-black text-blue-700">98%</p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-purple-600/60 uppercase tracking-widest mb-1">Spécialité</p>
                      <p className="text-xs font-black text-purple-700 truncate">{currentUser?.specialties?.[0] || 'Généraliste'}</p>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-2xl">
                      <p className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mb-1">Classement</p>
                      <p className="text-lg font-black text-amber-700">Top 5%</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ===== 7. QUICK CONTACT BUREAU ===== */}
        <section className="space-y-3">
          <button 
            onClick={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
            className="w-full flex items-center justify-between px-2"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-muted-foreground/40" />
              <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60">Contact Bureau</h2>
            </div>
            {expandedSection === 'contact' ? <ChevronUp className="w-4 h-4 text-muted-foreground/40" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/40" />}
          </button>

          <AnimatePresence>
            {expandedSection === 'contact' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="bg-white/80 backdrop-blur-xl p-4 rounded-[1.8rem] border border-white/50 shadow-sm space-y-3">
                  <button 
                    onClick={() => {
                      sendWhatsAppMessage('0767693804', `🔧 ${currentUser?.name} — Message depuis le terrain.\n\n📍 Sur zone : ${activeJobs.length} missions actives.\n⏰ ${currentTime}`);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-green-50 active:scale-[0.98] transition-all"
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-black text-foreground">WhatsApp Bureau</p>
                      <p className="text-[9px] text-muted-foreground/60 font-bold">Envoyer un message au dispatch</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </button>

                  <a 
                    href="tel:+33388001122"
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-blue-50 active:scale-[0.98] transition-all"
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-black text-foreground">Appeler le Bureau</p>
                      <p className="text-[9px] text-muted-foreground/60 font-bold">03 88 00 11 22 — Dispatch Central</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </a>

                  <button 
                    onClick={() => alert("Notification envoyée au manager : Demande d'assistance terrain.")}
                    className="w-full flex items-center gap-3 p-3 rounded-2xl bg-orange-50 active:scale-[0.98] transition-all"
                  >
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-black text-foreground">Demande Assistance</p>
                      <p className="text-[9px] text-muted-foreground/60 font-bold">Envoyer un SOS au dispatch</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* ===== BOTTOM DOCK ===== */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 pointer-events-none w-max max-w-[95vw]">
        
        {/* Magic Scan Status Feed */}
        <AnimatePresence>
          {isScanning && (
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               exit={{ y: 20, opacity: 0 }}
               className="glass p-3 px-6 rounded-full border-none shadow-xl bg-primary text-white flex items-center gap-3 mb-2 pointer-events-auto"
            >
               <Sparkles className="w-4 h-4 animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest">{aiAnalysis || "Analyse IA..."}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
           initial={{ y: 40, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="pointer-events-auto glass-dark bg-white/80 backdrop-blur-3xl p-2 px-3 rounded-[2.5rem] flex items-center gap-2 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
        >
          {/* Jobs Stats */}
          <div className="flex items-center gap-3 px-3 py-2 bg-black/5 rounded-full border border-black/5">
            <div className="flex flex-col items-center min-w-[30px]">
              <span className="text-[7px] font-black text-primary leading-none mb-0.5">LIVE</span>
              <span className="text-sm font-black text-foreground tracking-tighter">{activeJobs.length}</span>
            </div>
            <div className="w-[1px] h-5 bg-black/10" />
            <div className="flex flex-col items-center min-w-[30px]">
              <span className="text-[7px] font-black text-green-600 leading-none mb-0.5">DONE</span>
              <span className="text-sm font-black text-foreground tracking-tighter">{doneJobs.length}</span>
            </div>
          </div>

          {/* Quick Tools */}
          <div className="flex items-center gap-1">
            <Button 
                onClick={startScan}
                disabled={isScanning}
                variant="ghost"
                size="icon"
                className={`h-11 w-11 rounded-full transition-all group ${isScanning ? 'bg-primary text-white' : 'hover:bg-primary/10 text-primary'}`}
            >
                <ScanLine className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>

            <Button 
                onClick={toggleVoiceReport}
                variant="ghost"
                size="icon"
                className={`h-11 w-11 rounded-full transition-all group ${isListening ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-orange-500/10 text-orange-600'}`}
            >
                <Mic className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </Button>
          </div>

          {/* Profile */}
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                  variant="ghost"
                  className="h-10 w-10 rounded-full p-0 flex items-center justify-center hover:bg-black/5 transition-all overflow-hidden border-2 border-white shadow-sm shadow-black/5"
              >
                  <div className="w-full h-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center font-black text-xs text-white uppercase">
                    {currentUser?.name.charAt(0)}
                  </div>
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] max-w-sm rounded-[3rem] p-6 glass border-none ios-shadow overflow-hidden bg-white/95">
              <DialogTitle className="text-xl font-black">Changer de rôle</DialogTitle>
              <div className="space-y-3 mt-4">
                {users.map(u => (
                  <button 
                    key={u.id}
                    onClick={() => setCurrentUser(u)}
                    className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all active:scale-[0.98] ${currentUser?.id === u.id ? 'bg-primary/10 ring-2 ring-primary' : 'bg-white/60 border border-black/5'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white ${u.role === 'admin' ? 'bg-black' : 'bg-primary'}`}>
                      {u.name.charAt(0)}
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-black text-foreground">{u.name}</p>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{u.role === 'admin' ? 'Manager' : 'Technicien'}</p>
                    </div>
                    {currentUser?.id === u.id && <CheckCircle className="w-5 h-5 text-primary" />}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>
      </div>

      {/* AI Scan Result Dialog */}
      <Dialog open={!!scannedAssetId} onOpenChange={(open) => !open && setScannedAssetId(null)}>
        <DialogContent className="w-[92vw] max-w-sm rounded-[2.5rem] p-0 border-none glass ios-shadow overflow-hidden gap-0 bg-white/95 backdrop-blur-xl animate-in zoom-in-95 duration-300">
          <div className="p-6 pb-2 text-center">
             <div className="w-12 h-1.5 bg-black/5 rounded-full mx-auto mb-6" />
             <DialogTitle className="text-2xl font-black tracking-tighter uppercase mb-6">Asset Identifié</DialogTitle>
             <div className="max-h-[55vh] overflow-y-auto px-1 custom-scrollbar">
               {scannedAssetId === 'ai-result' ? (
                  <div className="p-4 space-y-4">
                      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg">
                          <div className="flex items-center gap-2 mb-2">
                              <BrainCircuit className="w-5 h-5" />
                              <h3 className="font-black uppercase tracking-widest text-xs">Analyse Gemini 1.5</h3>
                          </div>
                          <p className="text-sm font-medium leading-relaxed opacity-90">
                              {customScanResult || "Analyse en cours..."}
                          </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-green-700 mb-2">Stock Recommandé</p>
                          <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-green-100 shadow-sm">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-green-700 font-black text-xs">98%</div>
                              <div>
                                  <p className="text-xs font-black text-foreground">Cylindre Compatible</p>
                                  <p className="text-[10px] text-muted-foreground">En stock dans votre van (3 unités)</p>
                              </div>
                          </div>
                      </div>
                  </div>
               ) : (
                   assets.find(a => a.id === scannedAssetId) && <AssetSheet asset={assets.find(a => a.id === scannedAssetId)!} />
               )}
             </div>
          </div>
          <div className="p-6">
             <Button className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all" onClick={() => setScannedAssetId(null)}>
               Fermer
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

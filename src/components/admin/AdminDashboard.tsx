
"use client";

import { useStore } from "@/store/useStore";
import { User, Intervention } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { 
  Truck, Settings, LayoutDashboard, History as HistoryIcon, 
  MessageCircle, ClipboardCheck,
  CheckCircle, ChevronUp, ChevronDown, X, Phone, MapPin,
   Eye, Send, AlertTriangle, Plus, Crosshair, Clock, User as UserIcon,
   BrainCircuit, Sparkles, Save, Bell, ChevronLeft, ChevronRight, RotateCcw,
   FileText, Download, Printer, ArrowDownCircle, ShoppingBag, Package, BadgeEuro, UserCircle, Info,
   Building2, Home, Briefcase, MessageSquare, Users, Calendar, Shield, Megaphone, BarChart3,
    Moon, Zap, CloudRain, ShieldCheck, PhoneCall, PhoneForwarded, Mic, MicOff, Keyboard, PhoneIncoming, PhoneOutgoing, Volume2, Video, Delete, Radio, SignalLow,
    ExternalLink, Globe, MousePointerClick, Search, LineChart, ShieldAlert, Trophy, Star,
    CreditCard, Euro, Wallet, PieChart, Menu, LayoutGrid, TrendingUp, Receipt
} from "lucide-react";
import { downloadPDF, sendPDFByEmail } from "@/lib/pdf-service";
import { exportToCSV } from "@/lib/export-service";
import { sendWhatsAppMessage, whatsappTemplates } from "@/lib/whatsapp";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AIDispatchAgent, SecurityScanningAgent, SecurityIncident } from "@/services/ai-agent";
import { findTechForLocation } from "@/lib/geo-utils";
import { useTwilioVoice } from "@/lib/useTwilioVoice";
import { calculatePriceBreakdown, formatPrice } from "@/lib/pricing";
import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, Fragment } from "react";
import { Notification } from "@/types";

import { AnimatePresence, motion } from "framer-motion";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "../ui/textarea";
import { Label } from "@/components/ui/label";
import { getTechColor, getStatusColor, GLASS_STYLES } from '@/lib/theme';

const InteractiveMap = dynamic(() => import("./InteractiveMap"), { 
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-secondary/30 animate-pulse flex items-center justify-center">Chargement de la carte...</div>
});

// 🚀 STRASBOURG SERRURE OS - ULTRA-ROI VERSION
// Purged of non-essential features for maximum performance.

export function AdminDashboard() {
  const { 
    inventory, assets, interventions, users, messages, 
    addMessage, currentUser, setCurrentUser, vanStocks, 
    notifications, markNotificationsAsRead, updateZones, zones,
    initSentinel, securityIncidents,
    addNotification, schedules, transferVanStock, simulateClientTracking
  } = useStore();
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);
  const [isGlobalPlanningOpen, setIsGlobalPlanningOpen] = useState(false);

  // MIGRATION: Logic removed as data is now handled by Firestore listeners and DUMMY_USERS seed.
  const [chatInput, setChatInput] = useState("");
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);
  const [lastWaitingCount, setLastWaitingCount] = useState(0);
  const [hasNewArchive, setHasNewArchive] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ display_name: string, lat: string, lon: string }>>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isZoneEditMode, setIsZoneEditMode] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [editingSchedule, setEditingSchedule] = useState<{techId: string, date: string} | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info'} | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<{techName: string, reasoning: string, confidence: number, optimizationScore: number} | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublicityHubOpen, setIsPublicityHubOpen] = useState(false);
  const [isAccountingHubOpen, setIsAccountingHubOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [runningCampaigns, setRunningCampaigns] = useState<string[]>(['google_sniper']); // Google Sniper active by default for demo
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsLeftSidebarOpen(false);
      setIsRightSidebarOpen(false);
    }
  }, [isMobile]);

  // Real-time Security Monitoring (Sentinel)
  useEffect(() => {
    initSentinel();
  }, []);

  const generateAISuggestion = async () => {
    setIsAnalyzing(true);
    setAiSuggestion(null);
    
    try {
        const suggestion = await AIDispatchAgent.getSmartDispatch(
            newMission, 
            users, 
            vanStocks, 
            inventory, 
            schedules,
            zones
        );
        
        setAiSuggestion({
            techName: suggestion.techName,
            reasoning: suggestion.reasoning,
            confidence: Math.round(suggestion.confidence * 100),
            optimizationScore: suggestion.optimizationScore
        });
        
        // Auto-select the tech
        setNewMission(prev => ({ ...prev, tech_id: suggestion.techId }));
    } catch (error) {
        console.error("AI Analysis failed:", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

   const handleExportCompta = () => {
    try {
      exportToCSV(interventions, inventory);
      setToast({ message: "Export comptable (CSV) généré avec succès.", type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      setToast({ message: error.message || "Erreur lors de l'export.", type: 'info' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const toggleCampaign = (id: string, label: string) => {
    const isActivating = !runningCampaigns.includes(id);
    setRunningCampaigns(prev => 
      isActivating ? [...prev, id] : prev.filter(c => c !== id)
    );
    addNotification({
      type: 'success',
      title: `Campagne ${label} ${isActivating ? 'Activée' : 'Mise en pause'}`,
      message: isActivating 
        ? 'Les algorithmes IA optimisent désormais votre visibilité sur ce canal.' 
        : 'Le flux publicitaire a été suspendu.'
    });
  };
  
  // Form State for new mission
  const [newMission, setNewMission] = useState({
    address: '',
    tech_id: '',
    asset_id: '',
    category: 'repair' as Intervention['category'],
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: '',
    latitude: 0,
    longitude: 0,
    estimated_duration: 30,
    labor_cost: 80,
    is_emergency: false
  });

  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);
  const [isPhoneHubOpen, setIsPhoneHubOpen] = useState(false);
  const [currentCallNumber, setCurrentCallNumber] = useState("");
  const [voipMode, setVoipMode] = useState<'dialer' | 'intercom' | 'assistance'>('dialer');
  const [isRadioActive, setIsRadioActive] = useState(false);
  const [transcription, setTranscription] = useState<{role: 'tech' | 'client', text: string}[]>([]);
  
  const [marketIntel] = useState([
    { name: 'Serrurier Express 67', status: 'aggressive', ads: 12, topAbs: '45%' },
    { name: 'Depannage Alsace 24/7', status: 'moderate', ads: 5, topAbs: '12%' },
    { name: 'Artisan Pro Strasbourg', status: 'low', ads: 2, topAbs: '5%' }
  ]);
  
  const [antiFraudStats] = useState({
    blockedIPs: 142,
    savedBudget: 845,
    lastAttack: 'Il y a 12 min (IP: 185.x.x.x)'
  });

  // Simulated Live Locations for "Nearby Stock Opti"
  const [techLocations] = useState({
    '2': { lat: 48.5833, lng: 7.7458, name: 'Marc' },      // Centre
    '3': { lat: 48.6000, lng: 7.7500, name: 'Sophie' },    // Nord
    '4': { lat: 48.5600, lng: 7.7400, name: 'Lucas' },     // Sud
  });

  const [stockOptimizationAlerts, setStockOptimizationAlerts] = useState<{from: string, to: string, item: string, itemId: string, distance: string}[]>([]);

  useEffect(() => {
    // Logic to find pairs of techs who are near (< 2km) 
    // and where one has spare stock (> min_threshold + 5) 
    // and another is below threshold
    const alerts: any[] = [];
    
    // Hardcoded demo alert for verification
    alerts.push({
      from: '2', // Marc
      to: '4',   // Lucas
      item: 'Cylindre Mul-T-Lock MT5+',
      itemId: 'i1',
      distance: '850m'
    });
    
    setStockOptimizationAlerts(alerts);
  }, []);

  
  const { makeCall, endCall, status: twilioStatus, isInitialized: isTwilioReady, callerName, errorStatus, isSimulated } = useTwilioVoice();
  
  // Dynamic call status based on Twilio + Local override
  const [localCallStatus, setLocalCallStatus] = useState<'idle' | 'dialing' | 'connected' | 'incoming'>('idle');
  const callStatus = twilioStatus === 'dialing' ? 'dialing' : 
                    twilioStatus === 'connected' ? 'connected' : 
                    twilioStatus === 'incoming' ? 'incoming' : localCallStatus;

  // Live Transcription Simulation
  useEffect(() => {
    if (callStatus === 'connected') {
      const phrases = [
        { role: 'tech', text: 'Bonjour, SERRURE Strasbourg à votre service.' },
        { role: 'client', text: 'Bonjour, je suis bloquée devant chez moi au 15 Quai des Bateliers.' },
        { role: 'tech', text: 'Très bien, je vois que vous êtes près du Centre. Un technicien arrive dans 15min.' },
        { role: 'client', text: 'Merci beaucoup, c\'est urgent car j\'ai laissé le feu allumé.' }
      ];
      
      let i = 0;
      const interval = setInterval(() => {
        if (i < phrases.length) {
          // @ts-ignore
          setTranscription(prev => [...prev, phrases[i]]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setTranscription([]);
    }
  }, [callStatus]);

  // Debounced address search
  useEffect(() => {
    // Only search if address is 3+ chars AND we don't have a confirmed location (lat=0)
    if (!newMission.address || newMission.address.length < 3 || newMission.latitude !== 0) {
      if (newMission.latitude === 0) setAddressSuggestions([]); // Only clear if we aren't confirmed
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        // Use a more robust Nominatim query with Strasbourg context
        // Limit search to Strasbourg and surroundings
        const query = `${newMission.address}, Strasbourg, France`;

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&viewbox=7.68,48.50,7.85,48.65&bounded=1`,
          {
            headers: {
              'Accept-Language': 'fr-FR,fr;q=0.9',
              'User-Agent': 'SerrureApp-Admin-Dashboard/1.0'
            }
          }
        );

        if (!response.ok) throw new Error("API Limit or Error");

        const data = await response.json();
        setAddressSuggestions(data);
      } catch (error) {
        console.error("Suggestions fetch failed:", error);
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 400); // Slightly faster debounce

    return () => clearTimeout(timer);
  }, [newMission.address, newMission.latitude]);

  // Real-time notification logic for Manager
  useEffect(() => {
    const waitingInterventions = interventions.filter(i => i.status === 'waiting_approval');
    const waitingCount = waitingInterventions.length;

    // Trigger notification toggle logic (background)
    if (waitingCount > lastWaitingCount) {
      // Logic for new archival arrival or validation
      setHasNewArchive(true);
    }

    setLastWaitingCount(waitingCount);
  }, [interventions, lastWaitingCount]);

  const calculateIntTotal = (int: Intervention) => {
    return calculatePriceBreakdown(int, inventory).total;
  };

  const getPriceBreakdown = (int: Intervention) => {
    return calculatePriceBreakdown(int, inventory);
  };

  const today = new Date().toISOString().split('T')[0];
  const activeInterventions = interventions.filter(i => i.status !== 'done');
  
  const dailyCA = useMemo(() => {
    return interventions.filter(i => i.status === 'done' && i.date === today).reduce((total, int) => {
      return total + calculateIntTotal(int);
    }, 0);
  }, [interventions, inventory, today]);

  const monthlyCA = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return interventions
      .filter(i => {
        const d = new Date(i.date);
        return i.status === 'done' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, current) => acc + calculateIntTotal(current), 0);
  }, [interventions, inventory]);

  const unpaidTotal = useMemo(() => {
    return interventions
      .filter(i => i.status === 'done' && i.payment_status === 'unpaid')
      .reduce((acc, current) => acc + calculateIntTotal(current), 0);
  }, [interventions, inventory]);

  const todaysInterventions = interventions
    .filter(i => i.date === today)
    .sort((a, b) => a.time.localeCompare(b.time));
  const finishedInterventions = interventions.filter(i => i.status === 'done');

  const toggleRole = () => {
    const nextUser = currentUser?.role === 'admin' ? users[1] : users[0];
    setCurrentUser(nextUser);
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col font-sans">

      {/* 0. Notification Center - iPhone Style "Dynamic Island" Arrow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center">
          <motion.button
            whileHover={{ y: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
                setIsNotifCenterOpen(!isNotifCenterOpen);
                if (!isNotifCenterOpen) markNotificationsAsRead();
            }}
            className="mt-2 p-2 px-6 glass bg-white/80 rounded-full border border-black/5 shadow-lg flex items-center gap-3 active:scale-95 transition-all group pointer-events-auto"
          >
              <div className="relative">
                <Bell className={`w-4 h-4 text-primary ${notifications.some(n => !n.read) ? 'animate-bounce' : ''}`} />
                {notifications.some(n => !n.read) && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </div>
              <span className="text-2xs font-black uppercase tracking-widest opacity-70 group-hover:opacity-100 transition-opacity hidden lg:inline">Business Intelligence</span>
              <span className="text-2xs font-black uppercase tracking-widest opacity-70 lg:hidden">Manager Ops</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${isNotifCenterOpen ? 'rotate-180' : ''}`} />
          </motion.button>

          
          <AnimatePresence>
              {isNotifCenterOpen && (
                  <motion.div
                    initial={{ y: -20, opacity: 0, scale: 0.95 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -20, opacity: 0, scale: 0.95 }}
                    className="mt-4 w-[92vw] max-w-md glass-dark bg-white/90 backdrop-blur-3xl rounded-[3rem] border border-white/50 shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto"
                  >
                      <div className="p-6 pb-4 border-b border-black/5 flex justify-between items-center bg-white/40">
                          <div>
                              <h3 className="text-xl font-black uppercase tracking-tighter">Activités Live</h3>
                              <p className="text-3xs font-bold text-muted-foreground uppercase opacity-70 tracking-widest">Temps Réel • Flux Entreprise</p>
                          </div>
                          <Badge variant="outline" className="rounded-full px-3 py-1 bg-primary/5 text-primary border-primary/10 text-2xs font-black">
                              {notifications.length} ALERTES
                          </Badge>
                      </div>

                      <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
                          {notifications.length === 0 ? (
                              <div className="py-16 text-center space-y-3 opacity-30">
                                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center mx-auto">
                                      <Bell className="w-6 h-6" />
                                  </div>
                                  <p className="text-xs font-black uppercase tracking-widest">Aucune notification</p>
                              </div>
                          ) : (
                              notifications.map((n) => (
                                  <motion.div
                                    key={n.id}
                                    layout
                                    className={`p-4 rounded-[2rem] border transition-all flex gap-4 ${n.read ? 'bg-white/50 border-black/5 grayscale-[0.5]' : 'bg-white border-primary/10 shadow-sm'}`}
                                  >
                                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                                          n.type === 'stock' ? 'bg-orange-500/10 text-orange-600' :
                                          n.type === 'tech' ? 'bg-blue-500/10 text-blue-600' :
                                          n.type === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-indigo-500/10 text-indigo-600'
                                      }`}>
                                          {n.type === 'stock' ? <Package className="w-5 h-5" /> :
                                           n.type === 'tech' ? <UserCircle className="w-5 h-5" /> :
                                           n.type === 'success' ? <BadgeEuro className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start mb-1">
                                              <span className="text-2xs font-black uppercase tracking-tight">{n.title}</span>
                                              <span className="text-2xs font-medium text-muted-foreground opacity-50">{n.timestamp}</span>
                                          </div>
                                          <p className="text-xs text-muted-foreground leading-relaxed font-medium">{n.message}</p>
                                      </div>
                                  </motion.div>
                              ))
                          )}
                      </div>

                      <div className="p-4 bg-black/5 text-center">
                          <button
                            onClick={() => setIsNotifCenterOpen(false)}
                            className="text-2xs font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors"
                          >
                              Fermer le Centre de Contrôle
                          </button>
                      </div>
                  </motion.div>
              )}
          </AnimatePresence>
      </div>

      {/* 1. Fullscreen Map Layer */}
      <div className="absolute inset-0 z-0 bg-secondary/5">
        <InteractiveMap
          onSelectIntervention={setSelectedIntervention}
          onContactTech={() => alert("Fonctionnalité Chat Équipe (Demo Mode)")}
          prospects={[]}
          incidents={securityIncidents}
          isZoneEditMode={isZoneEditMode}
        />
      </div>


      {/* 2. SIDEBAR LEFT - Professional Daily Feed */}
      <div className={`fixed left-0 top-16 bottom-24 z-40 w-[88vw] pt-20 md:w-[420px] md:pt-0 pointer-events-none p-6 ${!isLeftSidebarOpen ? 'pointer-events-none' : ''}`}>
        <AnimatePresence>
          {isLeftSidebarOpen && (
            <motion.div
              initial={{ x: -420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -420, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full glass bg-white/70 border-white/40 rounded-[2.5rem] flex flex-col shadow-2xl backdrop-blur-3xl pointer-events-auto border border-white/20 overflow-hidden"
            >
              <div className="p-5 border-b border-black/5 bg-white/40">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Missions</h2>
                    <p className="text-2xs font-black text-muted-foreground uppercase tracking-widest mt-1">
                      {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-none text-2xs font-black px-3 py-1 rounded-full">
                      {todaysInterventions.length} OPÉRATIONS
                    </Badge>
                    {isMobile && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsLeftSidebarOpen(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {todaysInterventions.length === 0 ? (
                   <div className="py-12 px-6 text-center bg-black/5 rounded-[2.5rem] border border-dashed border-black/10 flex flex-col items-center gap-4">
                      <div className="p-4 bg-white/50 rounded-full">
                        <Sparkles className="w-8 h-8 text-primary/40" />
                      </div>
                      <div>
                        <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground mb-2">Aucune mission prévue</p>
                        <p className="text-3xs font-medium text-muted-foreground/60 leading-relaxed italic">
                          Initialisez les données de démo pour voir le planning en action.
                        </p>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => useStore.getState().seedData()}
                        className="mt-2 rounded-xl bg-white text-3xs font-black uppercase tracking-widest h-10 px-6 border-none shadow-sm active:scale-95 transition-all"
                      >
                        Scanner le planning
                      </Button>
                   </div>
                ) : todaysInterventions.map(int => {
                  const isDone = int.status === 'done';
                  const isWaiting = int.status === 'waiting_approval';
                  return (
                    <motion.div
                      layout
                      key={int.id}
                      onClick={() => setSelectedIntervention(int)}
                      className={`group p-4 rounded-[2rem] border transition-all cursor-pointer flex items-center gap-4 ${
                        isDone ? 'bg-black/5 border-transparent opacity-60' :
                        isWaiting ? 'bg-orange-500/10 border-orange-200/50 shadow-xl shadow-orange-500/5' : 'bg-white border-black/5 shadow-sm hover:shadow-md hover:scale-[1.02]'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center min-w-[45px] border-r border-black/5 pr-3">
                         <span className="text-2xs font-black text-foreground leading-none">{int.time}</span>
                         <div className={`w-2 h-2 rounded-full mt-2 ${isDone ? 'bg-green-500' : isWaiting ? 'bg-orange-500 animate-pulse' : 'bg-primary'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className={`text-[13px] font-black truncate leading-tight ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {int.address.split(',')[0]}
                          </p>
                          <div className="flex gap-1 shrink-0">
                            {int.social_emergency_type && int.social_emergency_type !== 'none' && (
                              <Badge className="bg-orange-500 text-white border-none rounded-full h-3.5 px-1.5 text-4xs font-black animate-pulse">
                                SOCIAL
                              </Badge>
                            )}
                            {int.is_emergency && (
                              <Badge className="bg-red-500 text-white border-none rounded-full h-3.5 px-1.5 text-4xs font-black">
                                URGENT
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <p className="text-3xs font-bold text-muted-foreground uppercase tracking-tight opacity-70">
                             {users.find(u => u.id === int.tech_id)?.name} • {int.category || 'Opération'}
                           </p>
                           <span className="w-1 h-1 bg-black/10 rounded-full" />
                           <p className="text-3xs font-black text-indigo-500 uppercase tracking-widest">{int.estimated_duration || 30} MIN</p>
                        </div>
                      </div>

                      {!isDone && (
                        <div className="flex items-center gap-2">
                           {isWaiting && (
                             <Badge variant="outline" className="h-6 rounded-full border-orange-200 bg-orange-50 text-orange-600 text-3xs font-black px-2 uppercase tracking-tighter">À Valider</Badge>
                           )}
                           <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-2xl bg-green-500 text-white shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all flex items-center justify-center border-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              const tech = users.find(u => u.id === int.tech_id);
                              if (tech?.phone) {
                                sendWhatsAppMessage(tech.phone, whatsappTemplates.dispatchToTech(tech.name, int));
                              }
                            }}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-100">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </Button>
                        </div>
                      )}

                      {isDone && (
                        <div className="p-2 bg-green-500/10 rounded-full">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2.5 SIDEBAR RIGHT - Technicians & Stock */}
      <div className={`fixed right-0 top-16 bottom-24 z-40 ${isMobile ? 'w-[88vw] pt-20 md:pt-0' : 'md:w-[420px]'} pointer-events-none p-6 ${!isRightSidebarOpen ? 'pointer-events-none' : ''}`}>
        <AnimatePresence>
          {isRightSidebarOpen && (
            <motion.div
              initial={{ x: 420, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 420, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="h-full glass bg-white/70 border-white/40 rounded-[2.5rem] flex flex-col shadow-2xl backdrop-blur-3xl pointer-events-auto border border-white/20 overflow-hidden"
            >
              <div className="p-5 border-b border-black/5 bg-white/40">
                <div className="flex justify-between items-center mb-4">
                   <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Planning</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-indigo-600" />
                    </div>
                    {isMobile && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsRightSidebarOpen(false)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {users.filter(u => u.role === 'tech').map(tech => (
                  <motion.div
                    key={tech.id}
                    className="p-4 rounded-[2rem] bg-white border border-black/5 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                          <AvatarImage src={tech.avatar_url} />
                          <AvatarFallback className="bg-indigo-100 text-indigo-600 font-black text-xs">{tech.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${tech.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <h4 className="text-xs font-black uppercase tracking-wider truncate">{tech.name}</h4>
                           <Badge className="bg-green-50 text-green-700 border-none text-4xs font-black px-1.5 h-3.5">PRO</Badge>
                        </div>
                        <p className="text-3xs font-bold text-muted-foreground uppercase opacity-70">En service jusqu'à 18:00</p>
                      </div>
                    </div>

                    {/* Management Stats - KPIs */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                       <div className="bg-slate-50 p-2 rounded-xl border border-black/5">
                          <p className="text-4xs font-black text-slate-400 uppercase leading-none mb-1">Charge du Jour</p>
                          <div className="flex items-end justify-between">
                             <span className="text-xs font-black">{interventions.filter(i => i.tech_id === tech.id && i.date === today).length} Missions</span>
                             <div className="w-8 h-1 bg-indigo-100 rounded-full overflow-hidden mb-1">
                                <div className="h-full bg-indigo-600" style={{ width: `${(interventions.filter(i => i.tech_id === tech.id && i.date === today).length / 5) * 100}%` }} />
                             </div>
                          </div>
                       </div>
                       <div className="bg-slate-50 p-2 rounded-xl border border-black/5">
                          <p className="text-4xs font-black text-slate-400 uppercase leading-none mb-1">C.A. (Estimé)</p>
                          <span className="text-xs font-black text-indigo-600">
                             {interventions.filter(i => i.tech_id === tech.id && i.date === today && i.status === 'done').reduce((acc, current) => acc + calculateIntTotal(current), 0)} €
                          </span>
                       </div>
                    </div>

                    {/* Work Schedule */}
                    <div className="mb-4 px-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-3xs font-black uppercase tracking-widest text-slate-400">Présence Hebdomadaire</span>
                        <div className="flex items-center gap-1 cursor-pointer hover:bg-indigo-50 px-1.5 py-0.5 rounded-lg transition-colors" onClick={() => setIsGlobalPlanningOpen(true)}>
                           <Calendar className="w-2.5 h-2.5 text-indigo-400" />
                           <span className="text-4xs font-bold text-indigo-500">VOIR TOUT</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => {
                          const date = new Date('2026-02-09');
                          date.setDate(date.getDate() + idx);
                          const dateStr = date.toISOString().split('T')[0];
                          const daySched = schedules.find(s => s.tech_id === tech.id && s.date === dateStr);
                          const isWorking = !!daySched && daySched.type === 'working';
                          const isOnCall = !!daySched && daySched.type === 'on_call';

                          return (
                            <div
                              key={idx}
                              onClick={() => setEditingSchedule({ techId: tech.id, date: dateStr })}
                              className={`flex flex-col items-center py-1.5 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                              isWorking ? 'bg-indigo-500 border-indigo-400 shadow-sm' :
                              isOnCall ? 'bg-amber-100 border-amber-200 shadow-sm' :
                              'bg-white border-black/5 opacity-40'
                            }`}>
                              <span className={`text-5xs font-black uppercase mb-1 ${isWorking ? 'text-white' : isOnCall ? 'text-amber-700' : 'text-muted-foreground'}`}>{day}</span>
                              <div className={`w-1 h-1 rounded-full ${isWorking ? 'bg-white' : isOnCall ? 'bg-amber-500' : 'bg-black/10'}`} />
                              {daySched && (
                                <span className={`text-[5px] font-black mt-1 leading-none ${isWorking ? 'text-white/80' : 'text-amber-600'}`}>
                                  {daySched.start_time.split(':')[0]}h
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Manager Management Actions */}
                    <div className="flex gap-1.5">
                       <Button 
                          size="sm" 
                          variant="ghost" 
                          className="flex-1 h-9 rounded-xl border border-black/5 bg-slate-50/50 hover:bg-slate-100 text-3xs font-black uppercase tracking-widest gap-2"
                          onClick={() => {
                            setToast({ message: `Alerte disponibilité envoyée à ${tech.name}`, type: 'info' });
                            setTimeout(() => setToast(null), 3000);
                          }}
                       >
                          <Bell className="w-3 h-3 text-amber-500" />
                          Alerte
                       </Button>
                       <Button 
                          size="sm" 
                          className="flex-1 h-9 rounded-xl bg-black text-white text-3xs font-black uppercase tracking-widest gap-2"
                          onClick={() => {
                            setToast({ message: `Planning de ${tech.name} mis à jour`, type: 'success' });
                            setTimeout(() => setToast(null), 3000);
                          }}
                       >
                          <Save className="w-3 h-3" />
                          Gérer
                       </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. SMART DOCK - MacBook Style Center Dock */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-4 pointer-events-none w-max max-w-[95vw]">


        {/* The Smart Dock Pill */}
        <motion.div
           initial={{ y: 40, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className={`pointer-events-auto glass-dark bg-white/80 backdrop-blur-3xl ${isMobile ? 'p-1 px-2' : 'p-2 px-3 sm:px-4'} rounded-[2.5rem] flex items-center ${isMobile ? 'gap-0.5' : 'gap-2 sm:gap-4'} border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:scale-[1.02] transition-transform duration-500`}
        >

          <div className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
            <Button
                onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)}
                variant="ghost"
                className={`${isMobile ? 'h-10 w-10 px-1' : 'h-12 w-12'} rounded-full flex items-center justify-center transition-all group ${isLeftSidebarOpen ? 'bg-primary text-white shadow-lg' : 'hover:bg-black/5 text-muted-foreground'}`}
            >
                <LayoutDashboard className={`w-5 h-5 ${isLeftSidebarOpen ? 'text-white' : 'group-hover:scale-110'} transition-transform`} />
            </Button>

            <Button
                onClick={() => setIsCreateModalOpen(true)}
                className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} rounded-full bg-foreground text-background font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center border-none`}
            >
                <Plus className="w-5 h-5" />
            </Button>

            <Button
                onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                variant="ghost"
                className={`${isMobile ? 'h-10 w-10 px-1' : 'h-12 w-12'} rounded-full flex items-center justify-center transition-all group ${isRightSidebarOpen ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-black/5 text-muted-foreground'}`}
            >
                <Users className={`w-5 h-5 ${isRightSidebarOpen ? 'text-white' : 'group-hover:scale-110'} transition-transform`} />
            </Button>

            <Button
                onClick={() => setIsPublicityHubOpen(true)}
                variant="ghost"
                className={`${isMobile ? 'h-10 w-10 px-1' : 'h-12 w-12'} rounded-full flex items-center justify-center transition-all group ${isPublicityHubOpen ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'hover:bg-black/5 text-muted-foreground'}`}
            >
                <Megaphone className={`w-5 h-5 ${isPublicityHubOpen ? 'text-white' : 'group-hover:scale-110'} transition-transform`} />
            </Button>


             <Button
                onClick={() => setIsPhoneHubOpen(true)}
                variant="ghost"
                className={`${isMobile ? 'h-10 w-10 px-1' : 'h-12 w-12'} rounded-full flex items-center justify-center transition-all group ${isPhoneHubOpen ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'hover:bg-black/5 text-muted-foreground'}`}
            >
                <Phone className={`w-5 h-5 ${isPhoneHubOpen ? 'text-white' : 'group-hover:scale-110'} transition-transform`} />
            </Button>

             <Button
                onClick={() => setIsAccountingHubOpen(true)}
                variant="ghost"
                className={`${isMobile ? 'h-10 w-10 px-1' : 'h-12 w-12'} rounded-full flex items-center justify-center transition-all group ${isAccountingHubOpen ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'hover:bg-black/5 text-muted-foreground'}`}
            >
                <Euro className={`w-5 h-5 ${isAccountingHubOpen ? 'text-white' : 'group-hover:scale-110'} transition-transform`} />
            </Button>

             <Button
                onClick={() => setIsAdminMenuOpen(true)}
                variant="ghost"
                size="icon"
                className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} rounded-full hover:bg-black/5 text-muted-foreground group`}
            >
                <Settings className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            </Button>
          </div>

          {/* Active Alerts Badge (Integrated) */}
          <AnimatePresence>
             {activeInterventions.filter(i => i.status === 'waiting_approval').length > 0 && (
               <motion.div 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 exit={{ scale: 0 }}
                 className="absolute -top-1 -right-1"
               >
                 <div className="relative">
                   <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-75" />
                   <div className="relative bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-3xs font-black border-2 border-white">
                     {activeInterventions.filter(i => i.status === 'waiting_approval').length}
                   </div>
                 </div>
               </motion.div>
             )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Edit Mode Quick Actions - Top Floating Bar */}
      <AnimatePresence>
        {isZoneEditMode && (
          <motion.div 
            initial={{ y: -100, x: '-50%' }}
            animate={{ y: 20, x: '-50%' }}
            exit={{ y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[60] pointer-events-auto"
          >
            <div className="glass-dark bg-black/80 backdrop-blur-2xl p-2 px-4 rounded-full flex items-center gap-4 border border-white/20 shadow-2xl">
              <div className="flex flex-col">
                <span className="text-3xs font-black text-white/50 uppercase tracking-widest leading-none">Territoires</span>
                <span className="text-2xs font-black text-white uppercase tracking-tighter">Mode Édition</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <p className="text-3xs font-bold text-white/60 max-w-[120px] leading-tight mr-2">
                  Cliquez sur une zone pour ajouter un point.
                </p>
                <Button 
                    onClick={() => {
                      setIsZoneEditMode(false);
                      addNotification({
                        type: 'success',
                        title: 'Zones Enregistrées',
                        message: 'Les nouveaux périmètres ont été synchronisés avec succès.'
                      });
                    }}
                    className="h-10 px-6 rounded-full bg-green-500 text-white shadow-xl hover:bg-green-600 active:scale-95 transition-all border-none font-black uppercase text-2xs tracking-widest flex items-center gap-2"
                >
                    <Save className="w-4 h-4" />
                    Terminer & Sauvegarder
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Admin Command Center - The "Hub" */}
      <Dialog open={isAdminMenuOpen} onOpenChange={setIsAdminMenuOpen}>
        <DialogContent className="w-[90vw] max-w-sm rounded-[3rem] p-6 glass border-none ios-shadow overflow-hidden bg-white/95">
          <DialogHeader className="mb-4 text-left">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Hub Central</DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase opacity-70">
              Cockpit de Supervision Global
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
             {/* 1. Alerts Section */}
             <div 
                onClick={() => setIsValidationOpen(true)}
                className="bg-red-500 text-white p-5 rounded-[2.5rem] flex items-center justify-between shadow-xl shadow-red-500/20 active:scale-95 transition-transform cursor-pointer"
             >
                <div className="flex items-center gap-4">
                   <div className="bg-white/20 p-2.5 rounded-2xl">
                      <AlertTriangle className="w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-sm font-black uppercase tracking-wide">{interventions.filter(i => i.status === 'waiting_approval').length} Alertes</p>
                      <p className="text-3xs font-medium opacity-80 uppercase tracking-widest leading-none">Validation Missions Requise</p>
                   </div>
                </div>
                <Button size="sm" variant="secondary" className="h-8 rounded-xl text-3xs font-black uppercase shadow-sm">Gérer</Button>
             </div>

             {/* 2. System Configuration Tools */}
             <div className="space-y-1 px-1">
                <p className="text-3xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2 ml-1">Outils Administration</p>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { label: 'Team', icon: Users, desc: 'Gestion Équipes', color: 'text-indigo-500' },
                        { label: 'IA Engine', icon: BrainCircuit, desc: 'Config Dispatch', color: 'text-purple-500' },
                        { label: 'Rapports', icon: FileText, desc: 'Exports Data', color: 'text-blue-500' },
                        { label: 'Sécurité', icon: ShieldCheck, desc: 'Accès & Logs', color: 'text-green-500' }
                    ].map((item, idx) => (
                    <button
                        key={idx}
                        className="p-4 rounded-[2rem] bg-white border border-black/5 hover:border-primary/20 hover:bg-primary/[0.02] flex flex-col items-start gap-2 shadow-sm transition-all active:scale-[0.97]"
                        onClick={() => alert(`Accès à ${item.desc} (Demo Mode)`)}
                    >
                        <div className={`p-2 rounded-xl bg-secondary/30 ${item.color}`}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                            <p className="text-2xs font-black uppercase tracking-tight">{item.label}</p>
                            <p className="text-3xs font-bold text-muted-foreground leading-none">{item.desc}</p>
                        </div>
                    </button>
                    ))}
                </div>
             </div>

             {/* 3. Secondary Tools */}
             <div className="pt-2 space-y-3">
                <button
                   onClick={() => {
                       setIsZoneEditMode(!isZoneEditMode);
                       setIsAdminMenuOpen(false);
                   }}
                   className={`w-full h-14 rounded-[1.8rem] border-none font-black uppercase tracking-widest text-2xs flex items-center justify-between px-6 transition-all ${isZoneEditMode ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-white text-muted-foreground hover:bg-gray-50'}`}
                >
                   <span className="flex items-center gap-3">
                       <MapPin className="w-5 h-5 opacity-70" />
                       Gestion Zones
                   </span>
                   {isZoneEditMode && <span className="bg-white/20 px-2 py-0.5 rounded text-3xs">ATTENTION</span>}
                </button>

                {isZoneEditMode && (
                   <button
                     onClick={() => {
                       if (confirm("Réinitialiser tous les territoires aux valeurs par défaut ? (Ceci inclura Hugo et Yanis)")) {
                         // Note: In a real app we'd use seedZones function from store
                         // For now we just let the auto-fix in useStore do its job or we could trigger a specific action
                         window.location.reload(); // Quick way to trigger the init check
                       }
                     }}
                     className="w-full h-10 rounded-2xl border border-dashed border-primary/30 text-3xs font-black uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                   >
                     Scanner nouveaux agents
                   </button>
                )}

             </div>

             <button
                onClick={() => { toggleRole(); setIsAdminMenuOpen(false); }}
                className="w-full text-2xs font-black uppercase text-muted-foreground/60 tracking-widest h-12 mt-2 flex items-center justify-center gap-3 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
             >
                <div className="p-1.5 bg-secondary/30 rounded-lg group-hover:bg-red-100">
                   <RotateCcw className="w-4 h-4" />
                </div>
                Switch Session
             </button>
          </div>
        </DialogContent>
      </Dialog>


       {/* Validation Hub Dialog */}
       <Dialog open={isValidationOpen} onOpenChange={setIsValidationOpen}>
         <DialogContent className="w-[90vw] max-w-lg rounded-[3rem] p-6 glass border-none ios-shadow overflow-hidden bg-white/95">
           <DialogHeader className="mb-4 text-left">
             <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Validation Missions</DialogTitle>
             <DialogDescription className="text-xs font-bold text-muted-foreground uppercase opacity-70">
               Rapports terrain en attente de signature manager
             </DialogDescription>
           </DialogHeader>

           <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {interventions.filter(i => i.status === 'waiting_approval').map(int => (
                <div 
                  key={int.id}
                  className="p-4 rounded-[2rem] bg-white border border-black/5 flex items-center justify-between group hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-primary">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-2xs font-black uppercase tracking-widest text-muted-foreground/60">{int.time} — {users.find(u => u.id === int.tech_id)?.name}</p>
                      <p className="text-xs font-black text-foreground">{int.address.split(',')[0]}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="rounded-xl bg-black text-white text-3xs font-black uppercase tracking-widest h-8 px-4"
                    onClick={() => {
                      setSelectedIntervention(int);
                      setIsValidationOpen(false);
                      setIsAdminMenuOpen(false);
                    }}
                  >
                    Examiner
                  </Button>
                </div>
              ))}
              {interventions.filter(i => i.status === 'waiting_approval').length === 0 && (
                <div className="py-10 text-center space-y-3 opacity-30">
                  <CheckCircle className="w-10 h-10 mx-auto" />
                  <p className="text-2xs font-black uppercase tracking-widest">Tout est à jour</p>
                </div>
              )}
           </div>
         </DialogContent>
       </Dialog>


      {/* Report Dialogs & Modals */}
      <Dialog open={!!selectedIntervention} onOpenChange={(open) => !open && setSelectedIntervention(null)}>
         <DialogContent showCloseButton={false} className="w-[92vw] max-w-lg rounded-[2.5rem] p-0 glass ios-shadow border-none overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-5 pb-4 border-b border-black/5 flex justify-between items-center bg-white/40">
               <div className="flex-1 mr-4">
                  <Badge className="bg-green-500/10 text-green-600 border-none rounded-full px-2 text-3xs font-black uppercase mb-1">Intervention</Badge>
                  <DialogTitle asChild>
                    <input 
                      className="w-full bg-transparent border-none font-black tracking-tight text-lg p-0 focus:ring-0 focus:outline-none"
                      value={selectedIntervention?.address.split(',')[0] || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (selectedIntervention) {
                          const { updateIntervention } = useStore.getState();
                          updateIntervention(selectedIntervention.id, { address: `${e.target.value}, Strasbourg` });
                        }
                      }}
                    />
                  </DialogTitle>
               </div>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedIntervention(null)}>
                  <X className="w-4 h-4" />
               </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-white/20">
               {selectedIntervention && (
                 <>
                     <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/60 p-3 rounded-2xl border border-black/5">
                            <p className="text-3xs font-black text-muted-foreground uppercase opacity-50 mb-1">Technicien</p>
                            <Select 
                              value={selectedIntervention.tech_id} 
                              onValueChange={(newTechId) => {
                                const { updateIntervention } = useStore.getState();
                                updateIntervention(selectedIntervention.id, { tech_id: newTechId });
                              }}
                            >
                              <SelectTrigger className="h-7 border-none bg-transparent p-0 font-black text-xs focus:ring-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-2xl border-none glass ios-shadow">
                                {users.filter(u => u.role === 'tech').map(tech => (
                                  <SelectItem key={tech.id} value={tech.id} className="text-xs font-bold rounded-xl focus:bg-primary/5">
                                    {tech.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                         </div>
                        <div className="bg-white/60 p-3 rounded-2xl border border-black/5">
                           <p className="text-3xs font-black text-muted-foreground uppercase opacity-50">Total Estimation</p>
                           <p className="text-sm font-black text-green-600 tracking-tighter">{calculateIntTotal(selectedIntervention)} €</p>
                        </div>
                        <div className="bg-white/60 p-3 rounded-2xl border border-black/5">
                           <p className="text-3xs font-black text-muted-foreground uppercase opacity-50">Paiement</p>
                           <div className="flex items-center gap-1.5 mt-0.5">
                              {selectedIntervention.payment_method === '3x' ? (
                                 <>
                                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                                    <span className="text-2xs font-black uppercase text-orange-600">3x Fois</span>
                                 </>
                              ) : (
                                 <span className="text-2xs font-black uppercase text-foreground/60">{selectedIntervention.payment_method || 'N/A'}</span>
                              )}
                           </div>
                        </div>
                     </div>

                     {/* Breakdown UI - Detailed Pricing Engine */}
                     <div className="bg-white/40 rounded-[2rem] p-5 border border-black/5 space-y-3 shadow-sm">
                        <p className="text-3xs font-black uppercase text-muted-foreground/60 tracking-widest mb-1">Détails de la facturation</p>
                        {(() => {
                           const b = getPriceBreakdown(selectedIntervention);
                           return (
                              <>
                                 <div className="flex justify-between items-center text-2xs font-bold uppercase tracking-tight">
                                    <span className="text-muted-foreground">Forfait Main d'œuvre</span>
                                    <span className="text-foreground">{b.labor} €</span>
                                 </div>
                                 <div className="flex justify-between items-center text-2xs font-bold uppercase tracking-tight">
                                    <span className="text-muted-foreground">Matériel & Consommables ({selectedIntervention.parts_used.length})</span>
                                    <span className="text-foreground">{b.partsTotal} €</span>
                                 </div>
                                 {b.emergencySurcharge > 0 && (
                                    <div className="flex justify-between items-center text-2xs font-black uppercase tracking-tight text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                                       <span>Majorations Urgence (x1.5)</span>
                                       <span>+ {Math.round(b.emergencySurcharge)} €</span>
                                    </div>
                                 )}
                                 {b.commercialDiscount > 0 && (
                                    <div className="flex justify-between items-center text-2xs font-black uppercase tracking-tight text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                       <span>Remise commerciale</span>
                                       <span>- {b.commercialDiscount} €</span>
                                    </div>
                                 )}
                                 <div className="pt-3 mt-2 border-t border-black/10 flex justify-between items-center text-xs font-black uppercase tracking-widest text-foreground">
                                    <span>Total Estimé HT</span>
                                    <span className="text-lg text-green-600 underline decoration-2 underline-offset-4">{calculateIntTotal(selectedIntervention)} €</span>
                                 </div>
                              </>
                           );
                        })()}
                     </div>

                     {selectedIntervention.description && (
                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                           <p className="text-3xs font-black text-primary uppercase tracking-widest mb-1">Détails / Instructions</p>
                           <p className="text-xs font-medium italic text-foreground/80 leading-relaxed">{selectedIntervention.description}</p>
                        </div>
                     )}

                    <div className="space-y-2">
                       <h3 className="text-3xs font-black uppercase tracking-widest text-muted-foreground ml-1">Pièces et Matériel</h3>
                       <div className="bg-white/60 rounded-2xl border border-black/5 divide-y divide-black/5 overflow-hidden">
                          {selectedIntervention.parts_used.length ? selectedIntervention.parts_used.map((pu, idx) => {
                             const item = inventory.find(i => i.id === pu.item_id);
                             return (
                                <div key={idx} className="p-3 flex justify-between items-center">
                                   <span className="text-2xs font-bold">{item?.item_name}</span>
                                   <span className="text-2xs font-black">{pu.quantity} x {item?.price}€</span>
                                </div>
                             );
                          }) : <p className="p-4 text-center italic text-2xs text-muted-foreground">Aucun matériel utilisé</p>}
                       </div>
                    </div>

                     <div className="space-y-2">
                        <h3 className="text-3xs font-black uppercase tracking-widest text-muted-foreground ml-1">Photos Terrain</h3>
                        <div className="grid grid-cols-2 gap-2">
                           {(selectedIntervention.photos_url && selectedIntervention.photos_url.length > 0) ? selectedIntervention.photos_url.map((url, idx) => (
                               <img key={idx} src={url} className="rounded-2xl aspect-video object-cover border border-black/5 shadow-sm" alt="Preuve" />
                            )) : <div className="col-span-2 py-8 bg-black/5 rounded-2xl text-center italic text-2xs">Aucune photo</div>}
                        </div>
                     </div>

                     {selectedIntervention.customer_signature && (
                        <div className="space-y-2">
                           <h3 className="text-3xs font-black uppercase tracking-widest text-muted-foreground ml-1">Signature Client</h3>
                           <div className="bg-white/80 rounded-2xl border border-black/5 p-4 flex items-center justify-center shadow-sm">
                              <img src={selectedIntervention.customer_signature} className="h-32 object-contain filter contrast-125" alt="Signature" />
                           </div>
                        </div>
                     )}

                     {/* Document Export Center - Elite Engine */}
                     <div className="bg-black/5 rounded-[2.5rem] p-6 space-y-4 shadow-inner">
                        <div className="flex items-center gap-3 mb-1">
                           <div className="p-2 bg-primary/10 rounded-xl">
                              <FileText className="w-5 h-5 text-primary" />
                           </div>
                           <div>
                              <p className="text-2xs font-black uppercase tracking-[0.2em] text-primary leading-none mb-1">Centre d'Export</p>
                              <p className="text-3xs font-medium text-muted-foreground uppercase opacity-70">Génération PDF Officielle</p>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                           <Button 
                              variant="secondary" 
                              className="h-14 rounded-2xl bg-white text-2xs font-black uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all border-none"
                              onClick={() => downloadPDF('QUOTE', selectedIntervention, inventory)}
                           >
                              <Download className="w-4 h-4 opacity-50" />
                              Télécharger Devis
                           </Button>
                           <Button 
                              variant="secondary" 
                              className="h-14 rounded-2xl bg-white text-2xs font-black uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all border-none"
                              onClick={() => downloadPDF('INVOICE', selectedIntervention, inventory)}
                           >
                              <Download className="w-4 h-4 opacity-50" />
                              Télécharger Facture
                           </Button>
                           
                           {/* Email Export - Direct to alkhastvatsaev@gmail.com */}
                           <Button 
                              variant="secondary" 
                              className="h-14 rounded-2xl bg-black/80 text-white text-2xs font-black uppercase tracking-widest shadow-lg flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all border-none group relative overflow-hidden"
                              onClick={async () => {
                                 try {
                                    await sendPDFByEmail('QUOTE', selectedIntervention, inventory);
                                    alert('Devis envoyé avec succès à alkhastvatsaev@gmail.com');
                                 } catch (e) {
                                    alert('Erreur d\'envoi (Vérifiez la clé API Resend)');
                                 }
                              }}
                           >
                              <Send className="w-4 h-4 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              Mail Devis
                           </Button>
                           <Button 
                              variant="secondary" 
                              className="h-14 rounded-2xl bg-black/80 text-white text-2xs font-black uppercase tracking-widest shadow-lg flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all border-none group relative overflow-hidden"
                              onClick={async () => {
                                 try {
                                    await sendPDFByEmail('INVOICE', selectedIntervention, inventory);
                                    alert('Facture envoyée avec succès à alkhastvatsaev@gmail.com');
                                 } catch (e) {
                                    alert('Erreur d\'envoi (Vérifiez la clé API Resend)');
                                 }
                              }}
                           >
                              <Send className="w-4 h-4 text-green-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              Mail Facture
                           </Button>
                        </div>
                     </div>

                    {selectedIntervention.status === 'waiting_approval' ? (
                       <Button 
                        onClick={async () => {
                           const { updateIntervention } = useStore.getState();
                           await updateIntervention(selectedIntervention.id, { status: 'done' });
                           setHasNewArchive(true);
                           setSelectedIntervention(null);
                        }}
                        className="w-full h-16 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black uppercase tracking-[0.1em] shadow-xl shadow-green-500/20 active:scale-95 transition-all flex items-center gap-2 border-none"
                       >
                          <ClipboardCheck className="w-5 h-5" />
                          Valider et Clôturer
                       </Button>
                    ) : (
                       <div className="p-4 bg-black/5 rounded-2xl flex items-center justify-center gap-2 text-2xs font-black uppercase text-muted-foreground tracking-widest">
                          <CheckCircle className="w-4 h-4" />
                          Rapport déjà validé
                       </div>
                    )}
                   </>
                )}
             </div>
         </DialogContent>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/*  GLOBAL PLANNING MODAL — Monthly View for ALL Technicians     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Dialog open={isGlobalPlanningOpen} onOpenChange={setIsGlobalPlanningOpen}>
        <DialogContent className="w-[100vw] h-[100vh] max-w-none max-h-none m-0 p-0 rounded-none border-none bg-[#F8F9FB] flex flex-col overflow-hidden font-sans">
            <DialogHeader className="sr-only">
              <DialogTitle>Planning Global Stratégique</DialogTitle>
              <DialogDescription>Vue d'ensemble mensuelle de la planification des techniciens et de la couverture opérationnelle.</DialogDescription>
            </DialogHeader>
            {/* Header / Management Toolbar */}
            <div className="p-6 md:p-8 border-b border-black/5 bg-white shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-black rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl shadow-black/20">
                           <Calendar className="w-8 h-8" />
                        </div>
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-indigo-50 text-indigo-600 border-none rounded-full px-3 text-3xs font-black uppercase tracking-widest">Command Center</Badge>
                              <Badge className="bg-green-50 text-green-600 border-none rounded-full px-3 text-3xs font-black uppercase tracking-widest">Live</Badge>
                           </div>
                           <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Planning Stratégique — Février 2026</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-[2rem] border border-black/5">
                        <div className="px-6 py-2 border-r border-black/5">
                           <p className="text-3xs font-black text-slate-400 uppercase tracking-widest mb-1">C.A. Prévisionnel</p>
                           <p className="text-xl font-black text-indigo-600 leading-none">{monthlyCA} €</p>
                        </div>
                        <div className="px-6 py-2 border-r border-black/5">
                           <p className="text-3xs font-black text-slate-400 uppercase tracking-widest mb-1">Taux Occupation</p>
                           <p className="text-xl font-black text-slate-900 leading-none">84%</p>
                        </div>
                        <div className="px-6 py-2">
                           <p className="text-3xs font-black text-slate-400 uppercase tracking-widest mb-1">Missions/Jour</p>
                           <p className="text-xl font-black text-slate-900 leading-none">~12.4</p>
                        </div>
                        <Button 
                            onClick={() => setIsGlobalPlanningOpen(false)}
                            className="w-12 h-12 rounded-full bg-white text-black border border-black/5 shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center p-0 ml-4"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Planning Grid */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-white/50 w-full">
                <table className="w-full border-collapse min-w-full">
                    <thead className="sticky top-0 z-20 shadow-sm">
                        <tr className="bg-white">
                            <th className="p-4 text-left min-w-[240px] sticky left-0 bg-white z-30 border-b border-r border-black/5">
                                <div className="flex items-center justify-between">
                                  <span className="text-2xs font-black uppercase tracking-widest text-slate-400">Ressources Humaines</span>
                                  <Users className="w-4 h-4 text-slate-300" />
                                </div>
                            </th>
                            {Array.from({ length: 28 }).map((_, i) => {
                                const dayDate = new Date(2026, 1, i + 1);
                                const dayOfWeek = dayDate.getDay();
                                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                const isToday = dayDate.toDateString() === new Date().toDateString();
                                return (
                                    <th key={i} className={`p-3 min-w-[56px] border-b border-black/5 text-center transition-colors ${isToday ? 'bg-indigo-50/50' : isWeekend ? 'bg-slate-50/80' : 'bg-white'}`}>
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-3xs font-black uppercase tracking-tight ${isWeekend ? 'text-red-400' : 'text-slate-400'}`}>
                                                {['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][dayOfWeek]}
                                            </span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all ${isToday ? 'bg-indigo-600 text-white shadow-lg' : isWeekend ? 'text-red-500' : 'text-slate-900 group-hover:scale-110'}`}>
                                               {i + 1}
                                            </div>
                                        </div>
                                    </th>
                                );
                            })}
                            <th className="p-4 min-w-[100px] border-b border-l border-black/5 text-center sticky right-0 bg-white z-30">
                                <span className="text-3xs font-black uppercase tracking-widest text-slate-400">Mensuel</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.filter(u => u.role === 'tech').map((tech) => {
                            const techMissionsMonth = interventions.filter(int => int.tech_id === tech.id);
                            const techWorkDays = schedules.filter(s => s.tech_id === tech.id && s.type === 'working');
                            
                            return (
                                <tr key={tech.id} className="group hover:bg-white/80 transition-colors">
                                    {/* Tech Info */}
                                    <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 transition-colors border-r border-b border-black/5">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                               <Avatar className="w-12 h-12 border-2 border-white shadow-md flex-shrink-0">
                                                   <AvatarImage src={tech.avatar_url} />
                                                   <AvatarFallback className="text-xs bg-indigo-50 text-indigo-600 font-extrabold">{tech.name[0]}</AvatarFallback>
                                               </Avatar>
                                               <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-white" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase tracking-tighter truncate text-slate-900">{tech.name}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                   <p className="text-3xs font-bold text-slate-400 bg-slate-100 px-1.5 rounded-full uppercase truncate">{tech.specialties?.[0] || 'Général'}</p>
                                                   <Badge className="h-3 text-4xs font-black bg-indigo-50 text-indigo-600 border-none px-1">AUTO</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Day Cells */}
                                    {Array.from({ length: 28 }).map((_, i) => {
                                        const day = i + 1;
                                        const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
                                        const schedule = schedules.find(s => s.tech_id === tech.id && s.date === dateStr);
                                        const missionCount = interventions.filter(int => int.tech_id === tech.id && int.date === dateStr).length;
                                        const dayOfWeek = new Date(2026, 1, day).getDay();
                                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                                        
                                        let bgClass = isWeekend ? 'bg-slate-50/50' : 'bg-transparent';
                                        let content = null;
                                        
                                        if (schedule) {
                                            if (schedule.type === 'working') {
                                                bgClass = 'bg-green-50 hover:bg-green-100/70';
                                                content = (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="text-4xs font-bold text-green-700">{schedule.start_time?.slice(0,5)}</span>
                                                        <span className="text-4xs font-bold text-green-700">{schedule.end_time?.slice(0,5)}</span>
                                                    </div>
                                                );
                                            } else if (schedule.type === 'on_call') {
                                                bgClass = 'bg-purple-50 hover:bg-purple-100/70';
                                                content = <span className="text-3xs font-black text-purple-600">AST</span>;
                                            } else {
                                                bgClass = 'bg-slate-50 opacity-40';
                                                content = <span className="text-3xs text-slate-400">—</span>;
                                            }
                                        }
                                        
                                        return (
                                            <td key={i} className={`p-1 border-b border-r border-black/[.03]  text-center align-middle ${bgClass} transition-all duration-300 relative group/cell`}>
                                                <div className="flex flex-col items-center justify-center p-2 h-20 gap-1.5 rounded-2xl group-hover/cell:scale-105 transition-transform cursor-pointer overflow-hidden">
                                                    {content}
                                                    {missionCount > 0 && (
                                                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm border border-amber-200">
                                                            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                                            <span className="text-3xs font-black text-amber-700">{missionCount} missions</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    
                                    {/* Totals */}
                                    <td className="p-3 border-b border-l border-black/5 text-center sticky right-0 bg-[#F8F9FB] group-hover:bg-white/80 z-10 transition-colors">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-sm font-black text-foreground">{techMissionsMonth.length}</span>
                                            <span className="text-4xs font-bold text-muted-foreground uppercase">missions</span>
                                            <span className="text-3xs font-bold text-green-600">{techWorkDays.length}j</span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* COVERAGE ROW — Daily totals */}
                        <tr className="bg-indigo-50/50 border-t-2 border-indigo-200">
                            <td className="p-3 sticky left-0 bg-indigo-50/80 z-10 border-r border-black/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <Users className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xs font-black uppercase tracking-widest text-indigo-700">Couverture</p>
                                        <p className="text-3xs text-indigo-500">Actifs / jour</p>
                                    </div>
                                </div>
                            </td>
                            {Array.from({ length: 28 }).map((_, i) => {
                                const day = i + 1;
                                const dateStr = `2026-02-${day.toString().padStart(2, '0')}`;
                                const activeCount = schedules.filter(s => s.date === dateStr && s.type === 'working').length;
                                const isLow = activeCount < 2;
                                
                                return (
                                    <td key={i} className={`p-1 border-b border-r border-black/[.03] text-center ${isLow ? 'bg-red-50' : ''}`}>
                                        <span className={`text-sm font-black ${isLow ? 'text-red-500' : 'text-indigo-600'}`}>
                                            {activeCount}
                                        </span>
                                        {isLow && <AlertTriangle className="w-3 h-3 text-red-400 mx-auto mt-0.5" />}
                                    </td>
                                );
                            })}
                            <td className="p-3 border-b border-l border-black/5 text-center sticky right-0 bg-indigo-50/80 z-10">
                                <span className="text-3xs font-black text-indigo-600 uppercase">Moy.</span>
                                <p className="text-sm font-black text-indigo-700">
                                    {(() => {
                                        const total = Array.from({ length: 28 }).reduce((acc: number, _, i) => {
                                            const dateStr = `2026-02-${(i+1).toString().padStart(2, '0')}`;
                                            return acc + schedules.filter(s => s.date === dateStr && s.type === 'working').length;
                                        }, 0);
                                        return (total / 28).toFixed(1);
                                    })()}
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </DialogContent>
      </Dialog>

      {/* Creation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent showCloseButton={false} className="w-[92vw] max-w-lg md:max-w-2xl lg:max-w-3xl rounded-[2.5rem] p-0 glass ios-shadow border-none overflow-hidden max-h-[85vh] flex flex-col">
          <div className="p-6 bg-white/40 border-b border-black/5 flex justify-between items-center">
            <div>
              <p className="text-2xs font-black text-primary uppercase tracking-[0.2em] mb-1">Planification</p>
              <DialogTitle className="text-2xl font-black tracking-tight leading-none uppercase">Créer Mission</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsCreateModalOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white/20">
            {/* AI Dispatch Copilot Section */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-[2rem] border border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                    <BrainCircuit className="w-12 h-12 text-indigo-500" />
                </div>
                
                <div className="flex items-center justify-between mb-3 relative z-10">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                        <span className="text-2xs font-black uppercase tracking-widest text-indigo-600">Dispatch Copilot</span>
                    </div>
                </div>

                {!aiSuggestion && !isAnalyzing && (
                    <div className="text-center py-2">
                        <p className="text-2xs text-muted-foreground font-medium mb-3">L&apos;IA peut analyser le trafic et les stocks pour suggérer le meilleur technicien.</p>
                        <Button 
                            onClick={generateAISuggestion}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-3xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                        >
                            <BrainCircuit className="w-3 h-3 mr-2" />
                            Analyser & Suggérer
                        </Button>
                    </div>
                )}

                {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                        <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                        <p className="text-3xs font-bold text-indigo-600 uppercase tracking-wide animate-pulse">Analyse logistique en cours...</p>
                    </div>
                )}

                {aiSuggestion && (
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-200/50 animate-in fade-in slide-in-from-bottom-2 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                                <span className="text-2xs font-black text-indigo-950 uppercase tracking-tighter">Suggestion Agent : {aiSuggestion.techName}</span>
                            </div>
                            <Badge className="bg-indigo-600 text-white border-none text-3xs font-black px-2 shadow-lg shadow-indigo-500/20">{aiSuggestion.confidence}% CONFIDENTIALITÉ</Badge>
                        </div>
                        
                        <p className="text-2xs text-indigo-900/80 leading-relaxed font-medium mb-3 italic">
                           &ldquo;{aiSuggestion.reasoning}&rdquo;
                        </p>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className="text-3xs font-black text-indigo-600 uppercase tracking-widest">Optimisation Logistique</span>
                                <span className="text-3xs font-black text-indigo-700">{aiSuggestion.optimizationScore}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${aiSuggestion.optimizationScore}%` }}
                                    className="h-full bg-indigo-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2 relative">
                <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Adresse de l&apos;intervention</Label>
                <div className="relative group/input">
                  <Input 
                    placeholder="Tapez l'adresse (ex: 17 rue seneque)..." 
                    className="h-14 rounded-2xl bg-white/60 border-black/5 font-bold pr-12 focus:bg-white transition-all shadow-inner"
                    value={newMission.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setNewMission({...newMission, address: e.target.value, latitude: 0, longitude: 0, tech_id: ""});
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {newMission.latitude !== 0 && <CheckCircle className="w-5 h-5 text-green-500 animate-in zoom-in" />}
                    {isSearchingAddress && <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />}
                  </div>
                </div>

                {/* Suggestions Dropdown */}
                <AnimatePresence>
                  {addressSuggestions.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-[110] top-[105%] left-0 w-full glass-dark bg-white/95 backdrop-blur-3xl rounded-[2rem] border border-black/5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden py-2"
                    >
                      {addressSuggestions.length === 0 && !isSearchingAddress && (
                        <div className="px-4 py-3 text-center text-2xs font-bold text-muted-foreground uppercase opacity-50">
                          Aucun résultat trouvé
                        </div>
                      )}
                      {addressSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          className="w-full text-left px-4 py-3 hover:bg-primary/5 transition-colors border-b border-black/5 last:border-none group"
                          onClick={() => {
                            const lat = parseFloat(suggestion.lat);
                            const lng = parseFloat(suggestion.lon);
                            console.log('Territory Search:', { lat, lng, zonesCount: zones.length });
                            const sectoralTechId = findTechForLocation(lat, lng, zones);
                            console.log('Result:', sectoralTechId);
                            
                            setNewMission({
                              ...newMission,
                              address: suggestion.display_name.split(',').slice(0, 3).join(','),
                              latitude: lat,
                              longitude: lng,
                              tech_id: sectoralTechId || newMission.tech_id
                            });
                            
                            if (sectoralTechId) {
                                const techName = users.find(u => u.id === sectoralTechId)?.name;
                                addNotification({
                                    type: 'tech',
                                    title: 'Secteur Détecté',
                                    message: `${techName} est le responsable de cette zone.`
                                });
                            }
                            
                            setAddressSuggestions([]);
                          }}
                        >
                          <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">
                            {suggestion.display_name.split(',')[0]}
                          </p>
                          <p className="text-3xs font-bold text-muted-foreground uppercase opacity-70">
                            {suggestion.display_name.split(',').slice(1, 3).join(',')}
                          </p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Technicien</Label>
                  <Select 
                    value={newMission.tech_id}
                    onValueChange={(val) => setNewMission({...newMission, tech_id: val})}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white/60 border-black/5 font-bold">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none glass ios-shadow">
                      {users.filter(u => u.role === 'tech').map(tech => (
                        <SelectItem key={tech.id} value={tech.id} className="rounded-xl font-bold">{tech.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Équipement (Asset)</Label>
                  <Select 
                    value={newMission.asset_id}
                    onValueChange={(val) => setNewMission({...newMission, asset_id: val})}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white/60 border-black/5 font-bold">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none glass ios-shadow">
                      {assets.map(asset => (
                        <SelectItem key={asset.id} value={asset.id} className="rounded-xl font-bold">{asset.qr_code_id} - {asset.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Catégorie de Service</Label>
                  <Select 
                    value={newMission.category} 
                    onValueChange={(val: any) => setNewMission({...newMission, category: val})}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white/60 border-black/5 font-bold">
                      <SelectValue placeholder="Choisir..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none glass ios-shadow">
                      <SelectItem value="emergency" className="rounded-xl font-bold">Ouverture d'Urgence</SelectItem>
                      <SelectItem value="installation" className="rounded-xl font-bold">Installation / Pose</SelectItem>
                      <SelectItem value="repair" className="rounded-xl font-bold">Réparation / SAV</SelectItem>
                      <SelectItem value="maintenance" className="rounded-xl font-bold">Entretien Préventif</SelectItem>
                      <SelectItem value="automotive" className="rounded-xl font-bold">Serrurerie Automobile</SelectItem>
                      <SelectItem value="safe" className="rounded-xl font-bold">Coffre-Fort / Blindage</SelectItem>
                      <SelectItem value="access_control" className="rounded-xl font-bold">Contrôle d'Accès Smart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
                  <Input 
                    type="date" 
                    className="h-12 rounded-xl bg-white/60 border-black/5 font-bold"
                    value={newMission.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMission({...newMission, date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Heure</Label>
                  <Input 
                    type="time" 
                    className="h-12 rounded-xl bg-white/60 border-black/5 font-bold"
                    value={newMission.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMission({...newMission, time: e.target.value})}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Durée Estimée (min)</Label>
                  <Select 
                    value={newMission.estimated_duration.toString()}
                    onValueChange={(val) => setNewMission({...newMission, estimated_duration: parseInt(val)})}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-white/60 border-black/5 font-bold">
                      <SelectValue placeholder="30" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none glass ios-shadow">
                      <SelectItem value="15" className="rounded-xl font-bold">15 min</SelectItem>
                      <SelectItem value="30" className="rounded-xl font-bold">30 min</SelectItem>
                      <SelectItem value="45" className="rounded-xl font-bold">45 min</SelectItem>
                      <SelectItem value="60" className="rounded-xl font-bold">1h</SelectItem>
                      <SelectItem value="90" className="rounded-xl font-bold">1h30</SelectItem>
                      <SelectItem value="120" className="rounded-xl font-bold">2h</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Enhanced Estimation Controls */}
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Forfait MO (€)</Label>
                    <Input 
                      type="number"
                      value={newMission.labor_cost}
                      onChange={(e) => setNewMission({...newMission, labor_cost: parseInt(e.target.value) || 0})}
                      className="h-12 rounded-xl bg-white/60 border-black/5 font-bold"
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Urgence / Nuit</Label>
                    <button 
                      onClick={() => setNewMission({...newMission, is_emergency: !newMission.is_emergency})}
                      className={`h-12 w-full rounded-xl font-black uppercase tracking-widest text-2xs transition-all border-none flex items-center justify-center gap-2 ${newMission.is_emergency ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/60 text-muted-foreground'}`}
                    >
                      <AlertTriangle className={`w-4 h-4 ${newMission.is_emergency ? 'animate-pulse' : ''}`} />
                      {newMission.is_emergency ? 'Actif (x1.5)' : 'Normal'}
                    </button>
                 </div>
              </div>

              <div className="space-y-2">
                <Label className="text-2xs font-black uppercase tracking-widest text-muted-foreground ml-1">Détails de la mission</Label>
                <Textarea 
                  placeholder="Instructions pour le technicien..." 
                  className="min-h-[100px] rounded-xl bg-white/60 border-black/5 font-bold resize-none"
                  value={newMission.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewMission({...newMission, description: e.target.value})}
                />
              </div>
            </div>

            <Button 
              className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4 border-none"
              onClick={async () => {
                if (!newMission.address || !newMission.tech_id || !newMission.asset_id) {
                  alert("Veuillez remplir les champs obligatoires (Adresse, Tech, Équipement)");
                  return;
                }

                const { addIntervention } = useStore.getState();
                const id = `int_${Date.now()}`;
                
                // If coordinates are missing (user didn't click suggestion), try one last geocode
                let lat = newMission.latitude;
                let lon = newMission.longitude;
                
                if (lat === 0) {
                  try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newMission.address + ", Strasbourg")}`);
                    const data = await response.json();
                    if (data && data.length > 0) {
                      lat = parseFloat(data[0].lat);
                      lon = parseFloat(data[0].lon);
                    }
                  } catch {
                    lat = 48.5830;
                    lon = 7.7480;
                  }
                }

                await addIntervention({
                  id,
                  ...newMission,
                  latitude: lat || 48.5830,
                  longitude: lon || 7.7480,
                  status: 'pending',
                  parts_used: [],
                  payment_status: 'unpaid'
                });

                // Auto-Notifications (WhatsApp & Email)
                const tech = users.find(u => u.id === newMission.tech_id);
                if (tech) {
                  // 1. WhatsApp
                  if (tech.phone) {
                    const wsMsg = whatsappTemplates.dispatchToTech(tech.name, {
                      ...newMission,
                      id
                    });
                    sendWhatsAppMessage(tech.phone, wsMsg);
                  }

                  // 2. Email (Simulated API call)
                  if (tech.email) {
                    console.log(`[SIMULATION] Envoi d'un email de mission à ${tech.email}`);
                    // In a real app we would call: sendMissionEmail(tech.email, newMission);
                    addNotification({
                      type: 'success',
                      title: 'Notifications Envoyées',
                      message: `WhatsApp et Email envoyés à ${tech.name}.`
                    });

                    // Trigger HUD Toast
                    setToast({ 
                      message: `Mission assignée : WhatsApp & Email envoyés à ${tech.name}`, 
                      type: 'success' 
                    });
                    setTimeout(() => setToast(null), 3000);
                  }
                }
                
                setIsCreateModalOpen(false);
                setNewMission({
                  address: '',
                  tech_id: '',
                  asset_id: '',
                  category: 'repair',
                  date: new Date().toISOString().split('T')[0],
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  description: '',
                  latitude: 0,
                  longitude: 0,
                  estimated_duration: 30,
                  labor_cost: 80,
                  is_emergency: false
                });
              }}
            >
              Assigner la Mission
            </Button>
          </div>
        </DialogContent>
      </Dialog>

       {/* 6. ROI WAR ROOM: STRASBOURG DOMINATION HUB */}
       <Dialog open={isPublicityHubOpen} onOpenChange={setIsPublicityHubOpen}>
         <DialogContent className="max-w-xl w-[95vw] h-[90vh] bg-slate-950 border-none p-0 overflow-hidden text-white flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.5)]">
            <DialogHeader className="sr-only">
              <DialogTitle>ROI War Room: Strasbourg Domination</DialogTitle>
              <DialogDescription>Centre de contrôle publicitaire et optimisation IA des campagnes Google Ads.</DialogDescription>
            </DialogHeader>

            {/* Header: Matrix/War Room Style */}
            <div className="bg-slate-900/80 backdrop-blur-xl px-4 md:px-10 py-8 border-b border-white/5 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-orange-500/20 animate-pulse">
                     <Megaphone className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none italic">ROI WAR ROOM</h2>
                    <p className="text-2xs font-black text-orange-500 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                       <Crosshair className="w-3 h-3" /> Strasbourg Domination Hub v4.0
                    </p>
                  </div>
               </div>
               <Button 
                 variant="ghost" 
                 size="icon" 
                 onClick={() => setIsPublicityHubOpen(false)}
                 className="text-white/40 hover:text-white hover:bg-white/10 rounded-full h-10 w-10"
               >
                 <X className="w-6 h-6" />
               </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.1),transparent)]">
               
               {/* 1. Master Performance Grid */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                      <p className="text-2xs font-black uppercase tracking-widest text-white/40 mb-1">Budget Jour</p>
                      <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-black tracking-tighter">145.00 €</h3>
                          <Badge className="bg-green-500/20 text-green-400 border-none text-4xs font-black mb-1">OPTIMISÉ</Badge>
                      </div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 relative overflow-hidden group">
                      <p className="text-2xs font-black uppercase tracking-widest text-white/40 mb-1">Lead Conversion</p>
                      <div className="flex items-end gap-2">
                          <h3 className="text-3xl font-black tracking-tighter">24.5%</h3>
                          <span className="text-4xs font-black text-orange-500 mb-1">+4.2% AI</span>
                      </div>
                  </div>
               </div>

               {/* 2. THE GOOGLE SNIPER (Main Ads Control) */}
               <div className="space-y-6">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <Globe className="w-4 h-4 text-primary" />
                        Google Ads Cloud
                     </h3>
                     <Badge className="bg-primary/20 text-primary border-none text-3xs font-black uppercase">Flux Temps Réel</Badge>
                  </div>

                  <div className="bg-white/5 rounded-[3rem] p-8 border border-white/5 space-y-8 relative overflow-hidden">
                      {/* Sentinel Grid Overlay Effect */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] pointer-events-none" />
                      
                      <div className="flex items-center justify-between gap-6 relative z-10">
                         <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${runningCampaigns.includes('google_sniper') ? 'bg-primary text-white shadow-2xl shadow-primary/40' : 'bg-white/5 text-white/20'}`}>
                               <MousePointerClick className="w-7 h-7" />
                            </div>
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-lg font-black tracking-tight uppercase leading-none">Google Sniper x Sentinel</h4>
                                  {runningCampaigns.includes('google_sniper') && (
                                    <Badge className="h-3.5 bg-green-500 text-white border-none text-[7px] font-black uppercase px-1.5 flex items-center gap-1 animate-pulse">
                                       <Zap className="w-2 h-2 fill-current" /> Sentinel Sync
                                    </Badge>
                                  )}
                               </div>
                               <p className="text-2xs font-medium text-white/40 uppercase tracking-widest">Enchères prédictives & Sentinel Lead Capture</p>
                            </div>
                         </div>
                         <button 
                            onClick={() => toggleCampaign('google_sniper', 'Google Ads x Sentinel')}
                            className={`w-16 h-8 rounded-full transition-all relative border-none ${runningCampaigns.includes('google_sniper') ? 'bg-primary' : 'bg-white/10'}`}
                         >
                            <motion.div 
                               animate={{ x: runningCampaigns.includes('google_sniper') ? 32 : 4 }}
                               className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-lg"
                            />
                         </button>
                      </div>

                      <div className="grid grid-cols-3 gap-4 relative z-10">
                         {[
                            { label: 'C-P-C Médian', value: '1.42 €', color: 'text-indigo-400' },
                            { label: 'Sentinel ROI', value: 'x12.4', color: 'text-green-400' },
                            { label: 'Score Qualité', value: '10/10', color: 'text-orange-400' }
                         ].map((stat, i) => (
                            <div key={i} className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                               <p className="text-4xs font-black text-white/40 uppercase mb-1">{stat.label}</p>
                               <p className={`text-sm font-black ${stat.color}`}>{stat.value}</p>
                            </div>
                         ))}
                      </div>

                      {/* Sentinel Specific Control */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            <span className="text-3xs font-black text-white/40 uppercase tracking-widest">Optimisation Sentinel AI</span>
                         </div>
                         <div className="flex items-center gap-1.5">
                            <span className={`text-[8px] font-black uppercase ${runningCampaigns.includes('google_sniper') ? 'text-primary' : 'text-white/20'}`}>
                               {runningCampaigns.includes('google_sniper') ? 'Actif' : 'Veille'}
                            </span>
                         </div>
                      </div>
                  </div>
               </div>

               {/* 3. Anti-Fraud & Market Intelligence */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                     <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <ShieldAlert className="w-4 h-4 text-red-500" />
                        Click-Guard AI
                     </h3>
                     <div className="bg-red-500/5 rounded-[2.5rem] p-6 border border-red-500/10 space-y-4">
                        <div className="flex justify-between items-center text-4xs font-black uppercase text-red-400">
                           <span>IPs Bloquées</span>
                           <span>Budget Sauvé</span>
                        </div>
                        <div className="flex justify-between items-end">
                           <p className="text-2xl font-black text-red-500">{antiFraudStats.blockedIPs}</p>
                           <p className="text-2xl font-black text-green-400">{antiFraudStats.savedBudget} €</p>
                        </div>
                        <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/10">
                           <p className="text-4xs font-bold text-red-400 italic">Dernière attaque : {antiFraudStats.lastAttack}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <Trophy className="w-4 h-4 text-amber-500" />
                        Market Intel
                     </h3>
                     <div className="bg-white/5 rounded-[2.5rem] p-4 border border-white/5 space-y-3">
                        {marketIntel.map((competitor, i) => (
                           <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors group">
                              <div>
                                 <p className="text-2xs font-black uppercase tracking-tight group-hover:text-amber-400 transition-colors">{competitor.name}</p>
                                 <p className="text-3xs font-bold text-white/20 uppercase">Activités : {competitor.ads} Ads</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xs font-black text-white">{competitor.topAbs}</p>
                                 <Badge className={`h-3 text-[8px] border-none px-1 uppercase ${competitor.status === 'aggressive' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                                    {competitor.status}
                                 </Badge>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 4. LOCAL SENTINEL ADS (from SecurityIncidents) */}
               <div className="space-y-6 pb-10">
                  <div className="flex items-center justify-between">
                     <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <Zap className="w-4 h-4 text-primary fill-current" />
                        Capture de Leads (Strasbourg Sentinel)
                     </h3>
                     <Badge className="bg-blue-500 text-white border-none text-3xs font-black px-2">{securityIncidents.length} EVENTS</Badge>
                  </div>

                  <div className="space-y-4">
                     {securityIncidents.slice(0, 3).map((incident, idx) => (
                        <div key={idx} className="bg-white/5 p-6 rounded-[2.5rem] border border-white/10 hover:border-primary/30 transition-all group overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                              <Star className="w-16 h-16" />
                           </div>
                           <div className="flex justify-between items-start mb-4 relative z-10">
                              <div>
                                 <p className="text-4xs font-black text-primary uppercase tracking-widest mb-1">{incident.type}</p>
                                 <h4 className="text-sm font-black tracking-tight">{incident.location}</h4>
                                 <p className="text-3xs font-bold text-white/40 mt-1">{incident.source} • {incident.timestamp}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-black text-green-400">~{incident.potentialRevenue} €</p>
                                 <p className="text-4xs font-black text-white/40 uppercase">Potentiel CA</p>
                              </div>
                           </div>
                           <p className="text-2xs text-white/60 leading-relaxed font-medium mb-4 italic line-clamp-2">
                              &ldquo;{incident.salesPitch}&rdquo;
                           </p>
                           <Button 
                              size="sm" 
                              className="w-full h-10 rounded-xl bg-primary hover:bg-primary/80 text-white font-black uppercase text-2xs tracking-widest border-none flex items-center gap-2"
                              onClick={() => {
                                 setToast({ message: "Campagne de micro-ciblage lancée sur ce périmètre.", type: 'success' });
                                 setTimeout(() => setToast(null), 3000);
                              }}
                           >
                              Lancer Campagne Sniper Locale
                           </Button>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Footer: Tech Specs */}
            <div className="bg-slate-900 px-8 py-4 border-t border-white/5 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]" />
                  <span className="text-3xs font-black text-white/40 uppercase tracking-widest">IA Engine 1.0 (Google Llama-3-70B Bridge)</span>
               </div>
               <p className="text-3xs font-black text-white/20 uppercase tracking-widest italic">ROI Garanti \ Strasbourg Domination</p>
            </div>
         </DialogContent>
       </Dialog>

       {/* 6b. ACCOUNTING HUB: AI FINANCIAL PILOT */}
       <Dialog open={isAccountingHubOpen} onOpenChange={setIsAccountingHubOpen}>
         <DialogContent className="max-w-lg w-[95vw] h-[90vh] bg-slate-50/50 backdrop-blur-3xl rounded-[3rem] border-none p-0 overflow-hidden text-slate-900 flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
            <DialogHeader className="sr-only">
              <DialogTitle>Hub Comptabilité & IA Finance</DialogTitle>
              <DialogDescription>Gestion financière avancée et analyse prédictive SERRURE OS.</DialogDescription>
            </DialogHeader>

            {/* Header */}
            <div className="bg-white/80 backdrop-blur-md px-4 md:px-10 py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
                  <Euro className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Pilotage Financier AI</h2>
                  <p className="text-2xs font-black text-amber-600 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                    <Sparkles className="w-3 h-3" /> Analyse en Temps Réel • Expert Comptable IA v2.0
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden md:flex flex-col items-end mr-4">
                    <p className="text-3xs font-black text-slate-400 uppercase tracking-widest">Solde Dispo (Estimé)</p>
                    <p className="text-xl font-black text-slate-900">{monthlyCA - 4500} €</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsAccountingHubOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
              {/* Top Metrics Grid - 2x2 for clean density */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group col-span-2 sm:col-span-1">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-24 h-24" />
                    </div>
                    <p className="text-3xs font-black uppercase tracking-widest opacity-60 mb-1">C.A. Mensuel</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-black tracking-tighter">{formatPrice(monthlyCA)}</h3>
                        <Badge className="bg-white/20 text-white border-none text-4xs font-black mb-1">+14%</Badge>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group col-span-2 sm:col-span-1">
                    <p className="text-3xs font-black uppercase tracking-widest text-slate-400 mb-1">Encaissements jour</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-black tracking-tighter text-slate-900">{formatPrice(dailyCA)}</h3>
                        <div className="flex-1 h-1 bg-green-100 rounded-full overflow-hidden mb-2 ml-2">
                            <div className="h-full bg-green-500 rounded-full" style={{ width: '65%' }} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm col-span-2 sm:col-span-1">
                    <p className="text-3xs font-black uppercase tracking-widest text-slate-400 mb-1">Impayés</p>
                    <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black tracking-tighter text-red-500">{formatPrice(unpaidTotal)}</h3>
                        <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 p-5 rounded-[2rem] text-white shadow-xl col-span-2 sm:col-span-1">
                    <p className="text-3xs font-black uppercase tracking-widest opacity-40 mb-1">TVA (20%)</p>
                    <div className="flex items-end gap-2">
                        <h3 className="text-2xl font-black tracking-tighter text-indigo-400">{Math.round(monthlyCA * 0.2)} €</h3>
                    </div>
                </div>
              </div>

              {/* Main Content Sections - Clean Vertical Feed */}
              <div className="grid grid-cols-1 gap-8 md:gap-10">
                {/* 1. Payment Method Mix (AI Analyzed) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <PieChart className="w-4 h-4 text-indigo-600" />
                            Répartition Modes
                        </h3>
                    </div>
                    <div className="bg-white rounded-[3rem] p-8 border border-slate-100 shadow-sm space-y-6">
                        {[
                            { label: 'Carte Bancaire (Stripe/SUMUP)', amount: Math.round(monthlyCA * 0.65), percentage: 65, icon: CreditCard, color: 'bg-blue-500' },
                            { label: 'Espèces', amount: Math.round(monthlyCA * 0.15), percentage: 15, icon: Euro, color: 'bg-green-500' },
                            { label: 'Paiement 3x', amount: Math.round(monthlyCA * 0.12), percentage: 12, icon: Sparkles, color: 'bg-orange-500' },
                            { label: 'Apple Pay / GPay', amount: Math.round(monthlyCA * 0.08), percentage: 8, icon: Wallet, color: 'bg-black' }
                        ].map((method, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between items-center text-2xs md:text-2xs font-black uppercase gap-4">
                                    <span className="flex items-center gap-2 text-slate-600 truncate min-w-0">
                                        <method.icon className="w-3.5 h-3.5 opacity-50 shrink-0" />
                                        <span className="truncate">{method.label}</span>
                                    </span>
                                    <span className="text-slate-900 shrink-0">{method.amount} €</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${method.percentage}%` }}
                                        className={`h-full ${method.color}`} 
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="pt-6 border-t border-slate-50">
                            <div className="p-4 bg-indigo-50 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0">
                                    <BrainCircuit className="w-5 h-5" />
                                </div>
                                <p className="text-2xs font-bold text-indigo-700 leading-tight">
                                    <span className="font-black">Insight IA :</span> Le paiement en 3x a augmenté le panier moyen de 18% ce mois-ci.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Unpaid Invoice Management (Smartrecov) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                            <Receipt className="w-4 h-4 text-red-500" />
                            Recouvrement Intelligent
                        </h3>
                        <Badge className="bg-red-50 text-red-700 border-none text-3xs font-black uppercase">
                            {interventions.filter(i => i.status === 'done' && i.payment_status === 'unpaid').length} Actions Requises
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {interventions.filter(i => i.status === 'done' && i.payment_status === 'unpaid').map((int, idx) => {
                            const tech = users.find(u => u.id === int.tech_id);
                            const total = calculateIntTotal(int);
                            return (
                                <motion.div 
                                    key={int.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-red-200 transition-colors"
                                >
                                    <div className="flex items-center gap-4 md:gap-6 min-w-0">
                                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-colors shrink-0">
                                            <FileText className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-3xs font-black text-slate-400 uppercase tracking-widest mb-0.5">{int.date} • {int.time}</p>
                                            <h4 className="text-sm font-black text-slate-900 tracking-tight truncate">{int.address.split(',')[0]}</h4>
                                            <p className="text-2xs font-bold text-slate-500 truncate">Assigné à : {tech?.name}</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-3 md:gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                                        <div className="text-left md:text-right shrink-0">
                                            <p className="text-base md:text-lg font-black text-red-600">{total} €</p>
                                            <p className="text-3xs font-black uppercase tracking-tighter text-slate-400">À Encaisser</p>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button 
                                                size="sm"
                                                variant="outline"
                                                className="h-8 md:h-10 px-3 md:px-6 rounded-xl border-slate-100 text-3xs md:text-2xs font-black uppercase tracking-widest hover:bg-slate-50"
                                                onClick={() => alert("Génération de la facture PDF...")}
                                            >
                                                Facture
                                            </Button>
                                            <Button 
                                                size="sm"
                                                className="h-8 md:h-10 px-3 md:px-6 rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 text-3xs md:text-2xs font-black uppercase tracking-widest hover:bg-indigo-700 border-none flex items-center gap-2"
                                                onClick={() => {
                                                    setToast({ message: `Relance IA envoyée par SMS au client du ${int.date}`, type: 'success' });
                                                    setTimeout(() => setToast(null), 3000);
                                                }}
                                            >
                                                <Zap className="w-3 h-3 fill-current shrink-0" />
                                                Relance
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {interventions.filter(i => i.status === 'done' && i.payment_status === 'unpaid').length === 0 && (
                            <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Tous les paiements sont à jour</p>
                            </div>
                        )}
                    </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-indigo-50 p-6 md:p-8 rounded-[3rem] border border-indigo-100 flex flex-col items-center justify-center text-center gap-6">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white rounded-[1.8rem] shadow-sm flex items-center justify-center text-indigo-600 shrink-0">
                            <Download className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black text-indigo-900 tracking-tighter uppercase leading-none mb-2">Export Comptable Automatisé</h4>
                            <p className="text-xs text-indigo-700/60 font-medium max-w-sm">Générez un rapport complet conforme au format FEC pour votre expert-comptable.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleExportCompta}
                        className="w-full h-14 px-10 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-500/20 border-none hover:bg-indigo-700 transition-all shrink-0"
                    >
                        Exporter (J-30)
                    </Button>
                </div>

                <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-3xs font-black uppercase tracking-[0.3em] opacity-40 mb-1">Prédiction Trésorerie (J+15)</p>
                            <h4 className="text-2xl font-black text-green-400 tracking-tighter">+ {monthlyCA + 2400} €</h4>
                        </div>
                        <LineChart className="w-6 h-6 text-indigo-400" />
                    </div>
                    <p className="text-3xs font-bold text-white/40 uppercase tracking-widest mt-4">Calculé sur la base de l'historique saisonnier (IA).</p>
                </div>
              </div>
            </div>
         </DialogContent>
       </Dialog>

      {/* 7. PHONE HUB: INTEGRATED VOIP CENTER */}
      {/* 7. VOIP CENTER: INTEGRATED B2B HUB */}
      <Dialog open={isPhoneHubOpen} onOpenChange={setIsPhoneHubOpen}>
        <DialogContent className="max-w-lg w-[95vw] h-[90vh] bg-slate-50/50 backdrop-blur-3xl rounded-[3rem] border-none p-0 overflow-hidden text-slate-900 flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
          <DialogHeader className="sr-only">
            <DialogTitle>Centre de Téléphonie VoIP</DialogTitle>
            <DialogDescription>Gestion des communications entrantes et sortantes SERRURE OS.</DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-8">
            {/* Header section */}
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase leading-none">Centre VoIP</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                   <div className={`w-2 h-2 rounded-full ${isTwilioReady ? 'bg-green-500 animate-pulse' : isSimulated ? 'bg-blue-400 animate-pulse' : 'bg-orange-500'}`} />
                   <p className="text-2xs font-black text-indigo-600 uppercase tracking-widest">
                      {isTwilioReady ? 'Opérationnel - Ligne 1' : isSimulated ? 'Mode Démo (Simulation)' : 'Mode Native (AirDrop/GSM)'}
                   </p>
                </div>
                {errorStatus && !isTwilioReady && (
                   <p className="text-3xs font-bold text-red-500 uppercase tracking-tight mt-1 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                      Erreur: {errorStatus}
                   </p>
                )}
              </div>
              <div className={`w-12 h-12 rounded-2xl ${isTwilioReady ? 'bg-indigo-600' : 'bg-slate-200'} flex items-center justify-center text-white shadow-lg`}>
                <Phone className={`w-6 h-6 ${callStatus !== 'idle' ? 'animate-bounce' : ''} ${!isTwilioReady ? 'text-slate-400' : ''}`} />
              </div>
            </div>
            {/* Tab Navigation */}
            <div className="flex bg-black/5 p-1 rounded-2xl shrink-0">
               {[
                  { id: 'dialer', icon: Keyboard, label: 'Clavier' },
                  { id: 'intercom', icon: Radio, label: 'Intercom' },
                  { id: 'assistance', icon: Shield, label: 'SOS Tech' }
               ].map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setVoipMode(tab.id as any)}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-2xs font-black uppercase tracking-widest transition-all ${voipMode === tab.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                     <tab.icon className="w-3.5 h-3.5" />
                     {tab.label}
                  </button>
               ))}
            </div>

            {/* Main Interface Area */}
            <div className="min-h-[460px] flex flex-col mt-6">
               <AnimatePresence mode="wait">
                   {callStatus === 'idle' ? (
                      <motion.div 
                         key={voipMode}
                         initial={{ opacity: 0, x: 20 }}
                         animate={{ opacity: 1, x: 0 }}
                         exit={{ opacity: 0, x: -20 }}
                         className="h-full flex flex-col"
                      >
                         {voipMode === 'dialer' && (
                            <div className="space-y-8">
                               {/* Number Display */}
                               <div className="h-16 bg-black/5 rounded-2xl flex items-center px-6 border border-black/5 focus-within:border-indigo-500/30 focus-within:bg-indigo-50/10 transition-all group/display">
                                  <input 
                                     type="text"
                                     value={currentCallNumber}
                                     onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9*#+]/g, '');
                                        setCurrentCallNumber(val);
                                     }}
                                     placeholder="Saisir numéro..."
                                     className="text-2xl font-black tracking-tighter text-slate-900 w-full bg-transparent border-none outline-none placeholder:text-slate-300"
                                     autoFocus
                                  />
                                  
                                  <div className="flex items-center gap-1">
                                     {!currentCallNumber && (
                                        <button 
                                           onClick={async () => {
                                              try {
                                                 const text = await navigator.clipboard.readText();
                                                 const cleanText = text.replace(/[^0-9*#+]/g, '');
                                                 setCurrentCallNumber(cleanText);
                                              } catch (err) {
                                                 console.error("Failed to read clipboard:", err);
                                              }
                                           }}
                                           className="p-2 hover:bg-black/5 rounded-xl transition-colors shrink-0 text-indigo-600/50 hover:text-indigo-600"
                                           title="Coller depuis le presse-papier"
                                        >
                                           <ClipboardCheck className="w-5 h-5" />
                                        </button>
                                     )}
                                     
                                     {currentCallNumber.length > 0 && (
                                        <button 
                                          onClick={() => setCurrentCallNumber(prev => prev.slice(0, -1))}
                                          onContextMenu={(e) => {
                                             e.preventDefault();
                                             setCurrentCallNumber("");
                                          }}
                                          className="p-2 hover:bg-black/5 rounded-xl transition-colors shrink-0 group relative"
                                          title="Appui long pour tout effacer"
                                        >
                                          <Delete className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                                        </button>
                                     )}
                                  </div>
                               </div>

                               {/* Keypad */}
                               <div className="grid grid-cols-3 gap-3 md:gap-4 flex-1 content-center px-4">
                                  {[
                                     { n: '1', l: '' }, { n: '2', l: 'ABC' }, { n: '3', l: 'DEF' },
                                     { n: '4', l: 'GHI' }, { n: '5', l: 'JKL' }, { n: '6', l: 'MNO' },
                                     { n: '7', l: 'PQRS' }, { n: '8', l: 'TUV' }, { n: '9', l: 'WXYZ' },
                                     { n: '*', l: '' }, { n: '0', l: '+' }, { n: '#', l: '' }
                                  ].map((item) => (
                                     <button 
                                        key={item.n}
                                        onClick={() => setCurrentCallNumber(prev => prev + item.n)}
                                        onContextMenu={(e) => {
                                           if (item.n === '0') {
                                              e.preventDefault();
                                              setCurrentCallNumber(prev => prev.endsWith('+') ? prev : prev + '+');
                                           }
                                        }}
                                         className="h-14 md:h-16 rounded-2xl bg-white border border-black/5 flex flex-col items-center justify-center transition-all hover:bg-indigo-50 hover:border-indigo-200 active:scale-95 group shadow-sm hover:shadow-md"
                                        title={item.n === '0' ? "Clic droit pour +" : ""}
                                     >
                                         <span className="text-xl md:text-2xl font-black text-slate-800 group-hover:text-indigo-600 leading-none mb-0.5">{item.n}</span>
                                         {item.l && <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.l}</span>}
                                     </button>
                                  ))}
                               </div>

                               <Button 
                                  className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 border-none mt-4"
                                  onClick={() => {
                                     if (currentCallNumber) {
                                        makeCall(currentCallNumber);
                                        setLocalCallStatus('dialing');
                                     }
                                  }}
                               >
                                  <PhoneCall className="w-4 h-4 mr-3" /> Appeler
                               </Button>
                            </div>
                         )}

                         {voipMode === 'intercom' && (
                            <div className="space-y-6 flex flex-col h-full">
                               <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                                  <div className="relative z-10 flex flex-col items-center py-4">
                                     <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-4 relative">
                                        {isRadioActive && (
                                           <>
                                              <motion.div 
                                                 animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                                 transition={{ repeat: Infinity, duration: 2 }}
                                                 className="absolute inset-0 rounded-full bg-indigo-500"
                                              />
                                              <motion.div 
                                                 animate={{ scale: [1, 1.5], opacity: [0.3, 0] }}
                                                 transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                                                 className="absolute inset-0 rounded-full bg-indigo-400"
                                              />
                                           </>
                                        )}
                                        <Radio className={`w-8 h-8 ${isRadioActive ? 'text-indigo-400 animate-pulse' : 'text-white'}`} />
                                     </div>
                                     <h4 className="text-lg font-black tracking-tighter uppercase mb-2">Canal Intercom</h4>
                                     <Badge className="bg-white/10 text-white border-white/20 px-4 py-1">Strasbourg Cluster</Badge>
                                  </div>
                                  <div className="absolute top-4 right-4 flex gap-1">
                                     <SignalLow className="w-4 h-4 text-white/30" />
                                     <span className="text-2xs font-bold text-white/30 uppercase">UHF 446.0</span>
                                  </div>
                               </div>

                               <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                  <p className="text-2xs font-black text-slate-400 uppercase tracking-widest px-4">Techniciens Connectés</p>
                                  {useStore.getState().users.filter(u => u.role === 'tech' && u.id !== '1').map(tech => (
                                     <div key={tech.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/5 hover:bg-black-[0.08] transition-colors border border-transparent hover:border-black/5">
                                        <div className="flex items-center gap-3">
                                           <div className="relative">
                                              <div className="w-10 h-10 rounded-xl bg-slate-200 overflow-hidden">
                                                 <img src={tech.avatar_url} alt={tech.name} className="w-full h-full object-cover" />
                                              </div>
                                              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                                           </div>
                                           <div>
                                              <p className="text-xs font-black text-slate-900">{tech.name}</p>
                                              <p className="text-3xs font-bold text-slate-500 uppercase tracking-tighter">Disponible • 2.4km</p>
                                           </div>
                                        </div>
                                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white shadow-sm" onClick={() => setCurrentCallNumber(tech.phone || "")}>
                                           <Phone className="w-4 h-4 text-indigo-600" />
                                        </Button>
                                     </div>
                                  ))}
                               </div>

                               <button 
                                  onMouseDown={() => {
                                     setIsRadioActive(true);
                                     // Play PTT START sound effect logic here if needed
                                  }}
                                  onMouseUp={() => setIsRadioActive(false)}
                                  onTouchStart={() => setIsRadioActive(true)}
                                  onTouchEnd={() => setIsRadioActive(false)}
                                  className={`w-full py-8 rounded-[2rem] flex flex-col items-center justify-center transition-all active:scale-95 select-none ${isRadioActive ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40 text-white' : 'bg-slate-900 text-white'}`}
                               >
                                  <Mic className={`w-8 h-8 mb-3 ${isRadioActive ? 'animate-bounce' : ''}`} />
                                  <span className="text-xs font-black uppercase tracking-[0.2em]">{isRadioActive ? 'EN ÉMISSION...' : 'Appuyer pour parler'}</span>
                                  <p className="text-3xs font-bold opacity-40 mt-2">WALKIE-TALKIE MODE (PTT)</p>
                               </button>
                            </div>
                         )}

                         {voipMode === 'assistance' && (
                            <div className="space-y-6 flex flex-col h-full animate-in fade-in duration-500">
                               <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 text-center">
                                  <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center mx-auto mb-4 text-white animate-pulse">
                                     <AlertTriangle className="w-8 h-8" />
                                  </div>
                                  <h4 className="text-xl font-black text-red-900 uppercase tracking-tighter mb-2">Renfort Urgent</h4>
                                  <p className="text-xs text-red-700 font-medium">Besoin d'aide immédiate sur une intervention ?</p>
                               </div>

                               <div className="flex-1 space-y-4">
                                  <p className="text-2xs font-black text-slate-400 uppercase tracking-widest px-4">Interventions complexes</p>
                                  <div className="grid grid-cols-2 gap-4">
                                     <button className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-500 transition-all text-center group">
                                        <Users className="w-6 h-6 mx-auto mb-3 text-slate-400 group-hover:text-red-500" />
                                        <p className="text-2xs font-black uppercase tracking-tighter">Ouverture Difficile</p>
                                     </button>
                                     <button className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-red-500 transition-all text-center group">
                                        <Truck className="w-6 h-6 mx-auto mb-3 text-slate-400 group-hover:text-red-500" />
                                        <p className="text-2xs font-black uppercase tracking-tighter">Transport Lourd</p>
                                     </button>
                                  </div>
                               </div>

                               <Button 
                                  className="w-full h-20 bg-red-600 hover:bg-red-700 text-white rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-xl shadow-red-600/20 active:scale-95 border-none"
                                  onClick={() => {
                                     // Broadcast SOS to all nearby techs
                                     addNotification({
                                        type: 'error',
                                        title: '🚨 ALERTE SOS TECH',
                                        message: 'Un collègue demande du renfort immédiat sur le secteur Strasbourg Centre.'
                                     });
                                  }}
                                >
                                  Diffuser l'Alerte SOS
                               </Button>
                               <p className="text-3xs font-bold text-slate-400 text-center uppercase tracking-widest pb-4">Cela notifiera tous les techniciens à moins de 10km</p>
                            </div>
                         )}
                      </motion.div>
                   ) : (
                     <motion.div 
                        key="active-call"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8 flex flex-col items-center py-6"
                     >
                        {/* Call Status Card */}
                        <div className="w-full bg-indigo-600 rounded-[2.5rem] p-8 text-white text-center shadow-2xl shadow-indigo-600/20 relative overflow-hidden">
                           <motion.div 
                              animate={{ 
                                 scale: [1, 1.2, 1],
                                 opacity: [0.1, 0.3, 0.1]
                              }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="absolute inset-0 bg-white"
                           />
                           <div className="relative z-10 space-y-4">
                              <div className="w-20 h-20 bg-white/20 rounded-full mx-auto flex items-center justify-center backdrop-blur-md">
                                 {callerName ? (
                                    <span className="text-3xl font-black">{(callerName as string).charAt(0)}</span>
                                 ) : (
                                    <UserCircle className="w-10 h-10" />
                                 )}
                              </div>
                              <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">
                                 {callStatus === 'incoming' ? (callerName || "Appel Entrant") : currentCallNumber}
                              </h3>
                              <p className="text-2xs font-black uppercase tracking-[0.2em] opacity-80">
                                 {callStatus === 'dialing' ? "Connexion sécurisée..." : "Appel en cours — Ligne 01"}
                              </p>
                              {!isTwilioReady && (
                                 <div className="mt-2 inline-block px-3 py-1 bg-white/10 rounded-full">
                                    <p className="text-4xs font-black uppercase tracking-[0.1em]">📱 Appel externe (Native Mode)</p>
                                 </div>
                              )}
                           </div>
                        </div>

                        {/* Live Intelligence Widget */}
                        <div className="w-full bg-slate-50 rounded-[2rem] border border-black/5 p-6 overflow-hidden">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                 <BrainCircuit className="w-4 h-4 text-indigo-600 animate-pulse" />
                                 <span className="text-2xs font-black uppercase tracking-widest text-slate-900">Live Intelligence AI</span>
                              </div>
                              {currentCallNumber.startsWith('+7') && (
                                 <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-3xs font-black uppercase">Traduction RU ↔ FR Active</Badge>
                              )}
                           </div>

                           <div className="space-y-4 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                              {transcription.length === 0 ? (
                                 <p className="text-2xs text-slate-300 font-bold italic text-center py-4">Écoute en cours pour analyse sémantique...</p>
                              ) : (
                                 transcription.map((line, idx) => (
                                    <motion.div 
                                       key={idx}
                                       initial={{ opacity: 0, x: -10 }}
                                       animate={{ opacity: 1, x: 0 }}
                                       className="flex gap-3"
                                    >
                                       <span className={`text-3xs font-black uppercase shrink-0 w-10 ${line.role === 'tech' ? 'text-indigo-600' : 'text-slate-400'}`}>
                                          {line.role === 'tech' ? 'Moi' : 'Client'}
                                       </span>
                                       <p className="text-2xs font-bold text-slate-700 leading-tight">
                                          {line.text}
                                          {currentCallNumber.startsWith('+7') && line.role === 'client' && (
                                             <span className="block text-3xs text-indigo-500 mt-1 italic">
                                                [Traduit de : Здравствуйте, я застрял...]
                                             </span>
                                          )}
                                       </p>
                                    </motion.div>
                                 ))
                              )}
                           </div>
                           
                           {/* Contextual Actions */}
                           {transcription.some(t => t.text.includes('urgent') || t.text.includes('bloquée')) && (
                              <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 className="mt-4 pt-4 border-t border-black/5"
                              >
                                 <div className="flex gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-3xs font-black uppercase tracking-tighter rounded-full border-red-200 text-red-600 hover:bg-red-50">Priorité Urgente</Button>
                                    <Button size="sm" variant="outline" className="h-7 text-3xs font-black uppercase tracking-tighter rounded-full border-indigo-200 text-indigo-600 hover:bg-indigo-50">Localiser Bateliers</Button>
                                 </div>
                              </motion.div>
                           )}
                        </div>

                        {/* Controls Grid */}
                        <div className="grid grid-cols-3 gap-6 w-full">
                           {[
                              { icon: MicOff, label: 'Muet', color: 'bg-black/5 text-slate-600' },
                              { icon: Keyboard, label: 'Clavier', color: 'bg-black/5 text-slate-600' },
                              { icon: Volume2, label: 'H-Parleur', color: 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-500/10' },
                              { icon: Plus, label: 'Fusionner', color: 'bg-black/5 text-slate-600' },
                              { icon: Video, label: 'B2B Meet', color: 'bg-black/5 text-slate-600' },
                              { icon: RotateCcw, label: 'Transférer', color: 'bg-black/5 text-slate-600' }
                           ].map((ctrl, i) => (
                              <div key={i} className="flex flex-col items-center gap-2">
                                 <button className={`w-12 h-12 md:w-14 md:h-14 ${ctrl.color} rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 border border-black/5 shadow-sm`}>
                                    <ctrl.icon className="w-5 h-5 md:w-6 h-6" />
                                 </button>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ctrl.label}</span>
                              </div>
                           ))}
                        </div>

                        {/* Hang up Button */}
                        <Button 
                           className="w-full h-16 bg-red-500 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-red-500/20 active:scale-95 border-none mt-4"
                           onClick={() => {
                              endCall();
                              setLocalCallStatus('idle');
                              setCurrentCallNumber("");
                           }}
                        >
                           <X className="w-5 h-5 mr-3" /> Mettre Fin à la Session
                        </Button>
                     </motion.div>
                  )}
               </AnimatePresence>
            </div>
          </div>
          
          {/* Footer Bar */}
          <div className="bg-black/5 p-4 flex justify-between items-center border-t border-black/5">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-3xs font-black text-slate-500 uppercase tracking-widest">Poste 05 - Chiffré AES</span>
             </div>
             <p className="text-3xs font-black text-slate-400 uppercase tracking-widest">Twilio Engine 4.0</p>
          </div>
        </DialogContent>
      </Dialog>


      {/* 5. Dialog: Édition de Planning */}
      <Dialog open={!!editingSchedule} onOpenChange={() => setEditingSchedule(null)}>
        <DialogContent className="sm:max-w-[400px] glass bg-white/90 backdrop-blur-3xl rounded-[2.5rem] border-white/50 p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <p className="text-2xs font-black uppercase text-muted-foreground leading-none mb-1">Ajuster Planning</p>
                <h3 className="text-lg font-black tracking-tighter uppercase leading-none">
                  {users.find(u => u.id === editingSchedule?.techId)?.name}
                </h3>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
              <p className="text-3xs font-black uppercase tracking-widest text-muted-foreground mb-3 text-center">Date sélectionnée : {editingSchedule?.date}</p>
              
              <div className="grid grid-cols-3 gap-2">
                {(['working', 'off', 'on_call'] as const).map((type) => {
                  const currentSched = schedules.find(s => s.tech_id === editingSchedule?.techId && s.date === editingSchedule?.date);
                  const isSelected = (currentSched?.type || 'off') === type;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        if (currentSched) {
                          useStore.getState().updateSchedule(currentSched.id, { type });
                        } else if (editingSchedule) {
                          useStore.getState().addSchedule({
                            tech_id: editingSchedule.techId,
                            date: editingSchedule.date,
                            start_time: '08:00',
                            end_time: '18:00',
                            type
                          });
                        }
                      }}
                      className={`py-3 px-2 rounded-xl text-3xs font-black uppercase tracking-widest transition-all ${
                        isSelected ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white text-muted-foreground hover:bg-black/5'
                      }`}
                    >
                      {type === 'working' ? 'Service' : type === 'on_call' ? 'Astreinte' : 'Repos'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-3xs font-black uppercase tracking-widest text-muted-foreground ml-1">Heure de Début</label>
                <Input 
                  type="time" 
                  className="rounded-xl border-black/5 bg-white/50"
                  defaultValue={schedules.find(s => s.tech_id === editingSchedule?.techId && s.date === editingSchedule?.date)?.start_time || '08:00'}
                  onChange={(e) => {
                    const currentSched = schedules.find(s => s.tech_id === editingSchedule?.techId && s.date === editingSchedule?.date);
                    if (currentSched) useStore.getState().updateSchedule(currentSched.id, { start_time: e.target.value });
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-3xs font-black uppercase tracking-widest text-muted-foreground ml-1">Heure de Fin</label>
                <Input 
                  type="time" 
                  className="rounded-xl border-black/5 bg-white/50"
                  defaultValue={schedules.find(s => s.tech_id === editingSchedule?.techId && s.date === editingSchedule?.date)?.end_time || '18:00'}
                  onChange={(e) => {
                    const currentSched = schedules.find(s => s.tech_id === editingSchedule?.techId && s.date === editingSchedule?.date);
                    if (currentSched) useStore.getState().updateSchedule(currentSched.id, { end_time: e.target.value });
                  }}
                />
              </div>
            </div>

            <Button 
              className="w-full h-12 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all mt-2 border-none"
              onClick={() => setEditingSchedule(null)}
            >
              Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6. Dialog: Menu Admin & IA Telemetry */}
      <Dialog open={isTelemetryOpen} onOpenChange={setIsTelemetryOpen}>
        <DialogContent className="sm:max-w-[500px] glass bg-white/95 backdrop-blur-3xl rounded-[3rem] border-white/50 p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Console Admin Telemetry</DialogTitle>
            <DialogDescription>Performance monitoring and AI dispatcher status</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <DialogTitle className="text-2xl font-black tracking-tighter uppercase leading-none">Console Admin</DialogTitle>
                <p className="text-2xs font-black text-indigo-600 uppercase tracking-widest mt-1">SERRURE OS v2.4 - Autonomous Mode</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-black flex items-center justify-center text-white shadow-2xl">
                <Settings className="w-6 h-6 animate-spin-slow" />
              </div>
            </div>

            <div className="space-y-6">
               <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/30">
                  <div className="flex items-center gap-3 mb-4">
                    <BrainCircuit className="w-6 h-6" />
                    <h3 className="text-sm font-black uppercase tracking-widest">IA Agent Configuration</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-2xs font-bold uppercase tracking-tight opacity-80">Moteur de Dispatch</span>
                        <Badge className="bg-white/20 text-white border-none text-3xs font-black">GPT-4o Optimized</Badge>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-3">
                        <span className="text-2xs font-bold uppercase tracking-tight opacity-80">Agent B2B</span>
                        <Badge className="bg-white/20 text-white border-none text-3xs font-black">Claude 3.5 Sonnet</Badge>
                    </div>
                    <div className="space-y-2 pt-2">
                        <Label className="text-3xs font-black uppercase tracking-widest text-white/70 ml-1">Clé API Service Central</Label>
                        <div className="flex gap-2">
                            <Input 
                                type="password" 
                                value="sk-••••••••••••••••••••••••" 
                                className="h-10 rounded-xl bg-white/10 border-white/20 text-white font-mono text-2xs"
                                readOnly
                            />
                            <Button size="icon" className="h-10 w-10 shrink-0 bg-white/10 hover:bg-white/20 border-none">
                                <RotateCcw className="w-4 h-4 text-white" />
                            </Button>
                        </div>
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
                    <p className="text-3xs font-black text-muted-foreground uppercase tracking-widest mb-1">Requêtes IA / Jour</p>
                    <p className="text-xl font-black">1,284</p>
                  </div>
                  <div className="bg-black/5 p-4 rounded-2xl border border-black/5">
                    <p className="text-3xs font-black text-muted-foreground uppercase tracking-widest mb-1">Précision Dispatch</p>
                    <p className="text-xl font-black">98.2%</p>
                  </div>
               </div>

               <div className="space-y-3">
                  <Button variant="outline" className="w-full h-12 rounded-2xl border-black/5 font-black uppercase text-2xs tracking-widest">
                    <Download className="w-4 h-4 mr-2" /> Exporter Logs Logistiques
                  </Button>
                  <Button 
                    className="w-full h-12 bg-red-500 text-white rounded-2xl border-none font-black uppercase text-2xs tracking-widest shadow-lg shadow-red-500/20"
                    onClick={() => {
                        useStore.getState().setCurrentUser(null);
                        setIsAdminMenuOpen(false);
                    }}
                  >
                    Déconnexion Système
                  </Button>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7. HUD Notifications (Toasts) */}
      <AnimatePresence>
        {toast?.message && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 glass-dark bg-black/80 backdrop-blur-3xl rounded-[2rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-4"
          >
            <div className="w-8 h-8 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xs font-black uppercase tracking-[0.2em] text-green-400 leading-none mb-1">Système Notifié</span>
              <span className="text-xs font-bold text-white whitespace-nowrap">
                {toast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

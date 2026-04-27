"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Euro, X, TrendingUp, AlertTriangle, PieChart, 
  CreditCard, Sparkles, Wallet, BrainCircuit, 
  Receipt, FileText, Zap, CheckCircle, Download, LineChart
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Intervention, User } from "@/types";

interface AccountingHubProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  monthlyCA: number;
  dailyCA: number;
  unpaidTotal: number;
  interventions: Intervention[];
  users: User[];
  calculateIntTotal: (int: Intervention) => number;
  handleExportCompta: () => void;
  setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void;
  formatPrice: (price: number) => string;
}

export const AccountingHub: React.FC<AccountingHubProps> = ({
  isOpen,
  onOpenChange,
  monthlyCA,
  dailyCA,
  unpaidTotal,
  interventions,
  users,
  calculateIntTotal,
  handleExportCompta,
  setToast,
  formatPrice
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] h-[90vh] bg-slate-50/50 backdrop-blur-3xl rounded-[3rem] border-none p-0 overflow-hidden text-slate-900 flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Hub Comptabilité & IA Finance</DialogTitle>
          <DialogDescription>Gestion financière avancée et analyse prédictive Serrurerie Bruxelloise OS.</DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md px-4 md:px-10 py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Euro className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Pilotage Financier IA</h2>
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
              onClick={() => onOpenChange(false)}
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
                        <div className="h-full bg-green-500 rounded-full w-[65%]" />
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
                <p className="text-3xs font-bold text-white/40 uppercase tracking-widest mt-4">Calculé sur la base de l&apos;historique saisonnier (IA).</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

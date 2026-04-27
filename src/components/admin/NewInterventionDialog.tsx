"use client";

import React, { useState } from "react";
import { 
  X, MapPin, User as UserIcon, Calendar, Clock, 
  Settings, Camera, FileText, ChevronRight, 
  CreditCard, ExternalLink, Trash2, CheckCircle2, 
  Send, History, Plus, Briefcase, Zap, Euro,
  Building, Phone, Mail, Info, Search
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/useStore";
import { User } from "@/types";

interface NewInterventionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  inventory: any[];
  setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void;
}

export const NewInterventionDialog: React.FC<NewInterventionDialogProps> = ({
  isOpen,
  onOpenChange,
  users,
  inventory,
  setToast
}) => {
  const [formData, setFormData] = useState({
    customer_name: "",
    address: "",
    phone: "",
    description: "",
    tech_id: "",
    type: "EMERGENCY" as 'EMERGENCY' | 'APPOINTMENT'
  });

  const handleSubmit = async () => {
    if (!formData.customer_name || !formData.address) {
      setToast({ message: "Veuillez remplir les champs obligatoires", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      const { addIntervention } = useStore.getState();
      await addIntervention({
        ...formData,
        status: 'PENDING',
        created_at: new Date().toISOString(),
        parts_used: [],
        photos_url: [],
        history: [{
          timestamp: new Date().toISOString(),
          action: "Intervention créée par l'administrateur",
          user: "Admin"
        }]
      });
      
      setToast({ message: "Intervention créée avec succès", type: "success" });
      setTimeout(() => setToast(null), 3000);
      onOpenChange(false);
      setFormData({
        customer_name: "",
        address: "",
        phone: "",
        description: "",
        tech_id: "",
        type: "EMERGENCY"
      });
    } catch (error) {
      setToast({ message: "Erreur lors de la création", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] h-[85vh] bg-slate-50/50 backdrop-blur-3xl rounded-[3rem] border-none p-0 overflow-hidden text-slate-900 flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Nouvelle Intervention</DialogTitle>
          <DialogDescription>Planifier une nouvelle mission pour un technicien.</DialogDescription>
        </DialogHeader>

        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md px-10 py-8 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex flex-col">
            <Badge className="bg-indigo-500/10 text-indigo-600 border-none rounded-full px-2 text-3xs font-black uppercase mb-1 w-fit">Administration</Badge>
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none">Nouvelle Mission</h2>
          </div>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => onOpenChange(false)}>
            <X className="w-6 h-6 text-slate-400" />
          </Button>
        </div>

        <ScrollArea className="flex-1 p-10">
          <div className="space-y-10 pb-10">
            {/* Type Selection */}
            <div className="space-y-4">
               <Label className="text-3xs font-black text-slate-400 uppercase tracking-widest">Type d&apos;Urgence</Label>
               <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setFormData({...formData, type: 'EMERGENCY'})}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${
                      formData.type === 'EMERGENCY' ? 'bg-red-50 border-red-200 shadow-lg shadow-red-500/10' : 'bg-white border-slate-100'
                    }`}
                  >
                    <Zap className={`w-6 h-6 ${formData.type === 'EMERGENCY' ? 'text-red-500' : 'text-slate-300'}`} />
                    <span className={`text-2xs font-black uppercase tracking-widest ${formData.type === 'EMERGENCY' ? 'text-red-600' : 'text-slate-400'}`}>Urgent</span>
                  </button>
                  <button 
                    onClick={() => setFormData({...formData, type: 'APPOINTMENT'})}
                    className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${
                      formData.type === 'APPOINTMENT' ? 'bg-indigo-50 border-indigo-200 shadow-lg shadow-indigo-500/10' : 'bg-white border-slate-100'
                    }`}
                  >
                    <Calendar className={`w-6 h-6 ${formData.type === 'APPOINTMENT' ? 'text-indigo-500' : 'text-slate-300'}`} />
                    <span className={`text-2xs font-black uppercase tracking-widest ${formData.type === 'APPOINTMENT' ? 'text-indigo-600' : 'text-slate-400'}`}>Rendez-vous</span>
                  </button>
               </div>
            </div>

            {/* Customer Info */}
            <div className="space-y-6">
               <Label className="text-3xs font-black text-slate-400 uppercase tracking-widest">Informations Client</Label>
               <div className="space-y-4">
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-white font-bold text-xs" 
                      placeholder="Nom complet du client"
                      value={formData.customer_name}
                      onChange={(e) => setFormData({...formData, customer_name: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-white font-bold text-xs" 
                      placeholder="Adresse complète (ex: Rue Neuve 1, 1000 Bruxelles)"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      className="h-14 pl-12 rounded-2xl border-slate-100 bg-white font-bold text-xs" 
                      placeholder="Numéro de téléphone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
               </div>
            </div>

            {/* Tech Assignment */}
            <div className="space-y-4">
               <Label className="text-3xs font-black text-slate-400 uppercase tracking-widest">Assigner un Technicien (Optionnel)</Label>
               <div className="flex flex-wrap gap-2">
                 {users.filter(u => u.role === 'tech' || u.role === 'admin').map(tech => (
                   <Button 
                     key={tech.id}
                     variant="outline"
                     size="sm"
                     onClick={() => setFormData({...formData, tech_id: tech.id === formData.tech_id ? "" : tech.id})}
                     className={`h-10 px-4 rounded-xl border-slate-100 text-3xs font-black uppercase tracking-widest transition-all ${
                       formData.tech_id === tech.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-600'
                     }`}
                   >
                     {tech.name}
                   </Button>
                 ))}
               </div>
            </div>

            {/* Description */}
            <div className="space-y-4">
               <Label className="text-3xs font-black text-slate-400 uppercase tracking-widest">Notes & Description de la panne</Label>
               <textarea 
                 className="w-full h-32 p-6 rounded-[2rem] border border-slate-100 bg-white font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                 placeholder="Détails sur la serrure, accès, code d'entrée..."
                 value={formData.description}
                 onChange={(e) => setFormData({...formData, description: e.target.value})}
               />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="bg-white border-t border-slate-200 p-8 shrink-0">
          <Button 
            className="w-full h-16 rounded-[2rem] bg-indigo-600 text-white border-none font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98]"
            onClick={handleSubmit}
          >
            Créer l&apos;intervention
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

"use client";

import React from "react";
import Image from "next/image";
import { 
  X, MapPin, User as UserIcon, Calendar, Clock, 
  Settings, Camera, FileText, ChevronRight, 
  CreditCard, ExternalLink, Trash2, CheckCircle2, 
  Send, History, Plus, Briefcase, Zap, Euro,
  Building, Phone, Mail, Info
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Intervention, User } from "@/types";
import { useStore } from "@/store/useStore";

interface SelectedInterventionDialogProps {
  intervention: Intervention | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  users: User[];
  inventory: any[];
  calculateIntTotal: (int: Intervention) => number;
  getPriceBreakdown: (int: Intervention) => any;
  downloadPDF: (type: 'QUOTE' | 'INVOICE', int: Intervention, inventory: any[]) => void;
  setToast: (toast: { message: string, type: 'success' | 'error' } | null) => void;
  formatPrice: (price: number) => string;
}

export const SelectedInterventionDialog: React.FC<SelectedInterventionDialogProps> = ({
  intervention,
  isOpen,
  onOpenChange,
  users,
  inventory,
  calculateIntTotal,
  getPriceBreakdown,
  downloadPDF,
  setToast,
  formatPrice
}) => {
  if (!intervention) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] h-[90vh] bg-slate-50/50 backdrop-blur-3xl rounded-[3rem] border-none p-0 overflow-hidden text-slate-900 flex flex-col shadow-[0_40px_100px_rgba(0,0,0,0.3)]">
        <DialogHeader className="sr-only">
          <DialogTitle>Détails de l&apos;intervention</DialogTitle>
          <DialogDescription>Informations complètes sur l&apos;intervention à {intervention.address}.</DialogDescription>
        </DialogHeader>

        {/* Header - Sticky Style */}
        <div className="bg-white/80 backdrop-blur-md px-6 md:px-10 py-6 border-b border-slate-200 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <Badge className="bg-green-500/10 text-green-600 border-none rounded-full px-2 text-3xs font-black uppercase mb-1 w-fit">Intervention</Badge>
              <div className="flex items-center gap-3">
                <input 
                  className="text-2xl font-black text-slate-900 tracking-tighter uppercase leading-none bg-transparent border-none p-0 focus:ring-0 w-full outline-none"
                  value={intervention.address.split(',')[0]}
                  onChange={(e) => {
                    const { updateIntervention } = useStore.getState();
                    updateIntervention(intervention.id, { address: `${e.target.value}, Bruxelles` });
                  }}
                />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => onOpenChange(false)}>
            <X className="w-5 h-5 text-slate-400" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 md:p-10 space-y-10 pb-20">
            {/* Tech Assignment Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                <UserIcon className="w-4 h-4 text-indigo-600" />
                Assignation Techniciens
              </h3>
              <div className="flex flex-wrap gap-2">
                {users.filter(u => u.role === 'tech' || u.role === 'admin').map(tech => {
                  const isAssigned = intervention.tech_ids?.includes(tech.id) || intervention.tech_id === tech.id;
                  return (
                    <Button 
                      key={tech.id}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentIds = intervention.tech_ids || (intervention.tech_id ? [intervention.tech_id] : []);
                        const newIds = currentIds.includes(tech.id) 
                          ? currentIds.filter(id => id !== tech.id)
                          : [...currentIds, tech.id];
                        useStore.getState().updateIntervention(intervention.id, { tech_ids: newIds });
                      }}
                      className={`h-10 px-4 rounded-xl border-slate-100 text-3xs font-black uppercase tracking-widest transition-all ${
                        isAssigned ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {tech.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Financial Summary Overlay-like Section */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-8">
               <div className="flex justify-between items-center">
                  <div>
                    <p className="text-3xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Montant Total TTC</p>
                    <p className="text-sm font-black text-green-600 tracking-tighter">{calculateIntTotal(intervention)} €</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xs font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mode de Paiement</p>
                    <div className="flex items-center gap-2 justify-end">
                      {intervention.payment_method === '3x' ? (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg">
                          <Sparkles className="w-3 h-3" />
                          <span className="text-3xs font-black uppercase">Alma 3X</span>
                        </div>
                      ) : (
                        <span className="text-2xs font-black uppercase text-foreground/60">{intervention.payment_method || 'N/A'}</span>
                      )}
                    </div>
                  </div>
               </div>

               <Separator className="bg-slate-50" />

               <div className="space-y-4">
                  {(() => {
                    const b = getPriceBreakdown(intervention);
                    return (
                      <>
                        <div className="flex justify-between text-2xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground">Déplacement</span>
                          <span className="text-slate-900">{b.travel} €</span>
                        </div>
                        <div className="flex justify-between text-2xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground">Main d&apos;œuvre</span>
                          <span className="text-slate-900">{b.labor} €</span>
                        </div>
                        <div className="flex justify-between text-2xs font-bold uppercase tracking-widest">
                          <span className="text-muted-foreground">Matériel & Consommables ({intervention.parts_used.length})</span>
                          <span className="text-slate-900">{b.parts} €</span>
                        </div>
                        <div className="flex justify-between items-center pt-4">
                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Total Intervention</span>
                          <span className="text-lg text-green-600 underline decoration-2 underline-offset-4">{calculateIntTotal(intervention)} €</span>
                        </div>
                      </>
                    );
                  })()}
               </div>
            </div>

            {/* Content Body Grid */}
            <div className="space-y-10">
              {/* Description Section */}
              {intervention.description && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-40">Observations Techniques</h3>
                  <p className="text-xs font-medium italic text-foreground/80 leading-relaxed">{intervention.description}</p>
                </div>
              )}

              {/* Materials Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-40">Matériel Installé</h3>
                <div className="flex flex-wrap gap-2">
                  {intervention.parts_used.length ? intervention.parts_used.map((pu, idx) => {
                    const item = inventory.find(i => i.id === pu.part_id);
                    return (
                      <Badge key={idx} variant="outline" className="px-3 py-1 bg-white border-slate-100 text-3xs font-bold text-slate-600 rounded-lg">
                        {item?.name || 'Matériel'} x{pu.quantity}
                      </Badge>
                    );
                  }) : <p className="text-3xs italic text-slate-400 uppercase tracking-widest">Aucun matériel listé</p>}
                </div>
              </div>

              {/* Photos Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-40">Photos & Media</h3>
                <div className="grid grid-cols-4 gap-3">
                  {(intervention.photos_url && intervention.photos_url.length > 0) ? intervention.photos_url.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                      <Image src={url} alt={`Photo ${idx}`} fill className="object-cover" />
                    </div>
                  )) : (
                    <div className="col-span-4 py-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                      <Camera className="w-6 h-6 mb-2 opacity-20" />
                      <p className="text-4xs font-black uppercase tracking-widest">Aucune photo jointe</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Signature Section */}
              {intervention.customer_signature && (
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-40">Validation Client</h3>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center justify-center">
                    <Image src={intervention.customer_signature} width={300} height={128} unoptimized className="h-32 object-contain filter contrast-125" alt="Signature" />
                  </div>
                </div>
              )}

              {/* Logs / History Section */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest opacity-40">Journal d&apos;activité</h3>
                <div className="space-y-2">
                   {intervention.history?.map((h, idx) => (
                     <div key={idx} className="flex items-center gap-4 text-3xs font-bold px-4 py-2 bg-slate-100/50 rounded-xl">
                        <span className="text-slate-400 shrink-0">{h.timestamp.split('T')[1].slice(0, 5)}</span>
                        <span className="text-slate-900 flex-1">{h.action}</span>
                        <span className="text-indigo-600 uppercase tracking-tighter">{h.user}</span>
                     </div>
                   ))}
                   <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                      <input 
                        className="flex-1 bg-white border border-slate-100 rounded-xl px-4 text-xs h-10 outline-none" 
                        placeholder="Ajouter une note interne..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value) {
                             const newHistory = [...(intervention.history || []), {
                               timestamp: new Date().toISOString(),
                               action: e.currentTarget.value,
                               user: 'Admin'
                             }];
                             useStore.getState().updateIntervention(intervention.id, { history: newHistory });
                             e.currentTarget.value = '';
                             setToast({ message: 'Note ajoutée au journal', type: 'success' });
                             setTimeout(() => setToast(null), 3000);
                          }
                        }}
                      />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 p-6 flex gap-3 shrink-0">
          <Button 
            className="flex-1 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border-none font-black uppercase text-3xs tracking-widest hover:bg-indigo-100"
            onClick={() => downloadPDF('QUOTE', intervention, inventory)}
          >
            Devis PDF
          </Button>
          <Button 
            className="flex-1 h-12 rounded-2xl bg-slate-900 text-white border-none font-black uppercase text-3xs tracking-widest"
            onClick={() => downloadPDF('INVOICE', intervention, inventory)}
          >
            Facture PDF
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100">
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

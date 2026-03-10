import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Phone, Mail, MapPin, History, Calendar, User, 
  ChevronRight, ExternalLink, MessageSquare, Clock, 
  ArrowUpRight, ArrowDownLeft, FileText, CheckCircle
} from 'lucide-react';
import { Client, ActivityItem, Intervention } from '@/types';
import { useStore } from '@/store/useStore';
import { format, isValid, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchCustomerEmails, GmailMessage } from '@/lib/gmail';

const toDate = (input: any): Date | null => {
    if (!input) return null;
    if (input instanceof Date) return input;
    if (typeof input?.toDate === 'function') return input.toDate();
    if (typeof input === 'number') return new Date(input);
    if (typeof input === 'string') {
        try { return parseISO(input); } catch(e) { return new Date(input); }
    }
    return null;
};

const safeFormat = (dateInput: any, formatStr: string) => {
  if (!dateInput) return '---';
  try {
    const d = toDate(dateInput);
    if (!d || !isValid(d)) return '---';
    return format(d, formatStr, { locale: fr });
  } catch (e) {
    return '---';
  }
};

interface CustomerProfileProps {
  client: Client;
  onClose: () => void;
}

export const CustomerProfile: React.FC<CustomerProfileProps> = ({ client, onClose }) => {
  // Use try-catch block for the entire component logic to avoid crashing the parent
  try {
    if (!client) return null;
    
    // Hooks MUST be outside any try-catch that could return early, but here they are at the top.
    // However, the rule is hooks must be called exactly the same number of times.
    // So we don't return null before hooks.
  } catch (e) {
      console.error("CustomerProfile setup error:", e);
      return null;
  }

  const [activeTab, setActiveTab] = useState<'activity' | 'history' | 'notes'>('activity');
  const interventions = useStore(state => {
    const allInts = state.interventions;
    if (!Array.isArray(allInts)) return [];
    return allInts.filter(i => {
      if (!client || !i) return false;
      const isById = i.client_id === client.id;
      const isByAddress = client.address && i.address && typeof i.address === 'string' && i.address.toLowerCase().includes(client.address.toLowerCase());
      return isById || isByAddress;
    });
  });
  const users = useStore(state => Array.isArray(state.users) ? state.users : []);
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (client && client.email) {
      setLoading(true);
      fetchCustomerEmails(client.email)
        .then(msgs => {
          setEmails(Array.isArray(msgs) ? msgs : []);
        })
        .catch(err => {
          console.error("Effect email error", err);
          setEmails([]);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setEmails([]);
    }
  }, [client?.id, client?.email]);

  const allActivities: ActivityItem[] = React.useMemo(() => {
    if (!client) return [];
    
    // Safely initialize activities
    const acts: ActivityItem[] = Array.isArray(client.activities) ? [...client.activities] : [];
    
    // Add Gmail emails to activities
    if (Array.isArray(emails)) {
      emails.forEach(email => {
        if (!email || !email.id) return;
        acts.push({
          id: email.id,
          type: 'email',
          title: `Email: ${email.subject || '(Sans sujet)'}`,
          description: email.snippet || '',
          timestamp: email.date || new Date().toISOString(),
          metadata: { direction: 'inbound' }
        });
      });
    }

    // Add recent interventions to activities
    if (Array.isArray(interventions)) {
      interventions.forEach(int => {
        if (!int || !int.id || !int.date) return;
        acts.push({
          id: int.id,
          type: 'intervention',
          title: `Mission ${int.status === 'done' ? 'Terminée' : 'Programmée'}`,
          description: int.description || `Intervention à ${int.address}`,
          timestamp: int.time ? `${int.date}T${int.time}` : int.date,
          status: int.status
        });
      });
    }

    return acts.sort((a, b) => {
      if (!a || !a.timestamp) return 1;
      if (!b || !b.timestamp) return -1;
      try {
        const d_a = toDate(a.timestamp);
        const d_b = toDate(b.timestamp);
        const dateA = d_a ? d_a.getTime() : 0;
        const dateB = d_b ? d_b.getTime() : 0;
        return dateB - dateA;
      } catch (e) {
        return 0;
      }
    });
  }, [client, emails, interventions]);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'call': return <Phone className="w-4 h-4" />;
      case 'intervention': return <History className="w-4 h-4" />;
      case 'note': return <MessageSquare className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (!client) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-white border-l border-black/5 shadow-2xl relative z-50 w-full max-w-md"
    >
      {/* Header */}
      <div className="p-6 border-b border-black/5 bg-gradient-to-br from-black/[0.02] to-transparent">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">{client.name || "Client"}</h2>
              <p className="text-3xs font-medium text-muted-foreground uppercase tracking-widest">Fiche Client</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground/80">
            <Phone className="w-3.5 h-3.5" />
            <span>{client.phone || client.contact_info || "Sans numéro"}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground/80">
            <Mail className="w-3.5 h-3.5" />
            <span>{typeof client?.email === 'string' ? client.email : "Non renseigné"}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground/80">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{typeof client?.address === 'string' ? client.address : "Sans adresse"}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-6 border-b border-black/5 bg-white sticky top-0 z-10">
        {[
          { id: 'activity', label: 'Activité', icon: History },
          { id: 'history', label: 'Interventions', icon: FileText },
          { id: 'notes', label: 'Notes', icon: MessageSquare },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 px-2 text-2xs font-black uppercase tracking-widest border-b-2 transition-all ${
              activeTab === tab.id ? 'border-primary text-black' : 'border-transparent text-muted-foreground/40 hover:text-muted-foreground'
            }`}
          >
            {/* tab.icon is a component, we use it directly */}
            <tab.icon className="w-3 h-3" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'activity' && (
            <motion.div 
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-3xs font-black uppercase text-muted-foreground/60 tracking-widest">Flux d'activités & Emails</p>
                {loading && <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
              </div>
              
              {allActivities && allActivities.length > 0 ? (
                allActivities.map((activity, idx) => (
                  <div key={activity.id || idx} className="relative pl-8 pb-6 last:pb-0">
                    {idx !== allActivities.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-black/[0.03]" />
                    )}
                    <div className="absolute left-0 top-0 w-6 h-6 rounded-lg bg-black/5 flex items-center justify-center">
                      <div className="text-black/40">{getActivityIcon(activity.type)}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-xs font-bold leading-tight">{activity.title || "Activité"}</p>
                        <span className="text-[10px] font-medium text-muted-foreground/60 uppercase whitespace-nowrap ml-2">
                          {safeFormat(activity.timestamp, 'dd MMM')}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-muted-foreground/80 leading-relaxed line-clamp-2">
                        {activity.description || ""}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <Clock className="w-8 h-8 text-black/10 mx-auto mb-3" />
                  <p className="text-2xs font-bold text-muted-foreground/40 uppercase tracking-widest">Aucune activité récente</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {interventions && interventions.length > 0 ? (
                interventions.map(int => (
                  <div key={int.id} className="p-4 rounded-2xl bg-black/[0.02] border border-black/5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-black">{int.category?.toUpperCase() || 'INTERVENTION'}</p>
                        <p className="text-3xs font-medium text-muted-foreground">
                          {safeFormat(int.date, 'dd MMMM yyyy')}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                        int.status === 'done' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {int.status || "En attente"}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {(int.tech_ids || [int.tech_id] || []).filter(Boolean).map((tid, tidx) => {
                          const tech = users.find(u => u.id === tid);
                          return (
                            <div key={tid || tidx} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden bg-black/5" title={tech?.name}>
                              {tech?.avatar_url ? (
                                <img src={tech.avatar_url} alt="" className="w-full h-auto" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] font-black uppercase bg-primary/10 text-primary">
                                  {tech?.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-3xs font-medium text-muted-foreground italic">
                        {Math.max(1, (int.tech_ids || [int.tech_id] || []).length)} technicien(s) intervenu(s)
                      </p>
                    </div>

                    {int.history && Array.isArray(int.history) && int.history.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-black/5 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Suivi journalier :</p>
                        {int.history.map((h: any, hidx: number) => h ? (
                           <div key={hidx} className="bg-white/40 p-2 rounded-xl text-[11px] border border-black/5">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-black text-[9px] uppercase">{h.tech_name || 'Inconnu'}</span>
                                <span className="text-[9px] text-muted-foreground opacity-60">{h.date || '---'}</span>
                              </div>
                              <p className="text-muted-foreground">{h.notes || ''}</p>
                           </div>
                        ) : null)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-xs font-medium italic">Aucun historique d'intervention trouvé.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Actions */}
      <div className="p-6 border-t border-black/5 bg-white">
        <button className="w-full h-12 rounded-xl bg-black text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" />
          Rappeler le client
        </button>
      </div>
    </motion.div>
  );
};

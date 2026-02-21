
"use client";

import { Intervention, Asset } from "@/types";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Camera, ArrowLeft, Plus, Minus, CheckCircle, X, RotateCcw, CreditCard, ArrowRightCircle, 
  QrCode, Euro, Signature, History, Info, FileText, Download, Printer, ScanLine, Wallet, 
  Sparkles, Send, MessageSquare, Phone as PhoneIcon 
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { calculatePriceBreakdown } from "@/lib/pricing";
import { AssetSheet } from "./AssetSheet";
import { downloadPDF, sendPDFByEmail } from "@/lib/pdf-service";
import { sendWhatsAppMessage, whatsappTemplates } from "@/lib/whatsapp";
import { motion, AnimatePresence } from "framer-motion";

interface InterventionDetailsProps {
  intervention: Intervention;
  onBack: () => void;
}

export function InterventionDetails({ intervention, onBack }: InterventionDetailsProps) {
  const { assets, inventory, clients, decrementStock, updateIntervention, uploadImage, currentUser } = useStore();
  const [parts, setParts] = useState<{ id: string; qty: number }[]>([]);
  const [isClosing, setIsClosing] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("unpaid");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "transfer" | "cash" | "apple_pay" | "3x">("card");
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [almaBreakdown, setAlmaBreakdown] = useState<boolean>(false);
  const [socialType, setSocialType] = useState<Intervention['social_emergency_type']>(intervention.social_emergency_type || "none");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const asset = assets.find((a) => a.id === intervention.asset_id) as Asset;
  const client = clients.find((c) => c.id === asset?.client_id);

  const calculateIntTotal = () => {
    return calculatePriceBreakdown(
      { ...intervention, social_emergency_type: socialType }, 
      inventory, 
      parts
    ).total;
  };

  // Signature Logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set display size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#007AFF';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const addPart = (itemId: string) => {
    setParts((prev) => {
      const existing = prev.find((p) => p.id === itemId);
      if (existing) {
        return prev.map((p) => (p.id === itemId ? { ...p, qty: p.qty + 1 } : p));
      }
      return [...prev, { id: itemId, qty: 1 }];
    });
  };

  const removePart = (itemId: string) => {
    setParts((prev) =>
      prev
        .map((p) => (p.id === itemId ? { ...p, qty: p.qty - 1 } : p))
        .filter((p) => p.qty > 0)
    );
  };

  const compressImage = async (file: File | Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(file), 3000); // Timeout 3s max
      const reader = new FileReader();
      reader.onerror = () => { clearTimeout(timeout); resolve(file); };
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => { clearTimeout(timeout); resolve(file); };
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            clearTimeout(timeout);
            resolve(blob || file);
          }, 'image/jpeg', 0.7);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    
    // Safety Timer: Force close after 8s if still stuck
    const forceCloseTimeout = setTimeout(() => {
      if (isClosing) {
        setIsClosing(false);
        onBack();
      }
    }, 8000);

    try {
      const canvas = canvasRef.current;
      const uploadPromises: Promise<string | void>[] = [];
      let signatureUrl = "";
      let photosUrls: string[] = [];

      // 1. Signature (Fast extraction)
      if (canvas && hasSignature) {
        try {
          const blob = await new Promise<Blob | null>((res) => {
            const t = setTimeout(() => res(null), 1500);
            canvas.toBlob((b) => { clearTimeout(t); res(b); }, "image/png");
          });
          if (blob) {
            uploadPromises.push(uploadImage(blob, `interventions/${intervention.id}/sig_${Date.now()}.png`).then(url => signatureUrl = url));
          }
        } catch (err) { console.error("Sig error", err); }
      }

      // 2. Photos (Upload with shorter individual timeouts)
      const photoResults = await Promise.all(
        photoFiles.map(async (file, idx) => {
          try {
            const compressed = await compressImage(file);
            return await uploadImage(compressed, `interventions/${intervention.id}/p_${idx}_${Date.now()}.jpg`);
          } catch (err) { 
            return null;
          }
        })
      );
      photosUrls = photoResults.filter(url => !!url) as string[];

      // Wait briefly for uploads but don't hang forever
      if (uploadPromises.length > 0) {
        await Promise.race([
          Promise.all(uploadPromises),
          new Promise(res => setTimeout(res, 4000))
        ]);
      }

      // 3. Finalize and Save
      parts.forEach((p) => decrementStock(p.id, p.qty));
      
      await updateIntervention(intervention.id, { 
        status: 'waiting_approval', 
        parts_used: parts.map(p => ({ item_id: p.id, quantity: p.qty })),
        customer_signature: signatureUrl || (canvas?.toDataURL() || ""),
        photos_url: photosUrls,
        payment_status: paymentStatus,
        payment_method: paymentMethod,
        social_emergency_type: socialType
      });
      
      clearTimeout(forceCloseTimeout);
      setIsClosing(false);
      
      // Notify (Non-blocking)
      setTimeout(() => {
        try {
          const total = calculateIntTotal();
          const msg = `📑 *RAPPORT D'INTERVENTION*\n\n📍 *Adresse :* ${intervention.address}\n👷 *Tech :* ${currentUser?.name}\n💰 *Total :* ${total}€\n💎 *Statut :* EN ATTENTE VALIDATION`;
          sendWhatsAppMessage('0767693804', msg);
        } catch(e) {}
      }, 500);

      onBack();
    } catch (e) {
      console.error("Critical failure during mission closing:", e);
      clearTimeout(forceCloseTimeout);
      setIsClosing(false);
      onBack(); // Final fallback
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] relative overflow-hidden flex flex-col font-sans">
      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[60%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[50%] h-[30%] bg-orange-500/5 blur-[100px] rounded-full" />

      {/* Header */}
      <div className="sticky top-0 z-50 p-6 pb-2">
         <div className="glass p-3 px-5 rounded-[2.5rem] border-white/40 ios-shadow border-none flex justify-between items-center shadow-2xl bg-white/80 backdrop-blur-2xl">
            <Button variant="ghost" onClick={onBack} className="h-12 px-5 rounded-[1.5rem] hover:bg-black/5 text-foreground font-black uppercase text-[10px] tracking-wider">
              <ArrowLeft className="w-4 h-4 mr-2" /> Retour
            </Button>
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none">Rapport Ops</span>
               <span className="text-[9px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">{intervention.time}</span>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-7 pb-32 animate-in fade-in slide-in-from-right duration-500 max-w-lg mx-auto w-full no-scrollbar">
         <header className="px-2 mt-2">
            <div className="flex justify-between items-start">
              <div>
                <Badge className="bg-primary/10 text-primary border-none rounded-full px-2 text-[8px] font-black uppercase mb-1">Missions Terrain</Badge>
                <h2 className="text-3xl font-black text-foreground tracking-tighter leading-none">{intervention.address.split(',')[0]}</h2>
                <p className="text-xs text-muted-foreground font-bold uppercase tracking-tight mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    {intervention.address.split(',').slice(1).join(',')}
                </p>
              </div>
              
              {client && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      if (client.contact_info) {
                        sendWhatsAppMessage(client.contact_info, whatsappTemplates.etaToClient(currentUser?.name || 'Technicien', 15));
                      }
                    }}
                    className="p-3 bg-green-500 rounded-2xl text-white shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="opacity-100">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </button>
                  <a 
                    href={`tel:${client.contact_info}`} 
                    className="p-3 bg-blue-500 rounded-2xl text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <PhoneIcon className="w-5 h-5" />
                  </a>
                </div>
              )}
            </div>
         </header>

        {/* Asset summary in a glass card */}
        <div className="glass p-6 rounded-[2.5rem] ios-shadow border-none overflow-hidden relative group shadow-sm bg-white/70">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <QrCode className="w-12 h-12" />
           </div>
           <AssetSheet asset={asset} />
        </div>

        {/* Stock Management */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">Utilisation Matériel</h3>
            <Badge className="bg-primary text-white border-none rounded-full h-5 px-2 text-[9px] font-black">{parts.length}</Badge>
          </div>
          <div className="glass rounded-[2.5rem] ios-shadow border-none overflow-hidden divide-y divide-black/5 bg-white/70">
            {inventory.map((item) => {
              const used = parts.find((p) => p.id === item.id);
              return (
                <div key={item.id} className="flex items-center justify-between p-4.5 bg-white/40">
                  <div className="flex-1">
                    <p className="text-sm font-black text-foreground tracking-tight">{item.item_name}</p>
                    <p className="text-[10px] text-muted-foreground font-black uppercase">En réserve: {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-secondary/40 p-1.5 rounded-2xl border border-white/50">
                    <button 
                      className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${used ? 'bg-white text-primary shadow-sm active:scale-90' : 'text-muted-foreground opacity-30 cursor-not-allowed'}`}
                      onClick={() => removePart(item.id)}
                      disabled={!used}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-5 text-center font-black text-xs">{used?.qty || 0}</span>
                    <button 
                      className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all ${item.quantity > (used?.qty || 0) ? 'bg-white text-primary shadow-sm active:scale-90' : 'text-muted-foreground opacity-30 cursor-not-allowed'}`}
                      onClick={() => addPart(item.id)}
                      disabled={item.quantity <= (used?.qty || 0)}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Photos with modern grid */}
        <section className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Preuve visuelle</h3>
          <div className="grid grid-cols-2 gap-4">
            <input 
              type="file" accept="image/*" capture="environment" className="hidden" id="photo-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setPhotos(prev => [...prev, url]);
                  setPhotoFiles(prev => [...prev, file]);
                }
              }}
            />
            <Label 
              htmlFor="photo-upload"
              className="glass aspect-[4/3] flex flex-col items-center justify-center text-primary bg-primary/5 hover:bg-primary/10 transition-all border-none ios-shadow active:scale-[0.98] cursor-pointer m-0 rounded-[2rem] shadow-sm"
            >
              <div className="bg-white p-3 rounded-2xl shadow-sm mb-2">
                 <Camera className="w-6 h-6 text-primary" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Prendre Photo</span>
            </Label>
            {photos.length > 0 ? (
              <div className="glass aspect-[4/3] relative overflow-hidden ios-shadow border-none rounded-[2rem] shadow-sm">
                 <img src={photos[photos.length - 1]} alt="Intervention" className="w-full h-full object-cover" />
                 <button 
                    className="absolute top-3 right-3 bg-black/40 text-white p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 border border-white/20"
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setPhotos(prev => prev.slice(0, -1)); 
                      setPhotoFiles(prev => prev.slice(0, -1));
                    }}
                 >
                    <X className="w-4 h-4" />
                 </button>
              </div>
            ) : (
              <div className="glass aspect-[4/3] bg-secondary/20 flex flex-col items-center justify-center border-none rounded-[2rem] shadow-sm italic opacity-40">
                 <History className="w-6 h-6 mb-2 text-muted-foreground" />
                 <span className="text-[8px] font-black uppercase tracking-widest">Aucun cliché</span>
              </div>
            )}
          </div>
        </section>

        {/* Signature Pad - Refined */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60">Signature Client</h3>
            {hasSignature && (
              <button onClick={clearSignature} className="text-red-500 text-[9px] font-black tracking-widest uppercase flex items-center gap-1 shadow-sm px-2 py-1 bg-white/50 rounded-full">
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>
          <div className="glass h-52 bg-white/90 relative overflow-hidden border-none ios-shadow rounded-[2.5rem] shadow-sm">
            <canvas ref={canvasRef} className="w-full h-full touch-none cursor-crosshair" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing} />
            {!hasSignature && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                <Signature className="w-10 h-10 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Signer Ici</p>
              </div>
            )}
          </div>
        </section>

        {/* Social / Humanitarian Tariff */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-orange-600/80">Solidarité & Urgence Sociale</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'none', label: 'Aucune situation particulière', desc: 'Tarif standard applicable', icon: <CheckCircle className="w-4 h-4" /> },
              { id: 'baby_inside', label: 'Bébé bloqué à l\'intérieur', desc: 'Priorité absolue & Remise Solidarité (-5%)', icon: <Info className="w-4 h-4" /> },
              { id: 'pet_trapped', label: 'Animal en danger', desc: 'Assistance rapide & Remise Solidarité (-5%)', icon: <Info className="w-4 h-4" /> },
              { id: 'elderly_person', label: 'Personne âgée / Vulnérable', desc: 'Accompagnement & Remise Solidarité (-5%)', icon: <Info className="w-4 h-4" /> },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSocialType(st.id as any)}
                className={`p-4 rounded-[2rem] text-left transition-all border-none flex items-center justify-between ${socialType === st.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'glass bg-white/70'}`}
              >
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-tight">{st.label}</span>
                  <span className={`text-[8px] font-bold ${socialType === st.id ? 'text-white/70' : 'text-muted-foreground'}`}>{st.desc}</span>
                </div>
                <div className={`p-2 rounded-xl ${socialType === st.id ? 'bg-white/20' : 'bg-orange-50'}`}>
                  {st.icon}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Payment Section - Modernized */}
        <section className="space-y-5">
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-2">Paiement</h3>
          <div className="grid grid-cols-3 gap-2">
              {[
                  { id: 'card', label: 'Stripe', icon: <CreditCard className="w-5 h-5" /> },
                  { id: 'apple_pay', label: 'Apple Pay', icon: <Wallet className="w-5 h-5" /> },
                  { id: '3x', label: 'Alma (3x)', icon: <Sparkles className="w-5 h-5" /> },
                  { id: 'transfer', label: 'Virement', icon: <ArrowRightCircle className="w-5 h-5" /> },
                  { id: 'cash', label: 'Espèces', icon: <Euro className="w-5 h-5" /> }
              ].map((m) => (
                  <button
                      key={m.id}
                      onClick={() => {
                        setPaymentMethod(m.id as any);
                        setAlmaBreakdown(m.id === '3x');
                      }}
                      className={`p-4 rounded-3xl flex flex-col items-center gap-3 transition-all border-none shadow-sm active:scale-95 ${paymentMethod === m.id ? 'bg-primary text-white scale-[0.97] shadow-xl shadow-primary/20' : 'glass bg-white/70 text-foreground ios-shadow'}`}
                  >
                      <div className={`p-2.5 rounded-2xl ${paymentMethod === m.id ? 'bg-white/20 text-white' : 'bg-primary/5 text-primary'}`}>
                          {m.icon}
                      </div>
                      <span className="text-[7px] font-black uppercase tracking-wider whitespace-nowrap">{m.label}</span>
                  </button>
              ))}
          </div>

          {/* Alma Breakdown Animation */}
          <AnimatePresence>
            {almaBreakdown && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/90 glass p-5 rounded-[2rem] space-y-3 mb-4 border border-indigo-100">
                    <div className="flex justify-between items-center pb-2 border-b border-black/5">
                        <span className="text-[10px] font-black uppercase text-indigo-600">Échéancier Alma 3x</span>
                        <Badge className="bg-indigo-100 text-indigo-600 border-none text-[8px] font-black">SANS FRAIS</Badge>
                    </div>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-muted-foreground">Mois {i} {i === 1 ? '(Aujourd\'hui)' : ''}</span>
                            <span className="font-black text-foreground">{(parts.reduce((acc, p) => acc + (inventory.find(inv => inv.id === p.id)?.price || 0) * p.qty, 80) / 3).toFixed(2)}€</span>
                        </div>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
 
          <div className="flex flex-col gap-3 glass p-5 bg-white/70 rounded-[2.5rem] border-none ios-shadow shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-foreground/70">Traitement Demo</span>
                <Badge className={`${paymentStatus === 'paid' ? 'bg-green-500' : 'bg-orange-500'} text-white border-none rounded-full px-3 text-[9px] font-black`}>
                    {paymentStatus === 'paid' ? 'VÉRIFIÉ ✓' : 'EN ATTENTE'}
                </Badge>
              </div>

              <div className="flex gap-2">
                  {/* Dynamic payment button based on selection */}
                  <Button
                    onClick={() => {
                        setIsPaymentProcessing(true);
                        setTimeout(() => {
                            setIsPaymentProcessing(false);
                            if (paymentMethod === 'card') {
                                window.open('https://buy.stripe.com/demo_vatsaev_serrurerie_alsacienne', '_blank');
                            } else if (paymentMethod === 'apple_pay') {
                                alert("Simulation Apple Pay : Posez votre iPhone sur le terminal ou validez avec FaceID.");
                                setPaymentStatus('paid');
                            } else if (paymentMethod === '3x') {
                                window.open('https://getalma.eu/demo_checkout', '_blank');
                                setPaymentStatus('paid');
                            } else {
                                alert(`Demande de ${paymentMethod} enregistrée.`);
                                setPaymentStatus('paid');
                            }
                        }, 1200);
                    }}
                    disabled={isPaymentProcessing}
                    className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg border-none active:scale-95 transition-all flex items-center gap-3 ${
                        paymentMethod === 'card' ? 'bg-[#635BFF] text-white' :
                        paymentMethod === 'apple_pay' ? 'bg-black text-white' :
                        paymentMethod === '3x' ? 'bg-indigo-600 text-white' : 'bg-primary text-white'
                    }`}
                  >
                      {isPaymentProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          {paymentMethod === 'card' && <CreditCard className="w-4 h-4" />}
                          {paymentMethod === 'apple_pay' && <Wallet className="w-4 h-4" />}
                          {paymentMethod === '3x' && <Sparkles className="w-4 h-4" />}
                          <span>Payer avec {
                            paymentMethod === 'card' ? 'Stripe' : 
                            paymentMethod === 'apple_pay' ? 'Apple Pay' : 
                            paymentMethod === '3x' ? 'Alma' : 'Selection'
                          }</span>
                        </>
                      )}
                  </Button>

                  <button 
                      onClick={() => setPaymentStatus(paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 ${paymentStatus === 'paid' ? 'bg-green-500 text-white shadow-lg' : 'bg-secondary text-muted-foreground'}`}
                  >
                      {paymentStatus === 'paid' ? <CheckCircle className="w-6 h-6" /> : <RotateCcw className="w-5 h-5 opacity-50" />}
                  </button>
              </div>
          </div>
        </section>

        {/* 6. Documents Section - Elite PDF Engine */}
        <section className="p-6 bg-white/40 rounded-[2.5rem] border border-black/5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <h3 className="text-xs font-black uppercase tracking-widest">Documents Officiels</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Button 
                    variant="outline" 
                    className="h-16 rounded-3xl border-none bg-white text-[10px] font-black uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                    onClick={() => downloadPDF('QUOTE', intervention, inventory)}
                >
                    <Download className="w-4 h-4 opacity-50" />
                    Télécharger Devis
                </Button>
                <Button 
                    variant="outline" 
                    className="h-16 rounded-3xl border-none bg-white text-[10px] font-black uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                    onClick={() => downloadPDF('INVOICE', intervention, inventory)}
                >
                    <Download className="w-4 h-4 opacity-50" />
                    Télécharger Facture
                </Button>

                {/* Direct Email Export for Techs too */}
                <Button 
                    variant="outline" 
                    className="h-16 rounded-3xl border-none bg-black/5 text-black/60 text-[10px] font-black uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                    onClick={async () => {
                      try {
                          await sendPDFByEmail('QUOTE', intervention, inventory);
                          alert('Devis envoyé au bureau !');
                      } catch (e) {
                          alert('Erreur d\'envoi');
                      }
                    }}
                >
                    <Send className="w-4 h-4 text-blue-500" />
                    Mail Bureau (Devis)
                </Button>
                <Button 
                    variant="outline" 
                    className="h-16 rounded-3xl border-none bg-[#25D366]/10 text-[#075E54] text-[10px] font-black uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                    onClick={() => {
                      const total = calculateIntTotal();
                      const msg = `📑 *RAPPORT TERRAIN*\n\n📍 Mission : ${intervention.address}\n👷 Tech : ${currentUser?.name}\n🛠 Matériel : ${parts.length} pièces\n💰 Total : ${total}€\n\n📄 Rapport complet envoyé sur le dashboard.`;
                      sendWhatsAppMessage('0767693804', msg);
                      alert('Rapport WhatsApp envoyé au Manager !');
                    }}
                >
                    <MessageSquare className="w-4 h-4 text-[#25D366]" />
                    WhatsApp Manager
                </Button>
                <Button 
                    variant="outline" 
                    className="h-16 rounded-3xl border-none bg-black/5 text-black/60 text-[10px] font-black uppercase tracking-widest shadow-sm flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all"
                    onClick={async () => {
                      try {
                          await sendPDFByEmail('INVOICE', intervention, inventory);
                          alert('Facture envoyée au bureau !');
                      } catch (e) {
                          alert('Erreur d\'envoi (Vérifiez la clé API)');
                      }
                    }}
                >
                    <Send className="w-4 h-4 text-green-500" />
                    Mail Bureau (Facture)
                </Button>
            </div>
        </section>

        {/* Bottom padding for fixed button */}
        <div className="h-10" />
      </div>

       <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm z-50 flex flex-col items-center gap-2">
         {!hasSignature && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className="bg-primary/10 px-4 py-1 rounded-full text-[9px] font-black text-primary uppercase tracking-widest backdrop-blur-md"
           >
              Signature Requise pour Envoi
           </motion.div>
         )}
         <Button 
           className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale text-[12px] border-none"
           disabled={isClosing || !hasSignature}
           onClick={handleClose}
         >
           {isClosing ? (
               <div className="flex items-center gap-3">
                   <div className="w-5 h-5 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Téléchargement...</span>
               </div>
           ) : (
               <div className="flex items-center gap-3">
                 <CheckCircle className="w-6 h-6" />
                 <span>Clôturer Mission</span>
               </div>
           )}
         </Button>
       </div>
    </div>
  );
}

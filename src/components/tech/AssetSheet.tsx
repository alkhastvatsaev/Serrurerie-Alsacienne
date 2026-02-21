
"use client";

import { Asset } from "@/types";
import { Badge } from "@/components/ui/badge";
import { History, Shield, Ruler, Settings } from "lucide-react";
import QRCode from 'qrcode';
import { useEffect, useState } from "react";

interface AssetSheetProps {
  asset: Asset;
}

export function AssetSheet({ asset }: AssetSheetProps) {
  const [qrSrc, setQrSrc] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(asset.qr_code_id, {
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' }
    }).then(setQrSrc).catch(console.error);
  }, [asset.qr_code_id]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center gap-3 mb-4">
         <div className="bg-white p-3 rounded-3xl shadow-lg shadow-black/10 rotate-[-2deg] border-4 border-primary/20">
            {qrSrc ? (
              <img src={qrSrc} alt="QR Code" className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 bg-muted animate-pulse rounded-2xl" />
            )}
         </div>
         <Badge className="bg-secondary/60 text-foreground border-none rounded-full px-4 py-1 font-mono text-[10px] font-black tracking-widest ios-shadow">
            {asset.qr_code_id}
         </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { icon: <Settings className="w-5 h-5" />, label: "Modèle", value: asset.specifications.brand, color: "text-blue-500" },
          { icon: <Ruler className="w-5 h-5" />, label: "Cylindre", value: asset.specifications.cylinder_size, color: "text-orange-500" },
          { icon: <Shield className="w-5 h-5" />, label: "Blindage", value: asset.specifications.shielding_type, color: "text-purple-500" },
          { icon: <History className="w-5 h-5" />, label: "Entretien", value: asset.last_service_date, color: "text-green-500" }
        ].map((item, idx) => (
          <div key={idx} className="bg-white/60 p-4 rounded-[1.8rem] border border-white flex flex-col items-start gap-1 ios-shadow">
            <div className={`${item.color} mb-1 bg-white p-2 rounded-xl shadow-sm`}>
               {item.icon}
            </div>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">{item.label}</p>
            <p className="font-black text-foreground tracking-tight text-sm">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 bg-primary/5 rounded-2xl border border-primary/10 flex items-center gap-3">
         <div className="bg-primary/10 p-1.5 rounded-full">
            <Shield className="w-3 h-3 text-primary" />
         </div>
         <p className="text-[10px] font-bold text-primary/70 italic leading-snug">
            Données techniques certifiées par le réseau Serrurerie Alsacienne PRO™
         </p>
      </div>
    </div>
  );
}

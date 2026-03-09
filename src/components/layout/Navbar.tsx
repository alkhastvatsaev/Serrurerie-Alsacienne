
"use client";

import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { currentUser, setCurrentUser, users } = useStore();

  const toggleRole = () => {
    const nextUser = currentUser?.role === 'admin' ? users[1] : users[0];
    setCurrentUser(nextUser);
  };

  return (
    <nav className="glass sticky top-0 z-[100] px-4 py-2.5 flex items-center justify-between transition-all border-b shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 group">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-primary fill-none stroke-current stroke-2 group-hover:scale-110 transition-transform">
            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" />
            <path d="M12 14a2 2 0 1 0-2-2 2 2 0 0 0 2 2zm1-5h-2v3h2V9z" />
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black tracking-tight leading-none text-foreground uppercase">Serrurerie</span>
          <span className="text-[10px] font-medium tracking-widest leading-none text-muted-foreground uppercase mt-0.5">Alsacienne</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 px-3 text-[11px] font-bold rounded-full bg-secondary hover:bg-secondary/80 text-foreground transition-all uppercase tracking-wider"
          onClick={toggleRole}
        >
          {currentUser?.role === 'admin' ? 'Technicien' : 'Manager'}
        </Button>

        <div className="flex items-center gap-2 bg-secondary/50 p-1 rounded-full pl-3 pr-1 border border-black/5">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-bold leading-none text-foreground">{currentUser?.name.split(' ')[0]}</p>
          </div>
          <Avatar className="h-7 w-7 border border-white shadow-sm ring-1 ring-black/5">
            <AvatarFallback className="bg-primary text-white text-[10px] font-bold">
              {currentUser?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}

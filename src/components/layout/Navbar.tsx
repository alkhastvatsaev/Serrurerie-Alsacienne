
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
        {/* Branding removed per user request */}
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

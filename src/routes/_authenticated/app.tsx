import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, LogOut, Search } from "lucide-react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app/AppSidebar";
import { BarberBackdrop } from "@/components/brand/BarberBackdrop";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (!u) return;
      setEmail(u.email ?? "");
      setName(
        (u.user_metadata?.full_name as string) ||
          (u.user_metadata?.name as string) ||
          (u.email?.split("@")[0] ?? "Usuário"),
      );
    });
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase() || "BC";

  return (
    <SidebarProvider>
      <div className="relative flex min-h-screen w-full bg-noir">
        <BarberBackdrop />
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/50 bg-noir/80 backdrop-blur-md px-4 md:px-6">
            <SidebarTrigger className="text-silver hover:text-gold" />
            <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-silver/50" />
                <Input
                  placeholder="Buscar cliente, agendamento, serviço..."
                  className="pl-9 bg-secondary/40 border-border/60"
                />
              </div>
            </div>
            <div className="flex-1 md:hidden" />
            <Button variant="ghost" size="icon" className="text-silver hover:text-gold">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-md hover:bg-secondary/60 transition-colors">
                  <Avatar className="h-8 w-8 border border-gold/30">
                    <AvatarFallback className="bg-noir text-gold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left leading-tight">
                    <p className="text-sm font-medium text-ivory">{name}</p>
                    <p className="text-[11px] text-silver/60">Administrador</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="leading-tight">
                    <p className="text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground font-normal">
                      {email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

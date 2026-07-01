import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { BarberBackdrop } from "@/components/brand/BarberBackdrop";
import { Logo } from "@/components/brand/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — BC CLUBE" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase reset link puts type=recovery in the URL hash and sets a session.
    const timer = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mínimo de 6 caracteres");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Senha atualizada com sucesso!");
    navigate({ to: "/app" });
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <BarberBackdrop />
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Logo size="lg" showTagline />
        </div>
        <div className="bc-card p-8">
          <h1 className="font-display text-2xl text-ivory">Redefinir senha</h1>
          <p className="mt-2 text-sm text-silver/70">
            Escolha uma nova senha para sua conta BC CLUBE.
          </p>
          {ready && (
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Atualizando..." : "Atualizar senha"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

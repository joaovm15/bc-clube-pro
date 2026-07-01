import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { BarberBackdrop } from "@/components/brand/BarberBackdrop";
import { Logo } from "@/components/brand/Logo";

const emailSchema = z.string().trim().email({ message: "Email inválido" }).max(255);
const passwordSchema = z
  .string()
  .min(6, { message: "Mínimo de 6 caracteres" })
  .max(72, { message: "Máximo de 72 caracteres" });
const nameSchema = z
  .string()
  .trim()
  .min(2, { message: "Informe seu nome" })
  .max(80, { message: "Nome muito longo" });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — BC CLUBE" },
      { name: "description", content: "Acesse sua conta BC CLUBE." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16">
      <BarberBackdrop />
      <div className="w-full max-w-md">
        <Link to="/" className="flex justify-center mb-8">
          <Logo size="lg" showTagline />
        </Link>
        <div className="bc-card p-8">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6 bg-secondary/40">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <SignInForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpForm />
            </TabsContent>
          </Tabs>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-silver/50">
            <div className="flex-1 h-px bg-border" />
            ou
            <div className="flex-1 h-px bg-border" />
          </div>
          <GoogleButton />
        </div>
        <p className="mt-6 text-center text-xs text-silver/50">
          Ao continuar você concorda com os Termos de Uso e a Política de Privacidade.
        </p>
      </div>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    const p = passwordSchema.safeParse(password);
    if (!p.success) return toast.error(p.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/app" });
  }

  async function onForgot() {
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) return toast.error("Informe seu email para recuperar a senha");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Enviamos um link de recuperação para o seu email.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@barbearia.com"
        />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password">Senha</Label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs text-silver/70 hover:text-gold transition-colors"
          >
            Esqueci minha senha
          </button>
        </div>
        <Input
          id="signin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = nameSchema.safeParse(name);
    if (!n.success) return toast.error(n.error.issues[0].message);
    const em = emailSchema.safeParse(email);
    if (!em.success) return toast.error(em.error.issues[0].message);
    const p = passwordSchema.safeParse(password);
    if (!p.success) return toast.error(p.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Bem-vindo ao BC CLUBE.");
    navigate({ to: "/app" });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="signup-name">Seu nome</Label>
        <Input
          id="signup-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="João Victor"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="voce@barbearia.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-password">Senha</Label>
        <Input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Criando..." : "Criar minha conta"}
      </Button>
    </form>
  );
}

function GoogleButton() {
  const [loading, setLoading] = useState(false);
  async function onClick() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      setLoading(false);
      toast.error("Não foi possível entrar com Google");
      return;
    }
    if (result.redirected) return;
    window.location.href = "/app";
  }
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={onClick}
      disabled={loading}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="#EA4335" d="M12 5.04c1.68 0 3.19.58 4.38 1.72l3.26-3.26C17.66 1.56 15.03.5 12 .5 7.31.5 3.26 3.24 1.28 7.25l3.8 2.95C6.02 7.28 8.77 5.04 12 5.04z"/>
        <path fill="#4285F4" d="M23.5 12.28c0-.83-.07-1.63-.2-2.4H12v4.55h6.47c-.28 1.5-1.12 2.78-2.4 3.63l3.7 2.87c2.17-2 3.43-4.95 3.43-8.65z"/>
        <path fill="#FBBC05" d="M5.08 14.2c-.24-.73-.38-1.5-.38-2.3s.14-1.57.38-2.3L1.28 6.65C.47 8.26 0 10.08 0 12s.47 3.74 1.28 5.35l3.8-2.95z"/>
        <path fill="#34A853" d="M12 23.5c3.24 0 5.96-1.07 7.94-2.91l-3.7-2.87c-1.03.7-2.36 1.12-4.24 1.12-3.23 0-5.98-2.24-6.92-5.24l-3.8 2.95C3.26 20.76 7.31 23.5 12 23.5z"/>
      </svg>
      Continuar com Google
    </Button>
  );
}

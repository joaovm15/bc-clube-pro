import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Calendar,
  Users,
  UserCog,
  DollarSign,
  Scissors,
  BarChart3,
  Percent,
  Package,
  ArrowRight,
  Check,
  Clock,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Smartphone,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

import { BarberBackdrop } from "@/components/brand/BarberBackdrop";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import emblem from "@/assets/emblem-skull.png";
import scorte from "@/assets/service-corte.jpg";
import sbarba from "@/assets/service-barba.jpg";
import scortebarba from "@/assets/service-corte-barba.jpg";
import ssobra from "@/assets/service-sobrancelha.jpg";
import spig from "@/assets/service-pigmentacao.jpg";
import shidra from "@/assets/service-hidratacao.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BC CLUBE — Gestão Inteligente para Barbearias" },
      {
        name: "description",
        content:
          "O controle completo da sua barbearia na palma da mão. Agenda, clientes, financeiro, comissões e relatórios em um único lugar.",
      },
      { property: "og:title", content: "BC CLUBE — Gestão Inteligente para Barbearias" },
      {
        property: "og:description",
        content:
          "O software premium que organiza sua barbearia e aumenta o seu lucro.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Calendar, title: "Agenda", desc: "Agendamentos rápidos e sem conflitos." },
  { icon: Users, title: "Clientes", desc: "Histórico completo de cada cliente." },
  { icon: UserCog, title: "Funcionários", desc: "Gerencie sua equipe e comissões." },
  { icon: DollarSign, title: "Financeiro", desc: "Receitas, despesas e lucro em tempo real." },
  { icon: Scissors, title: "Serviços", desc: "Cadastre serviços, preços e duração." },
  { icon: BarChart3, title: "Relatórios", desc: "Gráficos e métricas detalhadas." },
  { icon: Percent, title: "Comissões", desc: "Cálculo automático por profissional." },
  { icon: Package, title: "Estoque", desc: "Controle de produtos e alertas." },
];

const services = [
  { img: scorte, name: "Corte Degradê", price: "R$ 40,00", time: "30 min" },
  { img: sbarba, name: "Barba", price: "R$ 25,00", time: "20 min" },
  { img: scortebarba, name: "Corte + Barba", price: "R$ 60,00", time: "45 min" },
  { img: ssobra, name: "Sobrancelha", price: "R$ 15,00", time: "15 min" },
  { img: spig, name: "Pigmentação", price: "R$ 90,00", time: "60 min" },
  { img: shidra, name: "Hidratação", price: "R$ 45,00", time: "35 min" },
];

const benefits = [
  { icon: Sparkles, title: "Organização", desc: "Tudo o que sua barbearia precisa em um só lugar." },
  { icon: TrendingUp, title: "Lucro", desc: "Visão financeira clara para crescer com segurança." },
  { icon: Users, title: "Equipe", desc: "Comissões e escalas transparentes." },
  { icon: Calendar, title: "Agenda", desc: "Zero conflito, tudo confirmado." },
  { icon: BarChart3, title: "Relatórios", desc: "Decisões baseadas em dados reais." },
  { icon: ShieldCheck, title: "Segurança", desc: "Seus dados protegidos com criptografia." },
];

function Landing() {
  return (
    <div className="relative min-h-screen bg-noir text-ivory overflow-hidden">
      <BarberBackdrop />
      <Header />
      <main>
        <Hero />
        <SectionDivider />
        <FeaturesCarousel />
        <SectionDivider />
        <ServicesCarousel />
        <SectionDivider />
        <BenefitsCarousel />
        <SectionDivider />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "backdrop-blur-md bg-noir/80 border-b border-border/50"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link to="/">
          <Logo size="md" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-silver/80">
          <a href="#funcionalidades" className="hover:text-gold transition-colors">
            Funcionalidades
          </a>
          <a href="#servicos" className="hover:text-gold transition-colors">
            Serviços
          </a>
          <a href="#beneficios" className="hover:text-gold transition-colors">
            Benefícios
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm text-silver/80 hover:text-gold transition-colors hidden sm:inline"
          >
            Entrar
          </Link>
          <Link to="/auth">
            <Button variant="default" size="sm">
              Começar agora
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] items-center">
        <div className="bc-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
            <span className="h-1 w-1 rounded-full bg-gold" />
            Gestão premium para barbearias
          </div>
          <h1 className="mt-6 font-display text-5xl md:text-7xl leading-[1.05] font-semibold text-ivory">
            O controle completo
            <br />
            da sua barbearia
            <br />
            <span className="bc-gold-text">na palma da mão.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-silver/80 leading-relaxed">
            Gerencie agenda, clientes, funcionários, faturamento, despesas e
            crescimento da sua barbearia em um único lugar.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link to="/auth">
              <Button size="lg" className="group">
                Começar agora
                <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="#funcionalidades">
              <Button size="lg" variant="outline">
                Conhecer o sistema
              </Button>
            </a>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-xs uppercase tracking-widest text-silver/60">
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-gold" /> Sem cartão
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-gold" /> Instalação em minutos
            </span>
            <span className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-gold" /> Suporte incluso
            </span>
          </div>
        </div>

        <div className="relative flex justify-center bc-fade-up">
          <div className="absolute inset-0 -z-10 rounded-full bg-gold/5 blur-3xl" />
          <img
            src={emblem}
            alt="Emblema BC CLUBE"
            width={520}
            height={520}
            className="w-[380px] md:w-[520px] drop-shadow-[0_20px_60px_rgba(212,175,55,0.15)]"
          />
        </div>
      </div>
    </section>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto max-w-7xl px-6">
      <div className="bc-divider-gold" />
    </div>
  );
}

function FeaturesCarousel() {
  const [emblaRef] = useEmblaCarousel({ align: "start", loop: true, dragFree: true });
  return (
    <section id="funcionalidades" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeader
        eyebrow="Funcionalidades"
        title="Tudo que uma barbearia moderna precisa"
        subtitle="Um conjunto completo de ferramentas construídas para o dia a dia real da sua operação."
      />
      <div className="mt-12 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="min-w-[240px] md:min-w-[280px] bc-card bc-card-hover p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md border border-gold/30 bg-gold/5">
                <f.icon className="h-5 w-5 text-gold" strokeWidth={1.5} />
              </div>
              <h3 className="mt-5 font-display text-2xl text-ivory">{f.title}</h3>
              <p className="mt-2 text-sm text-silver/70">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServicesCarousel() {
  const [emblaRef] = useEmblaCarousel({ align: "start", loop: true });
  return (
    <section id="servicos" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeader
        eyebrow="Serviços"
        title="Cardápio pronto para a sua barbearia"
        subtitle="Organize serviços com preço, duração e imagem — do corte à pigmentação."
      />
      <div className="mt-12 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {services.map((s) => (
            <article
              key={s.name}
              className="min-w-[260px] md:min-w-[300px] bc-card bc-card-hover overflow-hidden"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={s.img}
                  alt={s.name}
                  loading="lazy"
                  width={300}
                  height={375}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl text-ivory tracking-wide uppercase">
                  {s.name}
                </h3>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="bc-gold-text font-medium">{s.price}</span>
                  <span className="flex items-center gap-1.5 text-silver/70">
                    <Clock className="h-3.5 w-3.5" /> {s.time}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitsCarousel() {
  const [emblaRef] = useEmblaCarousel({ align: "start", loop: true, dragFree: true });
  return (
    <section id="beneficios" className="mx-auto max-w-7xl px-6 py-20">
      <SectionHeader
        eyebrow="Benefícios"
        title="Uma barbearia mais organizada e mais lucrativa"
      />
      <div className="mt-12 overflow-hidden" ref={emblaRef}>
        <div className="flex gap-5">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="min-w-[240px] md:min-w-[280px] bc-card bc-card-hover p-6"
            >
              <b.icon className="h-6 w-6 text-gold" strokeWidth={1.5} />
              <h3 className="mt-5 font-display text-2xl text-ivory">{b.title}</h3>
              <p className="mt-2 text-sm text-silver/70">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
      <h2 className="mt-4 font-display text-4xl md:text-5xl text-ivory leading-tight">
        {title}
      </h2>
      {subtitle && <p className="mt-4 text-silver/70 text-lg">{subtitle}</p>}
    </div>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <div className="relative bc-card overflow-hidden p-10 md:p-16">
        <img
          src={emblem}
          alt=""
          aria-hidden
          className="absolute -right-24 -bottom-24 w-[420px] opacity-[0.08] pointer-events-none"
          loading="lazy"
        />
        <div className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">
            Pronto para o próximo nível
          </p>
          <h2 className="mt-4 font-display text-4xl md:text-5xl leading-tight">
            Leve sua barbearia para <span className="bc-gold-text">o próximo nível.</span>
          </h2>
          <p className="mt-4 text-silver/70 text-lg">
            Ganhe controle, cresça com segurança e ofereça uma experiência de outro
            nível para seus clientes.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link to="/auth">
              <Button size="lg">Começar agora</Button>
            </Link>
            <div className="flex items-center gap-2 text-sm text-silver/70">
              <Smartphone className="h-4 w-4 text-gold" />
              Funciona no celular como um app
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/50 mt-10">
      <div className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <Logo size="sm" showTagline />
        <p className="text-xs text-silver/50">
          © {new Date().getFullYear()} BC CLUBE. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}

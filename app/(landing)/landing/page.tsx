'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Shield,
  TrendingUp,
  CreditCard,
  PiggyBank,
  Globe,
  Bot,
  ChevronDown,
  Sparkles,
  Wallet,
  BarChart3,
} from 'lucide-react';

/* ─── floating particle ─── */
function Particle({ delay, size, x }: { delay: number; size: number; x: number }) {
  return (
    <div
      className="landing-particle"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/* ─── animated counter ─── */
function Counter({ end, suffix = '', prefix = '' }: { end: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const duration = 2000;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

/* ─── feature card ─── */
function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  delay,
}: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) {
  return (
    <div className="landing-feature-card" style={{ animationDelay: `${delay}ms` }}>
      <div className={`landing-feature-icon ${gradient}`}>
        <Icon size={24} />
      </div>
      <h3 className="landing-feature-title">{title}</h3>
      <p className="landing-feature-desc">{description}</p>
    </div>
  );
}

/* ─── main page ─── */
export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const features = [
    {
      icon: CreditCard,
      title: 'Smart Account Management',
      description: 'Link multiple bank accounts and view all balances, cards, and transactions in one dashboard.',
      gradient: 'landing-gradient-blue',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Analytics',
      description: 'Track spending patterns, income trends, and financial health with interactive charts.',
      gradient: 'landing-gradient-purple',
    },
    {
      icon: Globe,
      title: 'Multi-Currency Support',
      description: 'View balances and transfer funds in USD, TRY, EUR, GBP, and CAD with live conversion.',
      gradient: 'landing-gradient-teal',
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: 'Two-factor authentication, encrypted transfers, and real-time fraud monitoring.',
      gradient: 'landing-gradient-rose',
    },
    {
      icon: Bot,
      title: 'AI Finance Assistant',
      description: 'Ask questions about spending, budgets, and goals — powered by Gemini AI.',
      gradient: 'landing-gradient-amber',
    },
    {
      icon: PiggyBank,
      title: 'Budgets & Savings Goals',
      description: 'Set monthly budgets and savings targets. Get alerts before you overspend.',
      gradient: 'landing-gradient-emerald',
    },
  ];

  const steps = [
    {
      icon: Wallet,
      title: 'Create Your Account',
      description: 'Sign up in seconds with just your email. No paperwork, no hidden fees.',
    },
    {
      icon: BarChart3,
      title: 'Connect Your Banks',
      description: 'Securely link your existing bank accounts through our encrypted integration.',
    },
    {
      icon: Sparkles,
      title: 'Take Control',
      description: 'Transfer money, track budgets, set goals, and let AI guide your journey.',
    },
  ];

  const particles = Array.from({ length: 20 }, (_, i) => ({
    delay: Math.random() * 8,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
  }));

  return (
    <div className="landing-page">
      {/* ─── NAV ─── */}
      <nav className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <Link href="/landing" className="landing-nav-logo">
            <Image src="/brand/defiance-logo.jpg" width={36} height={36} alt="Defiance Finance" className="rounded-full" />
            <span className="landing-nav-logo-text">Defiance Finance</span>
          </Link>

          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
            <a href="#stats" className="landing-nav-link">Stats</a>
          </div>

          <div className="landing-nav-actions">
            <Link href="/sign-in" className="landing-btn-ghost">Sign In</Link>
            <Link href="/sign-up" className="landing-btn-primary">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="landing-hero">
        <div className="landing-hero-bg">
          {particles.map((p, i) => <Particle key={i} {...p} />)}
          <div className="landing-hero-orb landing-hero-orb--1" />
          <div className="landing-hero-orb landing-hero-orb--2" />
          <div className="landing-hero-orb landing-hero-orb--3" />
        </div>

        <div className="landing-hero-content">
          <div className="landing-hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Financial Platform</span>
          </div>

          <h1 className="landing-hero-title">
            Your Money,{' '}
            <span className="landing-hero-title-accent">Finally</span>
            <br />In One Place
          </h1>

          <p className="landing-hero-subtitle">
            Transfer money, track spending, manage budgets, and get AI-powered
            financial insights — all from a single, beautiful dashboard.
          </p>

          <div className="landing-hero-actions">
            <Link href="/sign-up" className="landing-btn-hero">
              Start Free Today <ArrowRight size={18} />
            </Link>
            <a href="#features" className="landing-btn-hero-outline">
              Explore Features <ChevronDown size={18} />
            </a>
          </div>

          <div className="landing-hero-trust">
            <div className="landing-hero-trust-avatars">
              {[
                'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                'linear-gradient(135deg,#06b6d4,#3b82f6)',
                'linear-gradient(135deg,#8b5cf6,#ec4899)',
                'linear-gradient(135deg,#10b981,#06b6d4)',
                'linear-gradient(135deg,#f59e0b,#ef4444)',
              ].map((bg, i) => (
                <div key={i} className="landing-hero-trust-avatar" style={{ zIndex: 6 - i }}>
                  <div className="landing-hero-trust-avatar-inner" style={{ background: bg }} />
                </div>
              ))}
            </div>
            <p className="landing-hero-trust-text">
              Trusted by <strong>1,000+</strong> users worldwide
            </p>
          </div>
        </div>

        <div className="landing-hero-scroll">
          <ChevronDown size={20} className="animate-bounce" />
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">Features</span>
            <h2 className="landing-section-title">
              Everything You Need to<br />
              <span className="landing-text-gradient">Master Your Finances</span>
            </h2>
            <p className="landing-section-subtitle">
              From multi-bank management to AI-powered insights, Defiance Finance gives you the tools to take control.
            </p>
          </div>

          <div className="landing-features-grid">
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 100} />)}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="landing-section landing-section--dark">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge landing-section-badge--light">How It Works</span>
            <h2 className="landing-section-title landing-section-title--light">
              Get Started in<br />
              <span className="landing-text-gradient">Three Simple Steps</span>
            </h2>
          </div>

          <div className="landing-steps">
            {steps.map((s, i) => (
              <div key={s.title} className="landing-step">
                <div className="landing-step-number">{i + 1}</div>
                <div className="landing-step-icon"><s.icon size={28} /></div>
                <h3 className="landing-step-title">{s.title}</h3>
                <p className="landing-step-desc">{s.description}</p>
                {i < steps.length - 1 && <div className="landing-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section id="stats" className="landing-section">
        <div className="landing-container">
          <div className="landing-stats-grid">
            {[
              { end: 1200, suffix: '+', label: 'Active Users' },
              { end: 50, suffix: 'M', prefix: '$', label: 'Transfers Processed' },
              { end: 5, suffix: '+', label: 'Currencies Supported' },
              { end: 99, suffix: '%', label: 'Uptime Guarantee' },
            ].map((s) => (
              <div key={s.label} className="landing-stat">
                <div className="landing-stat-value">
                  <Counter end={s.end} suffix={s.suffix} prefix={s.prefix} />
                </div>
                <div className="landing-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="landing-cta">
        <div className="landing-cta-bg">
          <div className="landing-hero-orb landing-hero-orb--1" />
          <div className="landing-hero-orb landing-hero-orb--2" />
        </div>
        <div className="landing-container landing-cta-content">
          <h2 className="landing-cta-title">Ready to Take Control of Your Finances?</h2>
          <p className="landing-cta-subtitle">
            Join thousands of users who are already managing their money smarter with Defiance Finance.
          </p>
          <div className="landing-cta-actions">
            <Link href="/sign-up" className="landing-btn-hero">
              Create Free Account <ArrowRight size={18} />
            </Link>
            <Link href="/sign-in" className="landing-btn-hero-outline-light">
              I Already Have an Account
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <Image src="/brand/defiance-logo.jpg" width={32} height={32} alt="Defiance Finance" className="rounded-full" />
            <span className="landing-footer-brand-text">Defiance Finance</span>
          </div>
          <p className="landing-footer-copy">
            © {new Date().getFullYear()} Defiance Finance — Group E Senior Project. All rights reserved.
          </p>
          <div className="landing-footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <Link href="/sign-in">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

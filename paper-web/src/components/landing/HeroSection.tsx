import React, { useEffect, useRef, useState } from 'react';
import { Button } from '../design-system';

export const HeroSection: React.FC = () => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const parallaxOffset = scrollY * 0.5;
  const opacity = Math.max(0, 1 - scrollY / 500);
  const scale = Math.max(0.8, 1 - scrollY / 2000);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[var(--bg-primary)] via-[var(--bg-secondary)] to-[var(--bg-primary)]"
    >
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <div
          className="absolute top-20 left-10 w-96 h-96 bg-gradient-to-br from-[var(--color-primary-300)] to-[var(--color-primary-500)] rounded-full opacity-20 blur-3xl animate-float"
          style={{ transform: `translateY(${parallaxOffset * 0.3}px)` }}
        />
        <div
          className="absolute bottom-20 right-10 w-[30rem] h-[30rem] bg-gradient-to-br from-purple-300 to-pink-500 rounded-full opacity-20 blur-3xl"
          style={{
            transform: `translateY(${parallaxOffset * 0.5}px)`,
            animation: 'float-delayed 4s ease-in-out infinite'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-[40rem] h-[40rem] bg-gradient-to-br from-blue-300 to-[var(--color-primary-400)] rounded-full opacity-10 blur-3xl"
          style={{ transform: `translate(-50%, -50%) translateY(${parallaxOffset * 0.2}px)` }}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 bg-grid-pattern opacity-5"
          style={{ transform: `translateY(${parallaxOffset * 0.1}px)` }}
        />
      </div>

      {/* Hero Content */}
      <div
        className="relative container mx-auto px-6 text-center z-10"
        style={{
          opacity,
          transform: `scale(${scale}) translateY(${parallaxOffset * -0.2}px)`
        }}
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-full mb-8 animate-fade-in-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
          </span>
          <span className="text-sm font-medium text-[var(--text-primary)]">
            10,000+ nodes online • Truly Infinite Compute
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="text-display font-bold mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <span className="block">Deploy Anywhere.</span>
          <span className="block text-gradient-animate bg-gradient-to-r from-[var(--color-primary-500)] via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Host Everywhere.
          </span>
          <span className="block">Pay Nothing.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          The world's first <strong>infinite compute</strong> platform. Deploy unlimited sites on{' '}
          <code className="px-2 py-1 bg-[var(--bg-tertiary)] rounded">.paper</code> domains with{' '}
          <strong>$0 cost forever</strong>. Making AWS, Vercel, and Google Cloud obsolete.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <Button
            variant="primary"
            size="lg"
            className="hover-lift shadow-[var(--shadow-primary)]"
            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          >
            Start Deploying Free
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="hover-scale"
            onClick={() => window.open('https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf', '_blank')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Bootstrap PDF
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <StatCard
            value="$0"
            label="Forever"
            description="No hidden fees"
          />
          <StatCard
            value="<5s"
            label="Deploy Time"
            description="100x faster"
          />
          <StatCard
            value="∞"
            label="Bandwidth"
            description="Truly unlimited"
          />
          <StatCard
            value="10,000+"
            label="P2P Nodes"
            description="Auto-scaling"
          />
        </div>
      </div>

      {/* Scroll Indicator */}
      <div
        className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce"
        style={{ opacity }}
      >
        <div className="w-6 h-10 border-2 border-[var(--text-tertiary)] rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-[var(--text-tertiary)] rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  );
};

interface StatCardProps {
  value: string;
  label: string;
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, description }) => {
  return (
    <div className="card-glass p-6 rounded-2xl text-center hover-lift group">
      <div className="text-4xl font-bold text-[var(--text-primary)] mb-2 group-hover:scale-110 transition-transform duration-300">
        {value}
      </div>
      <div className="text-sm font-semibold text-[var(--text-primary)] mb-1">
        {label}
      </div>
      <div className="text-xs text-[var(--text-secondary)]">
        {description}
      </div>
    </div>
  );
};

// Grid pattern background
const gridPatternStyle = `
  .bg-grid-pattern {
    background-image: 
      linear-gradient(var(--border-primary) 1px, transparent 1px),
      linear-gradient(90deg, var(--border-primary) 1px, transparent 1px);
    background-size: 50px 50px;
  }
`;

// Inject style
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gridPatternStyle;
  document.head.appendChild(style);
}

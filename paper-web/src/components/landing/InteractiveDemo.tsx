import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, LoadingSpinner } from '../design-system';

interface DemoStep {
  id: number;
  command: string;
  output: string;
  delay: number;
}

const demoSteps: DemoStep[] = [
  {
    id: 1,
    command: '$ paper deploy',
    output: '[OK] Detecting framework... Next.js 14 detected',
    delay: 300
  },
  {
    id: 2,
    command: '',
    output: '[OK] Building project... Done in 2.3s',
    delay: 2300
  },
  {
    id: 3,
    command: '',
    output: '[OK] Uploading to IPFS... QmX3k7n9...',
    delay: 1200
  },
  {
    id: 4,
    command: '',
    output: '[OK] Broadcasting to P2P network... 847 peers',
    delay: 800
  },
  {
    id: 5,
    command: '',
    output: '[OK] Deployed successfully!',
    delay: 500
  },
  {
    id: 6,
    command: '',
    output: '\n✨ Your site is live at:\nhttps://my-awesome-app.paper\n\n🚀 Deploy time: 4.8s\n📊 Hosting cost: $0\n🌍 Available on 847 nodes worldwide',
    delay: 100
  }
];

export const InteractiveDemo: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isPlaying && currentStep < demoSteps.length) {
      const step = demoSteps[currentStep];
      const timer = setTimeout(() => {
        setDisplayedLines(prev => [
          ...prev,
          ...(step.command ? [step.command] : []),
          step.output
        ]);
        setCurrentStep(prev => prev + 1);
      }, step.delay);

      return () => clearTimeout(timer);
    } else if (isPlaying && currentStep >= demoSteps.length) {
      setIsPlaying(false);
    }
  }, [isPlaying, currentStep]);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [displayedLines]);

  const startDemo = () => {
    setCurrentStep(0);
    setDisplayedLines([]);
    setIsPlaying(true);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setDisplayedLines([]);
    setIsPlaying(false);
  };

  return (
    <section className="py-32 relative overflow-hidden">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-headline mb-6">
            See It In <span className="text-gradient-animate">Action</span>
          </h2>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Deploy your first site in under 5 seconds. No configuration, no credit card, no limits.
          </p>
        </div>

        {/* Interactive Terminal */}
        <div className="max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Card variant="elevated" padding="none" className="overflow-hidden">
            {/* Terminal Header */}
            <div className="bg-gradient-to-r from-[var(--color-gray-800)] to-[var(--color-gray-900)] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[var(--color-error)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
                  <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
                </div>
                <span className="ml-4 text-sm font-mono text-gray-400">terminal</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startDemo}
                  disabled={isPlaying}
                  className="text-white"
                >
                  {isPlaying ? 'Running...' : 'Run Demo'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetDemo}
                  className="text-white"
                >
                  Reset
                </Button>
              </div>
            </div>

            {/* Terminal Content */}
            <div
              ref={terminalRef}
              className="bg-[var(--color-gray-900)] text-gray-100 font-mono text-sm p-6 min-h-[400px] max-h-[500px] overflow-y-auto"
            >
              {displayedLines.length === 0 && !isPlaying && (
                <div className="text-gray-500 italic">
                  Click "Run Demo" to see Paper Network in action...
                </div>
              )}
              {displayedLines.map((line, index) => (
                <div
                  key={index}
                  className={`mb-2 ${line.startsWith('$') ? 'text-[var(--color-primary-400)] font-semibold' : ''} ${line.includes('[OK]') ? 'text-[var(--color-success)]' : ''} ${line.includes('✨') ? 'text-yellow-400' : ''}`}
                >
                  {line.split('\n').map((subLine, subIndex) => (
                    <div key={subIndex}>{subLine || '\u00A0'}</div>
                  ))}
                </div>
              ))}
              {isPlaying && (
                <div className="flex items-center gap-2 text-[var(--color-primary-400)]">
                  <LoadingSpinner size="sm" variant="dots" />
                </div>
              )}
            </div>
          </Card>

          {/* Feature Highlights Below Terminal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <FeatureCard
              icon="⚡"
              title="5 Second Deploys"
              description="From code to live in under 5 seconds. 100x faster than traditional platforms."
            />
            <FeatureCard
              icon="🤖"
              title="AI-Powered"
              description="AI detects your framework, optimizes your build, and fixes errors automatically."
            />
            <FeatureCard
              icon="🌍"
              title="Global Instantly"
              description="Deployed on thousands of P2P nodes worldwide. Zero CDN configuration needed."
            />
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <Card variant="glass" padding="md" hoverable className="text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-secondary)]">
        {description}
      </p>
    </Card>
  );
};

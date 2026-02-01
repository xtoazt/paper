import { Link } from "@remix-run/react";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-gradient"></div>
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-orb hero-orb-3"></div>
      </div>
      
      <div className="hero-content">
        <div className="hero-badge">
          <span className="hero-badge-text">✨ Free Forever</span>
        </div>
        
        <h1 className="hero-title">
          Deploy Unlimited Sites
          <br />
          <span className="hero-title-accent">Free Forever</span>
        </h1>
        
        <p className="hero-description">
          Host unlimited sites on .paper domains with $0 cost forever. 
          Better than Vercel, Cloudflare, and AWS combined.
        </p>
        
        <div className="hero-actions">
          <Link to="/dashboard" className="btn btn-primary btn-large">
            Get Started →
          </Link>
          <a href="#features" className="btn btn-secondary btn-large">
            Learn More
          </a>
        </div>
        
        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-value">∞</div>
            <div className="hero-stat-label">Domains</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">$0</div>
            <div className="hero-stat-label">Forever</div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-value">10s</div>
            <div className="hero-stat-label">Deploy Time</div>
          </div>
        </div>
      </div>
    </section>
  );
}

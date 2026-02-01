import { Link } from "@remix-run/react";

export function Pricing() {
  const features = [
    "Unlimited domains",
    "Unlimited bandwidth",
    "Unlimited storage",
    "Global CDN",
    "SSL certificates",
    "DDoS protection",
    "P2P tunneling",
    "VPS hosting",
    "Database hosting",
    "Cron jobs"
  ];

  return (
    <section id="pricing" className="pricing">
      <div className="pricing-container">
        <div className="pricing-header">
          <h2 className="pricing-title">Simple, Transparent Pricing</h2>
          <p className="pricing-subtitle">
            No hidden fees. No credit card required. Just free, forever.
          </p>
        </div>
        
        <div className="pricing-card">
          <div className="pricing-badge">Free Forever</div>
          
          <div className="pricing-price">
            <span className="pricing-currency">$</span>
            <span className="pricing-amount">0</span>
          </div>
          
          <p className="pricing-period">Forever. No credit card required.</p>
          
          <ul className="pricing-features">
            {features.map((feature, index) => (
              <li key={index} className="pricing-feature">
                <svg className="pricing-check" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
          
          <Link to="/dashboard" className="btn btn-primary btn-large btn-full">
            Get Started Now →
          </Link>
        </div>
      </div>
    </section>
  );
}

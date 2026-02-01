import { Link } from "@remix-run/react";

export function Navigation() {
  return (
    <nav className="nav">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="nav-logo-icon">📄</span>
          <span className="nav-logo-text">Paper Network</span>
        </Link>
        
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <Link to="/dashboard" className="nav-link nav-link-cta">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

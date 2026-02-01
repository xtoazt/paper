import { Link } from "@remix-run/react";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="footer-logo-icon">📄</span>
            <span className="footer-logo-text">Paper Network</span>
          </div>
          <p className="footer-tagline">
            The future of web hosting is here. Decentralized, free, and unstoppable.
          </p>
        </div>
        
        <div className="footer-links">
          <div className="footer-column">
            <h3 className="footer-column-title">Product</h3>
            <Link to="/dashboard" className="footer-link">Dashboard</Link>
            <a href="#features" className="footer-link">Features</a>
            <a href="#pricing" className="footer-link">Pricing</a>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-column-title">Resources</h3>
            <a href="/docs" className="footer-link">Documentation</a>
            <a href="https://github.com/xtoazt/paper" className="footer-link" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="/blog" className="footer-link">Blog</a>
          </div>
          
          <div className="footer-column">
            <h3 className="footer-column-title">Company</h3>
            <a href="/about" className="footer-link">About</a>
            <a href="/contact" className="footer-link">Contact</a>
            <a href="/privacy" className="footer-link">Privacy</a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {new Date().getFullYear()} Paper Network. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

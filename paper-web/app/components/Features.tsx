export function Features() {
  const features = [
    {
      icon: "🌐",
      title: "True Global Domains",
      description: "Your .paper domain works everywhere, forever. No DNS, no servers, no censorship.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "💰",
      title: "$0 Forever",
      description: "Unlimited bandwidth, unlimited storage, unlimited domains. Always free.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "P2P CDN with edge caching. Faster than traditional hosting.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: "🔒",
      title: "Cryptographically Secured",
      description: "End-to-end encryption, onion routing, DDoS protection built-in.",
      gradient: "from-red-500 to-orange-500"
    },
    {
      icon: "🚀",
      title: "Deploy in 10 Seconds",
      description: "No config, no setup. Just deploy and go live instantly.",
      gradient: "from-indigo-500 to-blue-500"
    },
    {
      icon: "🌍",
      title: "Censorship Impossible",
      description: "Distributed P2P network. No single point of failure or control.",
      gradient: "from-teal-500 to-cyan-500"
    }
  ];

  return (
    <section id="features" className="features">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">Why Paper Network?</h2>
          <p className="features-subtitle">
            Everything you need to deploy and scale your applications
          </p>
        </div>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className={`feature-icon feature-icon-${index}`}>
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

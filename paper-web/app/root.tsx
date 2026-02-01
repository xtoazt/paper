import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/index.css?url";
import designSystem from "~/styles/design-system.css?url";
import ultimateDesign from "~/styles/ultimate-design.css?url";
import appleDesignSystem from "~/styles/apple-design-system.css?url";
import animationsRefined from "~/styles/animations-refined.css?url";
import landingStyles from "~/styles/landing.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "stylesheet", href: designSystem },
  { rel: "stylesheet", href: ultimateDesign },
  { rel: "stylesheet", href: appleDesignSystem },
  { rel: "stylesheet", href: animationsRefined },
  { rel: "stylesheet", href: landingStyles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        
        {/* SEO Meta Tags */}
        <title>Paper Network - Deploy Unlimited Sites Free Forever | Better Than Vercel</title>
        <meta name="description" content="Host unlimited sites on .paper domains with $0 cost forever. Cryptographically secured, censorship-resistant alternative to Vercel, Cloudflare, and AWS. Deploy in 10 seconds with unlimited bandwidth and storage." />
        <meta name="keywords" content="vercel alternative, cloudflare alternative, free hosting, free domains, unlimited bandwidth, unlimited storage, decentralized hosting, .paper tld, p2p hosting, censorship resistant, web3, ipfs, pkarr, dht, serverless alternative, netlify alternative, aws alternative, github pages alternative, zero cost hosting, free web hosting, blockchain domains, sovereign domains, global domains, free tld" />
        <meta name="author" content="Paper Network" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <link rel="canonical" href="https://paper.is-a.software/" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://paper.is-a.software/" />
        <meta property="og:title" content="Paper Network - 10000x More Powerful Than Vercel | $0 Forever" />
        <meta property="og:description" content="$0 forever vs $300/month. Unlimited vs Limited. Censorship-resistant vs Blockable. Host unlimited sites on cryptographically secured .paper domains. Deploy in under 10 seconds." />
        <meta property="og:image" content="https://paper.is-a.software/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Paper Network" />
        <meta property="og:locale" content="en_US" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://paper.is-a.software/" />
        <meta property="twitter:title" content="Paper Network - 10000x More Powerful Than Vercel | $0 Forever" />
        <meta property="twitter:description" content="Deploy unlimited sites for $0. True global domains. Censorship impossible. Better than Vercel, Cloudflare & AWS combined." />
        <meta property="twitter:image" content="https://paper.is-a.software/og-image.png" />
        <meta property="twitter:creator" content="@papernetwork" />
        <meta property="twitter:site" content="@papernetwork" />

        {/* Additional SEO */}
        <meta name="theme-color" content="#667eea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Paper Network" />
        
        {/* Schema.org markup for Google+ */}
        <meta itemprop="name" content="Paper Network - Deploy Unlimited Sites Free Forever" />
        <meta itemprop="description" content="Host unlimited sites on .paper domains with $0 cost forever. Better than Vercel, Cloudflare, and AWS." />
        <meta itemprop="image" content="https://paper.is-a.software/og-image.png" />

        {/* Performance Optimization */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://ipfs.io" />
        <link rel="dns-prefetch" href="https://gateway.ipfs.io" />
        <link rel="prefetch" href="https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf" />
        
        {/* Security */}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="referrer" content="origin-when-cross-origin" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw-enhanced.js', { scope: '/' })
                    .then(registration => {
                      console.log('Service Worker registered:', registration.scope);
                    })
                    .catch(error => {
                      console.error('Service Worker registration failed:', error);
                    });
                });
              }
            `,
          }}
        />
        
        {/* Analytics (privacy-respecting) */}
        <script defer data-domain="paper.is-a.software" src="https://plausible.io/js/script.js"></script>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

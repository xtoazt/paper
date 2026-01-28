# Paper Network - Full PaaS Platform

## Quick Start

### Install CLI
```bash
npm install -g @paper/cli
```

### Deploy Your First App
```bash
paper login
paper init
paper deploy
```

Your app is now live at `https://your-app.paper` - **$0 forever!**

## What's New

Paper Network is no longer just static HTML hosting - it's now a **complete Platform-as-a-Service** supporting:

### 🚀 Any Framework
- React, Vue, Svelte (SPA)
- Next.js, Gatsby, Remix (SSR/SSG)
- Express, Fastify (Node.js)
- Django, Flask (Python)
- Static HTML/CSS/JS

### 🗄️ Databases Included
- PostgreSQL
- MongoDB
- Redis
- MySQL
- OrbitDB (distributed)
- Gun.js (P2P)

**All free. All unlimited.**

### ⚡ Features
- **Git Integration**: Push to deploy
- **CLI Tool**: Power user workflows
- **Web Dashboard**: Visual management
- **Edge Functions**: Serverless in browser
- **Auto-scaling**: Based on demand
- **Team Collaboration**: Invite members
- **Custom Domains**: HTTPS automatic
- **Real-time Logs**: Debug live
- **Environment Variables**: Secure secrets
- **Rollback**: One-click revert

## Architecture

### Build System
```
Your Code → Build Orchestrator → [Browser Builder OR P2P Workers] → IPFS
```

- **Browser Builder**: For simple apps (React SPA, static sites)
- **P2P Builders**: For complex apps (Next.js, Django, Rails)

### Runtime System
```
Request → Runtime Router → [Edge Runtime OR Container Runtime OR IPFS]
```

- **Edge Runtime**: Serverless functions in browser
- **Container Runtime**: Full servers on P2P nodes
- **IPFS**: Static assets, cached forever

### Deployment Methods
- **Git Push**: Automatic via webhooks
- **CLI**: `paper deploy`
- **Dashboard**: Drag & drop UI

## Directory Structure

```
paper-web/src/lib/
├── build/              # Build system
│   ├── browser-builder.ts
│   ├── p2p-builder.ts
│   └── orchestrator.ts
├── runtime/            # Runtime system
│   ├── edge-runtime.ts
│   ├── container-runtime.ts
│   └── router.ts
├── deployment/         # Deployment tools
│   └── git-integration.ts
├── database/           # Database layer
│   ├── distributed-db.ts
│   └── traditional-db.ts
├── adapters/           # Framework adapters
│   ├── nextjs-adapter.ts
│   ├── python-adapter.ts
│   └── node-adapter.ts
└── paas/              # Master export
    └── index.ts

cli/                    # CLI tool
├── src/
│   ├── commands/
│   └── utils/
└── package.json

components/ui/          # Dashboard UI
├── DeploymentDashboard.tsx
├── ProjectList.tsx
├── DatabaseManager.tsx
└── ...
```

## Usage Examples

### Deploy Next.js App
```bash
npx create-next-app my-app
cd my-app
paper deploy
# ✓ Deployed to https://my-app.paper
```

### Create Database
```bash
paper db create my-app-db postgres
paper db connect my-app-db
# postgresql://user:pass@p2p-node.paper:5432/my-app-db
```

### Set Environment Variables
```bash
paper env set DATABASE_URL "postgresql://..."
paper env set API_KEY "secret"
```

### View Logs
```bash
paper logs my-app --follow
```

### Scale Application
```bash
paper scale my-app --instances 5
```

### Add Custom Domain
```bash
paper domains add my-app example.com
# Then add CNAME: example.com → my-app.paper
```

## Programmatic API

```typescript
import { paas, buildOrchestrator, edgeRuntime } from '@paper/paas';

// Deploy application
const deployment = await paas.deploy({
  projectPath: './my-app',
  name: 'my-app',
  framework: 'nextjs',
  env: {
    DATABASE_URL: 'postgresql://...'
  }
});

console.log(`Deployed to ${deployment.url}`);

// Create database
const db = await paas.createDatabase({
  name: 'my-db',
  type: 'postgres'
});

console.log(`Connection: ${db.connectionString}`);
```

## Dashboard

Access the full-featured dashboard at:
```
https://paper.is-a.software/dashboard
```

Features:
- 📦 Project management
- 🚀 Deployment history
- 🗄️ Database management
- 🌐 Domain configuration
- 📊 Analytics
- ⚙️ Settings & team

## Comparison

| | Paper | Vercel | Heroku | Cloudflare |
|---|---|---|---|---|
| **Price** | $0 | $20-300/mo | $25-500/mo | $5-50/mo |
| **Bandwidth** | ∞ | Limited | Limited | Limited |
| **Databases** | Free ∞ | Paid | Paid | Paid |
| **Frameworks** | All | Most | All | Limited |
| **Lock-in** | None | High | Medium | High |
| **Censorship** | Impossible | Possible | Possible | Possible |

## Why Paper Network?

1. **$0 Forever**: No credit card, unlimited everything
2. **Decentralized**: P2P = unstoppable
3. **Any Framework**: React to Django to Rails
4. **Best DX**: Easier than Vercel
5. **Built-in DBs**: PostgreSQL, MongoDB, Redis included
6. **True Global**: P2P network everywhere
7. **Open Source**: No vendor lock-in

## Support

- **Docs**: https://paper.is-a.software/docs
- **GitHub**: https://github.com/xtoazt/paper
- **Discord**: https://discord.gg/paper

## Contributing

Paper Network is open source! Contributions welcome:
```bash
git clone https://github.com/xtoazt/paper.git
cd paper
npm install
npm run dev
```

## License

MIT

---

**Welcome to the future of web hosting. $0 forever. Unlimited everything. Unstoppable.**

# Paper CLI

Official command-line interface for deploying to Paper Network - the decentralized web hosting platform.

## Installation

```bash
npm install -g @paper/cli
```

## Quick Start

```bash
# Login to Paper Network
paper login

# Initialize your project
paper init

# Deploy to Paper Network
paper deploy
```

Your site is now live at `https://your-project.paper` - for free, forever! 🎉

## Commands

### Authentication

```bash
# Login (generates PKARR keypair)
paper login
```

### Project Management

```bash
# Initialize a project
paper init

# Deploy current directory
paper deploy

# Deploy with custom name
paper deploy --project my-app

# Deploy to production
paper deploy --prod
```

### Application Management

```bash
# View logs
paper logs my-app

# Follow logs in real-time
paper logs my-app --follow

# Scale application
paper scale my-app --instances 3
```

### Database Management

```bash
# Create a database
paper db create my-db postgres

# List databases
paper db list

# Get connection string
paper db connect my-db

# Delete database
paper db delete my-db
```

Supported database types:
- `postgres` - PostgreSQL
- `mongodb` - MongoDB
- `redis` - Redis
- `mysql` - MySQL/MariaDB

### Environment Variables

```bash
# Set environment variable
paper env set API_KEY=secret

# List environment variables
paper env list

# Delete environment variable
paper env delete API_KEY
```

### Custom Domains

```bash
# Add custom domain
paper domains add my-app example.com

# List domains
paper domains list my-app

# Remove domain
paper domains remove my-app example.com
```

## Configuration

Paper CLI stores configuration in `~/.paper/config.json`

Project-specific configuration can be added to `paper.json`:

```json
{
  "name": "my-app",
  "framework": "react",
  "build": {
    "command": "npm run build",
    "outputDirectory": "dist"
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

## Supported Frameworks

- Static HTML/CSS/JS
- React
- Vue
- Svelte
- Next.js
- Gatsby
- Remix
- Astro
- Express
- Fastify
- Django
- Flask

## Features

- 🚀 **Zero-cost hosting** - Free forever, unlimited bandwidth
- 🌍 **Global CDN** - P2P network provides low latency everywhere
- 🔒 **Censorship-resistant** - Decentralized infrastructure
- 📦 **Any framework** - Support for all major web frameworks
- 🗄️ **Free databases** - PostgreSQL, MongoDB, Redis included
- 🔐 **Automatic SSL** - HTTPS by default
- ⚡ **Instant deployments** - Deploy in seconds
- 🔄 **Git integration** - Auto-deploy from GitHub/GitLab

## Examples

### Deploy a React app

```bash
cd my-react-app
paper login
paper deploy
```

### Deploy with database

```bash
# Create database
paper db create my-app-db postgres

# Set connection string
paper env set DATABASE_URL "postgresql://..."

# Deploy
paper deploy
```

### Add custom domain

```bash
# Add domain
paper domains add my-app example.com

# Add CNAME record in your DNS:
# example.com → my-app.paper

# Done! SSL will be issued automatically
```

## Support

- Documentation: https://paper.network/docs
- GitHub: https://github.com/xtoazt/paper
- Discord: https://discord.gg/paper

## License

MIT

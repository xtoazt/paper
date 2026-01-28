# Paper Network VPS Guide

## Overview

Paper Network provides unlimited free VPS hosting powered by distributed computing. Deploy Node.js, Python, Go, Rust, and more with automatic scaling and load balancing.

## Features

- **Unlimited VPS Instances**: Create as many as you need
- **Multiple Runtimes**: Node.js, Python (Pyodide), Go (TinyGo), Rust (WASM)
- **Auto-Scaling**: Automatically scale based on load
- **Load Balancing**: Traffic distributed across multiple nodes
- **High Availability**: 3-node redundancy by default
- **Zero Cost**: Completely free forever

## Creating a VPS

### Via Dashboard

1. Visit `https://paper.paper` and go to the VPS tab
2. Click "Create VPS"
3. Configure your instance:
   - Name: `my-app`
   - CPU: `2 cores`
   - Memory: `1GB`
   - Runtime: `node`
4. Click "Deploy"

Your VPS will be available at `vps-xxxxx.paper`

### Via CLI

```bash
npm install -g @paper/cli

paper vps create \
  --name my-app \
  --runtime node \
  --cpu 2 \
  --memory 1024
```

## Deploying Your App

### Node.js App

```javascript
// server.js
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello from Paper Network!');
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

Deploy:
```bash
paper vps deploy --vps my-app --entry server.js
```

### Python App

```python
# app.py
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello():
    return 'Hello from Paper Network!'

if __name__ == '__main__':
    app.run(port=3000)
```

Deploy:
```bash
paper vps deploy --vps my-app --runtime python --entry app.py
```

## Scaling

### Auto-Scaling

Auto-scaling is enabled by default. Your VPS will automatically scale based on:
- CPU usage > 70%
- Memory usage > 80%
- Request queue depth

### Manual Scaling

```bash
paper vps scale --vps my-app --instances 5
```

## Environment Variables

Set environment variables:

```bash
paper vps env set --vps my-app NODE_ENV=production
paper vps env set --vps my-app DATABASE_URL=db-xxxxx.paper
```

## Monitoring

View real-time stats:

```bash
paper vps stats --vps my-app
```

Or visit the dashboard at `https://paper.paper/dashboard`

## Custom Domains

Map custom `.paper` domains:

```bash
paper vps domain add --vps my-app --domain myapp.paper
```

## SSH Access

While traditional SSH isn't available, you can execute commands:

```bash
paper vps exec --vps my-app "npm install"
paper vps logs --vps my-app --tail 100
```

## Pricing

Everything is **100% FREE** forever, powered by distributed community compute.

## Limits

No limits! Create unlimited VPS instances with unlimited resources.

## Support

- Documentation: `https://paper.paper/docs`
- Community: `https://github.com/xtoazt/paper/discussions`
- Issues: `https://github.com/xtoazt/paper/issues`

# Paper Network Compute Contribution

## How It Works

When you open the Paper Network PDF bootstrap or visit a `.paper` domain, your browser automatically becomes part of the distributed computing network. Your device contributes a small amount of resources to power the entire platform.

## What Gets Contributed

Your device contributes:

- **CPU**: 5-15% depending on activity
  - **5% when active** (using your device)
  - **15% when idle** (device inactive for 60+ seconds)
- **Memory**: Up to 200 MB RAM
- **Storage**: Minimal (cached content only)
- **Bandwidth**: As available

## Adaptive Throttling

The system intelligently adjusts resource usage:

### When You're Active

```
Using device? → Throttle to 5% CPU
Gaming/streaming? → Drop to minimum
Typing/clicking? → Stay at 5%
```

### When You're Idle

```
No activity for 60s → Increase to 15% CPU
Tab unfocused → Increase to 15%
Screen locked → Maximum contribution
```

### Automatic Detection

The system monitors:
- Mouse movements
- Keyboard input
- Window focus
- Tab visibility
- Scroll events
- Touch events

## Resource Monitoring

View your contribution:

```javascript
// In browser console
paper.stats.contribution
```

Output:
```javascript
{
  cpu: "8.2%",
  memory: "145 MB",
  bandwidth: "2.1 Mbps",
  tasks: 3,
  uptime: "2h 15m",
  contributed: {
    cpuHours: 0.18,
    tasks: 47,
    bandwidth: "1.2 GB"
  }
}
```

## What Your Contribution Powers

Your resources help provide:

### VPS Hosting
- Host containers across distributed nodes
- Run applications for other users
- Execute serverless functions

### Database Operations
- Store and replicate database shards
- Execute distributed queries
- Maintain data consistency

### CDN Services
- Cache and serve static assets
- Distribute content globally
- Provide unlimited bandwidth

### Compute Tasks
- Process background jobs
- Execute cron jobs
- Run AI/ML workloads

## Privacy & Security

### What We DON'T Access

- ❌ Your files
- ❌ Your browsing history
- ❌ Your personal data
- ❌ Your passwords
- ❌ Your local storage
- ❌ Your cookies

### What We DO Use

- ✓ CPU cycles
- ✓ RAM for caching
- ✓ Network bandwidth
- ✓ Browser APIs only

### Isolation

All compute tasks run:
- In **isolated Web Workers**
- With **sandboxed execution**
- **No access** to your data
- **No access** to other tabs

## Reputation System

Earn reputation by contributing:

```
Contributions → Reputation Score → Priority Access
```

### Benefits of High Reputation

- **Priority task execution**
- **Lower latency** for your services
- **More resources** allocated to your apps
- **Beta feature** access

### Reputation Score

```bash
paper reputation show
```

Output:
```
Reputation: ⭐⭐⭐⭐☆ (4.2/5.0)
Total Contribution: 24.5 CPU hours
Tasks Completed: 1,247
Success Rate: 99.8%
Uptime: 145 hours
```

## Silent Contribution

By default, contribution is **silent** with no UI indicators:

- No notifications
- No visible impact
- No opt-out required
- Completely transparent

The only way to know you're contributing is to check the console or visit the dashboard.

## Stopping Contribution

While not recommended, you can stop contributing:

```javascript
// In browser console
paper.contribution.stop()
```

**Note**: This disables access to all Paper Network services.

## Battery Impact

On laptops and mobile devices:

- **Minimal impact** when plugged in
- **Reduced contribution** on battery
- **Automatic pause** when battery < 20%
- **Smart throttling** based on power state

## Network Impact

The system respects your network:

- **No excessive traffic** on metered connections
- **Adaptive bandwidth** usage
- **Respects data limits**
- **Smart scheduling** for large transfers

## Fair Contribution

Everyone contributes proportionally:

```
Your usage ∝ Your contribution
```

If you:
- Use 1 VPS → Contribute ~5 CPU%
- Use 5 VPS → Contribute ~15 CPU%
- Use 10 VPS → Contribute ~25 CPU%

But always with the same limits to protect your experience.

## Benchmarks

Typical resource usage by activity:

| Activity | CPU | Memory | Battery Impact |
|----------|-----|--------|----------------|
| Browsing | 0-5% | 50-100 MB | Minimal |
| Video streaming | 15-30% | 100-200 MB | Low |
| Gaming | 50-90% | 500+ MB | High |
| **Paper contribution** | **5-15%** | **100-200 MB** | **Minimal** |

Paper Network contribution is **equivalent to browsing** - you won't even notice it.

## Real-World Impact

With 1,000 contributing devices:

```
1,000 devices × 15% CPU × 4 cores = 60,000 vCPU cores
1,000 devices × 200 MB RAM = 200 GB RAM
1,000 devices × 10 Mbps = 10 Gbps bandwidth

= Equivalent to $50,000/month in cloud costs
```

## Contribution Transparency

View network-wide stats:

```bash
paper stats network
```

Output:
```
Active Nodes: 12,450
Total CPU: 498,000 cores
Total RAM: 2.4 TB
Total Bandwidth: 124 Gbps
Tasks/sec: 8,450
Uptime: 99.97%
```

## Questions

### Why contribute?

To power the platform. Your contribution enables unlimited free resources for everyone, including yourself.

### Can I contribute more?

Yes! Increase limits:

```javascript
paper.contribution.setLimits({
  cpuIdle: 0.25,  // 25% when idle
  cpuActive: 0.10, // 10% when active
  memory: 500 * 1024 * 1024 // 500 MB
})
```

### Will it slow my computer?

No. The system is designed to be completely transparent and will never impact your experience.

### What if I'm on mobile?

Mobile devices contribute less and automatically pause on low battery.

### Can I see what tasks I'm running?

Yes:

```javascript
paper.contribution.tasks
```

### Do I need to keep a tab open?

No. Once bootstrapped, your browser maintains the connection via Service Worker, even with all tabs closed.

## Support

- Dashboard: `https://paper.paper/dashboard`
- Stats: `https://paper.paper/stats`
- Community: `https://github.com/xtoazt/paper/discussions`

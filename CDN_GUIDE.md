# Paper Network CDN Guide

## Overview

Paper Network provides a global CDN with unlimited bandwidth, powered by distributed nodes worldwide.

## Features

- **Unlimited Bandwidth**: No transfer limits
- **1000+ Edge Locations**: Distributed nodes worldwide
- **Automatic Compression**: Brotli, Gzip
- **Image Optimization**: WebP, AVIF conversion
- **Video Streaming**: HLS, DASH support
- **Smart Caching**: LRU with popularity scoring
- **Geo-Routing**: Serve from nearest node

## Uploading Assets

### Via Dashboard

1. Visit `https://paper.paper` and go to the CDN tab
2. Click "Upload Asset"
3. Select your files
4. Get your CDN URLs

### Via CLI

```bash
# Single file
paper cdn upload image.png

# Multiple files
paper cdn upload dist/*

# With custom path
paper cdn upload --path assets/ image.png
```

Output:
```
✓ Uploaded: https://cdn-xxxxx.paper/image.png
```

## Using CDN URLs

```html
<!-- Images -->
<img src="https://cdn-xxxxx.paper/logo.png" alt="Logo">

<!-- CSS -->
<link rel="stylesheet" href="https://cdn-xxxxx.paper/styles.css">

<!-- JavaScript -->
<script src="https://cdn-xxxxx.paper/app.js"></script>

<!-- Videos -->
<video src="https://cdn-xxxxx.paper/video.mp4" controls></video>
```

## Automatic Image Optimization

Images are automatically optimized:

```html
<!-- Original -->
<img src="https://cdn-xxxxx.paper/image.jpg">

<!-- Auto-optimized (WebP if supported) -->
<!-- Auto-resized for device -->
<!-- Auto-compressed -->
```

### Manual Optimization

```bash
paper cdn optimize \
  --file image.jpg \
  --format webp \
  --quality 85 \
  --width 1920
```

## Video Streaming

Upload videos for adaptive streaming:

```bash
paper cdn upload \
  --type video \
  --format hls \
  video.mp4
```

Generates:
```
https://cdn-xxxxx.paper/video.m3u8 (HLS)
https://cdn-xxxxx.paper/video.mpd  (DASH)
```

Use in HTML:

```html
<video controls>
  <source src="https://cdn-xxxxx.paper/video.m3u8" type="application/x-mpegURL">
  <source src="https://cdn-xxxxx.paper/video.mpd" type="application/dash+xml">
</video>
```

## Cache Control

### Default Caching

All assets are cached with:
- **1 year TTL** for static assets
- **Immutable** flag for versioned files
- **Smart invalidation** for updated content

### Custom Cache Headers

```bash
paper cdn upload \
  --file app.js \
  --cache-control "public, max-age=3600"
```

### Cache Invalidation

```bash
# Invalidate specific file
paper cdn invalidate https://cdn-xxxxx.paper/app.js

# Invalidate pattern
paper cdn invalidate "https://cdn-xxxxx.paper/assets/*"

# Purge all
paper cdn purge --all
```

## Compression

Automatic compression:
- **Brotli** for modern browsers
- **Gzip** for older browsers
- **No compression** for pre-compressed files

View compression ratio:
```bash
paper cdn stats --asset app.js
```

Output:
```
Original: 250 KB
Brotli: 65 KB (74% reduction)
Gzip: 80 KB (68% reduction)
```

## Bandwidth Aggregation

The CDN aggregates bandwidth from all nodes:

```bash
paper cdn bandwidth
```

Output:
```
Total Bandwidth: 1.2 Tbps
Active Nodes: 1,247
Average Latency: 12ms
```

## Performance

- **Sub-10ms latency** from nearest node
- **100+ Gbps** aggregate bandwidth
- **99.99% uptime**
- **Automatic failover**

## Geo-Routing

Traffic is automatically routed to the nearest node based on:
- Geographic location
- Network latency
- Node availability
- Load balancing

## Analytics

View asset analytics:

```bash
paper cdn analytics --asset app.js
```

See:
- Request count
- Bandwidth used
- Geographic distribution
- Cache hit ratio
- Popular files

## Custom Domains

Map custom domains:

```bash
paper cdn domain add cdn.mysite.paper
```

Use:
```html
<img src="https://cdn.mysite.paper/logo.png">
```

## Pricing

**100% FREE** with **unlimited bandwidth**.

## Best Practices

1. **Version your assets** - Use content hashes in filenames
2. **Compress before upload** - Pre-compress large files
3. **Use responsive images** - Serve appropriate sizes
4. **Enable lazy loading** - Load images on demand
5. **Set long cache times** - 1 year for static assets
6. **Use CDN for everything** - CSS, JS, images, fonts

## Security

- **Automatic HTTPS** - Free SSL for all assets
- **DDoS protection** - Built-in mitigation
- **Access control** - Public or private assets
- **Signed URLs** - Temporary access links

## Support

- Documentation: `https://paper.paper/docs/cdn`
- Examples: `https://github.com/xtoazt/paper/tree/main/examples/cdn`

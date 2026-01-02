// Paper TLD Helper - Use this bookmarklet
// javascript:(function(){const d=prompt('Enter .paper domain (e.g., blog.paper):','blog.paper');if(d){window.location.href='/_gateway/'+d+'/';}})();

// Or use this URL format:
// http://your-paper-site.com/_gateway/blog.paper/

// For address bar navigation to work:
// 1. First visit the Paper dashboard (registers Service Worker)
// 2. Then type blog.paper in address bar
// 3. Service Worker should intercept before DNS

// If DNS_PROBE_FINISHED_NXDOMAIN still appears:
// - The Service Worker might not be registered yet
// - Try visiting the dashboard first, then navigate to blog.paper
// - Or use the gateway URL directly: /_gateway/blog.paper/





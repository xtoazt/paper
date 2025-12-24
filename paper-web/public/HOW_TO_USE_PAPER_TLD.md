# Making .paper TLD Work - Critical Instructions

## The Problem

When you type `blog.paper` in the address bar, the browser tries to resolve DNS **BEFORE** the Service Worker can intercept it. This causes `DNS_PROBE_FINISHED_NXDOMAIN`.

## The Solution

**You MUST visit the Paper dashboard FIRST** to register the Service Worker. Then `.paper` domains will work.

### Step-by-Step:

1. **Visit the Paper Dashboard** (this page)
   - This registers the Service Worker
   - Wait for the green "Connected" indicator

2. **Then type `blog.paper` in the address bar**
   - Service Worker will intercept BEFORE DNS lookup
   - Works in the same browser session

3. **For New Tabs/Windows:**
   - Service Worker should still work (it controls all tabs)
   - If it doesn't, use the gateway URL: `/_gateway/blog.paper/`

## Alternative: Direct Gateway Access

If DNS still fails, use the gateway URL directly:
- `http://your-paper-site.com/_gateway/blog.paper/`
- This bypasses DNS entirely

## Browser-Specific Notes

### Chrome/Edge:
- Service Worker should intercept navigation
- Make sure "Use Secure DNS" is OFF (Settings > Privacy > Security)

### Firefox:
- Service Worker support is good
- May need to allow Service Workers in settings

### Safari:
- Service Worker support is limited
- May need to use gateway URLs directly

## Debugging

If it still doesn't work:

1. Open DevTools → Application → Service Workers
2. Check if `/sw.js` is registered and "activated"
3. Check console for `[Paper]` or `[SW]` logs
4. Try the gateway URL: `/_gateway/blog.paper/`

## Why This Happens

Browsers perform DNS resolution **before** Service Workers can intercept navigation. The Service Worker can only intercept:
- Requests from pages it controls (after registration)
- Fetch API calls
- Navigation within the same origin

For address bar navigation in a NEW tab, the Service Worker must already be registered from a previous visit.


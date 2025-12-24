# Paper TLD Functionality Verification

## Core TLD Flow

1. **User types `blog.paper` in address bar**
   - Service Worker intercepts via `fetch` event
   - Rewrites to `/_gateway/blog.paper/`
   - Sends message to main thread via MessageChannel

2. **Main thread receives GATEWAY_REQUEST**
   - Firewall checks request
   - Runtime handles request
   - Returns response via MessageChannel port

3. **Service Worker returns response**
   - Adds security headers
   - Serves to browser

## Test Cases

### ✅ Built-in Apps
- `blog.paper` → Should serve blog app
- `shop.paper` → Should serve shop app

### ✅ Imported Repos
- Import any GitHub/GitLab/Bitbucket repo
- Access at `{repo-name}.paper`
- Should serve files from virtual filesystem

### ✅ Path Handling
- `/` → Should try `index.html`
- `/path/to/file` → Should serve file
- `/nonexistent` → Should return 404

### ✅ Service Worker
- Should register on page load
- Should intercept `.paper` domains
- Should handle gateway requests

### ✅ Navigation
- Address bar navigation → Intercepted
- Link clicks → Intercepted
- Form submissions → Intercepted
- Fetch API calls → Intercepted

## Debugging

If `.paper` domains don't work:

1. Check Service Worker registration:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(regs => console.log(regs))
   ```

2. Check if SW is intercepting:
   - Open DevTools → Application → Service Workers
   - Should see `/sw.js` registered

3. Check console for errors:
   - Look for `[Paper]` or `[Interceptor]` logs
   - Check for firewall blocks

4. Test gateway directly:
   - Navigate to `/_gateway/blog.paper/`
   - Should work even if DNS doesn't resolve

## Known Issues & Fixes

- ✅ Fixed: Service Worker double registration
- ✅ Fixed: Gateway path parsing edge cases
- ✅ Fixed: Runtime path normalization
- ✅ Fixed: AppGrid using wrong URL format
- ✅ Fixed: Error handling in decompression


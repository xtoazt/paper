# Generate Bootstrap PDF

## Quick Start

```bash
cd paper-web/public
npm install pdf-lib
node create-bootstrap-pdf.js
```

This will create `bootstrap.pdf` in the `paper-web` directory.

## What Gets Created

A 3-page professional PDF with:
- **Page 1**: Welcome and auto-redirect JavaScript
- **Page 2**: Quick start guide
- **Page 3**: Technical architecture details

## After Generation

1. **Test the PDF**:
   - Open in Adobe Acrobat Reader (best JavaScript support)
   - Verify it contains readable content
   - Check that links are clickable

2. **Commit to repository**:
   ```bash
   cd ../..  # Back to paper root
   git add bootstrap.pdf
   git commit -m "Add bootstrap PDF for censorship resistance"
   git push origin main
   ```

3. **Wait for jsDelivr** (5-10 minutes):
   - The PDF will be available at:
   - `https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf`

4. **Update website links** (optional):
   - In `src/components/pages/UltimateLanding.tsx`
   - Change GitHub links back to jsDelivr PDF URL
   - Change button text from "View on GitHub" to "Bootstrap PDF"

## Current Status

✅ Script is ready to run
⚠️ PDF not yet created
✅ Website works without PDF (GitHub links active)

## Note

The PDF is **optional**. The site is fully functional without it. The PDF was designed as an additional censorship-resistant entry point, but the main site already has multiple access methods.

#!/bin/bash
# Paper Network PDF Bootstrap Builder
# Compiles the LaTeX document with embedded JavaScript

set -e

echo "🔨 Building Paper Network Bootstrap PDF..."

# Check if pdflatex is installed
if ! command -v pdflatex &> /dev/null; then
    echo "❌ Error: pdflatex not found!"
    echo "Please install TeX Live:"
    echo "  macOS: brew install --cask mactex"
    echo "  Ubuntu/Debian: sudo apt-get install texlive-full"
    echo "  Windows: Download from https://www.tug.org/texlive/"
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -f bootstrap.pdf bootstrap.aux bootstrap.log bootstrap.out bootstrap.toc

# Compile LaTeX document (run twice for references)
echo "📄 Compiling LaTeX document (pass 1)..."
pdflatex -interaction=nonstopmode bootstrap.tex > /dev/null 2>&1 || true

echo "📄 Compiling LaTeX document (pass 2)..."
pdflatex -interaction=nonstopmode bootstrap.tex > /dev/null 2>&1 || true

# Clean auxiliary files
echo "🧹 Cleaning auxiliary files..."
rm -f bootstrap.aux bootstrap.log bootstrap.out bootstrap.toc

# Check if PDF was created
if [ -f "bootstrap.pdf" ]; then
    SIZE=$(du -h bootstrap.pdf | cut -f1)
    echo "✅ Success! PDF created: bootstrap.pdf ($SIZE)"
    echo ""
    echo "📤 Upload this PDF to jsDelivr:"
    echo "   1. Commit to GitHub: git add bootstrap.pdf && git commit -m 'Add bootstrap PDF'"
    echo "   2. Push: git push"
    echo "   3. Access via: https://cdn.jsdelivr.net/gh/xtoazt/paper@main/bootstrap.pdf"
    echo ""
    echo "🔍 Test locally:"
    echo "   open bootstrap.pdf"
    echo ""
else
    echo "❌ Error: PDF compilation failed!"
    echo "Check bootstrap.log for details"
    exit 1
fi

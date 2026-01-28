# Paper Network - Makefile
# Build system for LaTeX PDF bootstrap

.PHONY: pdf clean help install-deps

# Default target
all: pdf

# Build the PDF bootstrap
pdf:
	@echo "🔨 Building Paper Network Bootstrap PDF..."
	@pdflatex -interaction=nonstopmode bootstrap.tex > /dev/null 2>&1
	@pdflatex -interaction=nonstopmode bootstrap.tex > /dev/null 2>&1
	@$(MAKE) clean-temp
	@echo "✅ Success! PDF created: bootstrap.pdf"
	@du -h bootstrap.pdf | awk '{print "   Size:", $$1}'

# Clean temporary files
clean-temp:
	@rm -f bootstrap.aux bootstrap.log bootstrap.out bootstrap.toc bootstrap.fls bootstrap.fdb_latexmk

# Clean everything including PDF
clean: clean-temp
	@rm -f bootstrap.pdf
	@echo "🧹 Cleaned all build artifacts"

# Install LaTeX dependencies (macOS)
install-deps:
	@echo "📦 Installing LaTeX dependencies..."
	@if command -v brew > /dev/null 2>&1; then \
		echo "Installing MacTeX via Homebrew..."; \
		brew install --cask mactex; \
	elif command -v apt-get > /dev/null 2>&1; then \
		echo "Installing TeX Live via apt..."; \
		sudo apt-get update && sudo apt-get install -y texlive-full; \
	else \
		echo "❌ Please install TeX Live manually:"; \
		echo "   https://www.tug.org/texlive/"; \
	fi

# Test the PDF
test: pdf
	@echo "🔍 Opening PDF for testing..."
	@if command -v open > /dev/null 2>&1; then \
		open bootstrap.pdf; \
	elif command -v xdg-open > /dev/null 2>&1; then \
		xdg-open bootstrap.pdf; \
	else \
		echo "Please open bootstrap.pdf manually"; \
	fi

# Show help
help:
	@echo "Paper Network PDF Bootstrap Build System"
	@echo ""
	@echo "Targets:"
	@echo "  make pdf           - Build the PDF bootstrap"
	@echo "  make clean         - Remove all build artifacts"
	@echo "  make install-deps  - Install LaTeX dependencies"
	@echo "  make test          - Build and open PDF"
	@echo "  make help          - Show this help message"

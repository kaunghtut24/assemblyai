#!/bin/bash

# Test script for color functionality
echo "Testing color functionality..."

# Source the color functions from start-servers.sh
source <(grep -A 50 "# Colors for output" start-servers.sh | head -50)

echo ""
echo "=== Color Test ==="
print_status "This is an info message"
print_success "This is a success message"
print_warning "This is a warning message"
print_error "This is an error message"
echo ""

if [[ "$USE_COLORS" == "true" ]]; then
    echo "✅ Colors are ENABLED in this terminal"
    echo "   Terminal supports $(tput colors) colors"
else
    echo "❌ Colors are DISABLED in this terminal"
    echo "   Fallback to plain text mode"
fi

echo ""
echo "Color detection details:"
echo "- Terminal is TTY: $([[ -t 1 ]] && echo "Yes" || echo "No")"
echo "- tput available: $(command -v tput >/dev/null 2>&1 && echo "Yes" || echo "No")"
if command -v tput >/dev/null 2>&1; then
    echo "- Terminal colors: $(tput colors 2>/dev/null || echo "Unknown")"
fi

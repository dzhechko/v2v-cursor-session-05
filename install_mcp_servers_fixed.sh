#!/bin/bash
# ============================================================================
# MCP Servers Installation Script (FIXED)
# ============================================================================
# Updated with correct claude mcp add syntax

set -e  # Exit on error

echo "🚀 MCP Servers Installation Script (Fixed)"
echo "============================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📦 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if claude command exists
if ! command -v claude &> /dev/null; then
    print_warning "Claude CLI not found. Please install it first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version 18+ required. Current: $(node --version)"
    exit 1
fi

print_success "Prerequisites check passed"
echo ""

# 1. Install MCP Installer
print_step "Installing MCP Installer..."
if claude mcp add mcp-installer npx @anaisbetts/mcp-installer; then
    print_success "MCP Installer installed"
else
    print_warning "Failed to install MCP Installer (may already exist)"
fi
echo ""

# 2. Install Brave Search Server (with API key via JSON)
print_step "Installing Brave Search Server..."
if claude mcp add-json brave-search '{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s"
  }
}'; then
    print_success "Brave Search Server installed with API key"
else
    print_warning "Failed to install Brave Search Server"
fi
echo ""

# 3. Install Puppeteer Server
print_step "Installing Puppeteer Server..."
if claude mcp add puppeteer npx @modelcontextprotocol/server-puppeteer; then
    print_success "Puppeteer Server installed"
else
    print_warning "Failed to install Puppeteer Server (may already exist)"
fi
echo ""

# Verification
echo "============================================"
echo "🔍 Verification"
echo "============================================"
echo ""

print_step "Listing installed MCP servers..."
claude mcp list
echo ""

# Final message
echo "============================================"
print_success "Installation Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Restart Claude Code to load the new servers"
echo "2. Verify servers are working by checking available tools"
echo "3. Check logs if any server fails to start"
echo ""
echo "Useful commands:"
echo "  claude mcp list              # List all servers"
echo "  claude mcp get <name>        # Get server details"
echo "  claude mcp remove <name>     # Remove a server"
echo ""

#!/bin/bash
# ============================================================================
# MCP Servers Installation Script
# ============================================================================
# This script installs all MCP servers from your current Claude configuration

set -e  # Exit on error

echo "🚀 MCP Servers Installation Script"
echo "===================================="
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
    print_warning "Claude CLI not found. Please install it first:"
    echo "  npm install -g @anthropics/claude-cli"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version 18+ required. Current: $(node --version)"
    echo "  Please upgrade Node.js: https://nodejs.org/"
    exit 1
fi

print_success "Prerequisites check passed"
echo ""

# 1. Install MCP Installer
print_step "Installing MCP Installer..."
if claude mcp add @anaisbetts/mcp-installer; then
    print_success "MCP Installer installed"
else
    print_warning "Failed to install MCP Installer"
fi
echo ""

# 2. Install Brave Search Server
print_step "Installing Brave Search Server..."
if claude mcp add @modelcontextprotocol/server-brave-search --env BRAVE_API_KEY=BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s; then
    print_success "Brave Search Server installed"
else
    print_warning "Failed to install Brave Search Server"
fi
echo ""

# 3. Install Puppeteer Server
print_step "Installing Puppeteer Server..."
if claude mcp add @modelcontextprotocol/server-puppeteer; then
    print_success "Puppeteer Server installed"
else
    print_warning "Failed to install Puppeteer Server"
fi
echo ""

# Verification
echo "===================================="
echo "🔍 Verification"
echo "===================================="
echo ""

print_step "Listing installed MCP servers..."
claude mcp list || print_warning "Failed to list MCP servers"
echo ""

# Final message
echo "===================================="
print_success "Installation Complete!"
echo "===================================="
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop to load the new servers"
echo "2. Verify servers are working by checking available tools"
echo "3. Check logs if any server fails to start:"
echo "   Settings → Advanced → View Logs"
echo ""
echo "Configuration file location:"
echo "  ~/Library/Application Support/Claude/claude_desktop_config.json"
echo ""

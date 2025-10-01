# MCP Servers Initialization Commands

## Current MCP Configuration

Based on your Claude Desktop configuration, here are the initialization commands for your MCP servers:

## 🔧 Installation Commands

### 1. MCP Installer
```bash
claude mcp add @anaisbetts/mcp-installer
```

**Purpose:** MCP package installer and manager
**Command:** `npx @anaisbetts/mcp-installer`

---

### 2. Brave Search Server
```bash
claude mcp add @modelcontextprotocol/server-brave-search
```

**Purpose:** Web search via Brave Search API
**Command:** `npx @modelcontextprotocol/server-brave-search`
**Environment:** `BRAVE_API_KEY=BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s`

**To set environment variable:**
```bash
# Option 1: Set globally in config
claude mcp add @modelcontextprotocol/server-brave-search --env BRAVE_API_KEY=BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s

# Option 2: Set in shell
export BRAVE_API_KEY="BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s"
```

---

### 3. Puppeteer Server
```bash
claude mcp add @modelcontextprotocol/server-puppeteer
```

**Purpose:** Browser automation and web scraping
**Command:** `npx @modelcontextprotocol/server-puppeteer`

---

## 📋 Full Reinstall Script

If you need to reinstall all MCP servers from scratch:

```bash
#!/bin/bash
# MCP Servers Installation Script

echo "Installing MCP Servers..."

# 1. Install MCP Installer
echo "📦 Installing MCP Installer..."
claude mcp add @anaisbetts/mcp-installer

# 2. Install Brave Search Server
echo "🔍 Installing Brave Search Server..."
claude mcp add @modelcontextprotocol/server-brave-search --env BRAVE_API_KEY=BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s

# 3. Install Puppeteer Server
echo "🌐 Installing Puppeteer Server..."
claude mcp add @modelcontextprotocol/server-puppeteer

echo "✅ All MCP servers installed!"
```

Save this as `install_mcp_servers.sh` and run:
```bash
chmod +x install_mcp_servers.sh
./install_mcp_servers.sh
```

---

## 🔄 Verification Commands

After installation, verify with:

```bash
# List all installed MCP servers
claude mcp list

# Test Brave Search
# (Should show brave_web_search and brave_local_search tools)

# Test Puppeteer
# (Should show puppeteer_navigate, puppeteer_screenshot, etc. tools)
```

---

## 📝 Current Configuration File

Your configuration is stored at:
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

Current config:
```json
{
  "mcpServers": {
    "mcp-installer": {
      "command": "npx",
      "args": ["@anaisbetts/mcp-installer"]
    },
    "server-brave-search": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s"
      }
    },
    "server-puppeteer": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

---

## 🛠️ Additional MCP Servers (Optional)

If you want to add more servers mentioned in your SuperClaude framework:

### Context7 (Documentation)
```bash
claude mcp add @context7/mcp-server
```

### Sequential Thinking
```bash
# Note: This might be a custom server - check availability
claude mcp add @sequential/mcp-server
```

### Magic (UI Components)
```bash
# Note: This might be a custom server - check availability
claude mcp add @magic/mcp-server
```

### Vercel MCP (Already Connected)
Your Vercel MCP is already authenticated and working via the `mcp__vercel__*` tools.

### Stripe MCP (Already Connected)
Your Stripe MCP is already authenticated and working via the `mcp__stripe__*` tools.

---

## 🚨 Troubleshooting

### If a server fails to start:

1. **Check Node.js version:**
   ```bash
   node --version  # Should be v18+ or v20+
   ```

2. **Clear npx cache:**
   ```bash
   npx clear-npx-cache
   ```

3. **Reinstall the server:**
   ```bash
   claude mcp remove <server-name>
   claude mcp add <server-name>
   ```

4. **Check logs:**
   - Open Claude Desktop
   - Go to Settings → Advanced → View Logs
   - Look for MCP-related errors

---

## 📚 References

- [MCP Documentation](https://modelcontextprotocol.io/)
- [Brave Search API](https://brave.com/search/api/)
- [Puppeteer Documentation](https://pptr.dev/)

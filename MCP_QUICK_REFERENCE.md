# 🚀 MCP Servers Quick Reference

## Your Current MCP Servers

### 1️⃣ MCP Installer
- **Package:** `@anaisbetts/mcp-installer`
- **Purpose:** Install and manage MCP packages
- **Command:** `claude mcp add @anaisbetts/mcp-installer`

### 2️⃣ Brave Search
- **Package:** `@modelcontextprotocol/server-brave-search`
- **Purpose:** Web search and local business search
- **API Key:** `BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s`
- **Command:**
  ```bash
  claude mcp add @modelcontextprotocol/server-brave-search \
    --env BRAVE_API_KEY=BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s
  ```

### 3️⃣ Puppeteer
- **Package:** `@modelcontextprotocol/server-puppeteer`
- **Purpose:** Browser automation, screenshots, web scraping
- **Command:** `claude mcp add @modelcontextprotocol/server-puppeteer`

---

## 📦 Installation Methods

### Method 1: One-by-one (Manual)
```bash
# Install each server individually
claude mcp add @anaisbetts/mcp-installer
claude mcp add @modelcontextprotocol/server-brave-search --env BRAVE_API_KEY=BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s
claude mcp add @modelcontextprotocol/server-puppeteer
```

### Method 2: Automated Script
```bash
# Use the provided installation script
cd "/Users/dzhechkov/Downloads/Session 05"
./install_mcp_servers.sh
```

### Method 3: Manual Config Copy
```bash
# Copy the backup config to Claude settings
cp mcp_config_backup.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
# Then restart Claude Desktop
```

---

## 🔄 Common Commands

### List Servers
```bash
claude mcp list
```

### Remove Server
```bash
claude mcp remove <server-name>
```

### Update Server
```bash
claude mcp remove <server-name>
claude mcp add <server-name>
```

---

## 📁 Files Created

1. **MCP_INIT_COMMANDS.md** - Detailed installation guide
2. **install_mcp_servers.sh** - Automated installation script
3. **mcp_config_backup.json** - Full MCP configuration backup
4. **MCP_QUICK_REFERENCE.md** - This quick reference guide

---

## ✅ Verification

After installation:

1. **Restart Claude Desktop**

2. **Check available tools** - you should see:
   - `mcp__brave-search__brave_web_search`
   - `mcp__brave-search__brave_local_search`
   - `mcp__puppeteer__puppeteer_navigate`
   - `mcp__puppeteer__puppeteer_screenshot`
   - `mcp__puppeteer__puppeteer_click`
   - etc.

3. **View logs** if issues occur:
   - Claude Desktop → Settings → Advanced → View Logs

---

## 🌟 Additional MCP Servers (Already Connected)

You also have these MCP servers active:

- ✅ **Vercel** - Deployment management (`mcp__vercel__*`)
- ✅ **Stripe** - Payment processing (`mcp__stripe__*`)
- ✅ **Context7** - Documentation lookup (`mcp__context7__*`)

---

## 🆘 Troubleshooting

### Server not starting?
```bash
# Clear npx cache
npx clear-npx-cache

# Reinstall
claude mcp remove <server-name>
claude mcp add <server-name>
```

### Node.js version issues?
```bash
# Check version (need 18+)
node --version

# Upgrade if needed
brew install node@20
```

### Config file location
```
~/Library/Application Support/Claude/claude_desktop_config.json
```

# 🔧 Исправленные команды MCP

## ❌ Старый (неправильный) синтаксис:
```bash
claude mcp add @modelcontextprotocol/server-puppeteer
```

## ✅ Правильный синтаксис:

### Формат команды:
```bash
claude mcp add <name> <commandOrUrl> [args...]
```

---

## 📦 Правильные команды для установки:

### 1. MCP Installer
```bash
claude mcp add mcp-installer npx @anaisbetts/mcp-installer
```

### 2. Brave Search (с переменной окружения)
```bash
claude mcp add brave-search npx @modelcontextprotocol/server-brave-search
```

**Затем добавьте API ключ через конфиг:**
```bash
# Откройте конфиг
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Добавьте env в секцию brave-search:
"brave-search": {
  "command": "npx",
  "args": ["@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s"
  }
}
```

### 3. Puppeteer
```bash
claude mcp add puppeteer npx @modelcontextprotocol/server-puppeteer
```

---

## 🚀 Полная установка (копировать целиком):

```bash
# 1. MCP Installer
claude mcp add mcp-installer npx @anaisbetts/mcp-installer

# 2. Brave Search
claude mcp add brave-search npx @modelcontextprotocol/server-brave-search

# 3. Puppeteer
claude mcp add puppeteer npx @modelcontextprotocol/server-puppeteer

echo "✅ Все серверы установлены!"
echo "⚠️  Не забудьте добавить BRAVE_API_KEY в конфиг вручную"
```

---

## 📝 Альтернатива: Использование JSON

Вы также можете добавить сервер через JSON:

```bash
claude mcp add-json puppeteer '{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-puppeteer"]
}'
```

С environment переменными:
```bash
claude mcp add-json brave-search '{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s"
  }
}'
```

---

## 🔍 Проверка установленных серверов:

```bash
# Список всех серверов
claude mcp list

# Детали конкретного сервера
claude mcp get puppeteer
claude mcp get brave-search
```

---

## 🛠️ Импорт из Claude Desktop:

Если у вас уже настроены серверы в Claude Desktop:

```bash
claude mcp add-from-claude-desktop
```

Это автоматически импортирует все серверы из вашего `claude_desktop_config.json`!

---

## 📋 Обновлённый скрипт установки:

```bash
#!/bin/bash
echo "🚀 Installing MCP Servers..."

# Install servers
claude mcp add mcp-installer npx @anaisbetts/mcp-installer
claude mcp add brave-search npx @modelcontextprotocol/server-brave-search
claude mcp add puppeteer npx @modelcontextprotocol/server-puppeteer

# Set Brave API key via JSON
claude mcp add-json brave-search '{
  "command": "npx",
  "args": ["@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "BSAQG0Gbqt4gRKPaAbLGRXlN7ayxM5s"
  }
}'

echo "✅ Installation complete!"
claude mcp list
```

---

## 💡 Полезные команды:

```bash
# Удалить сервер
claude mcp remove puppeteer

# Сбросить выбор проектов
claude mcp reset-project-choices

# Запустить MCP сервер Claude Code
claude mcp serve
```

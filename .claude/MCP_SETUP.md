# MCP (Model Context Protocol) Configuration for Claude Code

This directory contains the MCP configuration for Claude Code to connect to various services and tools.

## Configuration File Location

The MCP configuration is stored in `.claude/mcp.json` in your project directory.

## Configured MCP Servers

### 1. Brave Search (`@modelcontextprotocol/server-brave-search`)
- **Purpose**: Web search capabilities using Brave Search API
- **Required Environment Variable**: `BRAVE_API_KEY`
- **Get API Key**: https://brave.com/search/api/
- **Features**: Web search, image search, news search, video search

### 2. Stripe (`@stripe/mcp`)
- **Purpose**: Stripe payment processing integration
- **Required Environment Variable**: `STRIPE_API_KEY` (your Stripe secret key)
- **Get API Key**: https://dashboard.stripe.com/apikeys
- **Features**: Payment processing, customer management, subscription handling

### 3. Context7 (`@upstash/context7-mcp`)
- **Purpose**: Library documentation and code examples
- **Required Environment Variables**:
  - `UPSTASH_REDIS_REST_URL`: Your Upstash Redis REST URL
  - `UPSTASH_REDIS_REST_TOKEN`: Your Upstash Redis REST token
- **Get Credentials**: https://upstash.com/
- **Features**: Access to up-to-date library documentation, code snippets

### 4. Vercel v0 (`@gptj/vercel-v0-mcp`)
- **Purpose**: Integration with Vercel's v0 AI-powered development platform
- **Required Environment Variable**: `V0_ACCESS_TOKEN`
- **Get Access Token**: https://v0.dev/settings
- **Features**: AI-powered UI generation, code examples

## Setup Instructions

1. **Replace API Keys**: Open `.claude/mcp.json` and replace all placeholder values:
   - Replace `YOUR_BRAVE_API_KEY_HERE` with your actual Brave API key
   - Replace `YOUR_STRIPE_SECRET_KEY_HERE` with your Stripe secret key
   - Replace `YOUR_UPSTASH_REDIS_URL_HERE` with your Upstash Redis REST URL
   - Replace `YOUR_UPSTASH_REDIS_TOKEN_HERE` with your Upstash Redis REST token
   - Replace `YOUR_V0_ACCESS_TOKEN_HERE` with your v0 access token

2. **Verify NPX is Available**: Ensure you have Node.js and npm installed:
   ```bash
   node --version
   npm --version
   ```

3. **Test Individual Servers** (optional):
   ```bash
   # Test Brave Search (requires API key)
   BRAVE_API_KEY=your_key npx -y @modelcontextprotocol/server-brave-search
   
   # Test Stripe (requires API key)
   STRIPE_API_KEY=your_key npx -y @stripe/mcp --tools=all
   
   # Test Context7 (requires Upstash credentials)
   UPSTASH_REDIS_REST_URL=your_url UPSTASH_REDIS_REST_TOKEN=your_token npx -y @upstash/context7-mcp
   
   # Test Vercel v0 (requires access token)
   V0_ACCESS_TOKEN=your_token npx -y @gptj/vercel-v0-mcp
   ```

4. **Restart Claude Code**: After updating the configuration, restart Claude Code for changes to take effect.

## Troubleshooting

### If servers don't load:
1. Check that all API keys are correctly set
2. Ensure the `.claude/mcp.json` file is valid JSON (use a JSON validator)
3. Check Claude Code logs for any error messages
4. Verify that npm/npx is accessible from your PATH

### Package Installation Issues:
- The `npx -y` flag automatically installs packages if not present
- If you encounter permission issues, you might need to configure npm permissions
- For corporate environments, ensure npm registry access is not blocked

## Security Notes

⚠️ **IMPORTANT**: Never commit the `.claude/mcp.json` file with real API keys to version control!

Consider using environment variables or a separate `.env` file for sensitive credentials. Add `.claude/mcp.json` to your `.gitignore`:

```gitignore
# MCP configuration with sensitive keys
.claude/mcp.json
```

## Alternative: Using Environment Variables

Instead of hardcoding keys in `mcp.json`, you can reference system environment variables:
1. Set environment variables in your shell profile or `.env` file
2. The MCP servers will automatically pick them up if named correctly

## Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Claude Code MCP Guide](https://docs.claude.com/en/docs/claude-code/mcp)
- [MCP Server Registry](https://mcpservers.org/)
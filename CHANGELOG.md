# Changelog

All notable changes to QA Orchestra will be documented in this file.

## [1.0.0] - 2025-04-12

### Added
- 10 specialized QA agents: orchestrator, environment-manager, functional-reviewer, test-scenario-designer, browser-validator, automation-writer, manual-validator, bug-reporter, release-analyzer, smart-test-selector
- Output chaining via `qa-output/` directory
- Plugin support via `.claude-plugin/plugin.json` and `marketplace.json`
- `context/CONTEXT.md` template for stack-agnostic project configuration
- Example context file at `examples/CONTEXT.example.md`
- Browser validation workflow via Chrome DevTools MCP
- MCP server template at `examples/mcp.example.json`
- Full documentation in `docs/`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# MANDATORY AGENT BEHAVIOR RULES

1. **NEVER ASSUME — ASK FIRST**: 
   - Never guess or make assumptions about field names, requirements, column mappings, or intent.
   - If there is any ambiguity, ask the user for clarification before modifying any code.
   - Stop and confirm before making architectural or schema alterations.

2. **PRESERVE EXISTING DATA & FIELD DISTINCTIONS**:
   - Never confuse new fields with existing columns (e.g. Column 27 vs new clearance issues vs progress remarks vs tender info).
   - Keep each field completely independent unless explicitly asked to merge.

3. **TOKEN & EXECUTION CONCISION**:
   - Be concise and direct. Do not generate unnecessary filler text.

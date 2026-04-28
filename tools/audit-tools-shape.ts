#!/usr/bin/env bun
/**
 * audit-tools-shape — meta-linter enforcing tools/ convention checklist.
 *
 * Reads tools/*.ts (skipping tools/lib/*.ts and *.test.ts) and verifies
 * each conforms to the conventions in the tools-roadmap spec §2.g:
 *
 *   1. Has shebang #!/usr/bin/env bun
 *   2. Imports parseArgs from node:util
 *   3. Every console.* call has a preceding `// biome-ignore lint/suspicious/noConsole: CLI script` line
 *   4. Has a colocated tools/<name>.test.ts
 *   5. Has a header doc comment mentioning "exit codes" (case-insensitive)
 *
 * Exit codes:
 *   0 - all tools compliant
 *   1 - one or more tools non-compliant
 *   2 - tools/ directory unreadable or other input error
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = resolve(__dirname, '..')

interface ToolCheck {
  file: string
  failures: string[]
}

const BIOME_IGNORE_LITERAL = '// biome-ignore lint/suspicious/noConsole: CLI script'

function listToolFiles(toolsDir: string): string[] {
  const entries = readdirSync(toolsDir, { withFileTypes: true })
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.ts') && !e.name.endsWith('.test.ts'))
    .map((e) => e.name)
}

function checkTool(toolsDir: string, fileName: string): ToolCheck {
  const filePath = join(toolsDir, fileName)
  const content = readFileSync(filePath, 'utf8')
  const failures: string[] = []

  // 1. shebang
  if (!content.startsWith('#!/usr/bin/env bun')) {
    failures.push(`missing shebang (expected first line: #!/usr/bin/env bun)`)
  }

  // 2. parseArgs import
  if (!/from\s+['"]node:util['"]/.test(content) || !/parseArgs/.test(content)) {
    failures.push(`does not import parseArgs from node:util`)
  }

  // 3. console calls preceded by biome-ignore
  const lines = content.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    if (/\bconsole\.(log|error|warn|info|debug|trace)\b/.test(line)) {
      const prevLine = (lines[i - 1] ?? '').trim()
      if (!prevLine.includes(BIOME_IGNORE_LITERAL)) {
        failures.push(
          `line ${i + 1}: console call missing preceding biome-ignore: "${BIOME_IGNORE_LITERAL}"`,
        )
      }
    }
  }

  // 4. colocated test
  const testFile = fileName.replace(/\.ts$/, '.test.ts')
  if (!existsSync(join(toolsDir, testFile))) {
    failures.push(`missing colocated test file: ${testFile}`)
  }

  // 5. exit-code doc comment
  if (!/\/\*\*[\s\S]*?exit codes[\s\S]*?\*\//i.test(content)) {
    failures.push(`missing header doc comment documenting exit codes`)
  }

  return { file: fileName, failures }
}

function main(): void {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      root: { type: 'string', default: DEFAULT_ROOT },
    },
  })

  const root = resolve(values.root ?? DEFAULT_ROOT)
  const toolsDir = join(root, 'tools')

  if (!existsSync(toolsDir)) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error(`tools/ directory not found at ${toolsDir}`)
    process.exit(2)
  }

  let toolFiles: string[]
  try {
    toolFiles = listToolFiles(toolsDir)
  } catch (e) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error(`could not read ${toolsDir}: ${(e as Error).message}`)
    process.exit(2)
  }

  if (toolFiles.length === 0) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.log('no tools to audit')
    process.exit(0)
  }

  let totalFailures = 0
  for (const fileName of toolFiles) {
    const result = checkTool(toolsDir, fileName)
    if (result.failures.length === 0) {
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.log(`${result.file}  OK`)
    } else {
      totalFailures += result.failures.length
      // biome-ignore lint/suspicious/noConsole: CLI script
      console.error(`${result.file}  FAIL`)
      for (const f of result.failures) {
        // biome-ignore lint/suspicious/noConsole: CLI script
        console.error(`  - ${f}`)
      }
    }
  }

  if (totalFailures > 0) {
    // biome-ignore lint/suspicious/noConsole: CLI script
    console.error(`\n${totalFailures} convention failure(s) across ${toolFiles.length} tool(s)`)
    process.exit(1)
  }

  // biome-ignore lint/suspicious/noConsole: CLI script
  console.log(`\nAll ${toolFiles.length} tool(s) conform.`)
}

main()

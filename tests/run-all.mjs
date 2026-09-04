// dsh-chatgpt-subscription — 全量测试入口
// 用法：node tests/run-all.mjs（或 npm test）
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const files = [
  'test-alpha4-client-contract.mjs',
  'test-codex-host.js',
  'test-localization.mjs',
]

let allPass = true
for (const f of files) {
  console.log(`\n=== ${f} ===`)
  const res = spawnSync(process.execPath, [join(root, 'tests', f)], { stdio: 'inherit', cwd: root })
  if (res.status !== 0) allPass = false
}

console.log('\n' + (allPass ? '全量测试全部通过' : '存在失败用例'))
process.exit(allPass ? 0 : 1)

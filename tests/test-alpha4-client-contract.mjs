import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const patchPath = join(root, pkg.dsh.bundle.patch)
const source = readFileSync(join(root, 'src', 'client-bundle.js'), 'utf8')
const artifact = readFileSync(join(root, 'lib', 'client.js'), 'utf8')

const retiredRuntime = ['@deepseek-ai', 'dsh-client-' + 'runtime'].join('/')
assert.deepEqual(pkg.dsh.client.inject, [], 'plugin-page configuration must not load legacy global-settings modules')
assert.ok(!pkg.dsh.client.inject.includes(retiredRuntime), 'retired client runtime must not be injected')
assert.ok(existsSync(patchPath), 'bundle patch must exist')
assert.ok(existsSync(join(root, pkg.main)), 'host entry must exist')
assert.match(readFileSync(patchPath, 'utf8'), /- insert:/)

assert.match(source, /inject:\s*\['slots'\]/, 'client must wait on the public slots service')
assert.doesNotMatch(source, /slots\.inject\('settings\.section'/, 'global settings section must not be registered')
assert.match(source, /slots\.inject\('plugins\.bundle\.config'/, 'plugin configuration slot must remain registered')
assert.match(source, /key:\s*'dsh-chatgpt-subscription'/, 'plugin configuration key must match bundle name')
assert.match(source, /require\('react'\)/, 'React must stay an external client module')
assert.match(artifact, /window\.__ModuleLoader__\.load/, 'built client must use the DSH module loader')
assert.match(artifact, /require\('react'\)/, 'built client must retain external React loading')

console.log('alpha.4 client contract OK (plugin configuration + React)')

// ---------- 插件配置页风格：与 dsh-bottom-info-bar 的设置面板对齐 DSH 原生插件详情页 ----------
// 约定（锁死回归，取自同页原生区块 X_2TxG_sectionHead / X_2TxG_row / Button.module.css .sm）：
//   扁平列表 + .5px 细分隔线 + 12px 行留白；区块标题 15/600/22；行标题 14/400/22；次要说明 12/18；
//   按钮取宿主原生小号胶囊（h28 / r14 / 12px / 0 10px）；区块间距 32px。
//   一律走 --dsw-alias-* 令牌，禁止退回内联样式的卡片式（边框 + 圆角 + 深色底）。
assert.match(source, /function installStyles\(\)/, 'client must install a stylesheet instead of inline card styles')
assert.match(source, /style\.dataset\.pluginCss = id/, 'stylesheet injection must be idempotent via data-plugin-css')
assert.match(source, /\.cgpt-page \{[^}]*max-width: 760px;/, 'page width must match the info-bar settings panel (760px)')
assert.match(source, /\.cgpt-page \{[^}]*gap: 32px;/, 'section gap must match the native detailSections (32px)')
assert.match(source, /\.cgpt-head \{ display: flex; flex-direction: column; width: 100%; min-width: 0; \}/, 'title and intro must be one block so the 32px gap only separates sections')
assert.match(source, /\.cgpt-title \{[^}]*font-size: 15px; font-weight: 600; line-height: 22px;/, 'block title must use the native preset-settings-title scale (15/600/22)')
assert.match(source, /\.cgpt-row \{[^}]*padding: 12px 0; border-bottom: 0\.5px solid var\(--dsw-alias-border-l2\);/, 'rows must use the native 12px rhythm and .5px divider')
assert.match(source, /\.cgpt-rowTitle \{[^}]*font-size: 14px; font-weight: 400; line-height: 22px;/, 'row title must match the measured native row scale (14/400/22)')
assert.match(source, /\.cgpt-rowDesc \{[^}]*font-size: 12px; line-height: 18px; color: var\(--dsw-alias-label-secondary\)/, 'row description must use the native 12/18 secondary scale')
assert.match(source, /\.cgpt-btn \{[^}]*display: inline-flex; align-items: center; justify-content: center; height: 28px; border: 0\.5px solid var\(--dsw-alias-border-l3\)[^}]*border-radius: 14px; padding: 0 10px; font-size: 12px; font-weight: 400;/, 'buttons must use the native small capsule geometry')
assert.match(source, /\.cgpt-btn--primary \{[^}]*background: var\(--dsw-alias-label-primary\); color: var\(--dsw-alias-bg-layer-3\);/, 'primary button must use the native settings-form fill')
assert.match(source, /@media \(prefers-reduced-motion: reduce\)/, 'motion must respect the reduced-motion preference')
assert.doesNotMatch(source, /cardStyle|btnPrimary|btnSecondary|btnDanger/, 'the inline card style objects must be gone')
assert.doesNotMatch(source, /style:\s*\{/, 'no inline style props may remain in the page component')
// 部署产物必须包含同一份样式（lib 已入库，构建后不得滞后）
assert.match(artifact, /cgpt-row \{/, 'built client must carry the native row rule')
assert.match(artifact, /cgpt-btn \{/, 'built client must carry the native button rule')

console.log('plugin page style contract OK (native flat list + native control geometry)')

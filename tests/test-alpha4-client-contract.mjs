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

// ---------- 插件配置页风格：与 dsh-bottom-info-bar 的设置面板对齐 DSH 原生设置页 ----------
// 约定（锁死回归）：
//   扁平列表 + .5px 细分隔线；标题 14/20、次要说明 12/18；
//   控件取宿主 primitives 的 .input / SettingsForm .save 尺寸（r8 / 13px / 5px 14px）；
//   一律走 --dsw-alias-* 令牌，禁止退回内联样式的卡片式（边框 + 圆角 + 深色底）。
assert.match(source, /function installStyles\(\)/, 'client must install a stylesheet instead of inline card styles')
assert.match(source, /style\.dataset\.pluginCss = id/, 'stylesheet injection must be idempotent via data-plugin-css')
assert.match(source, /\.cgpt-page \{[^}]*max-width: 760px;/, 'page width must match the info-bar settings panel (760px)')
assert.match(source, /\.cgpt-title \{[^}]*font-size: 18px; font-weight: 600; line-height: 26px;/, 'page title must use the native heading scale')
assert.match(source, /\.cgpt-row \{[^}]*padding: 16px 0; border-bottom: 0\.5px solid var\(--dsw-alias-border-l2\);/, 'rows must use the native .5px divider and 16px rhythm')
assert.match(source, /\.cgpt-rowTitle \{[^}]*font-size: 14px; font-weight: 400; line-height: 22px;/, 'row title must match the measured native row scale (14/400/22)')
assert.match(source, /\.cgpt-rowDesc \{[^}]*font-size: 12px; line-height: 18px; color: var\(--dsw-alias-label-secondary\)/, 'row description must use the native 12/18 secondary scale')
assert.match(source, /\.cgpt-btn \{[^}]*border: 0\.5px solid var\(--dsw-alias-border-l3\)[^}]*border-radius: 8px; padding: 5px 14px; font-size: 13px; font-weight: 500;/, 'buttons must use the native settings-form geometry')
assert.match(source, /\.cgpt-btn--primary \{[^}]*background: var\(--dsw-alias-label-primary\); color: var\(--dsw-alias-bg-layer-3\);/, 'primary button must use the native settings-form fill')
assert.match(source, /@media \(prefers-reduced-motion: reduce\)/, 'motion must respect the reduced-motion preference')
assert.doesNotMatch(source, /cardStyle|btnPrimary|btnSecondary|btnDanger/, 'the inline card style objects must be gone')
assert.doesNotMatch(source, /style:\s*\{/, 'no inline style props may remain in the page component')
// 部署产物必须包含同一份样式（lib 已入库，构建后不得滞后）
assert.match(artifact, /cgpt-row \{/, 'built client must carry the native row rule')
assert.match(artifact, /cgpt-btn \{/, 'built client must carry the native button rule')

console.log('plugin page style contract OK (native flat list + native control geometry)')

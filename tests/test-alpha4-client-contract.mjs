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
// 约定（锁死回归，取自同页原生的 X_2TxG_sectionHead / X_2TxG_rows / X_2TxG_row / X_2TxG_rowId /
// Button.module.css .sm，2026-09-22 在真机页面逐项量过）：
//   区块间距 32px、区块内部 12px、区块头基线对齐 + 10px 且 **padding 0**；
//   区块标题 14/500/20；行 = padding 12px 2px + .5px 下边线（末行无线）、无圆角、无负外边距；
//   行标题 13.5/500/20；行说明 12/18 三级色；区块说明 13/20 二级色；
//   按钮取宿主原生小号胶囊（h28 / r14 / 12px / 0 10px）。
//   【对齐铁律】配置区挂载点 .X_2TxG_detailSection 实测 x=323.2、padding:0，宿主自己的区块标题
//   也落在 323.2；所以我们的内容块**一律不能自带左右内边距**，否则整体错位 8px。
//   一律走 --dsw-alias-* 令牌，禁止退回内联样式的卡片式（边框 + 圆角 + 深色底）。
assert.match(source, /function installStyles\(\)/, 'client must install a stylesheet instead of inline card styles')
assert.match(source, /style\.dataset\.pluginCss = id/, 'stylesheet injection must be idempotent via data-plugin-css')
assert.match(source, /\.cgpt-page \{[^}]*max-width: 100%;/, 'page width cap must be left to the host (.X_2TxG_page > * already pins min(100%, 960px))')
assert.doesNotMatch(source, /\.cgpt-page \{[^}]*max-width: 760px/, 'page must not hard-cap its width at 760px (it narrows the content against the host and leaves the right edge unreachable)')
assert.match(source, /\.cgpt-page \{[^}]*gap: 32px;/, 'section gap must match the native detailSections (32px)')
assert.match(source, /\.cgpt-section \{ display: flex; flex-direction: column; gap: 12px;/, 'section internals must match the native detailSection (12px)')
// 区块头照原生 sectionHead：基线对齐 + 10px 间距 + 零内边距，标题 14/500/20
assert.match(source, /\.cgpt-sectionHead \{ display: flex; align-items: baseline; gap: 10px;[^}]*padding: 0;/, 'section head must use the native baseline alignment, 10px gap and zero padding')
assert.match(source, /\.cgpt-title \{[^}]*font-size: 14px; font-weight: 500; line-height: 20px;/, 'section title must use the native sectionTitle scale (14/500/20)')
assert.match(source, /\.cgpt-intro \{[^}]*padding: 0;[^}]*font-size: 13px; line-height: 20px;/, 'section intro must use the native pageIntro scale (13/20) with zero padding')
// 行 = 原生 .X_2TxG_row：12px 2px + .5px 下边线（末行无线），不是插件列表的 card 几何
assert.match(source, /\.cgpt-list \{ display: flex; flex-direction: column; gap: 0;/, 'row list must match the native .rows container (gap 0)')
assert.match(source, /\.cgpt-row \{[^}]*padding: 12px 2px; border: 0; border-bottom: 0\.5px solid var\(--dsw-alias-border-l2/, 'rows must use the native .row geometry (12px 2px + .5px bottom rule)')
assert.match(source, /\.cgpt-row:last-child \{ border-bottom: 0; \}/, 'the last row must drop its rule like the native .row:last-child')
assert.doesNotMatch(source, /\.cgpt-row \{[^}]*margin: 0 -8px/, 'rows must not use the card negative margin (it gets clipped by the collapse container)')
assert.match(source, /\.cgpt-rowTitle \{[^}]*font-size: 13\.5px; font-weight: 500; line-height: 20px;/, 'row title must match the measured native rowId scale (13.5/500/20)')
assert.match(source, /\.cgpt-rowDesc \{[^}]*font-size: 11\.5px; line-height: 16px; color: var\(--dsw-alias-label-tertiary\)/, 'row description must match the native .X_2TxG_rowModule scale (11.5/16 tertiary)')
// 横向对齐铁律：内容块不得自带左右内边距
assert.doesNotMatch(source, /\.cgpt-(?:sectionHead|intro|note|alerts) \{[^}]*padding: 0 8px/, 'content blocks must not add their own 8px horizontal padding (it misaligns everything against the host)')
// 错误/警示照原生 failure / banner 形态，而不是把「错误」单占一行再甩出正文
assert.match(source, /\.cgpt-alert--error \{[^}]*display: flex; align-items: center; gap: 10px; color: var\(--dsw-alias-state-error-primary[^}]*overflow-wrap: anywhere; white-space: pre-wrap;/, 'error must use the native failure/reason form')
assert.match(source, /\.cgpt-alert--warning \{[^}]*background: color-mix\(in srgb, var\(--dsw-alias-state-warning-primary[^}]*border-radius: 10px; padding: 8px 12px;/, 'warning must use the native banner form')
assert.match(source, /\.cgpt-btn \{[^}]*display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 28px; border: 0\.5px solid var\(--dsw-alias-border-l3\)[^}]*border-radius: 14px; padding: 0 10px; font-size: 12px; font-weight: 400;/, 'buttons must use the native small capsule geometry as a fallback')
assert.match(source, /\.cgpt-btn--primary \{[^}]*background: var\(--dsw-alias-button-primary-fill, var\(--dsw-alias-label-primary\)\); color: var\(--dsw-alias-label-primary-foreground, #fff\);/, 'primary button must use the native button token family')
assert.match(source, /@media \(prefers-reduced-motion: reduce\)/, 'motion must respect the reduced-motion preference')
assert.doesNotMatch(source, /cardStyle|btnPrimary|btnSecondary|btnDanger/, 'the inline card style objects must be gone')
assert.doesNotMatch(source, /style:\s*\{/, 'no inline style props may remain in the page component')
// 原生组件接入：宿主 primitives 存在时必须走原生 Button/Switch/Tag/StateDot，缺成员时降级
assert.match(source, /require\('@deepseek-ai\/dsh-client-ui-primitives'\)/, 'client must try to load the host primitives')
assert.match(source, /var NativeButton = native\('Button'\)/, 'native Button must be resolved through a safety-checked accessor')
// 状态指示不再用宿主 Tag/StateDot（其几何与 28px 按钮不等高，同屏三个高度）——
// 改为与按钮同一套几何的自绘状态药丸，这里锁定该约束。
assert.doesNotMatch(source, /native\('Tag'\)|native\('StateDot'\)/, 'status pill must not use host Tag/StateDot (unequal height against 28px buttons)')
assert.match(source, /\.cgpt-statusPill \{[^}]*height: 28px; border-radius: 14px; padding: 0 10px; font-size: 12px;/, 'status pill must share the exact button geometry (28px/14px/10px/12px)')
assert.doesNotMatch(source, /cgptStatusTag|cgptStateDot/, 'legacy tag/dot helpers must be gone')
assert.doesNotMatch(source, /React\.createElement\(PRIMITIVES\./, 'primitives members must never be passed to createElement unguarded (React #130)')
// 部署产物必须包含同一份样式（lib 已入库，构建后不得滞后）
assert.match(artifact, /cgpt-row \{/, 'built client must carry the native row rule')
assert.match(artifact, /cgpt-btn \{/, 'built client must carry the native button rule')

console.log('plugin page style contract OK (native detail-page metrics + host primitives)')

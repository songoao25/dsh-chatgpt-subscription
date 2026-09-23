// dsh-chatgpt-subscription — 插件描述的中英双语契约
// 覆盖两条描述通路：
//   1) 插件列表卡片 —— DSH readPluginMeta 读 locale/{en,zh}.json 的 meta（title + description）
//   2) 插件详情页顶部 —— 本插件 client bundle 的 plugins.bundle.config summary 视图，按 ctx.locale 取值
// 另锁「文案去 AI 味」：无破折号、无感叹号、无「一键/丝滑/seamless」这类营销词。
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const readJson = (relative) => JSON.parse(readFileSync(join(root, relative), 'utf8'))

// ---------- 1. locale 文件：DSH 内置语言只有 zh / en，两侧必须一一对应 ----------
assert.deepEqual(readdirSync(join(root, 'locale')).sort(), ['en.json', 'zh.json'],
  'locale/ must carry exactly the two DSH built-in languages (zh, en)')
const en = readJson('locale/en.json')
const zh = readJson('locale/zh.json')
assert.deepEqual(Object.keys(en.meta).sort(), Object.keys(zh.meta).sort(),
  'en/zh meta must declare the same fields')
assert.deepEqual(Object.keys(en.meta).sort(), ['description', 'title'],
  'plugin metadata carries a title and a description')
for (const [lang, meta] of [['en', en.meta], ['zh', zh.meta]]) {
  for (const field of ['title', 'description']) {
    assert.equal(typeof meta[field], 'string', lang + '.' + field + ' must be a string')
    assert.ok(meta[field].trim() !== '', lang + '.' + field + ' must not be blank')
  }
}
assert.notEqual(en.meta.title, zh.meta.title, 'the two languages must not ship the same title')
assert.notEqual(en.meta.description, zh.meta.description, 'the two languages must not ship the same description')

// ---------- 2. package.json 接线：exports 不放行，readPluginMeta 就解析不到 locale 文件 ----------
assert.equal(pkg.exports['./locale/*.json'], './locale/*.json',
  'exports must expose ./locale/*.json (readPluginMeta resolves the dictionary through the exports map)')
assert.ok(pkg.files.includes('locale/*.json'), 'the published tarball must include locale/*.json')
assert.equal(pkg.description, en.meta.description,
  'package.json description is the English fallback and must equal locale/en.json meta.description')

// ---------- 3. 文案去 AI 味 ----------
const AI_SMELL_ZH = /一键|轻松|极致|丝滑|强大|完美|立即|马上|告别|无需|不再/
const AI_SMELL_EN = /seamless|effortless|powerful|unleash|revolutionary|game.?chang|supercharge|simply|just /i
const AI_SMELL_SHARED = /[—–]|--|[!！]|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u
for (const [lang, meta] of [['en', en.meta], ['zh', zh.meta]]) {
  const copy = meta.title + ' ' + meta.description
  assert.doesNotMatch(copy, AI_SMELL_SHARED, lang + ' copy must not use dashes, exclamation or emoji')
  assert.doesNotMatch(meta.description, lang === 'zh' ? AI_SMELL_ZH : AI_SMELL_EN,
    lang + ' description must stay free of marketing filler')
}
assert.ok(en.meta.description.length <= 170, 'English description must stay card-sized')
assert.ok(zh.meta.description.length <= 80, '中文描述保持卡片长度')

// ---------- 4. 运行时：详情页顶部与列表标题随 DSH 语言切换 ----------
const artifact = readFileSync(join(root, 'lib', 'client.js'), 'utf8')
assert.match(artifact, /plugins\.bundle\.config/, 'built client must remain the description source for the detail page')
assert.ok(artifact.includes(en.meta.description), 'built client must carry the English description (rebuild lib/)')
assert.ok(artifact.includes(zh.meta.description), 'built client must carry the Chinese description (rebuild lib/)')

// React 替身：只需支撑本组件的 hook 与 createElement
const React = {
  createElement: function (tag, props) {
    return { tag, props: props || {}, children: Array.prototype.slice.call(arguments, 2) }
  },
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useCallback: (fn) => fn,
  useEffect: () => {},
  useRef: (value) => ({ current: value }),
}
const documentStub = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, textContent: '' }),
  head: { appendChild: () => {} },
}
const sandbox = {
  window: { navigator: { languages: ['zh-CN'] }, setTimeout, clearTimeout },
  document: documentStub,
  console,
}
sandbox.window.__ModuleLoader__ = { load: (mod) => { sandbox.loaded = mod } }
vm.createContext(sandbox)
vm.runInContext(artifact, sandbox)
assert.equal(sandbox.loaded.id, 'dsh-chatgpt-subscription', 'client module id must stay the bundle name')

// DSH 的 resolveText 语义：{en, zh} 按当前语言回退链取值
function localeFor(active) {
  const chains = { zh: ['zh', 'en'], en: ['en'] }
  return {
    resolveText(text) {
      if (typeof text === 'string') return text
      return chains[active].reduceRight((resolved, locale) => text[locale] ?? resolved, text.en)
    },
  }
}
function textsOf(node, sink) {
  const out = sink || []
  if (typeof node === 'string') out.push(node)
  else if (typeof node === 'function') textsOf(node(node.props), out) // 函数组件：替身里直接展开
  else if (node && typeof node.tag === 'function') textsOf(node.tag(node.props), out)
  else if (node && node.children) for (const child of node.children) textsOf(child, out)
  return out
}
async function render(options) {
  const registry = {}
  const ctx = {
    slots: {
      inject: (name, callback) => { callback(); return () => {} },
      register: (entry, component) => { registry.entry = entry; registry.component = component; return () => {} },
    },
  }
  if (options.locale) ctx.locale = localeFor(options.locale)
  if (options.languages) sandbox.window.navigator = { languages: options.languages }
  await sandbox.loaded.factory((name) => {
    if (name === 'react') return React
    throw new Error('unexpected module request: ' + name)
  }).apply(ctx)
  assert.equal(typeof registry.component, 'function', 'configuration entry must register through the slot')
  return {
    label: registry.entry.label(),
    summary: textsOf(registry.component({ view: 'summary' })).join(''),
    page: textsOf(registry.component({ view: 'page' })).join(' '),
  }
}

const zhRender = await render({ locale: 'zh' })
assert.equal(zhRender.summary, zh.meta.description, 'Chinese locale must render the Chinese description')
assert.equal(zhRender.label, zh.meta.title, 'Chinese locale must render the Chinese title')
assert.ok(zhRender.page.includes(zh.meta.title), 'the page section head follows the active language')

const enRender = await render({ locale: 'en' })
assert.equal(enRender.summary, en.meta.description, 'English locale must render the English description')
assert.equal(enRender.label, en.meta.title, 'English locale must render the English title')
assert.ok(enRender.page.includes(en.meta.title), 'the page section head follows the active language')

// locale 服务缺席时按浏览器语言兜底，最后退英文
const fallbackEn = await render({ languages: ['en-US', 'en'] })
assert.equal(fallbackEn.summary, en.meta.description, 'without the locale service the browser language decides')
const fallbackZh = await render({ languages: ['zh-CN'] })
assert.equal(fallbackZh.summary, zh.meta.description, 'zh-CN must fall back to the zh copy')

console.log('bilingual plugin description contract OK (locale files + detail page copy)')

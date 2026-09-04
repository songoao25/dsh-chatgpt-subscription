import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import fixture from './locale-fixture.cjs'
import { createHostTranslator, localizeHostText } from '../src/host-locale.js'

const { dictionaries, createLocale } = fixture
assert.deepEqual(Object.keys(dictionaries.zh).sort(), Object.keys(dictionaries.en).sort())
for (const key of Object.keys(dictionaries.zh)) {
  const parameters = value => (value.match(/\{\w+\}/g) || []).sort()
  assert.deepEqual(parameters(dictionaries.zh[key]), parameters(dictionaries.en[key]), key)
}
const source = readFileSync(new URL('../src/client-bundle.js', import.meta.url), 'utf8')
const host = readFileSync(new URL('../src/host.js', import.meta.url), 'utf8')
for (const match of (source + host).matchAll(/\bt\('([^']+)'/g)) {
  assert.ok(Object.hasOwn(dictionaries.zh, match[1]), match[1])
}
// Localization does not fix the independent mutating-RPC method/popup bugs.
assert.match(source, /rpc\('startCodexOAuth'\)/)
assert.match(source, /rpc\('unbindCodex'\)/)
assert.match(source, /if \(res\.authorizeUrl\) window\.open\(res\.authorizeUrl, '_blank'\)/)

let states = [null, false]
let index = 0
let plugin, component, options
const React = {
  createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
  useState(initial) { const i = index++; return [i < states.length ? states[i] : initial, value => { states[i] = value }] },
  useRef: value => ({ current: value }), useCallback: fn => fn, useEffect() {},
}
const locale = createLocale('zh')
const slots = {
  inject: (_, register) => register(),
  register(value, body) { options = value; component = body; return () => {} },
}
vm.runInNewContext(readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8'), {
  window: { __ModuleLoader__: { load(mod) { plugin = mod.factory(() => React) } } },
})
await plugin.apply({ slots, locale, effect(fn) { fn() } })
assert.deepEqual(Array.from(plugin.inject), ['slots', 'locale'])
assert.equal(options.locale, 'dsh-chatgpt-subscription')
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join('')
  if (tree == null || typeof tree === 'boolean') return ''
  return typeof tree === 'object' ? text(tree.props.children) : String(tree)
}
function render() { index = 0; return text(component({})) }
const t = locale.bind('dsh-chatgpt-subscription')
for (const language of ['zh', 'en', 'zh']) {
  locale.setLocale(language)
  assert.equal(t, locale.bind('dsh-chatgpt-subscription'))
  assert.equal(options.label(), dictionaries[language]['ui.chatgptSubscription'])
  states = [null, false]
  assert.equal(render(), dictionaries[language]['ui.loading'])
  states = [{ bound: false }, false]
  assert.ok(render().includes(dictionaries[language]['ui.signInWithChatGPT']))
  states[1] = true
  assert.ok(render().includes(dictionaries[language]['ui.authorizing']))
  states = [{ bound: true, expiresAt: Date.now() + 60000 }, false]
  assert.ok(render().includes(dictionaries[language]['ui.connected']))
  assert.ok(render().includes(dictionaries[language]['ui.disconnect']))
  states[0].expiresAt = 1
  assert.ok(render().includes(dictionaries[language]['ui.expired']))
  // A cached Chinese host status switches without waiting for token upkeep.
  states = [{ bound: false, error: { message: dictionaries.zh['host.tokenSyncFailed'] } }, false]
  assert.ok(render().includes(dictionaries[language]['host.tokenSyncFailed']))
}

let preference = 'zh'
const hostT = createHostTranslator({ settings: { get: namespace => { assert.equal(namespace, 'locale'); return { preference } } } })
const pageStart = host.indexOf('function respondOAuthPage(')
const pageEnd = host.indexOf('\n}', pageStart) + 2
const respondOAuthPage = new Function('createHostTranslator', host.slice(pageStart, pageEnd) + '; return respondOAuthPage;')(createHostTranslator)
for (const language of ['zh', 'en']) {
  preference = language
  assert.equal(hostT('host.tokenSyncFailed'), dictionaries[language]['host.tokenSyncFailed'])
  let html
  const response = { setHeader(name, value) { assert.equal(value, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }[name]) }, end(value) { html = value } }
  respondOAuthPage(response, 400, '<script>"&\'</script>', hostT)
  assert.equal(response.statusCode, 400)
  assert.ok(html.includes('<html lang="' + (language === 'zh' ? 'zh-CN' : 'en') + '">'))
  assert.ok(html.includes(dictionaries[language]['host.pageTitle']))
  assert.ok(html.includes(dictionaries[language]['host.pageCloseHint']))
  assert.ok(html.includes('&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;'))
  assert.ok(!html.includes('<script>'))
}
preference = '<invalid>'
assert.equal(hostT('host.pageLanguage'), 'zh-CN')
for (const language of ['zh', 'en']) {
  preference = language
  for (const key of Object.keys(dictionaries.zh).filter(key => key.startsWith('host.'))) {
    const params = Object.fromEntries((dictionaries.zh[key].match(/\{\w+\}/g) || []).map(name => [name.slice(1, -1), 'sample']))
    const original = dictionaries.zh[key].replace(/\{(\w+)\}/g, (_, name) => params[name])
    assert.equal(localizeHostText(original, hostT, dictionaries), hostT(key, params), key)
  }
}
const wire = { provider: '同步异常', kind: 'exception', amount: 12.3, error: { message: '同步异常' } }
assert.deepEqual(JSON.parse(JSON.stringify(wire, hostT.json)), { ...wire, error: { message: 'Token sync failed' } })
assert.equal(localizeHostText('External provider detail', hostT, dictionaries), 'External provider detail')
assert.equal(localizeHostText('', hostT, dictionaries), '')
console.log('PASS  zh/en key coverage, interpolation, live settings/status binding, host preference and escaped OAuth pages')

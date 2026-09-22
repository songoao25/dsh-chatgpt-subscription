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

// dsh-chatgpt-subscription — host 端纯函数与状态机测试（注入式，零真实网络/零真实 auth.json）
// 提取 host.js 模块级常量与纯函数（将「常量 + 纯函数」作为一个共享作用域整体求值，
// 使函数能解析到同模块内的兄弟函数与常量——如 decodeJwtExp 调 decodeBase64Url、buildAuthorizeUrl 用 OAUTH_SCOPE）
import { chmodSync, readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync, rmSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tmpdir } from 'node:os'
import { createHash, randomBytes } from 'node:crypto'

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))
const src = readFileSync(join(root, 'src', 'host.js'), 'utf8')
const clientSrc = readFileSync(join(root, 'src', 'client-bundle.js'), 'utf8')
const patchSrc = readFileSync(join(root, 'cordis.patch.yml'), 'utf8')

// ---- 简易断言（脱敏：涉及 token/auth/secret 的断言失败时不打印实际值）----
let pass = 0
let fail = 0
const failures = []
function isSensitive(v) {
  return /token|auth|secret|access|refresh|password|sk-/i.test(String(v))
}
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    pass++
  } else {
    // 若 expected 或 actual 触及 token/认证字段，失败详情中隐藏实际值（测试仅用模拟数据，
    // 但仍不让任何疑似敏感串进入日志，避免 code scanning 告警 js/clear-text-logging）。
    const act = (isSensitive(expected) || isSensitive(actual)) ? '[REDACTED]' : JSON.stringify(actual)
    failures.push(`${name}: 期望 ${JSON.stringify(expected)} 实际 ${act}`)
    fail++
  }
}

// ---- 提取「常量 + 纯函数」为一个共享作用域 ----
// 思路：从源码中按出现顺序提取模块级 const 与 function 声明，连同 Node 内置依赖一起
// 拼进一个 new Function 整体求值成一份上下文对象，再读出各具名函数。
function extractModule(nameList, depOverrides) {
  const wantedConstants = new Set([
    'CODEX_OAUTH_CLIENT_ID', 'OAUTH_CALLBACK_PATH', 'CODEX_JWT_ACCOUNT_CLAIM',
    'OAUTH_SCOPE', 'CODEX_TOKEN_FALLBACK_LIFETIME_SEC', 'CODEX_REFRESH_AHEAD_SEC',
  ])
  const wantedFns = new Set(nameList)
  const lines = src.split('\n')
  const fragments = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const cm = /^const\s+(\w+)\s*=/.exec(line)
    if (cm && wantedConstants.has(cm[1])) {
      // 常量单行声明（可能带行尾注释）；仅取本行即可（无需跨行，这些常量都不跨行）
      fragments.push(line)
      continue
    }
    const fm = /^function\s+(\w+)\s*\(/.exec(line)
    if (fm && wantedFns.has(fm[1])) {
      let chunk = line
      let depth = (chunk.match(/\{/g) || []).length - (chunk.match(/\}/g) || []).length
      let j = i
      while (depth > 0 && j + 1 < lines.length) { j++; chunk += '\n' + lines[j]; depth += (lines[j].match(/\{/g) || []).length - (lines[j].match(/\}/g) || []).length }
      fragments.push(chunk)
      i = j
      continue
    }
  }
  // 片段体用裸名引用这些标识符：除了 Node 本身的内建全局（process/Buffer/URL/URLSearchParams/
  // AbortSignal/fetch），fs/crypto/path 是 import（非全局），必须按原裸名注入到 new Function 作用域。
  const params = [
    'createHash', 'randomBytes',
    'readFileSync', 'writeFileSync', 'renameSync', 'mkdirSync', 'unlinkSync', 'chmodSync',
    'createServer', 'homedir', 'dirname',
  ]
  const factory = new Function(
    ...params,
    '"use strict";\n' + fragments.join('\n') + '\nreturn {' + nameList.join(',') + '};'
  )
  const dep = Object.assign({
    createHash, randomBytes,
    readFileSync, writeFileSync, renameSync, mkdirSync, unlinkSync, chmodSync,
    createServer: null, homedir: null, dirname,
  }, depOverrides || {})
  return factory(
    dep.createHash, dep.randomBytes,
    dep.readFileSync, dep.writeFileSync, dep.renameSync, dep.mkdirSync, dep.unlinkSync, dep.chmodSync,
    dep.createServer, dep.homedir, dep.dirname,
  )
}

// 提取纯函数（同一共享作用域）
const fnNames = [
  'decodeBase64Url', 'decodeJwtExp', 'codexExpiresAt', 'codexNeedsRefresh',
  'readCodexAuthFile', 'writeAuthJson', 'readBindFlag', 'writeBindFlag', 'clearBindFlag',
  'createPkcePair', 'buildAuthorizeUrl', 'parseCallbackUrl', 'oauthCallbackPort',
  'codexAccountIdFromJwt', 'buildOAuthAuthObject', 'routingModeFor',
]
const mod = extractModule(fnNames)
const {
  decodeBase64Url, decodeJwtExp, codexExpiresAt, codexNeedsRefresh,
  readCodexAuthFile, writeAuthJson, readBindFlag, writeBindFlag, clearBindFlag,
  createPkcePair, buildAuthorizeUrl, parseCallbackUrl, oauthCallbackPort,
  codexAccountIdFromJwt, buildOAuthAuthObject, routingModeFor,
} = mod

// 环境变量隔离（测试前设置）
process.env.DSH_CHATGPT_AUTH = join(tmpdir(), 'dsh-cgpt-test-auth.json')
process.env.DSH_CHATGPT_BIND_FILE = join(tmpdir(), 'dsh-cgpt-test-bind.json')
process.env.DSH_CHATGPT_OAUTH_PORT = '1456'
process.env.DSH_CHATGPT_DATA_DIR = tmpdir()

// ---- 测试 1：JWT 解码 ----
function makeJwt(claims) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url')
  return b64({ alg: 'none' }) + '.' + b64(claims) + '.sig'
}
{
  const exp = Math.floor(Date.now() / 1000) + 3600
  const jwt = makeJwt({ exp, sub: 'test' })
  check('decodeJwtExp 合法 JWT', decodeJwtExp(jwt), exp)
  check('decodeJwtExp 非 JWT → null', decodeJwtExp('not-a-jwt'), null)
  check('decodeJwtExp 空 → null', decodeJwtExp(''), null)
  check('decodeJwtExp 损坏 → null', decodeJwtExp('a.b'), null)
  const noExp = makeJwt({ sub: 'x' })
  check('decodeJwtExp 缺 exp → null', decodeJwtExp(noExp), null)
  check('decodeBase64Url 标准', decodeBase64Url('aGVsbG8='), 'hello')
}

// ---- 测试 2：过期判定 ----
{
  const now = Math.floor(Date.now() / 1000)
  const lastRefreshMs = Date.now()
  check('codexExpiresAt 用 JWT exp', codexExpiresAt(now + 100, lastRefreshMs), now + 100)
  check('codexExpiresAt exp null 走 last_refresh 兜底', codexExpiresAt(null, lastRefreshMs), Math.floor(lastRefreshMs / 1000) + 864000)
  check('codexNeedsRefresh 临近过期(30min) → true', codexNeedsRefresh(now + 30 * 60, now), true)
  check('codexNeedsRefresh 充足(1d) → false', codexNeedsRefresh(now + 86400, now), false)
}

// ---- 测试 2b：模式路由判定 ----
{
  check('健康绑定 + ChatGPT → ChatGPT 模式', routingModeFor(true, true, 'openai-codex'), 'chatgpt')
  check('健康绑定 + DeepSeek → DeepSeek 模式', routingModeFor(true, true, 'deepseek-official'), 'deepseek')
  check('令牌失效 + ChatGPT 选择 → DeepSeek 模式', routingModeFor(true, false, 'openai-codex'), 'deepseek')
  check('未绑定 + ChatGPT 选择 → DeepSeek 模式', routingModeFor(false, true, 'openai-codex'), 'deepseek')
}

// ---- 测试 3：绑定标记 ----
{
  const file = process.env.DSH_CHATGPT_BIND_FILE
  clearBindFlag(file)
  check('readBindFlag 无文件 → bound false', readBindFlag(file).bound, false)
  writeBindFlag(file, { plan: 'plus' })
  const f = readBindFlag(file)
  check('readBindFlag 写后 → bound true', f.bound, true)
  check('writeBindFlag 权限为 0600', statSync(file).mode & 0o777, 0o600)
  // readBindFlag 契约只返回 { ok, bound }；扩展字段（plan 等）写入文件保留（供外部读取），不参与读回
  const rawFlag = JSON.parse(readFileSync(file, 'utf8'))
  check('readBindFlag 扩展字段写入文件', rawFlag.plan, 'plus')
  clearBindFlag(file)
  check('clearBindFlag 后 → bound false', readBindFlag(file).bound, false)
}

// ---- 测试 4：auth.json 读/写 ----
{
  const file = process.env.DSH_CHATGPT_AUTH
  writeFileSync(file, JSON.stringify({ auth_mode: 'oauth', tokens: { access_token: 'acc1', refresh_token: 'ref1', account_id: 'acc-id' }, last_refresh: '2026-08-14T00:00:00.000Z' }))
  const r = readCodexAuthFile(file)
  check('readCodexAuthFile ok', r.ok, true)
  check('readCodexAuthFile 读 access', r.auth.tokens.access_token, 'acc1')
  const updated = writeAuthJson(file, r.auth, 'acc2', 'ref2', '2026-08-16T00:00:00.000Z')
  const r2 = readCodexAuthFile(file)
  check('writeAuthJson 更新 access', r2.auth.tokens.access_token, 'acc2')
  check('writeAuthJson 更新 refresh', r2.auth.tokens.refresh_token, 'ref2')
  check('writeAuthJson 保留 account_id', r2.auth.tokens.account_id, 'acc-id')
  check('writeAuthJson 保留 auth_mode', r2.auth.auth_mode, 'oauth')
  check('writeAuthJson last_refresh 更新', r2.auth.last_refresh, '2026-08-16T00:00:00.000Z')
  check('writeAuthJson 权限为 0600', statSync(file).mode & 0o777, 0o600)
}

// ---- 测试 5：PKCE / 授权 URL / 回调解析 ----
{
  const pkce = createPkcePair()
  check('PKCE verifier 32 字节', pkce.verifier.length >= 40, true)
  check('PKCE challenge 非空', pkce.challenge.length > 0, true)
  const url = buildAuthorizeUrl('state123', pkce.challenge)
  check('authorizeUrl 含 client_id', url.includes('client_id='), true)
  check('authorizeUrl 含 state', url.includes('state=state123'), true)
  check('authorizeUrl 含 code_challenge', url.includes('code_challenge=' + encodeURIComponent(pkce.challenge)), true)
  check('authorizeUrl 含 redirect_uri', url.includes('redirect_uri='), true)
  const cb = parseCallbackUrl('http://localhost:1456/auth/callback?code=xyz&state=state123')
  check('parseCallbackUrl code', cb.code, 'xyz')
  check('parseCallbackUrl state', cb.state, 'state123')
  const cb2 = parseCallbackUrl('http://localhost:1456/auth/callback#code=hashcode&state=s2')
  check('parseCallbackUrl hash 分支', cb2.code, 'hashcode')
  check('parseCallbackUrl hash state', cb2.state, 's2')
  check('oauthCallbackPort env 覆盖', oauthCallbackPort(), 1456)
}

// ---- 测试 5b：account_id 提取 / auth 对象构造 ----
{
  // 构造含官方账号声明的 JWT
  const accountClaim = 'https://api.openai.com/auth'
  const jwt = makeJwt({ [accountClaim]: { chatgpt_account_id: 'acc-123' } })
  check('codexAccountIdFromJwt 提取成功', codexAccountIdFromJwt(jwt), 'acc-123')
  check('codexAccountIdFromJwt 非 JWT → null', codexAccountIdFromJwt('x.y.z'), null)
  check('codexAccountIdFromJwt 空 → null', codexAccountIdFromJwt(''), null)
  check('codexAccountIdFromJwt 缺声明 → null', codexAccountIdFromJwt(makeJwt({ sub: 'x' })), null)

  const nowIso = '2026-08-16T00:00:00.000Z'
  const exchange = { access_token: jwt, refresh_token: 'ref-new', id_token: 'id-new' }
  const built = buildOAuthAuthObject(null, exchange, nowIso)
  check('buildOAuthAuthObject 全新骨架 auth_mode', built.auth_mode, 'oauth')
  check('buildOAuthAuthObject access_token', built.tokens.access_token, jwt)
  check('buildOAuthAuthObject refresh_token', built.tokens.refresh_token, 'ref-new')
  check('buildOAuthAuthObject id_token', built.tokens.id_token, 'id-new')
  check('buildOAuthAuthObject account_id 提取', built.tokens.account_id, 'acc-123')
  check('buildOAuthAuthObject last_refresh', built.last_refresh, nowIso)

  // 已有结构保留 + refresh 缺失不覆盖旧值
  const existing = { auth_mode: 'oauth', OPENAI_API_KEY: 'fake-openai-key', tokens: { account_id: 'acc-old', refresh_token: 'ref-old' }, last_refresh: '2026-08-01T00:00:00.000Z' }
  const built2 = buildOAuthAuthObject(existing, { access_token: jwt, refresh_token: null, id_token: null }, nowIso)
  check('buildOAuthAuthObject 保留 OPENAI_API_KEY', built2.OPENAI_API_KEY, 'fake-openai-key')
  check('buildOAuthAuthObject refresh 缺失保留旧值', built2.tokens.refresh_token, 'ref-old')
  check('buildOAuthAuthObject account_id 更新为新', built2.tokens.account_id, 'acc-123')
}

// ---- 测试 6：安全静态断言 ----
{
  check('host 源码无 token 打印', /console\.(log|warn|error)[^;]*(token|access_token|refresh_token|Authorization|Bearer)/.test(src), false)
  check('host 源码无 eyJ 字面量', src.includes('eyJ'), false)
  check('host 无个人路径', src.includes(['/Users', 'probe'].join('/')), false)
  check('host env 前缀 DSH_CHATGPT', src.includes('DSH_CHATGPT'), true)
  check('host 不读取或删除 DeepSeek 密钥值', src.includes('ctx.credentials.resolve(\'DEEPSEEK_API_KEY\')'), false)
  check('host 只切换 DeepSeek 搜索凭据引用', src.includes("SEARCH_SETTINGS_NAMESPACE = 'web-search-deepseek'") && src.includes('DEEPSEEK_SEARCH_KEY_REF'), true)
  check('host ChatGPT 搜索 fail closed', src.includes('CHATGPT_SEARCH_DISABLED_KEY_REF'), true)
  check('host 包含单飞保护', src.includes('syncInFlight'), true)
  check('host 包含默认模型回滚保护', src.includes('restoreDefaultModel'), true)
  check('host 拒绝自定义同名路由覆盖', src.includes('apiKeyEnv 不是 OPENAI_CODEX_API_KEY'), true)
  check('host 解绑移除自有路由', src.includes("path: ['providers', 'openai-codex'] }]"), true)
  check('host 不删除用户已有 Codex 路由', src.includes('同名用户路由只读不删不改'), true)
  check('host 只清理自有 Codex 凭据', src.includes('codexCredentialOwned') && src.includes('credentialManaged'), true)
  check('host 失效状态清理 Codex 凭据', (src.match(/clearInjectedCodexCredential\(flag\)/g) || []).length >= 4, true)
  check('OAuth 启动 RPC 受同源保护', src.includes('MUTATING = { startCodexOAuth: true'), true)
  check('ChatGPT 默认模型使用明确配置', src.includes('CODEX_DEFAULT_MODEL'), true)
  check('客户端 RPC 检查 HTTP 状态', clientSrc.includes("if (!r.ok) throw new Error"), true)
  check('客户端卸载清理授权轮询', clientSrc.includes('pollRef.current'), true)
  check('插件保留 DeepSeek 搜索 provider 供模式恢复', patchSrc.includes('DEEPSEEK_API_KEY') && !patchSrc.includes('disabled: true'), true)
  check('绑定和解绑都切换搜索线路', (src.match(/setSearchMode\(/g) || []).length >= 4, true)
  check('手动模型选择通过轮询同步搜索线路', src.includes('ROUTING_SYNC_INTERVAL_MS') && src.includes('syncRoutingMode'), true)
  check('未绑定启动不主动注册 ChatGPT 路由', !src.includes('    ensureCodexRoute();\n    syncCodexToken();'), true)
}

// 清理临时文件
try { rmSync(process.env.DSH_CHATGPT_AUTH, { force: true }); rmSync(process.env.DSH_CHATGPT_BIND_FILE, { force: true }); } catch (e) {}

// ---- 结果 ----
console.log(`test-codex-host: ${pass} PASS / ${fail} FAIL`)
if (failures.length > 0) { console.log(failures.join('\n')); }
process.exit(fail > 0 ? 1 : 0)

window.__ModuleLoader__.load({ id: "dsh-chatgpt-subscription", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
// dsh-chatgpt-subscription — client half：设置侧边栏「订阅」页（紧邻「模型」、图标一致）
module.exports = {
  inject: ['slots', 'locale'],
  async apply(ctx) {
    const LOCALE_NAMESPACE = 'dsh-chatgpt-subscription';
    const LOCALES = {"zh":{"ui.couldNotLoadStatus":"获取状态失败","ui.couldNotStartAuthorization":"启动授权失败：","ui.unknownError":"未知错误","ui.couldNotStartAuthorization.handleAuthorize":"启动授权异常：{message}","ui.disconnectYourChatGPTSubscription":"确定要解绑 ChatGPT 订阅吗？","ui.couldNotDisconnect":"解绑失败：{value}","ui.expired":"已到期","ui.loading":"加载中…","ui.chatgptSubscription":"ChatGPT 订阅","ui.connectYourChatGPTSubscriptionTo":"绑定后可在 DSH 中使用 ChatGPT Plus/Pro 订阅额度对话，并在底部信息栏查看剩余额度与重置时间。","ui.authorizing":"授权中…","ui.signInWithChatGPT":"授权登录","ui.connected":"已绑定","ui.tokenExpires":"令牌有效期至：{at}（剩余 {remaining}）","ui.reauthorize":"重新授权","ui.disconnect":"解绑","ui.signInUsesTheOfficial":"说明：绑定由官方 OAuth 流程完成，令牌存储在 ~/.codex/auth.json（0600）。独立插件 dsh-chatgpt-subscription 负责维护令牌，dsh-bottom-info-bar 只读令牌显示额度。本插件不管理联网搜索配置：搜索商由 DSH 的搜索配置单独指定（如 DeepSeek 搜索或第三方搜索服务），ChatGPT 订阅令牌绝不会被当作搜索凭据使用。","host.invalidOAuthCallbackURL":"OAuth 回调地址无效","host.callbackPathNotFound":"回调路径不存在","host.oauthStateVerificationFailedPlease":"OAuth 状态校验失败，请重试","host.authorizationCodeMissing":"缺少授权码","host.authorizationReceivedYouCanClose":"授权完成，可关闭此页","host.settingsServiceIsNotReady":"settings 服务未就绪，下个周期重试","host.aCustomOpenaiCodexRoute":"检测到用户自定义的 openai-codex 路由（apiKeyEnv 不是 OPENAI_CODEX_API_KEY），插件不会覆盖","host.couldNotRegisterTheOpenai":"openai-codex 路由注册失败，稍后重试","host.theDefaultModelServiceIs":"默认模型服务未就绪，无法安全切换到 ChatGPT","host.tokenSyncFailed":"同步异常","host.couldNotRemoveTheRoute":"解绑路由清理失败","host.notConnectedSignInOn":"未绑定 ChatGPT 订阅，请在 DSH 设置「订阅」页授权绑定","host.notConnectedButOldCredentials":"未绑定，但旧凭据清理失败","host.connectionIsNoLongerValid":"绑定失效且路由清理失败","host.connectionIsNoLongerValid.error":"绑定已失效：未找到登录凭证，请重新授权","host.signInCredentialsAreMissing":"登录凭证缺失且旧凭据清理失败","host.connectionIsNoLongerValid.error2":"绑定已失效：缺少 access_token，请重新授权","host.accessTokenIsMissingAnd":"缺少 access_token 且旧凭据清理失败","host.tokenExpiresSoonButRefresh":"令牌临近过期但缺少 refresh_token，请重新授权","host.tokenRefreshedButCouldNot":"续期成功但写回 auth.json 失败","host.tokenRefreshFailedRefreshToken":"令牌续期失败（refresh_token 可能失效），请重新授权","host.tokenIsUnusableAndOld":"令牌不可用且旧凭据清理失败","host.openaiCODEXAPIKEYIs":"检测到用户已有 OPENAI_CODEX_API_KEY，插件不会覆盖","host.couldNotSetDSHCredentials":"凭据注入失败","host.couldNotSetDSHCredentials.syncCodexTokenOnce":"凭据注入和旧凭据清理均失败","host.authorizationTimedOutAfterMinutes":"授权超时（5 分钟），请重试","host.tokenExchangeFailed":"令牌交换失败（","host.networkError":"网络错误","host.pleaseTryAgain":"），请重试","host.authorizedButCouldNotSave":"绑定成功但写入 auth.json 失败","host.authorizedButCouldNotSwitch":"绑定成功但默认模型切换失败，请检查设置后重试","host.authorizedButCouldNotSave.runCodexOAuthFlow":"绑定成功但写入绑定标记失败","host.connectionFailedCouldNotSet":"绑定失败：凭据注入失败","host.connectionFailedPleaseTryAgain":"绑定异常，请重试","host.authorizationInProgressPleaseWait":"授权进行中，请稍候","host.callbackPortIsInUse":"回调端口 {port} 被占用，请关闭占用程序（如正在运行的 codex 登录）后重试","host.authorizationInProgressCompleteIt":"授权进行中，请先完成或等待超时","host.chatgptSubscriptionDisconnectedSignIn":"已解绑 ChatGPT 订阅，请重新授权绑定","host.couldNotDisconnectPleaseTry":"解绑失败，请重试","ui.tokenExpiredAt":"令牌有效期至：{at}（剩余 已到期）","host.pageLanguage":"zh-CN","host.pageTitle":"ChatGPT 授权","host.pageCloseHint":"你可以关闭此页面，返回 DSH 继续。"},"en":{"ui.couldNotLoadStatus":"Could not load status","ui.couldNotStartAuthorization":"Could not start authorization: ","ui.unknownError":"Unknown error","ui.couldNotStartAuthorization.handleAuthorize":"Could not start authorization: {message}","ui.disconnectYourChatGPTSubscription":"Disconnect your ChatGPT subscription?","ui.couldNotDisconnect":"Could not disconnect: {value}","ui.expired":"Expired","ui.loading":"Loading…","ui.chatgptSubscription":"ChatGPT Subscription","ui.connectYourChatGPTSubscriptionTo":"Connect your ChatGPT subscription to chat in DSH using your Plus/Pro quota. Install Bottom Info Bar to see remaining quota and reset times.","ui.authorizing":"Authorizing…","ui.signInWithChatGPT":"Sign in with ChatGPT","ui.connected":"Connected","ui.tokenExpires":"Token expires: {at} ({remaining} remaining)","ui.reauthorize":"Reauthorize","ui.disconnect":"Disconnect","ui.signInUsesTheOfficial":"Sign-in uses the official OAuth flow. Tokens are stored in ~/.codex/auth.json (0600). This plugin maintains the tokens; dsh-bottom-info-bar only reads them to display quota. Web search is configured separately in DSH. Your ChatGPT subscription token is never used as a search credential.","host.invalidOAuthCallbackURL":"Invalid OAuth callback URL","host.callbackPathNotFound":"Callback path not found","host.oauthStateVerificationFailedPlease":"OAuth state verification failed. Please try again.","host.authorizationCodeMissing":"Authorization code missing","host.authorizationReceivedYouCanClose":"Authorization received. You can close this page.","host.settingsServiceIsNotReady":"Settings service is not ready. Retrying next cycle.","host.aCustomOpenaiCodexRoute":"A custom openai-codex route uses a different apiKeyEnv than OPENAI_CODEX_API_KEY. The plugin will not overwrite it.","host.couldNotRegisterTheOpenai":"Could not register the openai-codex route. Retrying later.","host.theDefaultModelServiceIs":"The default model service is not ready. Cannot safely switch to ChatGPT.","host.tokenSyncFailed":"Token sync failed","host.couldNotRemoveTheRoute":"Could not remove the route after disconnecting","host.notConnectedSignInOn":"Not connected. Sign in on the ChatGPT Subscription page in DSH Settings.","host.notConnectedButOldCredentials":"Not connected, but old credentials could not be removed","host.connectionIsNoLongerValid":"Connection is no longer valid and the route could not be removed","host.connectionIsNoLongerValid.error":"Connection is no longer valid: sign-in credentials not found. Please reauthorize.","host.signInCredentialsAreMissing":"Sign-in credentials are missing and old credentials could not be removed","host.connectionIsNoLongerValid.error2":"Connection is no longer valid: access_token is missing. Please reauthorize.","host.accessTokenIsMissingAnd":"access_token is missing and old credentials could not be removed","host.tokenExpiresSoonButRefresh":"Token expires soon, but refresh_token is missing. Please reauthorize.","host.tokenRefreshedButCouldNot":"Token refreshed, but could not be saved to auth.json","host.tokenRefreshFailedRefreshToken":"Token refresh failed (refresh_token may be invalid). Please reauthorize.","host.tokenIsUnusableAndOld":"Token is unusable and old credentials could not be removed","host.openaiCODEXAPIKEYIs":"OPENAI_CODEX_API_KEY is already configured. The plugin will not overwrite it.","host.couldNotSetDSHCredentials":"Could not set DSH credentials","host.couldNotSetDSHCredentials.syncCodexTokenOnce":"Could not set DSH credentials or remove old credentials","host.authorizationTimedOutAfterMinutes":"Authorization timed out after 5 minutes. Please try again.","host.tokenExchangeFailed":"Token exchange failed (","host.networkError":"network error","host.pleaseTryAgain":"). Please try again.","host.authorizedButCouldNotSave":"Authorized, but could not save auth.json","host.authorizedButCouldNotSwitch":"Authorized, but could not switch the default model. Check Settings and try again.","host.authorizedButCouldNotSave.runCodexOAuthFlow":"Authorized, but could not save the connection flag","host.connectionFailedCouldNotSet":"Connection failed: could not set DSH credentials","host.connectionFailedPleaseTryAgain":"Connection failed. Please try again.","host.authorizationInProgressPleaseWait":"Authorization in progress. Please wait.","host.callbackPortIsInUse":"Callback port {port} is in use. Close the program using it (such as an active codex sign-in) and try again.","host.authorizationInProgressCompleteIt":"Authorization in progress. Complete it or wait for it to time out.","host.chatgptSubscriptionDisconnectedSignIn":"ChatGPT subscription disconnected. Sign in again to reconnect.","host.couldNotDisconnectPleaseTry":"Could not disconnect. Please try again.","ui.tokenExpiredAt":"Token expires: {at} (Expired)","host.pageLanguage":"en","host.pageTitle":"ChatGPT authorization","host.pageCloseHint":"You can close this page and return to DSH to continue."}};
    ctx.effect(function () { return ctx.locale.register(LOCALE_NAMESPACE, LOCALES); }, 'subscription: dictionaries');
    const t = ctx.locale.bind(LOCALE_NAMESPACE);
    // Existing host snapshots carry text, not message keys. Translate known
    // messages at render time too, so a cached status follows switches.
    function localizeHostText(message, translate, dictionaries) {
  if (typeof message !== 'string' || message.length === 0) return message
  for (const key of Object.keys(dictionaries.zh)) {
    if (dictionaries.zh[key] === message || dictionaries.en[key] === message) return translate(key)
  }
  for (const key of Object.keys(dictionaries.zh)) {
    if (!key.startsWith('host.')) continue
    for (const language of ['zh', 'en']) {
      const template = dictionaries[language][key]
      if (!/\{\w+\}/.test(template)) continue
      const names = []
      const pattern = template.split(/(\{\w+\})/).map(function (part) {
        if (/^\{\w+\}$/.test(part)) { names.push(part.slice(1, -1)); return '([\\s\\S]*?)' }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      }).join('')
      const match = new RegExp('^' + pattern + '$').exec(message)
      if (match) {
        const params = {}
        names.forEach(function (name, index) { params[name] = match[index + 1] })
        return translate(key, params)
      }
    }
  }
  return message
}
    function hostText(message) { return localizeHostText(message, t, LOCALES); }
    // slots 服务等待就绪（最多 18s）
    let slots = ctx.slots || ctx.get('slots');
    for (let i = 0; slots === undefined && i < 60; i++) {
      await new Promise(function (resolve) { window.setTimeout(resolve, 300); });
      slots = ctx.slots || ctx.get('slots');
    }
    if (slots === undefined) {
      console.warn('[dsh-chatgpt-subscription] slots 服务未就绪，设置页未注册');
      return;
    }

    // RPC 封装（webServer HTTP）
    const PREFIX = '/_dsh/dsh-chatgpt-subscription';
    function rpc(method, args) {
      const url = PREFIX + '/' + method;
      const controller = new AbortController();
      const timeout = window.setTimeout(function () { controller.abort(); }, 15000);
      return fetch(url, {
        method: args ? 'POST' : 'GET',
        headers: { 'content-type': 'application/json' },
        body: args ? JSON.stringify(args) : undefined,
        signal: controller.signal,
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (body) {
          if (!r.ok) throw new Error(body.error || ('HTTP ' + r.status));
          return body;
        });
      }).finally(function () { window.clearTimeout(timeout); });
    }

    // React 由 bundle 的 require('react') 提供（seed 模块，与官方 client 包同机制）
    var React = require('react');
    // h 必须支持多 children（React.createElement 接受可变参数；组件多处传多个子元素）
    function h(tag, props) {
      var args = [tag, props];
      for (var i = 2; i < arguments.length; i++) args.push(arguments[i]);
      return React.createElement.apply(React, args);
    }

    // ---------- 设置页组件 ----------
    function SubscriptionPage(props) {
      var _React$useState = React.useState(null),
          status = _React$useState[0],
          setStatus = _React$useState[1];
      var _React$useState2 = React.useState(false),
          authorizing = _React$useState2[0],
          setAuthorizing = _React$useState2[1];
      var pollRef = React.useRef(null);

      // 加载状态 + 轮询
      var load = React.useCallback(function () {
        rpc('getCodexBridgeStatus').then(function (s) { setStatus(s); }).catch(function (e) { setStatus({ ok: false, error: { message: t('ui.couldNotLoadStatus') } }); });
      }, []);

      React.useEffect(function () {
        load();
        var timer = window.setInterval(load, 5000); // 每 5s 刷新一次（授权中时更快感知）
        return function () {
          window.clearInterval(timer);
          if (pollRef.current !== null) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }
        };
      }, [load]);

      // 授权按钮处理
      var handleAuthorize = React.useCallback(function () {
        if (authorizing) return;
        setAuthorizing(true);
        rpc('startCodexOAuth').then(function (res) {
          if (!res.ok) {
            alert(t('ui.couldNotStartAuthorization') + hostText(res.error && res.error.message || t('ui.unknownError')));
            setAuthorizing(false);
            return;
          }
          // 打开浏览器授权页（window.open 兜底；host 也会尝试 open shell）
          if (res.authorizeUrl) window.open(res.authorizeUrl, '_blank');
          // 轮询直到完成；组件卸载或授权结束时必须清理定时器
          if (pollRef.current !== null) window.clearInterval(pollRef.current);
          pollRef.current = window.setInterval(function () {
            rpc('getCodexBridgeStatus').then(function (s) {
              setStatus(s);
              if (s.bound || !s.oauthInFlight) {
                window.clearInterval(pollRef.current);
                pollRef.current = null;
                setAuthorizing(false);
              }
            }).catch(function () {
              window.clearInterval(pollRef.current);
              pollRef.current = null;
              setAuthorizing(false);
            });
          }, 2000);
        }).catch(function (e) {
          alert(t('ui.couldNotStartAuthorization.handleAuthorize', { message: e.message }));
          setAuthorizing(false);
        });
      }, [authorizing]);

      // 解绑
      var handleUnbind = React.useCallback(function () {
        if (!confirm(t('ui.disconnectYourChatGPTSubscription'))) return;
        rpc('unbindCodex').then(function (res) {
          if (res.ok) { load(); } else { alert(t('ui.couldNotDisconnect', { value: hostText(res.error && res.error.message || '') })); }
        });
      }, [load]);

      // 格式化时间戳
      function fmtTime(ms) {
        if (!ms) return '—';
        var d = new Date(ms);
        return String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      }
      function fmtCountdown(ms) {
        if (!ms || ms <= 0) return t('ui.expired');
        var totalSec = Math.floor(ms / 1000);
        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        var s = totalSec % 60;
        var p = function (x) { return String(x).padStart(2, '0'); };
        return h > 0 ? h + 'h' + p(m) + 'm' : p(m) + ':' + p(s);
      }

      var style = { maxWidth: 720, margin: '0 auto', padding: '1rem' };
      var cardStyle = { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, padding: '1rem 1.2rem', marginBottom: '1rem', background: 'var(--dsw-alias-bg-module-platform)' };
      var btnPrimary = { background: 'var(--dsw-alias-button-primary-fill)', color: 'var(--dsw-alias-label-primary-foreground)', border: 'none', borderRadius: 18, padding: '0 1.2rem', height: 36, cursor: 'pointer', fontSize: 14 };
      var btnDanger = { background: 'transparent', color: 'var(--dsw-alias-state-error-primary)', border: '1px solid var(--dsw-alias-state-error-primary)', borderRadius: 18, padding: '0 1rem', height: 32, cursor: 'pointer', fontSize: 13 };
      var btnSecondary = { background: 'transparent', color: 'var(--dsw-alias-label-primary)', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 18, padding: '0 1rem', height: 32, cursor: 'pointer', fontSize: 13 };

      if (!status) return h('div', { style: style }, h('p', null, t('ui.loading')));

      var bound = status.bound;
      var errorMsg = hostText((status.error && status.error.message) || '');

      return h('div', { style: style },
        h('h2', { style: { marginTop: 0, fontSize: 18, fontWeight: 500 } }, t('ui.chatgptSubscription')),
        h('div', { style: cardStyle },
          !bound ? h('div', null,
            h('p', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 14 } }, t('ui.connectYourChatGPTSubscriptionTo')),
            h('button', { style: Object.assign({}, btnPrimary, { marginTop: '0.5rem' }), onClick: handleAuthorize, disabled: authorizing }, authorizing ? t('ui.authorizing') : t('ui.signInWithChatGPT')),
            errorMsg ? h('p', { style: { color: 'var(--dsw-alias-state-error-primary)', fontSize: 13, marginTop: '0.5rem' } }, errorMsg) : null
          ) : h('div', null,
            h('div', { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.8rem' } },
              h('span', { style: { width: 8, height: 8, borderRadius: '50%', background: 'var(--dsw-alias-state-success-primary)', display: 'inline-block' } }),
              h('strong', null, t('ui.connected'))
            ),
            status.expiresAt ? h('p', { style: { fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, t(status.expiresAt <= Date.now() ? 'ui.tokenExpiredAt' : 'ui.tokenExpires', { at: fmtTime(status.expiresAt), remaining: fmtCountdown(status.expiresAt - Date.now()) })) : null,
            h('div', { style: { display: 'flex', gap: 8, marginTop: '1rem' } },
              h('button', { style: btnSecondary, onClick: handleAuthorize, disabled: authorizing }, t('ui.reauthorize')),
              h('button', { style: btnDanger, onClick: handleUnbind }, t('ui.disconnect'))
            )
          )
        ),
        h('p', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', marginTop: '1rem' } },
          t('ui.signInUsesTheOfficial')
        )
      );
    }

    // 注册 settings.section（对齐官方注册模式：ctx.slots.inject 等待 section 声明就绪 +
    // 显式 label 供侧边栏显示 + children 定义页面子槽 + order 控制排序紧接「模型」(order=10) 之后）
    // 参考官方 dsh-client-ui-settings-models / settings-plugins 同款写法
    var dispose = ctx.slots.inject('settings.section', function () {
      return ctx.slots.register(
        {
          name: 'settings.section',
          id: 'chatgpt-subscription',
          locale: LOCALE_NAMESPACE,
          order: 12,
          label: function () { return t('ui.chatgptSubscription'); },
          children: {},
        },
        SubscriptionPage
      );
    });

    return function () { if (dispose) dispose(); };
  },
};

return module.exports;
} });

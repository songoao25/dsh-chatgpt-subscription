// dsh-chatgpt-subscription — client half：设置侧边栏「订阅」页（紧邻「模型」、图标一致）
module.exports = {
  inject: ['slots', 'locale'],
  async apply(ctx) {
    const LOCALE_NAMESPACE = 'dsh-chatgpt-subscription';
    const LOCALES = /*__LOCALES__*/{};
    ctx.effect(function () { return ctx.locale.register(LOCALE_NAMESPACE, LOCALES); }, 'subscription: dictionaries');
    const t = ctx.locale.bind(LOCALE_NAMESPACE);
    // Existing host snapshots carry text, not message keys. Translate known
    // messages at render time too, so a cached status follows switches.
    /*__HOST_TEXT__*/
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

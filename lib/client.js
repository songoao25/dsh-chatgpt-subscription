window.__ModuleLoader__.load({ id: "dsh-chatgpt-subscription", factory: (require) => {
var module = { exports: {} }; var exports = module.exports;
// dsh-chatgpt-subscription — client half：插件详情页的订阅配置
module.exports = {
  inject: ['slots'],
  async apply(ctx) {
    // slots 服务等待就绪（最多 18s）
    let slots = ctx.slots || ctx.get('slots');
    for (let i = 0; slots === undefined && i < 60; i++) {
      await new Promise(function (resolve) { window.setTimeout(resolve, 300); });
      slots = ctx.slots || ctx.get('slots');
    }
    if (slots === undefined) {
      console.warn('[dsh-chatgpt-subscription] slots 服务未就绪，插件配置页未注册');
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
    // 同 h，但 children 以数组给出——逐项展开成可变参数，
    // 避免把数组当唯一子节点（那会要求每个元素带 key，且会多套一层隐式 key 警告）。
    function hList(tag, props, children) {
      var args = [tag, props];
      for (var i = 0; i < children.length; i++) {
        if (children[i]) args.push(children[i]);
      }
      return React.createElement.apply(React, args);
    }

    // ---------- 样式 ----------
    // 与 dsh-bottom-info-bar 的设置面板同一套观感，并直接对齐 DSH 原生设置页：
    // 扁平列表 + .5px 细分隔线 + 原生字号阶梯（14/20 标题、12/18 次要说明）+ 原生控件尺寸。
    // 全部走 --dsw-alias-* 令牌，深色/浅色主题自动跟随。
    function installStyles() {
      var id = 'dsh-chatgpt-subscription-page';
      if (document.querySelector('style[data-plugin-css="' + id + '"]') !== null) return;
      var style = document.createElement('style');
      style.dataset.plugin = 'dsh-chatgpt-subscription';
      style.dataset.pluginCss = id;
      style.textContent = `
        .cgpt-page { display: flex; flex-direction: column; width: 100%; max-width: 760px; min-width: 0; gap: 12px; color: var(--dsw-alias-label-primary); }
        .cgpt-page, .cgpt-page * { box-sizing: border-box; }
        .cgpt-title { width: 100%; margin: 0; font-size: 18px; font-weight: 600; line-height: 26px; color: var(--dsw-alias-label-primary); }
        .cgpt-intro { width: 100%; margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; }
        .cgpt-list { display: flex; flex-direction: column; width: 100%; min-width: 0; }
        .cgpt-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; width: 100%; min-width: 0; padding: 16px 0; border-bottom: 0.5px solid var(--dsw-alias-border-l2); }
        .cgpt-row:last-child { border-bottom: none; }
        .cgpt-rowText { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cgpt-rowTitle { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 400; line-height: 22px; color: var(--dsw-alias-label-primary); }
        .cgpt-rowDesc { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary); overflow-wrap: anywhere; }
        .cgpt-rowDesc--error { color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-error, #d92d20)); }
        .cgpt-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; min-width: 0; margin-left: auto; }
        .cgpt-status { display: inline-flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-primary); font-size: 13px; line-height: 20px; }
        .cgpt-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-success-primary, var(--dsw-alias-label-success, #087f5b)); }
        /* 按钮取宿主 primitives 的 SettingsForm .save 尺寸（r8 / 13px / 5px 14px） */
        .cgpt-btn { appearance: none; font: inherit; cursor: pointer; border: 0.5px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-primary); background: transparent; border-radius: 8px; padding: 5px 14px; font-size: 13px; font-weight: 500; line-height: 1.5; transition: background-color 120ms ease, border-color 120ms ease; }
        .cgpt-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.08)); }
        .cgpt-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
        .cgpt-btn:disabled { opacity: 0.4; cursor: default; }
        .cgpt-btn--primary { border-color: transparent; background: var(--dsw-alias-label-primary); color: var(--dsw-alias-bg-layer-3); }
        .cgpt-btn--primary:hover:not(:disabled) { background: var(--dsw-alias-label-primary); opacity: 0.9; }
        .cgpt-btn--danger { border-color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-error, #d92d20)); color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-error, #d92d20)); }
        .cgpt-btn--danger:hover:not(:disabled) { background: var(--dsw-alias-state-error-bg-primary, rgba(217,45,32,0.08)); border-color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-error, #d92d20)); }
        .cgpt-note { width: 100%; margin: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; overflow-wrap: anywhere; }
        .cgpt-loading { margin: 0; padding: 16px 0; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; }
        @media (max-width: 600px) { .cgpt-row { align-items: flex-start; } .cgpt-controls { justify-content: flex-start; margin-left: 0; } }
        @media (prefers-reduced-motion: reduce) { .cgpt-btn { transition: none; } }
      `;
      document.head.appendChild(style);
    }
    installStyles();

    // ---------- 插件配置页组件 ----------
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
        rpc('getCodexBridgeStatus').then(function (s) { setStatus(s); }).catch(function (e) { setStatus({ ok: false, error: { message: '获取状态失败' } }); });
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
            alert('启动授权失败：' + (res.error && res.error.message || '未知错误'));
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
          alert('启动授权异常：' + e.message);
          setAuthorizing(false);
        });
      }, [authorizing]);

      // 解绑
      var handleUnbind = React.useCallback(function () {
        if (!confirm('确定要解绑 ChatGPT 订阅吗？')) return;
        rpc('unbindCodex').then(function (res) {
          if (res.ok) { load(); } else { alert('解绑失败：' + (res.error && res.error.message || '')); }
        });
      }, [load]);

      // 格式化时间戳
      function fmtTime(ms) {
        if (!ms) return '—';
        var d = new Date(ms);
        return String(d.getFullYear()) + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      }
      function fmtCountdown(ms) {
        if (!ms || ms <= 0) return '已到期';
        var totalSec = Math.floor(ms / 1000);
        var h = Math.floor(totalSec / 3600);
        var m = Math.floor((totalSec % 3600) / 60);
        var s = totalSec % 60;
        var p = function (x) { return String(x).padStart(2, '0'); };
        return h > 0 ? h + 'h' + p(m) + 'm' : p(m) + ':' + p(s);
      }

      var title = h('h2', { className: 'cgpt-title' }, 'ChatGPT 订阅');
      var intro = h('p', { className: 'cgpt-intro' }, '绑定后可在 DSH 中使用 ChatGPT Plus/Pro 订阅额度对话，并在底部信息栏查看剩余额度与重置时间。');
      var note = h('p', { className: 'cgpt-note' },
        '说明：绑定由官方 OAuth 流程完成，令牌存储在 ~/.codex/auth.json（0600）。独立插件 dsh-chatgpt-subscription 负责维护令牌，dsh-bottom-info-bar 只读令牌显示额度。本插件不管理联网搜索配置：搜索商由 DSH 的搜索配置单独指定（如 DeepSeek 搜索或第三方搜索服务），ChatGPT 订阅令牌绝不会被当作搜索凭据使用。');

      if (!status) {
        return h('div', { className: 'cgpt-page' }, title, intro, h('p', { className: 'cgpt-loading' }, '加载中…'));
      }

      var bound = status.bound;
      var errorMsg = (status.error && status.error.message) || '';

      // 状态行：标题 + 说明在左，控件靠右——与信息栏设置面板同一套行结构
      var statusDesc = bound
        ? (status.expiresAt
          ? ('令牌有效期至 ' + fmtTime(status.expiresAt) + '（剩余 ' + fmtCountdown(status.expiresAt - Date.now()) + '）')
          : '令牌已绑定，暂未读到有效期。')
        : '尚未绑定。绑定后底部信息栏会显示订阅额度与重置时间。';
      var statusControls = bound
        ? [
          h('span', { className: 'cgpt-status', key: 'state' }, h('span', { className: 'cgpt-dot' }), '已绑定'),
          h('button', { className: 'cgpt-btn', key: 'reauth', onClick: handleAuthorize, disabled: authorizing }, authorizing ? '授权中…' : '重新授权'),
          h('button', { className: 'cgpt-btn cgpt-btn--danger', key: 'unbind', onClick: handleUnbind }, '解绑'),
        ]
        : [h('button', { className: 'cgpt-btn cgpt-btn--primary', key: 'auth', onClick: handleAuthorize, disabled: authorizing }, authorizing ? '授权中…' : '授权登录')];

      var rows = [
        hList('div', { className: 'cgpt-row', key: 'status' }, [
          h('div', { className: 'cgpt-rowText' },
            h('div', { className: 'cgpt-rowTitle' }, '订阅状态'),
            h('div', { className: 'cgpt-rowDesc' }, statusDesc)),
          hList('div', { className: 'cgpt-controls' }, statusControls),
        ]),
      ];
      if (errorMsg) {
        rows.push(h('div', { className: 'cgpt-row', key: 'error' },
          h('div', { className: 'cgpt-rowText' },
            h('div', { className: 'cgpt-rowTitle' }, '错误'),
            h('div', { className: 'cgpt-rowDesc cgpt-rowDesc--error' }, errorMsg))));
      }

      return h('div', { className: 'cgpt-page' }, title, intro, hList('div', { className: 'cgpt-list' }, rows), note);
    }

    function SubscriptionBundleConfig(props) {
      if (props && props.view === 'summary') {
        return h('span', { className: 'dshChatGPTBundleSummary' }, '绑定 ChatGPT Plus/Pro 订阅，在 DSH 中使用 ChatGPT 模型。');
      }
      return h(SubscriptionPage, props);
    }

    // 当前 DSH 的插件页是外部 bundle 的唯一配置入口；key 必须等于 bundle 包名。
    var dispose = slots.inject('plugins.bundle.config', function () {
      return slots.register(
        {
          name: 'plugins.bundle.config',
          key: 'dsh-chatgpt-subscription',
          label: function () { return 'ChatGPT 订阅'; },
        },
        SubscriptionBundleConfig
      );
    });

    return function () { if (dispose) dispose(); };
  },
};

return module.exports;
} });

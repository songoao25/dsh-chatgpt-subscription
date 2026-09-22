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
    // 宿主原生组件库（与 dsh-bottom-info-bar 同一来源）。取不到时全部退回插件内的等价实现，
    // 任何成员都不允许以 undefined 的身份进入 React.createElement（那会 React #130 白屏）。
    var PRIMITIVES = null;
    try {
      PRIMITIVES = require('@deepseek-ai/dsh-client-ui-primitives') || null;
    } catch (err) { PRIMITIVES = null; }
    function native(name) {
      if (!PRIMITIVES) return null;
      var member = PRIMITIVES[name];
      return typeof member === 'function' || (member && typeof member === 'object') ? member : null;
    }
    var NativeButton = native('Button');
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
    // 排版完全照宿主**插件详情页**那一套原生度量（dsh-client-ui-plugin-manager 的 X_2TxG_*），
    // 因为本页面就渲染在插件详情页里面：
    //   detailSections { flex-col; gap:32px }  → .cgpt-page
    //   detailSection  { flex-col; gap:12px }  → .cgpt-section
    //   sectionHead    { baseline; gap:10px; padding:0 } → .cgpt-sectionHead
    //   sectionTitle   { 14/500/20 }           → .cgpt-title
    //   rows           { flex-col; gap:0 }     → .cgpt-list
    //   row            { padding:12px 2px; border-bottom:.5px solid border-l2 } → .cgpt-row
    //   row:last-child { border-bottom:0 }
    //   rowLine        { align-items:center; gap:16px } → .cgpt-row 的主轴间距
    //   rowId          { 13.5/500/20 }         → .cgpt-rowTitle
    //   banner         { 12% 色底; r10; 8px 12px } → .cgpt-alert--warning
    //   failure/reason { 错误色; 12/18; 可换行 }    → .cgpt-alert--error
    // 【横向对齐铁律】宿主的 .X_2TxG_detailSection（配置区挂载点）实测 x=323.2、padding:0，
    // 宿主自己的区块标题文字左边界也是 323.2。所以我们的每个内容块都**不能自带左右内边距**，
    // 否则整体右移、与宿主自己渲染的区块错开——那正是「什么都对不齐」的根因。
    // 行本身用 padding:12px 2px（宿主 .X_2TxG_row 的真实值），内容内缩 2px，与宿主一致。
    // 全部走 --dsw-alias-* 令牌，深色/浅色主题自动跟随。
    function installStyles() {
      var id = 'dsh-chatgpt-subscription-page';
      if (document.querySelector('style[data-plugin-css="' + id + '"]') !== null) return;
      var style = document.createElement('style');
      style.dataset.plugin = 'dsh-chatgpt-subscription';
      style.dataset.pluginCss = id;
      style.textContent = `
        /* 宽度上限交给宿主：.X_2TxG_page > * 已把内容钉在 min(100%, 960px)，这里再写死 760px 会在宽视口下压窄内容、右侧控件够不到宿主右边界。 */
        .cgpt-page { display: flex; flex-direction: column; width: 100%; max-width: 100%; min-width: 0; gap: 32px; color: var(--dsw-alias-label-primary); }
        .cgpt-page, .cgpt-page * { box-sizing: border-box; }
        .cgpt-section { display: flex; flex-direction: column; gap: 12px; width: 100%; min-width: 0; }
        .cgpt-sectionHead { display: flex; align-items: baseline; gap: 10px; width: 100%; min-width: 0; padding: 0; }
        .cgpt-title { margin: 0; min-width: 0; font-size: 14px; font-weight: 500; line-height: 20px; color: var(--dsw-alias-label-primary); }
        .cgpt-sectionCount { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; font-variant-numeric: tabular-nums; }
        /* 行 = 原生详情页的 .X_2TxG_row：12px 2px 内边距 + .5px 下边线（末行无线），
           无圆角、无 hover 填充、无负外边距。分隔靠边线，所以列表 gap 为 0。 */
        .cgpt-list { display: flex; flex-direction: column; gap: 0; width: 100%; min-width: 0; }
        .cgpt-row { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; width: 100%; min-width: 0; margin: 0; padding: 12px 2px; border: 0; border-bottom: 0.5px solid var(--dsw-alias-border-l2, rgba(128,128,128,0.16)); border-radius: 0; }
        .cgpt-row:last-child { border-bottom: 0; }
        .cgpt-rowText { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .cgpt-rowTitle { display: flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 500; line-height: 20px; color: var(--dsw-alias-label-primary); }
        .cgpt-rowDesc { font-size: 11.5px; line-height: 16px; color: var(--dsw-alias-label-tertiary); overflow-wrap: anywhere; }
        .cgpt-controls { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; min-width: 0; margin-left: auto; }
        .cgpt-status { display: inline-flex; align-items: center; gap: 6px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
        .cgpt-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--dsw-alias-state-success-primary, #087f5b); }
        .cgpt-dot--error { background: var(--dsw-alias-state-error-primary, #d92d20); }
        /* 状态药丸：与 .cgpt-btn 完全同一套几何（28px 高 / 14px 圆角 / 10px 内边距 / 12px 字），
           只是不可点——保证状态、重新绑定、解绑三个元素同屏等高对齐。 */
        .cgpt-statusPill { display: inline-flex; align-items: center; gap: 6px; height: 28px; border-radius: 14px; padding: 0 10px; font-size: 12px; font-weight: 400; line-height: 18px; white-space: nowrap; }
        .cgpt-statusPill--success { color: var(--dsw-alias-state-success-primary, #087f5b); background: color-mix(in srgb, var(--dsw-alias-state-success-primary, #087f5b) 10%, transparent); }
        .cgpt-statusPill--danger { color: var(--dsw-alias-state-error-primary, #d92d20); background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #d92d20) 10%, transparent); }
        /* 按钮：宿主有原生 Button 时由其接管；这份只是兜底几何（Button.module.css .sm）。 */
        .cgpt-btn { appearance: none; font: inherit; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 4px; height: 28px; border: 0.5px solid var(--dsw-alias-border-l3); color: var(--dsw-alias-label-primary); background: transparent; border-radius: 14px; padding: 0 10px; font-size: 12px; font-weight: 400; line-height: 18px; transition: background-color 120ms ease, border-color 120ms ease; }
        .cgpt-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(128,128,128,0.08)); }
        .cgpt-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }
        .cgpt-btn:disabled { opacity: 0.4; cursor: default; }
        .cgpt-btn--primary { border-color: transparent; background: var(--dsw-alias-button-primary-fill, var(--dsw-alias-label-primary)); color: var(--dsw-alias-label-primary-foreground, #fff); }
        .cgpt-btn--primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover, var(--dsw-alias-label-primary)); opacity: 0.9; }
        /* 危险按钮照原生 .X_2TxG_danger：错误色文字 + 30% 错误色描边 + 8% 错误色 hover 底。 */
        .cgpt-btn--danger { color: var(--dsw-alias-state-error-primary, #d92d20); border-color: color-mix(in srgb, var(--dsw-alias-state-error-primary, #d92d20) 30%, transparent); }
        .cgpt-btn--danger:hover:not(:disabled) { background: color-mix(in srgb, var(--dsw-alias-state-error-primary, #d92d20) 8%, transparent); }
        /* 提示块：三种原生形态 */
        .cgpt-alerts { display: flex; flex-direction: column; gap: 12px; width: 100%; min-width: 0; padding: 0; }
        .cgpt-alert { width: 100%; min-width: 0; margin: 0; font-size: 12px; line-height: 18px; }
        /* 错误：照原生 .X_2TxG_failure（行内 flex + 错误色 + gap 10）+ .X_2TxG_reason（12/18 可换行）。 */
        .cgpt-alert--error { display: flex; align-items: center; gap: 10px; color: var(--dsw-alias-state-error-primary, #d92d20); overflow-wrap: anywhere; white-space: pre-wrap; }
        .cgpt-alertText { flex: 1 1 auto; min-width: 0; }
        .cgpt-alertActions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; margin-left: auto; }
        @media (max-width: 600px) { .cgpt-alert--error { flex-wrap: wrap; } .cgpt-alertActions { margin-left: 0; } }
        .cgpt-alert--warning { background: color-mix(in srgb, var(--dsw-alias-state-warning-primary, #f59e0b) 12%, transparent); color: var(--dsw-alias-label-primary); border-radius: 10px; padding: 8px 12px; }
        .cgpt-note--pre { white-space: pre-line; }
        .cgpt-note { width: 100%; margin: 0; padding: 0; color: var(--dsw-alias-label-tertiary); font-size: 12px; line-height: 18px; overflow-wrap: anywhere; }
        .cgpt-loading { margin: 0; padding: 0 8px; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }
        @media (max-width: 600px) { .cgpt-page { gap: 24px; } .cgpt-row { align-items: flex-start; } .cgpt-controls { justify-content: flex-start; margin-left: 0; } }
        @media (prefers-reduced-motion: reduce) { .cgpt-btn { transition: none; } }
      `;
      document.head.appendChild(style);
    }
    installStyles();

    // 按钮：优先宿主原生 Button（.sm 与插件详情页的「卸载」同一套几何）
    function cgptButton(props) {
      var className = 'cgpt-btn' + (props.className ? ' ' + props.className : '');
      if (NativeButton) {
        return h(NativeButton, {
          type: 'button',
          variant: props.variant || 'outline',
          size: 'sm',
          className: className,
          disabled: props.disabled,
          onClick: props.onClick,
          key: props.key,
        }, props.children);
      }
      return h('button', {
        type: 'button',
        className: className,
        disabled: props.disabled,
        onClick: props.onClick,
        key: props.key,
      }, props.children);
    }

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
        rpc('getCodexBridgeStatus').then(function (s) { setStatus(s); }).catch(function (e) { setStatus({ ok: false, error: { message: '读取状态失败，请刷新页面重试' } }); });
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
            alert('没法开始绑定：' + (res.error && res.error.message || '未知原因'));
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
          alert('绑定时出错：' + e.message);
          setAuthorizing(false);
        });
      }, [authorizing]);

      // 解绑
      var handleUnbind = React.useCallback(function () {
        if (!confirm('确定要解绑吗？\n\n解绑后本机保存的 ChatGPT 登录信息会被删除，需要重新登录一次才能继续用。')) return;
        rpc('unbindCodex').then(function (res) {
          if (res.ok) { load(); } else { alert('解绑失败：' + (res.error && res.error.message || '请重试')); }
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

      // 区块头：照原生 sectionHead（基线对齐、10px 间距、标题 14/500/20）。
      // 只放标题——「这是什么插件」由详情页顶部的 manifest 描述负责，这里不再复述。
      var head = h('div', { className: 'cgpt-sectionHead' },
        h('h4', { className: 'cgpt-title' }, 'ChatGPT 订阅'));
      // 页脚只讲页面级事实（隐私）；「绑定会打开登录页」在使用状态行里随按钮说一次，
      // 「解绑会删本机登录信息」在解绑确认弹窗里说一次——各自只出现一次。
      var note = h('p', { className: 'cgpt-note' },
        '登录信息只保存在这台电脑上，不经过任何第三方服务器。');

      if (!status) {
        return h('div', { className: 'cgpt-page' },
          h('div', { className: 'cgpt-section' }, head),
          h('p', { className: 'cgpt-loading' }, '加载中…'));
      }

      var bound = status.bound;
      var errorMsg = (status.error && status.error.message) || '';

      // 三态：未绑定（中性引导）/ 已连接（绿）/ 需要注意（红，绑定还在但状态异常）。
      // 未绑定绝不显示红字——那不是错误，是正常起点。
      var needsAttention = bound && !!errorMsg;
      var bindLabel = authorizing ? '正在打开浏览器…' : '绑定 ChatGPT 账号';

      var accountDesc = null;
      if (bound && status.account) {
        var parts = [];
        if (status.account.email) parts.push(status.account.email);
        if (status.account.plan) parts.push(status.account.plan + ' 套餐');
        accountDesc = parts.length > 0 ? parts.join(' · ') : '暂时读不到账号信息（不影响使用）';
      }

      var statusDesc = !bound
        ? '还没绑定。点右边的按钮，会打开 OpenAI 官方登录页，登录一次就好。'
        : needsAttention
          ? '绑定还在，但状态不正常，请看下面的红色提示。'
          : (status.expiresAt
            ? ('已连接，登录有效期到 ' + fmtTime(status.expiresAt) + '（还剩 ' + fmtCountdown(status.expiresAt - Date.now()) + '）')
            : '已连接。');

      var statusControls = !bound
        ? [cgptButton({ key: 'auth', onClick: handleAuthorize, disabled: authorizing, children: bindLabel })]
        : [
          h('span', { className: 'cgpt-statusPill ' + (needsAttention ? 'cgpt-statusPill--danger' : 'cgpt-statusPill--success'), key: 'state' },
            h('span', { className: 'cgpt-dot' + (needsAttention ? ' cgpt-dot--error' : '') }),
            needsAttention ? '需要注意' : '已连接'),
          cgptButton({ key: 'reauth', className: '', onClick: handleAuthorize, disabled: authorizing, children: authorizing ? '正在打开浏览器…' : '重新绑定' }),
          cgptButton({ key: 'unbind', className: 'cgpt-btn--danger', onClick: handleUnbind, children: '解绑' }),
        ];

      var rows = [];
      if (accountDesc) {
        rows.push(hList('div', { className: 'cgpt-row', key: 'account' }, [
          h('div', { className: 'cgpt-rowText' },
            h('div', { className: 'cgpt-rowTitle' }, '绑定账号'),
            h('div', { className: 'cgpt-rowDesc' }, accountDesc)),
        ]));
      }
      rows.push(hList('div', { className: 'cgpt-row', key: 'status' }, [
        h('div', { className: 'cgpt-rowText' },
          h('div', { className: 'cgpt-rowTitle' }, '使用状态'),
          h('div', { className: 'cgpt-rowDesc' }, statusDesc)),
        hList('div', { className: 'cgpt-controls' }, statusControls),
      ]));

      // 错误块自带「重新绑定」按钮：看到红字就能直接动手，不用自己找入口。
      var alerts = [];
      if (needsAttention) {
        alerts.push(h('div', { className: 'cgpt-alert cgpt-alert--error', key: 'err', role: 'alert' },
          h('span', { className: 'cgpt-alertText' }, errorMsg),
          h('span', { className: 'cgpt-alertActions' },
            cgptButton({ key: 'fix', className: '', onClick: handleAuthorize, disabled: authorizing, children: authorizing ? '正在打开浏览器…' : '重新绑定' }))));
      }

      return h('div', { className: 'cgpt-page' },
        h('div', { className: 'cgpt-section' }, head),
        hList('div', { className: 'cgpt-section' }, [
          hList('div', { className: 'cgpt-list' }, rows),
          alerts.length > 0 ? hList('div', { className: 'cgpt-alerts' }, alerts) : null,
        ]),
        note);
    }

    function SubscriptionBundleConfig(props) {
      if (props && props.view === 'summary') {
        return h('span', { className: 'dshChatGPTBundleSummary' }, '把你的 ChatGPT 账号绑进 DSH：登录一次，就能在 DSH 里直接用 ChatGPT 模型聊天，底部信息栏会显示剩余额度。');
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

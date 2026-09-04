# Localization

The original Chinese UI is retained in `src/locales.js`; English is the second
built-in dictionary. The UI follows DSH's Settings → General language preference,
without a plugin-specific selector or persisted language state.

## Framework integration

The plugin loads `@deepseek-ai/dsh-client-locale`, injects `locale`, registers
`ctx.locale.register('dsh-chatgpt-subscription', { zh, en })` as an owned effect,
and translates with `ctx.locale.bind('dsh-chatgpt-subscription')`. The settings
slot declares that namespace. DSH's slot renderer subscribes to the locale
revision; its translation seat changes identity on a switch, and the navigation
label is evaluated on every render. No slot re-registration is needed.

These APIs were checked against DSH's
[`dsh-v0.1.2-alpha.4` locale implementation](https://github.com/deepseek-ai/deepseek-harness/tree/dsh-v0.1.2-alpha.4/packages/client/locale)
and current upstream implementation, including actual registration, binding,
subscription, switching and dictionary lookup checks.

## Host and standalone pages

The host reads the supported `ctx.settings.get('locale').preference` on demand.
Only `zh` and `en` are supported here; absent or unsupported preferences retain
the original Chinese host copy. OAuth HTML uses that preference and retains its
existing message escaping and cache headers.

Existing RPCs return display strings. A presentation adapter recognizes only
dictionary-owned strings/templates and translates cached messages when serializing
presentation fields or rendering the client. Payload shapes, machine identifiers,
numeric values and refresh schedules remain unchanged. Client lookup still uses
DSH's bound translator; the adapter owns neither locale selection nor persistence.

DSH intentionally keeps non-loopback browsers' choices process-local. Therefore
an OAuth callback page follows the **host's saved preference**, which can differ
from a remote browser's selection or a provisional browser default. Changing an
already-open standalone callback document requires loading it again. Provider and
operating-system error details, technical HTTP routing diagnostics, brand names,
paths and protocol identifiers retain their original wording.

No locale argument or new request is sent. In particular, this PR retains the
upstream argument-free `startCodexOAuth` and `unbindCodex` calls and asynchronous
popup opening. The separate POST and popup/fallback fixes are excluded.

## Coverage and build

`tests/test-localization.mjs` checks both dictionary key sets and interpolation
parameters, settings/connection states, language switching on existing bindings,
cached messages, host preference normalization, unchanged machine fields, and
escaped callback HTML in both languages. Existing host and client contract checks
remain in the complete suite.

Runtime copy belongs in the dictionaries. Remaining source literals are technical
identifiers, styling, units, upstream HTTP diagnostics, and console-only messages;
comments and Chinese documentation are not runtime translation targets.

`npm run build` copies the host and shared locale sources and embeds the same
dictionary and presentation adapter in the static client bundle. Commit all
generated `lib/` files. Run the complete `npm test` suite after building. These
automated checks do not constitute manual DSH runtime testing.

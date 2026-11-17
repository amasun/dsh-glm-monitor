/**
 * Browser half of the GLM Monitor bundle.
 *
 * Registers one right-sidebar tab type and its body: Zhipu AI subscription
 * quota (5h token window + monthly MCP), model usage and tool usage, with a
 * 24h / 7d / 30d range switch and manual refresh.
 */
window.__ModuleLoader__.load({
  id: 'dsh-glm-monitor',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'glmMonitor'
    const PLUGIN_ID = 'dsh-glm-monitor'
    const TAB_KIND = 'glm-monitor'
    const ROUTE = '/glm-monitor/usage'
    const REFRESH_MS = 10 * 60 * 1000

    const zh = {
      title: 'GLM 用量',
      guideDesc: '查看智谱 AI 套餐用量与剩余额度',
      refresh: '刷新',
      range24: '24 小时',
      range7: '7 天',
      range30: '30 天',
      loading: '正在加载…',
      noKey: '尚未设置智谱 AI API Key，在下方粘贴并保存即可。',
      save: '保存 Key',
      badKey: '当前 Key 无效或已被拒绝，请在下方重新粘贴一个有效 Key，或先删除。',
      currentKey: '当前 Key',
      deleteKey: '删除 Key',
      loadFailed: '查询失败',
      quotaTitle: '配额限制',
      tokenWindow: 'Token 用量（5 小时窗口）',
      mcpMonthly: 'MCP / 工具用量（月度）',
      resetIn: '重置倒计时',
      resetting: '即将重置',
      level: '账户等级',
      used: '已用',
      remaining: '剩余',
      modelTitle: '模型调用量',
      totalCalls: '总调用次数',
      totalTokens: '总 Token 消耗',
      toolTitle: '工具调用量',
      webSearch: '网络搜索',
      webRead: '网页读取',
      zread: 'ZRead',
      searchMcp: 'Search MCP',
      details: '明细',
      times: '次',
    }
    const en = {
      title: 'GLM usage',
      guideDesc: 'Zhipu AI subscription usage and remaining quota',
      refresh: 'Refresh',
      range24: '24 hours',
      range7: '7 days',
      range30: '30 days',
      loading: 'Loading…',
      noKey: 'No Zhipu AI API key set. Paste it below and save.',
      save: 'Save key',
      badKey: 'The current key is invalid or rejected. Paste a valid key below, or delete it first.',
      currentKey: 'Current key',
      deleteKey: 'Delete key',
      loadFailed: 'Query failed',
      quotaTitle: 'Quota limits',
      tokenWindow: 'Token usage (5-hour window)',
      mcpMonthly: 'MCP / tool usage (monthly)',
      resetIn: 'Resets in',
      resetting: 'Resetting soon',
      level: 'Account level',
      used: 'Used',
      remaining: 'Remaining',
      modelTitle: 'Model usage',
      totalCalls: 'Total calls',
      totalTokens: 'Total tokens',
      toolTitle: 'Tool usage',
      webSearch: 'Web search',
      webRead: 'Web read',
      zread: 'ZRead',
      searchMcp: 'Search MCP',
      details: 'Details',
      times: ' calls',
    }

    function barColor(percent) {
      const name = percent >= 90 ? 'error' : percent >= 70 ? 'warn' : 'success'
      return `var(--dsw-alias-state-${name}-primary)`
    }

    function formatRemaining(resetMs, nowMs) {
      const rest = resetMs - nowMs
      if (rest <= 0) return null
      const minutes = Math.floor(rest / 60000)
      const days = Math.floor(minutes / 1440)
      const hours = Math.floor((minutes % 1440) / 60)
      const mins = minutes % 60
      if (days > 0) return `${days}d ${hours}h ${mins}m`
      if (hours > 0) return `${hours}h ${mins}m`
      return `${mins}m`
    }

    function formatNumber(value) {
      return typeof value === 'number' ? value.toLocaleString('en-US') : '—'
    }

    function QuotaBar(props) {
      const { title, percent, resetText, children } = props
      const pct = Math.max(0, Math.min(100, percent ?? 0))
      return h(
        'div',
        {
          style: {
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 12,
            background: 'var(--dsw-alias-bg-layer-1)',
          },
        },
        h(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 } },
          h('div', { style: { fontSize: 13, fontWeight: 600, color: 'var(--dsw-alias-label-primary)' } }, title),
          h(
            'div',
            { style: { fontSize: 13, fontWeight: 600, color: barColor(pct), whiteSpace: 'nowrap' } },
            `${Math.round(percent ?? 0)}%`,
          ),
        ),
        h(
          'div',
          {
            style: {
              height: 8,
              borderRadius: 4,
              margin: '8px 0 6px',
              background: 'var(--dsw-alias-bg-layer-2)',
              overflow: 'hidden',
            },
          },
          h('div', {
            style: {
              height: '100%',
              width: `${pct}%`,
              borderRadius: 4,
              background: barColor(pct),
              transition: 'width .3s',
            },
          }),
        ),
        resetText !== undefined &&
          h(
            'div',
            { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)' } },
            resetText === null ? null : resetText,
          ),
        children,
      )
    }

    function Section(props) {
      return h(
        'div',
        {
          style: {
            border: '1px solid var(--dsw-alias-border-l1)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 12,
            background: 'var(--dsw-alias-bg-layer-1)',
          },
        },
        h(
          'div',
          { style: { fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--dsw-alias-label-primary)' } },
          props.title,
        ),
        props.children,
      )
    }

    function Row(props) {
      return h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', fontSize: 12.5, padding: '3px 0' } },
        h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, props.label),
        h('span', { style: { color: 'var(--dsw-alias-label-primary)', fontWeight: 600 } }, props.value),
      )
    }

    function KeySetup(props) {
      const { t, message, detail, onSaved, masked } = props
      const [value, setValue] = React.useState('')
      const [saving, setSaving] = React.useState(false)
      const [removing, setRemoving] = React.useState(false)
      const [error, setError] = React.useState(null)
      const send = (apiKey, done) => {
        setSaving(apiKey !== '' ? true : false)
        setRemoving(apiKey === '' ? true : false)
        setError(null)
        fetch('/glm-monitor/key', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ apiKey }),
        })
          .then(async (response) => {
            const payload = await response.json().catch(() => null)
            if (!response.ok || !payload?.ok) throw new Error(payload?.error || `HTTP ${response.status}`)
            setValue('')
            done(payload)
          })
          .catch((saveError) => setError(saveError?.message || 'error'))
          .finally(() => {
            setSaving(false)
            setRemoving(false)
          })
      }
      const save = () => {
        const apiKey = value.trim()
        if (!apiKey || saving) return
        send(apiKey, onSaved)
      }
      const remove = () => {
        if (removing) return
        send('', onSaved)
      }
      return h(
        'div',
        { style: { padding: 16, fontSize: 13, lineHeight: 1.6 } },
        h('div', { style: { color: 'var(--dsw-alias-state-warn-primary)', fontWeight: 600 } }, message),
        masked
          ? h(
              'div',
              { style: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 } },
              h('span', { style: { color: 'var(--dsw-alias-label-secondary)' } }, `${t('currentKey')}: `),
              h('code', { style: { color: 'var(--dsw-alias-label-primary)', fontSize: 12 } }, masked),
              h(
                'button',
                {
                  onClick: remove,
                  disabled: removing,
                  style: {
                    fontSize: 12,
                    padding: '3px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--dsw-alias-state-error-primary)',
                    background: 'transparent',
                    color: 'var(--dsw-alias-state-error-primary)',
                    cursor: 'pointer',
                  },
                },
                removing ? '…' : t('deleteKey'),
              ),
            )
          : null,
        detail && h('div', { style: { color: 'var(--dsw-alias-label-secondary)', marginTop: 4 } }, detail),
        h(
          'div',
          { style: { display: 'flex', gap: 8, marginTop: 12 } },
          h('input', {
            type: 'password',
            value,
            placeholder: '智谱 AI API Key',
            onChange: (event) => setValue(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') save()
            },
            style: {
              flex: 1,
              minWidth: 0,
              fontSize: 12.5,
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid var(--dsw-alias-border-l2)',
              background: 'var(--dsw-alias-bg-layer-1)',
              color: 'var(--dsw-alias-label-primary)',
            },
          }),
          h(
            'button',
            {
              onClick: save,
              disabled: saving,
              style: {
                fontSize: 12.5,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--dsw-alias-border-l2)',
                background: 'var(--dsw-alias-brand-primary)',
                color: '#fff',
                cursor: 'pointer',
              },
            },
            saving ? '…' : t('save'),
          ),
        ),
        error && h('div', { style: { color: 'var(--dsw-alias-state-error-primary)', marginTop: 6, fontSize: 12 } }, error),
      )
    }

    function Body() {
      const [hours, setHours] = React.useState(24)
      const [state, setState] = React.useState({ status: 'loading', data: null, error: null })
      const [tick, setTick] = React.useState(0)
      const [masked, setMasked] = React.useState(null)
      const loadedRef = React.useRef('')

      const refreshMasked = React.useCallback(() => {
        fetch('/glm-monitor/key')
          .then((response) => response.json().catch(() => null))
          .then((payload) => setMasked(payload?.ok ? payload.masked || '' : null))
          .catch(() => setMasked(null))
      }, [])

      React.useEffect(() => {
        refreshMasked()
      }, [refreshMasked])

      const load = React.useCallback((range) => {
        setState({ status: 'loading', data: null, error: null })
        fetch(`${ROUTE}?hours=${range}`)
          .then(async (response) => {
            const payload = await response.json().catch(() => null)
            if (!response.ok || !payload || payload.ok !== true) {
              const error = payload && payload.error === 'no-key' ? 'no-key' : payload?.error || `HTTP ${response.status}`
              throw new Error(error)
            }
            return payload
          })
          .then((data) => setState({ status: 'ready', data, error: null }))
          .catch((error) => setState({ status: 'error', data: null, error: error?.message || 'error' }))
      }, [])

      React.useEffect(() => {
        const key = `${hours}`
        if (loadedRef.current === key) return
        loadedRef.current = key
        load(hours)
      }, [hours, load])

      React.useEffect(() => {
        const timer = setInterval(() => load(hours), REFRESH_MS)
        const ticker = setInterval(() => setTick((v) => v + 1), 60000)
        return () => {
          clearInterval(timer)
          clearInterval(ticker)
        }
      }, [hours, load])

      const lang = (document.documentElement.lang || '').toLowerCase()
      const dict = lang.startsWith('zh') ? zh : en
      const t = (key) => dict[key] ?? zh[key] ?? key

      if (state.status === 'loading') {
        return h('div', { style: { padding: 16, fontSize: 13, color: 'var(--dsw-alias-label-secondary)' } }, t('loading'))
      }
      if (state.status === 'error') {
        const noKey = state.error === 'no-key'
        const reload = () => {
          refreshMasked()
          load(hours)
        }
        return h(KeySetup, {
          t,
          message: noKey ? t('noKey') : t('loadFailed'),
          detail: noKey ? null : state.error,
          masked,
          onSaved: reload,
        })
      }

      const data = state.data
      const quota = data.quota?.code === 200 ? data.quota.data : null
      const model = data.model?.code === 200 ? data.model.data : null
      const tool = data.tool?.code === 200 ? data.tool.data : null

      // A rejected key comes back as HTTP 200 with auth failure codes in the
      // payloads, so the panel would otherwise stay "ready" with no way to
      // replace the key. Surface the key form whenever any payload reports it.
      const authFailed = [data.quota, data.model, data.tool].some(
        (payload) => payload && (payload.code === 401 || payload.code === 10006 || /api key|unauthorized|invalid.*key|无效/i.test(String(payload.msg ?? ''))),
      )
      const reload = () => {
        refreshMasked()
        load(hours)
      }

      const tokenLimits = (quota?.limits ?? []).filter((l) => l.type === 'TOKENS_LIMIT')
      const currentWindow =
        tokenLimits.length > 0
          ? tokenLimits.reduce((a, b) => (a.nextResetTime < b.nextResetTime ? a : b))
          : null
      const timeLimit = (quota?.limits ?? []).find((l) => l.type === 'TIME_LIMIT')

      const rangeItems = [
        { value: 24, label: t('range24') },
        { value: 168, label: t('range7') },
        { value: 720, label: t('range30') },
      ]

      return h(
        'div',
        { style: { padding: 16, fontSize: 13, color: 'var(--dsw-alias-label-primary)' } },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } },
          h(
            'select',
            {
              value: hours,
              onChange: (event) => setHours(Number(event.target.value)),
              style: {
                fontSize: 12.5,
                padding: '4px 8px',
                borderRadius: 8,
                border: '1px solid var(--dsw-alias-border-l2)',
                background: 'var(--dsw-alias-bg-layer-1)',
                color: 'var(--dsw-alias-label-primary)',
              },
            },
            rangeItems.map((item) => h('option', { key: item.value, value: item.value }, item.label)),
          ),
          h(
            'button',
            {
              onClick: () => {
                loadedRef.current = ''
                load(hours)
              },
              style: {
                marginLeft: 'auto',
                fontSize: 12.5,
                padding: '4px 12px',
                borderRadius: 8,
                border: '1px solid var(--dsw-alias-border-l2)',
                background: 'var(--dsw-alias-bg-layer-1)',
                color: 'var(--dsw-alias-label-primary)',
                cursor: 'pointer',
              },
            },
            t('refresh'),
          ),
        ),
        authFailed
          ? h(
              'div',
              { style: { marginBottom: 12 } },
              h(KeySetup, { t, message: t('badKey'), masked, onSaved: reload }),
            )
          : null,
        quota
          ? h(
              React.Fragment,
              null,
              h('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-secondary)', marginBottom: 8 } }, `${t('level')}: ${quota.level ?? '—'}`),
              currentWindow
                ? h(QuotaBar, {
                    key: `token-${tick}`,
                    title: t('tokenWindow'),
                    percent: currentWindow.percentage,
                    resetText: `${t('resetIn')}: ${formatRemaining(currentWindow.nextResetTime, data.serverTime) ?? t('resetting')}`,
                  })
                : null,
              timeLimit
                ? h(
                    QuotaBar,
                    { key: `time-${tick}`, title: t('mcpMonthly'), percent: timeLimit.percentage, resetText: undefined },
                    Array.isArray(timeLimit.usageDetails) && timeLimit.usageDetails.length > 0
                      ? h(
                          'div',
                          { style: { marginTop: 6 } },
                          timeLimit.usageDetails
                            .filter((d) => d.usage > 0)
                            .map((d, i) =>
                              h(Row, { key: i, label: d.modelCode, value: `${formatNumber(d.usage)}${t('times')}` }),
                            ),
                        )
                      : null,
                  )
                : null,
            )
          : h('div', { style: { color: 'var(--dsw-alias-state-error-primary)', marginBottom: 12 } }, `${t('quotaTitle')}: ${data.quota?.msg ?? t('loadFailed')}`),
        h(
          Section,
          { title: t('modelTitle') },
          model
            ? h(
                React.Fragment,
                null,
                h(Row, { label: t('totalCalls'), value: formatNumber(model.totalUsage?.totalModelCallCount) }),
                h(Row, { label: t('totalTokens'), value: formatNumber(model.totalUsage?.totalTokensUsage) }),
              )
            : h('div', { style: { color: 'var(--dsw-alias-state-error-primary)' } }, data.model?.msg ?? t('loadFailed')),
        ),
        h(
          Section,
          { title: t('toolTitle') },
          tool
            ? h(
                React.Fragment,
                null,
                h(Row, { label: t('webSearch'), value: formatNumber(tool.totalUsage?.totalNetworkSearchCount) }),
                h(Row, { label: t('webRead'), value: formatNumber(tool.totalUsage?.totalWebReadMcpCount) }),
                h(Row, { label: t('zread'), value: formatNumber(tool.totalUsage?.totalZreadMcpCount) }),
                h(Row, { label: t('searchMcp'), value: formatNumber(tool.totalUsage?.totalSearchMcpCount) }),
                Array.isArray(tool.totalUsage?.toolDetails) && tool.totalUsage.toolDetails.length > 0
                  ? h(
                      'div',
                      { style: { marginTop: 6, borderTop: '1px solid var(--dsw-alias-border-l1)', paddingTop: 6 } },
                      tool.totalUsage.toolDetails.map((d, i) =>
                        h(Row, { key: i, label: d.modelName, value: `${formatNumber(d.totalUsageCount)}${t('times')}` }),
                      ),
                    )
                  : null,
              )
            : h('div', { style: { color: 'var(--dsw-alias-state-error-primary)' } }, data.tool?.msg ?? t('loadFailed')),
        ),
      )
    }

    const inject = ['slots', 'sidebarRightTabs', 'locale']

    function apply(ctx) {
      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'glm-monitor: dictionaries')
      ctx.effect(
        () =>
          ctx.sidebarRightTabs.register({
            id: PLUGIN_ID,
            kind: TAB_KIND,
            title: () => t('title'),
            guide: [{ id: 'glm-usage', title: () => t('title'), description: () => t('guideDesc') }],
          }),
        'glm-monitor: tab type',
      )
      ctx.effect(
        () =>
          ctx.slots.inject('sidebar.right.pane.tab', () =>
            ctx.slots.register({ name: 'sidebar.right.pane.tab', key: PLUGIN_ID, locale: NS }, Body),
          ),
        'glm-monitor: tab body',
      )
    }

    return { inject, apply }
  },
})

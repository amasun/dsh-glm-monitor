/**
 * Host half of the GLM Monitor bundle.
 *
 * Registers one same-origin HTTP route that proxies the Zhipu AI (BigModel)
 * usage monitor endpoints with the configured API key, so the browser half
 * never touches the key and never fights CORS.
 */
const BASE_URL = 'https://open.bigmodel.cn'

export const inject = ['webServer', 'credentials']

const CREDENTIAL_NAME = 'GLM_MONITOR_API_KEY'

function maskKey(key) {
  if (!key) return ''
  if (key.length <= 10) return key.slice(0, 3) + '****'
  return key.slice(0, 6) + '****' + key.slice(-4)
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 64 * 1024) {
        reject(new Error('body too large'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'))
      } catch {
        reject(new Error('invalid JSON body'))
      }
    })
    req.on('error', reject)
  })
}

function formatDateTime(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  )
}

async function fetchMonitor(path, apiKey, params) {
  const url = new URL(BASE_URL + path)
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) url.searchParams.set(key, value)
  }
  const response = await fetch(url, {
    headers: { Authorization: apiKey, Accept: 'application/json' },
    redirect: 'follow',
  })
  const text = await response.text()
  if (!text.trim()) {
    return { code: response.status, msg: `HTTP ${response.status} from ${path}` }
  }
  try {
    return JSON.parse(text)
  } catch {
    return { code: response.status, msg: `Unexpected body from ${path}` }
  }
}

export function apply(ctx, config) {
  const disposers = []
  const currentKey = async () => {
    const hit = await ctx.credentials.resolve(CREDENTIAL_NAME)
    if (hit?.value) return String(hit.value).trim()
    return String(config?.apiKey ?? '').trim()
  }

  const keyRoute = {
    kind: 'exact',
    path: '/glm-monitor/key',
    handler: async (req, res) => {
      try {
        if (req.method === 'GET') {
          res.writeHead(200, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ ok: true, masked: maskKey(await currentKey()) }))
          return
        }
        if (req.method !== 'POST') {
          res.writeHead(405, { 'content-type': 'application/json' })
          res.end(JSON.stringify({ ok: false, error: 'method not allowed' }))
          return
        }
        const body = await readJsonBody(req)
        const apiKey = String(body?.apiKey ?? '').trim()
        if (apiKey) {
          await ctx.credentials.set(CREDENTIAL_NAME, apiKey)
        } else {
          await ctx.credentials.unset(CREDENTIAL_NAME)
        }
        res.writeHead(200, { 'content-type': 'application/json' })
        res.end(JSON.stringify({ ok: true, masked: maskKey(apiKey) }))
      } catch (error) {
        res.writeHead(500, { 'content-type': 'application/json' })
        res.end(JSON.stringify({
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        }))
      }
    },
  }
  disposers.push(ctx.webServer.register(keyRoute))

  const route = {
    kind: 'exact',
    path: '/glm-monitor/usage',
    resource: async (request) => {
      const apiKey = await currentKey()
      if (!apiKey) {
        return Response.json({ ok: false, error: 'no-key' }, { status: 400 })
      }
      let hours = Number(new URL(request.url).searchParams.get('hours'))
      if (![24, 168, 720].includes(hours)) hours = 24
      const endTime = formatDateTime(new Date())
      const startTime = formatDateTime(new Date(Date.now() - hours * 60 * 60 * 1000))
      try {
        const [quota, model, tool] = await Promise.all([
          fetchMonitor('/api/monitor/usage/quota/limit', apiKey),
          fetchMonitor('/api/monitor/usage/model-usage', apiKey, { startTime, endTime }),
          fetchMonitor('/api/monitor/usage/tool-usage', apiKey, { startTime, endTime }),
        ])
        return Response.json({ ok: true, serverTime: Date.now(), hours, quota, model, tool })
      } catch (error) {
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : String(error) },
          { status: 502 },
        )
      }
    },
  }
  disposers.push(ctx.webServer.register(route))
  return () => {
    for (const dispose of disposers) dispose()
  }
}

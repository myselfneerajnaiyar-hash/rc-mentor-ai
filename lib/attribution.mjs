export const ATTRIBUTION_FIELDS = Object.freeze([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'fbc', 'fbp',
])

const UTM_FIELDS = new Set(ATTRIBUTION_FIELDS.slice(0, 5))
const EMAIL_LIKE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i
const PHONE_LIKE = /(?:^|[^A-Za-z0-9])\+?\d(?:[\s().-]*\d){9,}(?:$|[^A-Za-z0-9])/

export function sanitizeAttributionValue(field, input) {
  if (!ATTRIBUTION_FIELDS.includes(field) || typeof input !== 'string') return ''
  const value = input.trim().normalize('NFKC')
  // Reject non-printable input before it reaches a URL or profile JSON field.
  // eslint-disable-next-line no-control-regex
  const containsControlCharacter = /[\u0000-\u001f\u007f]/.test(value)
  if (!value || value.length > 200 || containsControlCharacter || EMAIL_LIKE.test(value)) return ''
  if (UTM_FIELDS.has(field)) {
    if (!/^[\p{L}\p{N}_.:/+ -]+$/u.test(value) || PHONE_LIKE.test(value)) return ''
    return value
  }
  if (field === 'fbc') return /^fb\.\d{1,3}\.\d{8,16}\.[A-Za-z0-9_-]{1,160}$/.test(value) ? value : ''
  if (field === 'fbp') return /^fb\.\d{1,3}\.\d{8,16}\.\d{1,24}$/.test(value) ? value : ''
  return /^[A-Za-z0-9._-]{1,200}$/.test(value) ? value : ''
}

function getParam(params, name) {
  if (params && typeof params.get === 'function') return params.get(name) || ''
  const value = params?.[name]
  return Array.isArray(value) ? String(value[0] || '') : typeof value === 'string' ? value : ''
}

function readTouch(params, prefix = '') {
  return Object.fromEntries(ATTRIBUTION_FIELDS
    .map(field => [field, sanitizeAttributionValue(field, getParam(params, `${prefix}${field}`))])
    .filter(([, value]) => value))
}

export function normalizeAttribution(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { firstTouch: {}, lastTouch: {} }
  const firstTouch = readTouch(value.firstTouch || value.first_touch || {})
  const lastTouch = readTouch(value.lastTouch || value.last_touch || {})
  return { firstTouch, lastTouch }
}

export function attributionFromParams(params) {
  const current = readTouch(params)
  const explicitFirst = readTouch(params, 'first_')
  const explicitLast = readTouch(params, 'last_')
  return {
    firstTouch: Object.keys(explicitFirst).length ? explicitFirst : current,
    lastTouch: Object.keys(explicitLast).length ? explicitLast : current,
  }
}

export function mergeAttribution(query, stored, cookieValues = {}) {
  const current = readTouch(query)
  const explicitFirst = readTouch(query, 'first_')
  const explicitLast = readTouch(query, 'last_')
  const storedValue = normalizeAttribution(stored)
  const latest = { ...(Object.keys(explicitLast).length ? explicitLast : current) }
  for (const field of ['fbc', 'fbp']) {
    if (!latest[field]) {
      const cookieValue = sanitizeAttributionValue(field, cookieValues[field] || '')
      if (cookieValue) latest[field] = cookieValue
    }
  }
  const lastTouch = Object.keys(latest).length ? latest : storedValue.lastTouch
  const firstTouch = Object.keys(explicitFirst).length
    ? explicitFirst
    : Object.keys(storedValue.firstTouch).length ? storedValue.firstTouch : lastTouch
  return { firstTouch, lastTouch }
}

export function attributionParams(value) {
  const { firstTouch, lastTouch } = normalizeAttribution(value)
  const params = new URLSearchParams()
  for (const [field, val] of Object.entries(lastTouch)) params.set(field, val)
  for (const [field, val] of Object.entries(firstTouch)) params.set(`first_${field}`, val)
  return params
}

export function buildAttributedPath(path, attribution, extra = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(extra)) {
    if (typeof value === 'string' && value) params.set(key, value)
  }
  for (const [key, value] of attributionParams(attribution)) params.set(key, value)
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export function buildSignupHref(searchParams) {
  return buildAttributedPath('/signup', attributionFromParams(searchParams))
}

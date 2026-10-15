import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { isTenantContextBypassedRoute } from '../lib/tenant/routePolicy.mjs'

test('the Boot Camp app route and its internal screens bypass the shared tenant-context gate', async () => {
  assert.equal(isTenantContextBypassedRoute('/boot-camp'), true)
  assert.equal(isTenantContextBypassedRoute('/boot-camp/day/2'), true)
  assert.equal(isTenantContextBypassedRoute('/boot-camp/day/2/report'), true)
  assert.equal(isTenantContextBypassedRoute('/pricing'), false)
  const provider = await readFile(new URL('../components/providers/TenantProvider.jsx', import.meta.url), 'utf8')
  assert.match(provider, /if \(bypassTenantContext\) return/)
  assert.match(provider, /if \(bypassTenantContext\) return <TenantContext\.Provider/)
})

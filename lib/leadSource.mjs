const PAID_MEDIA = new Set(['cpc', 'ppc', 'paid', 'paid_search', 'paid_social', 'display', 'paid_media'])
const SEARCH_HOSTS = ['google.', 'bing.com', 'yahoo.', 'duckduckgo.com', 'baidu.com', 'search.brave.com', 'ecosia.org']

function value(input) {
  return typeof input === 'string' ? input.trim() : ''
}

export function classifyLeadSource({ firstTouch = {}, lastTouch = {}, campusAmbassador = '', influencer = '' } = {}) {
  const touch = Object.keys(firstTouch || {}).length ? firstTouch : lastTouch || {}
  const source = value(touch.utm_source).toLowerCase().replace(/^www\./, '')
  const medium = value(touch.utm_medium).toLowerCase()
  const referrer = value(touch.referrer).toLowerCase().replace(/^www\./, '')
  const paidMedium = PAID_MEDIA.has(medium)
  const metaSource = ['facebook', 'instagram', 'meta', 'fb', 'ig'].includes(source)
  const googleSource = ['google', 'adwords', 'googleads'].includes(source)
  let leadSource = 'Other'

  if (value(touch.gclid) || (googleSource && paidMedium)) leadSource = 'Google Ads'
  else if (value(touch.fbclid) || (metaSource && paidMedium)) leadSource = 'Meta Ads'
  else if (value(influencer)) leadSource = 'Influencer'
  else if (value(campusAmbassador)) leadSource = 'Campus Ambassador'
  else if (source === 'referral' || source === 'refer' || value(touch.referral_code)) leadSource = 'Referral'
  else if (['telegram', 't.me', 'telegram.me', 'telegram.org'].includes(source) || /(^|\.)t\.me$|(^|\.)telegram\.(?:me|org)$/.test(referrer)) leadSource = 'Telegram'
  else if (['whatsapp', 'wa', 'wa.me'].includes(source) || /(^|\.)wa\.me$|(^|\.)whatsapp\.com$/.test(referrer)) leadSource = 'WhatsApp'
  else if (['youtube', 'youtu.be'].includes(source) || /(^|\.)youtube\.com$|(^|\.)youtu\.be$/.test(referrer)) leadSource = 'YouTube'
  else if (source === 'instagram' || /(^|\.)instagram\.com$/.test(referrer)) leadSource = 'Instagram Organic'
  else if (source === 'organic' || ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'brave', 'ecosia'].includes(source) || SEARCH_HOSTS.some(suffix => referrer.includes(suffix))) leadSource = 'Organic'
  else if (source === 'direct' || (!source && !referrer)) leadSource = 'Direct'
  else if (source === 'facebook' || referrer.includes('facebook.com')) leadSource = 'Referral'

  const detail = value(influencer) ? `Influencer coupon: ${value(influencer)}`
    : value(campusAmbassador) ? `Campus ambassador referral: ${value(campusAmbassador)}`
      : value(touch.referral_code) ? `Referral code: ${value(touch.referral_code)}`
        : [value(touch.utm_source), referrer ? `referrer=${referrer}` : ''].filter(Boolean).join('; ')

  return {
    lead_source: leadSource,
    source_detail: detail,
    campaign: value(touch.utm_campaign),
    medium: value(touch.utm_medium),
  }
}

// Generates a modern, stylish avatar URL for a user based on their email or name.
// Uses DiceBear "lorelei" style (modern illustrated characters) as the default with vibrant pastel backgrounds.
export async function getGravatarUrl(email: string | undefined, size: number) {
  const normalized = email?.trim().toLowerCase()
  const seed = normalized ?? 'user-avatar'
  let hash = ''

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(seed))
      hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
    } catch {
      hash = simpleHash(seed)
    }
  } else {
    hash = simpleHash(seed)
  }

  // Try Gravatar first if valid email; fallback to DiceBear lorelei
  if (normalized && hash.length === 64) {
    const gravatarUrl = `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`
    try {
      const res = await fetch(gravatarUrl, { method: 'HEAD' })
      if (res.ok) return gravatarUrl
    } catch {
      // Fall through to stylish DiceBear
    }
  }

  // DiceBear lorelei — modern, attractive character avatar
  return `https://api.dicebear.com/9.x/lorelei/svg?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=b6e3f4,c0aede,d1f4cc,ffdfbf,ffd5dc,e0e7ff,fce7f3&radius=50`
}

function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

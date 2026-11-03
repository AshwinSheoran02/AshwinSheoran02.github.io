function normalizeBaseUrl(value: string) {
  const trimmed = value.trim()
  // A relative base (used for self-contained preview builds) keeps asset paths relative too.
  if (trimmed === '' || trimmed === '.' || trimmed === './') return './'
  const path = trimmed.replace(/^\/+|\/+$/g, '')
  return path ? `/${path}/` : '/'
}

const publicBaseUrl = normalizeBaseUrl(import.meta.env.BASE_URL)

export function publicAsset(path: string): string {
  return `${publicBaseUrl}${path.replace(/^\/+/, '')}`
}

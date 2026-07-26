function normalizeBaseUrl(value: string) {
  const path = value.trim().replace(/^\/+|\/+$/g, '')
  return path ? `/${path}/` : '/'
}

const publicBaseUrl = normalizeBaseUrl(import.meta.env.BASE_URL)

export function publicAsset(path: string): string {
  return `${publicBaseUrl}${path.replace(/^\/+/, '')}`
}

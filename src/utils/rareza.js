// Color por familia de rareza (tokens definidos en index.css).
export function rarezaColor(rareza = '') {
  const r = rareza.toLowerCase()
  if (r.includes('starlight') || r.includes('quarter century'))
    return 'var(--rar-starlight)'
  if (r.includes('secret') || r.includes('ultimate') || r.includes('ghost'))
    return 'var(--rar-secret)'
  if (r.includes('ultra') || r.includes('gold') || r.includes('collector'))
    return 'var(--rar-ultra)'
  if (r.includes('super')) return 'var(--rar-super)'
  return 'var(--rar-common)'
}

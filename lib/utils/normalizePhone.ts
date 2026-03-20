// lib/utils/normalizePhone.ts
// Fonction centralisée — à importer partout dans Vendify

export function normalizePhone(raw: string): string {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''

  const CI = '225'

  // Déjà correct : 225 + 9 chiffres = 12 chiffres
  if (p.startsWith('225') && p.length === 12) return p

  // Double préfixe : 2250XXXXXXXXX = 13 chiffres → enlever le 0
  if (p.startsWith('2250') && p.length === 13) return '225' + p.slice(4)

  // Autres pays déjà en format international
  for (const prefix of ['221', '229', '237', '228', '33', '1']) {
    if (p.startsWith(prefix) && p.length >= 11) return p
  }

  // Local CI 10 chiffres avec 0 (ex: 0715469666)
  if (p.length === 10 && p.startsWith('0')) return CI + p.slice(1)

  // Local CI 9 chiffres sans 0 (ex: 715469666)
  if (p.length === 9) return CI + p

  // Local CI 8 chiffres
  if (p.length === 8) return CI + p

  // Local CI 10 chiffres sans 0
  if (p.length === 10) return CI + p

  return p
}
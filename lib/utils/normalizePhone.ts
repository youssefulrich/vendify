// lib/utils/normalizePhone.ts
// Format correct : 225 + 0 + 9 chiffres = 2250715469666

export function normalizePhone(raw: string): string {
  if (!raw) return ''
  let p = raw.replace(/[\s\-().+]/g, '').replace(/\D/g, '')
  if (!p || p.length < 8) return ''
  // Déjà correct : 2250 + 9 chiffres = 13
  if (p.startsWith('2250') && p.length === 13) return p
  // 225 + 9 chiffres sans le 0 → corriger en ajoutant le 0
  if (p.startsWith('225') && p.length === 12) return '2250' + p.slice(3)
  // Local avec 0 : 0715469666 → 2250715469666
  if (p.startsWith('0') && p.length === 10) return '225' + p
  // Local sans 0 : 715469666 → 2250715469666
  if (p.length === 9) return '2250' + p
  return p
}
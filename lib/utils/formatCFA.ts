export function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-CI', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(amount) + ' FCFA'
}

// Ex: formatCFA(75000) → "75 000 FCFA"

export function formatCFAShort(amount: number): string {
  if (amount >= 1_000_000) {
    return (amount / 1_000_000).toFixed(1).replace('.0', '') + 'M FCFA'
  }
  if (amount >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'k FCFA'
  }
  return formatCFA(amount)
}

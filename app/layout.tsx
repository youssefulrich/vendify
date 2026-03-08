import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Vendify — Gestion de boutique',
  description: 'Gérez vos commandes, stock et bénéfices facilement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}

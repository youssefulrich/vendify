export async function sendWhatsApp(phone: string, message: string) {
  const idInstance = process.env.GREEN_API_ID
  const apiToken = process.env.GREEN_API_TOKEN

  // Normaliser le numéro vers format international
  let p = phone.replace(/\D/g, '')

  if (p.length === 8)  p = '22507' + p        // 8 chiffres CI ancien format
  if (p.length === 9)  p = '2250' + p         // 9 chiffres → 225 + 0 + 9
  if (p.length === 10 && p.startsWith('0')) p = '225' + p.slice(1)  // 0XXXXXXXXX
  if (p.length === 10 && !p.startsWith('225')) p = '225' + p        // 10 chiffres sans indicatif

  const chatId = p + '@c.us'

  console.log('sendWhatsApp → chatId:', chatId)

  const res = await fetch(
    `https://7107.api.greenapi.com/waInstance${idInstance}/sendMessage/${apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    }
  )

  const result = await res.json()
  console.log('Green API response:', result)
  return result
}
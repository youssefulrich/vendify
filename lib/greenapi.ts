export async function sendWhatsApp(phone: string, message: string) {
  const idInstance = process.env.GREEN_API_ID
  const apiToken = process.env.GREEN_API_TOKEN

  let p = phone.replace(/\D/g, '')

  if (p.length === 13 && p.startsWith('2250')) {
    // déjà bon → 2250XXXXXXXXX
  } else if (p.length === 12 && p.startsWith('225')) {
    p = '225' + '0' + p.slice(3)   // 225XXXXXXXXX → 2250XXXXXXXXX
  } else if (p.length === 10 && p.startsWith('0')) {
    p = '225' + p                   // 0715469666 → 2250715469666
  } else if (p.length === 9) {
    p = '2250' + p                  // 715469666 → 2250715469666
  } else if (p.length === 8) {
    p = '22505' + p
  }

  const chatId = p + '@c.us'

  console.log('sendWhatsApp → phone entré:', phone, '→ chatId:', chatId)

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
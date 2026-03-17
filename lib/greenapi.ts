export async function sendWhatsApp(phone: string, message: string) {
  const idInstance = process.env.GREEN_API_ID
  const apiToken = process.env.GREEN_API_TOKEN

  const chatId = phone.replace(/\D/g, '') + '@c.us'

  const res = await fetch(
    `https://7107.api.greenapi.com/waInstance${idInstance}/sendMessage/${apiToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, message }),
    }
  )

  return res.json()
}
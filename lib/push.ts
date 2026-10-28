export async function sendPushNotification({
  token,
  title,
  body,
  data = {},
}: {
  token: string
  title: string
  body: string
  data?: Record<string, string>
}) {
  if (!token?.startsWith('ExponentPushToken')) return

  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  })
}

import './globals.css'

export const metadata = {
  title: 'Photo Tournament',
  description: 'AI-powered photo tournament viewer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
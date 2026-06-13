import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Taskify — Your Daily Task Manager',
  description: 'A beautiful, full-stack task management app to manage your daily tasks. Create, organize, and track tasks with priority levels and due dates.',
  keywords: ['task manager', 'todo app', 'productivity', 'taskify'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body>{children}</body>
    </html>
  )
}

'use client'

interface Props {
  type: 'success' | 'error' | 'info'
  message: string
}

const icons = { success: '✓', error: '✕', info: 'ℹ' }

export default function Toast({ type, message }: Props) {
  return (
    <div className={`toast ${type}`} role="alert" aria-live="polite">
      <span>{icons[type]}</span>
      {message}
    </div>
  )
}

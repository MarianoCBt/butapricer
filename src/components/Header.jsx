import { useState } from 'react'
import { config } from '../config'

export default function Header({ onInicio }) {
  const [sinLogo, setSinLogo] = useState(false)

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onInicio}
          className="flex items-center gap-3 rounded-lg px-1 py-1 opacity-100 transition-opacity duration-150 hover:opacity-80"
        >
          {sinLogo ? (
            <span className="text-2xl">🐗</span>
          ) : (
            <img
              src={config.logo}
              alt=""
              className="h-9 w-9 object-contain"
              onError={() => setSinLogo(true)}
            />
          )}
          <span className="text-left">
            <span className="block text-lg font-bold leading-tight text-[var(--color-ink)]">
              {config.appName}
            </span>
            <span className="block text-xs leading-tight text-[var(--color-muted)]">
              {config.tagline}
            </span>
          </span>
        </button>
      </div>
    </header>
  )
}

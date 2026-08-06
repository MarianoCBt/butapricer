import { useState } from 'react'
import { config } from '../config'

export default function Header({ onInicio, onLista, cantidadLista = 0 }) {
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

        <button
          type="button"
          onClick={onLista}
          className="ml-auto flex min-h-9 items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-muted)] transition-colors duration-150 hover:border-[var(--color-brand)] hover:text-[var(--color-ink)]"
        >
          <span aria-hidden="true">🧾</span>
          <span className="hidden sm:inline">Lista</span>
          {cantidadLista > 0 && (
            <span className="tabular rounded-full bg-[var(--color-brand)] px-1.5 py-0.5 text-xs font-semibold text-white">
              {cantidadLista}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}

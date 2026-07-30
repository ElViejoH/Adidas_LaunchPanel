import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  test('muestra la etiqueta pública de un estado conocido', () => {
    render(<StatusBadge status="IN_REVIEW" />)
    expect(screen.getByText('En revisión')).toBeInTheDocument()
  })

  test('conserva un estado desconocido como fallback visible', () => {
    render(<StatusBadge status="BLOCKED" />)
    expect(screen.getByText('BLOCKED')).toBeInTheDocument()
  })

  test.each([
    ['CHANGES_REQUESTED', 'Cambios solicitados'],
    ['REJECTED', 'Rechazado'],
  ])('representa el resultado de revisión %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

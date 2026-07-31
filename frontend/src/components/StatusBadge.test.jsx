import { render, screen } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  test('shows the public label for a known status', () => {
    render(<StatusBadge status="IN_REVIEW" />)
    expect(screen.getByText('En revisión')).toBeInTheDocument()
  })

  test('keeps an unknown status as a visible fallback', () => {
    render(<StatusBadge status="BLOCKED" />)
    expect(screen.getByText('BLOCKED')).toBeInTheDocument()
  })

  test.each([
    ['DRAFT', 'Borrador', 'bg-zinc-100'],
    ['IN_REVIEW', 'En revisión', 'border-orange-600'],
    ['CHANGES_REQUESTED', 'Cambios solicitados', 'border-yellow-500'],
    ['APPROVED', 'Aprobado', 'border-emerald-700'],
    ['PUBLISHED', 'Publicado', 'border-blue-700'],
    ['REJECTED', 'Rechazado', 'border-red-700'],
  ])('represents the %s status with its semantic color', (status, label, colorClass) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toHaveClass(colorClass)
  })

  test.each(['IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'PUBLISHED', 'REJECTED'])(
    'keeps a white background for the %s status',
    (status) => {
      const { container } = render(<StatusBadge status={status} />)
      expect(container.firstChild).toHaveClass('bg-white')
    },
  )
})

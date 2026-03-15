import React from 'react'
import './Chip.css'

interface ChipProps {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
}

export const Chip: React.FC<ChipProps> = ({
  children,
  active = false,
  onClick,
  className = '',
}) => {
  return (
    <button
      className={`chip ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

interface BadgeProps {
  children: React.ReactNode
  variant?: 'main' | 'sub' | 'cron' | 'group'
  className?: string
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'main',
  className = '',
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  )
}
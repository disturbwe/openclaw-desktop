import React from 'react'
import './Button.css'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'primary' | 'danger'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  className?: string
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'default',
  size = 'medium',
  disabled = false,
  className = '',
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
import React from 'react'
import './Card.css'

interface CardProps {
  children: React.ReactNode
  title?: string
  className?: string
  onClick?: () => void
}

export const Card: React.FC<CardProps> = ({ children, title, className = '', onClick }) => {
  return (
    <div className={`card ${className}`} onClick={onClick}>
      {title && <div className="card-title">{title}</div>}
      {children}
    </div>
  )
}

interface MetricCardProps {
  icon: string
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  subtitle,
  trend,
  className = '',
}) => {
  return (
    <Card className={`metric-card ${className}`}>
      <div className="metric">
        <div className="metric-header">
          <span className="metric-icon">{icon}</span>
          <span className="metric-label">{label}</span>
        </div>
        <div className={`metric-value ${trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'accent'}`}>
          {value}
        </div>
        {subtitle && (
          <div className="metric-subtitle">
            {subtitle}
          </div>
        )}
      </div>
    </Card>
  )
}
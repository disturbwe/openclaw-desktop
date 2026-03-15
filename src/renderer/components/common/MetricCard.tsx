import React from 'react'
import { Card, Statistic } from 'antd'
import type { StatisticProps } from 'antd'

interface MetricCardProps extends Omit<StatisticProps, 'value'> {
  icon?: React.ReactNode
  value: string | number
}

export const MetricCard: React.FC<MetricCardProps> = ({ icon, value, ...props }) => {
  return (
    <Card className="metric-card">
      <Statistic
        value={value}
        prefix={icon}
        {...props}
      />
    </Card>
  )
}
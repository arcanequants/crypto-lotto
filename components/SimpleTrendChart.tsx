'use client'

// Simple SVG trend chart component
// No external dependencies, just pure SVG

interface DataPoint {
  label: string
  value: number
}

interface SimpleTrendChartProps {
  data: DataPoint[]
  color?: string
  height?: number
  showLabels?: boolean
}

export default function SimpleTrendChart({
  data,
  color = '#00F0FF',
  height = 120,
  showLabels = true,
}: SimpleTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
        No data available
      </div>
    )
  }

  const width = 600
  const padding = 40
  const chartWidth = width - padding * 2
  const chartHeight = height - padding

  // Find min/max values
  const values = data.map((d) => d.value)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values, 0)
  const valueRange = maxValue - minValue || 1

  // Create points for the line
  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight
    return { x, y, ...point }
  })

  // Create SVG path
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Create area path (fill under the line)
  const areaData = `
    M ${points[0].x} ${padding + chartHeight}
    L ${points[0].x} ${points[0].y}
    ${points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')}
    L ${points[points.length - 1].x} ${padding + chartHeight}
    Z
  `

  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', maxWidth: '100%' }}
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + chartHeight - ratio * chartHeight
          return (
            <line
              key={ratio}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="1"
            />
          )
        })}

        {/* Area fill */}
        <path d={areaData} fill={color} fillOpacity="0.1" />

        {/* Line */}
        <path d={pathData} stroke={color} strokeWidth="2" fill="none" />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="4" fill={color} />
            {showLabels && (
              <text
                x={point.x}
                y={padding + chartHeight + 20}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-dim)"
              >
                {point.label}
              </text>
            )}
          </g>
        ))}

        {/* Value labels on Y axis */}
        {[0, 0.5, 1].map((ratio) => {
          const y = padding + chartHeight - ratio * chartHeight
          const value = minValue + ratio * valueRange
          return (
            <text
              key={ratio}
              x={padding - 10}
              y={y + 4}
              textAnchor="end"
              fontSize="10"
              fill="var(--text-dim)"
            >
              {value.toFixed(0)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

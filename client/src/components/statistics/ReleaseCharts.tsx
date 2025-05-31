import React, { useState, useRef, useEffect } from 'react'

interface ReleaseChartsProps {
  stats: {
    yearlyReleases: number
    monthlyStats: Array<{ month: string; count: number }>
    weeklyStats: Array<{ day: string; count: number }>
    dailyStats: Array<{ hour: string; count: number }>
  }
}

function getYTicks(max: number, height: number) {
  // 최대값, 중간값, 0
  return [max, Math.round(max / 2), 0].map((v, i) => ({
    value: v,
    y: height - (v / max) * height
  }))
}

export function ReleaseCharts({ stats }: ReleaseChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const parent = containerRef.current.parentElement
        if (parent) {
          const parentStyle = window.getComputedStyle(parent)
          const parentPadding = parseFloat(parentStyle.paddingLeft) + parseFloat(parentStyle.paddingRight)
          setContainerWidth(parent.clientWidth - parentPadding)
        }
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // 연간
  const monthlyData = stats.monthlyStats.map(m => m.count)
  const maxMonthly = Math.max(...monthlyData, 1)

  // 주간: 월~금만 필터링
  const weekdays = ['월', '화', '수', '목', '금']
  const filteredWeeklyStats = stats.weeklyStats.filter(d => weekdays.includes(d.day))
  const weeklyData = filteredWeeklyStats.map(d => d.count)
  const maxWeekly = Math.max(...weeklyData, 1)
  const weeklyTotal = weeklyData.reduce((sum, d) => sum + d, 0)

  // 일간: 오늘 날짜의 0~23시만 추출
  const today = new Date()
  const todayHours = Array.from({ length: 24 }, (_, i) => i)
  const filteredDailyStats = todayHours.map(hour => {
    const found = stats.dailyStats.find(h => Number(h.hour) === hour)
    return found ? found : { hour, count: 0 }
  })
  const dailyData = filteredDailyStats.map(h => h.count)
  const maxDaily = Math.max(...dailyData, 1)
  const dailyTotal = dailyData.reduce((sum, d) => sum + d, 0)

  // SVG viewBox 크기
  const height = 120
  const leftPad = 40  // y축 여백
  const rightPad = 16 // 오른쪽 여백
  const bottomPad = 32

  // 툴팁 상태
  const [hover, setHover] = useState<{ type: string; idx: number } | null>(null)

  // 막대그래프 렌더 함수 (viewBox 기준)
  function renderBarGraph({ data, max, labels, type }: { data: number[]; max: number; labels: (string|number)[]; type: string }) {
    const availableWidth = containerWidth - leftPad - rightPad
    const minBarWidth = 24
    const gap = 8
    const totalGaps = data.length - 1
    const barWidth = Math.max(minBarWidth, (availableWidth - totalGaps * gap) / data.length)
    const graphWidth = data.length * barWidth + totalGaps * gap
    const svgWidth = leftPad + graphWidth + rightPad

    return (
      <div className="w-full" style={{ overflow: 'visible' }}>
        <svg
          width={svgWidth}
          height={height + bottomPad}
          viewBox={`0 0 ${svgWidth} ${height + bottomPad}`}
          style={{ overflow: 'visible', display: 'block', maxWidth: '100%' }}
        >
          {/* y축 눈금 */}
          {getYTicks(max, height).map((tick, i) => (
            <g key={i}>
              <text x={leftPad - 8} y={tick.y + 16} fontSize={12} fill="#aaa" textAnchor="end">{tick.value}</text>
              <line x1={leftPad} x2={svgWidth - rightPad} y1={tick.y + 16} y2={tick.y + 16} stroke="#eee" />
            </g>
          ))}
          {/* 막대그래프 */}
          {data.map((v, i) => {
            const x = leftPad + i * (barWidth + gap)
            const y = 16 + height - (v / max) * height
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={(v / max) * height}
                  fill="#fb923c"
                  rx={4}
                  onMouseEnter={() => setHover({ type, idx: i })}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: 'pointer' }}
                />
                {renderTooltip(type, i, x + barWidth/2, y, v)}
              </g>
            )
          })}
          {/* x축 라벨 */}
          {labels.map((label, i) => {
            const x = leftPad + i * (barWidth + gap) + barWidth/2
            return (
              <text
                key={i}
                x={x}
                y={height + 28}
                fontSize={12}
                fill="#aaa"
                textAnchor="middle"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    )
  }

  // 툴팁 렌더 함수
  function renderTooltip(type: string, idx: number, x: number, y: number, value: number) {
    if (!hover || hover.type !== type || hover.idx !== idx) return null
    return (
      <g pointerEvents="none" className="z-10">
        <rect x={x - 22} y={y - 38} width={44} height={24} rx={6} fill="#fff" stroke="#fb923c" />
        <text x={x} y={y - 22} textAnchor="middle" fontSize={14} fill="#fb923c" fontWeight={700}>{value}</text>
      </g>
    )
  }

  return (
    <div className="space-y-6 mt-8" ref={containerRef}>
      {/* 연간 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">연간 배포수</h3>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{stats.yearlyReleases}</span>
        </div>
        {renderBarGraph({ data: monthlyData, max: maxMonthly, labels: stats.monthlyStats.map(m => m.month), type: 'monthly' })}
      </div>
      {/* 주간 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">주간 배포수</h3>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{weeklyTotal}</span>
        </div>
        {renderBarGraph({ data: weeklyData, max: maxWeekly, labels: filteredWeeklyStats.map(d => d.day), type: 'weekly' })}
      </div>
      {/* 일간 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900">일간 배포수</h3>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{dailyTotal}</span>
        </div>
        {renderBarGraph({ data: dailyData, max: maxDaily, labels: filteredDailyStats.map(h => h.hour), type: 'daily' })}
      </div>
    </div>
  )
} 
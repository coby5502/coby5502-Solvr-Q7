import React, { useState, useRef, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'

interface Release {
  published_at: string // ISO date string
}

interface ReleaseChartsProps {
  releases: Release[]
}

// 한국 시간대로 변환하는 유틸리티 함수
function toKST(date: Date): Date {
  return new Date(date.getTime() + (9 * 60 * 60 * 1000))
}

function getYTicks(max: number, height: number) {
  return [max, Math.round(max / 2), 0].map((v) => ({
    value: v,
    y: height - (v / max) * height
  }))
}

function getYearMonthDay(date: Date) {
  const kstDate = toKST(date)
  return {
    year: kstDate.getFullYear(),
    month: kstDate.getMonth() + 1,
    day: kstDate.getDate()
  }
}

function getWeeksInMonth(year: number, month: number) {
  // month: 1~12
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  let weeks: { start: number; end: number }[] = []
  let current = new Date(firstDay)

  // 첫 월요일 찾기
  while (current.getDay() !== 1 && current <= lastDay) {
    current.setDate(current.getDate() + 1)
  }

  while (current <= lastDay) {
    const start = current.getDate()
    let end = start
    for (let i = 1; i < 5 && current < lastDay; i++) {
      current.setDate(current.getDate() + 1)
      end = current.getDate()
    }
    // 주의 첫날이 해당 월에 속할 때만 추가, 그리고 3일 이상만 주차로 인정
    const weekStart = new Date(year, month - 1, start)
    const weekEnd = new Date(year, month - 1, end)
    // 주의 끝이 월을 넘어가면, 월의 마지막 날로 제한
    if (weekEnd > lastDay) weekEnd.setDate(lastDay.getDate())
    // 실제로 해당 월에 포함된 일수 계산
    const daysInMonth = Array.from({ length: (weekEnd.getDate() - weekStart.getDate() + 1) }, (_, i) => weekStart.getDate() + i)
      .filter(d => d >= 1 && d <= lastDay.getDate())
    if (weekStart.getMonth() === month - 1 && daysInMonth.length >= 3) {
      weeks.push({ start: weekStart.getDate(), end: weekEnd.getDate() })
    }
    current.setDate(end + 1)
    // 다음 월요일로 이동
    while (current.getDay() !== 1 && current <= lastDay) {
      current.setDate(current.getDate() + 1)
    }
  }
  return weeks
}

export function ReleaseCharts({ releases }: ReleaseChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // 연간 state - 한국 시간 기준
  const years = Array.from(new Set(releases.map(r => toKST(new Date(r.published_at)).getFullYear()))).sort((a, b) => b - a)
  const [selectedYear, setSelectedYear] = useState(years[0] || toKST(new Date()).getFullYear())

  // 주간 state - 한국 시간 기준
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const [selectedMonth, setSelectedMonth] = useState(toKST(new Date()).getMonth() + 1)
  const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth)
  const [selectedWeek, setSelectedWeek] = useState(1)

  // 일간 state - 한국 시간 기준
  const [selectedDate, setSelectedDate] = useState<Date>(toKST(new Date()))

  // 일간: 캘린더 팝업 open 상태
  const [calendarOpen, setCalendarOpen] = useState(false)

  // 오늘이 포함된 주차 index (주간 미래 주차 비활성화용) - 한국 시간 기준
  const today = toKST(new Date())
  const isCurrentMonth = selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1
  const currentWeeks = getWeeksInMonth(today.getFullYear(), today.getMonth() + 1)
  const todayWeekIdx = isCurrentMonth ? currentWeeks.findIndex(w => today.getDate() >= w.start && today.getDate() <= w.end) : -1
  const isLastWeek = isCurrentMonth ? selectedWeek >= todayWeekIdx + 1 : selectedWeek === weeksInMonth.length

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

  // 연간 데이터 집계 - 한국 시간 기준
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1
    if (selectedYear === today.getFullYear() && month > today.getMonth() + 1) return null
    return releases.filter(r => {
      const d = toKST(new Date(r.published_at))
      return d.getFullYear() === selectedYear && d.getMonth() + 1 === month
    }).length
  }).filter(v => v !== null) as number[]
  const maxMonthly = Math.max(...monthlyData, 1)

  // 주간 데이터 집계 - 한국 시간 기준
  const weeks = getWeeksInMonth(selectedYear, selectedMonth)
  const weekRange = weeks[selectedWeek - 1] || { start: 1, end: 1 }
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    // 월~금 날짜
    const date = new Date(selectedYear, selectedMonth - 1, weekRange.start + i)
    if (date.getMonth() + 1 !== selectedMonth || date.getDate() > weekRange.end) return null
    return date
  }).filter(Boolean) as Date[]
  const weekLabels = ['월', '화', '수', '목', '금'].slice(0, weekDates.length)
  const weeklyData = weekDates.map(date => {
    const kstDate = toKST(date)
    return releases.filter(r => {
      const releaseDate = toKST(new Date(r.published_at))
      return releaseDate.getFullYear() === kstDate.getFullYear() &&
             releaseDate.getMonth() === kstDate.getMonth() &&
             releaseDate.getDate() === kstDate.getDate()
    }).length
  })
  const maxWeekly = Math.max(...weeklyData, 1)
  const weeklyTotal = weeklyData.reduce((a, b) => a + b, 0)

  // 일간 데이터 집계 - 한국 시간 기준
  const dayHours = Array.from({ length: 24 }, (_, i) => i)
  const dayDateStr = toKST(selectedDate).toISOString().slice(0, 10)
  const dailyData = dayHours.map(hour => {
    return releases.filter(r => {
      const d = toKST(new Date(r.published_at))
      return d.toISOString().slice(0, 10) === dayDateStr && d.getHours() === hour
    }).length
  })
  const maxDaily = Math.max(...dailyData, 1)
  const dailyTotal = dailyData.reduce((a, b) => a + b, 0)

  // SVG viewBox 크기
  const height = 120
  const leftPad = 40
  const rightPad = 16
  const bottomPad = 32

  // 툴크 상태
  const [hover, setHover] = useState<{ type: string; idx: number } | null>(null)

  // 연간 화살표 비활성화
  const yearIdx = years.indexOf(selectedYear)
  const isFirstYear = yearIdx === years.length - 1
  const isLastYear = yearIdx === 0

  // 주간 화살표 비활성화
  const isFirstWeek = selectedWeek === 1

  // 주간: 오늘이 포함된 주차가 기본 - 한국 시간 기준
  useEffect(() => {
    const today = toKST(new Date())
    if (selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1) {
      const weeks = getWeeksInMonth(selectedYear, selectedMonth)
      const day = today.getDate()
      const weekIdx = weeks.findIndex(w => day >= w.start && day <= w.end)
      if (weekIdx !== -1) setSelectedWeek(weekIdx + 1)
    }
  }, [selectedYear, selectedMonth])

  // 주간: 화살표 이동 로직 개선 - 한국 시간 기준
  const handlePrevWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1)
    } else if (selectedMonth > 1) {
      const prevMonth = selectedMonth - 1
      const prevWeeks = getWeeksInMonth(selectedYear, prevMonth)
      setSelectedMonth(prevMonth)
      setSelectedWeek(prevWeeks.length)
    } else if (selectedYear > Math.min(...years)) {
      const prevYear = selectedYear - 1
      setSelectedYear(prevYear)
      setSelectedMonth(12)
      const prevWeeks = getWeeksInMonth(prevYear, 12)
      setSelectedWeek(prevWeeks.length)
    }
  }

  const handleNextWeek = () => {
    // 미래 주차만 비활성화 - 한국 시간 기준
    const isFuture = (() => {
      const nextWeek = selectedWeek < weeks.length ? selectedWeek + 1 : 1
      const nextMonth = selectedWeek < weeks.length ? selectedMonth : (selectedMonth < 12 ? selectedMonth + 1 : 1)
      const nextYear = selectedWeek < weeks.length ? selectedYear : (selectedMonth < 12 ? selectedYear : selectedYear + 1)
      const nextWeeks = getWeeksInMonth(nextYear, nextMonth)
      const nextWeekRange = nextWeeks[nextWeek - 1] || { start: 1, end: 1 }
      const nextWeekDate = toKST(new Date(nextYear, nextMonth - 1, nextWeekRange.end))
      return nextWeekDate > today
    })()
    if (isFuture) return
    if (selectedWeek < weeks.length) {
      setSelectedWeek(selectedWeek + 1)
    } else if (selectedMonth < 12) {
      const nextMonth = selectedMonth + 1
      setSelectedMonth(nextMonth)
      setSelectedWeek(1)
    } else if (selectedYear < Math.max(...years)) {
      setSelectedYear(selectedYear + 1)
      setSelectedMonth(1)
      setSelectedWeek(1)
    }
  }

  // 미래 주차만 비활성화 - 한국 시간 기준
  const isNextWeekFuture = (() => {
    const nextWeek = selectedWeek < weeks.length ? selectedWeek + 1 : 1
    const nextMonth = selectedWeek < weeks.length ? selectedMonth : (selectedMonth < 12 ? selectedMonth + 1 : 1)
    const nextYear = selectedWeek < weeks.length ? selectedYear : (selectedMonth < 12 ? selectedYear : selectedYear + 1)
    const nextWeeks = getWeeksInMonth(nextYear, nextMonth)
    const nextWeekRange = nextWeeks[nextWeek - 1] || { start: 1, end: 1 }
    const nextWeekDate = toKST(new Date(nextYear, nextMonth - 1, nextWeekRange.end))
    return nextWeekDate > today
  })()

  // 버튼 스타일 통일
  const arrowBtn = (disabled: boolean) =>
    `rounded-full p-1.5 text-lg transition-colors ${disabled ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`

  // 꺾은선그래프 곡선 path 계산 (Cubic Bezier)
  function getLinePath(points: { x: number, y: number }[]) {
    if (points.length < 2) return ''
    let d = `M${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const cpx = (prev.x + curr.x) / 2
      d += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`
    }
    return d
  }

  function renderBarGraph({ data, max, labels, type }: { data: number[]; max: number; labels: (string | number)[]; type: string }) {
    const availableWidth = containerWidth - leftPad - rightPad
    const minBarWidth = 24
    const gap = 8
    const totalGaps = data.length - 1
    const barWidth = Math.max(minBarWidth, (availableWidth - totalGaps * gap) / data.length)
    const graphWidth = data.length * barWidth + totalGaps * gap
    const svgWidth = leftPad + graphWidth + rightPad

    const points = data.map((v, i) => {
      const x = leftPad + i * (barWidth + gap) + barWidth / 2
      const y = 16 + height - (v / max) * height
      return { x, y }
    })
    const linePath = getLinePath(points)

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
                {renderTooltip(type, i, x + barWidth / 2, y, v)}
              </g>
            )
          })}
          {/* 꺾은선그래프 (곡선) */}
          <path
            d={linePath}
            fill="none"
            stroke="#a78bfa"
            strokeWidth={2.5}
            style={{ filter: 'drop-shadow(0 1px 2px #a78bfa22)' }}
          />
          {/* 데이터 포인트 점 */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={hover && hover.type === type && hover.idx === i ? 7 : 5}
              fill={hover && hover.type === type && hover.idx === i ? '#fb923c' : '#a78bfa'}
              stroke="#fff"
              strokeWidth={2}
              style={{ transition: 'all 0.15s' }}
              onMouseEnter={() => setHover({ type, idx: i })}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          {/* x축 라벨 */}
          {labels.map((label, i) => {
            const x = leftPad + i * (barWidth + gap) + barWidth / 2
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

  function renderTooltip(type: string, idx: number, x: number, y: number, value: number) {
    if (!hover || hover.type !== type || hover.idx !== idx) return null
    let label = ''
    if (type === 'weekly' && weekDates[idx]) {
      const d = weekDates[idx]
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      label = `${dateStr}: ${value}`
    } else {
      label = String(value)
    }
    const width = Math.max(44, label.length * 8 + 16)
    return (
      <g pointerEvents="none" className="z-10">
        <rect x={x - width / 2} y={y - 38} width={width} height={24} rx={6} fill="#fff" stroke="#fb923c" />
        <text x={x} y={y - 22} textAnchor="middle" fontSize={14} fill="#fb923c" fontWeight={700}>{label}</text>
      </g>
    )
  }

  // UI
  return (
    <div className="space-y-6 mt-8" ref={containerRef}>
      {/* 연간 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(y => years[Math.max(0, yearIdx + 1)] || y)}
              disabled={isFirstYear}
              className={arrowBtn(isFirstYear)}
              aria-label="이전 연도"
            >◀</button>
            <span className="text-base font-bold text-gray-700">{selectedYear}년</span>
            <button
              onClick={() => setSelectedYear(y => years[Math.max(0, yearIdx - 1)] || y)}
              disabled={isLastYear}
              className={arrowBtn(isLastYear)}
              aria-label="다음 연도"
            >▶</button>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{monthlyData.reduce((a, b) => a + b, 0)}</span>
        </div>
        {renderBarGraph({ data: monthlyData, max: maxMonthly, labels: monthlyData.map((_, i) => `${i + 1}월`), type: 'monthly' })}
      </div>
      {/* 주간 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className={arrowBtn(false)}
              aria-label="이전 주차"
            >◀</button>
            <span className="text-base font-bold text-gray-700">{selectedYear}년 {selectedMonth}월 {selectedWeek}주차</span>
            <button
              onClick={handleNextWeek}
              className={arrowBtn(isNextWeekFuture)}
              aria-label="다음 주차"
              disabled={isNextWeekFuture}
            >▶</button>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{weeklyTotal}</span>
        </div>
        {renderBarGraph({ data: weeklyData, max: maxWeekly, labels: weekLabels, type: 'weekly' })}
      </div>
      {/* 일간 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 relative">
            <DatePicker
              selected={selectedDate}
              onChange={date => date && setSelectedDate(toKST(date))}
              dateFormat="yyyy년 MM월 dd일"
              maxDate={today}
              popperPlacement="bottom-start"
              popperClassName="z-50"
              customInput={
                <button
                  className="flex items-center gap-2 border border-orange-200 rounded-lg px-4 py-2 text-base font-bold text-gray-800 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm transition"
                  type="button"
                >
                  <Calendar className="w-5 h-5 text-orange-400" />
                  {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
                </button>
              }
              calendarClassName="border border-orange-200 rounded-lg bg-white p-2 shadow-md
                [&_.react-datepicker__header]:bg-gray-100 [&_.react-datepicker__header]:rounded-t-lg [&_.react-datepicker__header]:border-b [&_.react-datepicker__header]:border-gray-200
                [&_.react-datepicker__current-month]:font-bold [&_.react-datepicker__current-month]:text-lg [&_.react-datepicker__current-month]:py-2 [&_.react-datepicker__current-month]:leading-7
                [&_.react-datepicker__navigation]:!top-1/2 [&_.react-datepicker__navigation]:!-translate-y-1/2
                [&_.react-datepicker__navigation]:w-9 [&_.react-datepicker__navigation]:h-9
                [&_.react-datepicker__navigation]:rounded-full [&_.react-datepicker__navigation]:bg-white
                [&_.react-datepicker__navigation]:shadow [&_.react-datepicker__navigation]:border [&_.react-datepicker__navigation]:border-gray-200
                [&_.react-datepicker__navigation]:flex [&_.react-datepicker__navigation]:items-center [&_.react-datepicker__navigation]:justify-center
                [&_.react-datepicker__navigation]:hover:bg-orange-50
                [&_.react-datepicker__navigation]:z-10"
              dayClassName={(date: any) => {
                if (!(date instanceof Date) || isNaN(date.getTime())) return '';
                const kstDate = toKST(date)
                let base = "rounded-full transition";
                if (kstDate.toDateString() === today.toDateString()) {
                  base += " bg-orange-100 text-orange-600 font-bold";
                } else {
                  base += " hover:bg-orange-50";
                }
                if (kstDate.toDateString() === selectedDate.toDateString()) {
                  base += " ring-2 ring-orange-400";
                }
                return base;
              }}
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{dailyTotal}</span>
        </div>
        {renderBarGraph({ data: dailyData, max: maxDaily, labels: dayHours, type: 'daily' })}
      </div>
    </div>
  )
} 
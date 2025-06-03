import { useState, useRef } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'

interface Release {
  published_at: string // ISO date string
}

interface ReleaseChartsProps {
  releases: Release[]
}

function getYTicks(max: number, height: number) {
  return [max, Math.round(max / 2), 0].map((v) => ({
    value: v,
    y: height - (v / max) * height
  }))
}

// 월별 주차: 해당 월에 하루라도 포함된 월~금 주는 모두 포함
function getWeeksInMonthStrict(year: number, month: number) {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  let currentMonday = new Date(firstDay);
  currentMonday.setUTCDate(currentMonday.getUTCDate() - ((currentMonday.getUTCDay() + 6) % 7));
  const weeks: { start: Date; end: Date }[] = [];
  while (true) {
    const weekStart = new Date(currentMonday);
    const weekEnd = new Date(currentMonday);
    weekEnd.setUTCDate(weekStart.getUTCDate() + 4); // 월~금
    let monthDays = 0;
    for (let i = 0; i < 5; i++) {
      const d = new Date(weekStart);
      d.setUTCDate(weekStart.getUTCDate() + i);
      if (d.getUTCMonth() + 1 === month) monthDays++;
    }
    if (monthDays > 0) {
      weeks.push({ start: weekStart, end: weekEnd });
    }
    if (weekStart > lastDay && weekEnd > lastDay) break;
    currentMonday.setUTCDate(currentMonday.getUTCDate() + 7);
  }
  return weeks;
}

function getTodayUTCMidnight(): Date {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
}

export function ReleaseCharts({ releases }: ReleaseChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth] = useState(0)

  const years = Array.from(new Set(releases.map(r => new Date(r.published_at).getFullYear()))).sort((a, b) => b - a)
  const today = getTodayUTCMidnight();

  const [selectedYearAnnual, setSelectedYearAnnual] = useState(years[0] || today.getFullYear())
  const [selectedYearWeekly, setSelectedYearWeekly] = useState(today.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)

  const weeksInMonth = getWeeksInMonthStrict(selectedYearWeekly, selectedMonth)
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const idx = weeksInMonth.findIndex(w => today >= w.start && today <= w.end);
    return idx !== -1 ? idx + 1 : weeksInMonth.length;
  })

  const [selectedDate, setSelectedDate] = useState<Date>(today)

  function setMonthAndMaybeResetWeek(year: number, month: number) {
    const weeks = getWeeksInMonthStrict(year, month);
    const idx = weeks.findIndex(w => today >= w.start && today <= w.end);
    setSelectedYearWeekly(year);
    setSelectedMonth(month);
    setSelectedWeek(idx !== -1 ? idx + 1 : weeks.length);
  }

  // 월간 데이터 집계 - UTC 기준
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    if (selectedYearAnnual === today.getFullYear() && month > today.getMonth() + 1) return null;
    return releases.filter(r => {
      const d = new Date(r.published_at);
      return d.getFullYear() === selectedYearAnnual && d.getMonth() + 1 === month;
    }).length;
  }).filter(v => v !== null) as number[];
  const maxMonthly = Math.max(...monthlyData, 1);
  const monthLabels = monthlyData.map((_, i) => `${i + 1}월`);

  // 주간 데이터 집계 - UTC 기준
  const weeks = getWeeksInMonthStrict(selectedYearWeekly, selectedMonth);
  const weekRange = weeks[selectedWeek - 1] || { start: today, end: today };
  const weekDates = Array.from({ length: 5 }, (_, i) => {
    const date = new Date(weekRange.start);
    date.setUTCDate(weekRange.start.getUTCDate() + i);
    return date;
  });

  const weekLabels = ['월', '화', '수', '목', '금'];
  const weeklyData = weekDates.map(date => {
    return releases.filter(r => {
      const releaseDate = new Date(r.published_at);
      return (
        releaseDate.getUTCFullYear() === date.getUTCFullYear() &&
        releaseDate.getUTCMonth() === date.getUTCMonth() &&
        releaseDate.getUTCDate() === date.getUTCDate()
      );
    }).length;
  });
  const maxWeekly = Math.max(...weeklyData, 1);
  const weeklyTotal = weeklyData.reduce((a, b) => a + b, 0);

  // 일간 데이터 집계 - UTC 기준
  const dayHours = Array.from({ length: 24 }, (_, i) => i);
  const dailyData = dayHours.map(hour => {
    return releases.filter(r => {
      const d = new Date(r.published_at);
      return (
        d.getFullYear() === selectedDate.getFullYear() &&
        d.getMonth() === selectedDate.getMonth() &&
        d.getDate() === selectedDate.getDate() &&
        d.getHours() === hour
      );
    }).length;
  });
  const maxDaily = Math.max(...dailyData, 1);
  const dailyTotal = dailyData.reduce((a, b) => a + b, 0);

  const height = 140;
  const leftPad = 48;
  const rightPad = 24;
  const topPad = 32;
  const bottomPad = 48;

  const [hover, setHover] = useState<{ type: string; idx: number } | null>(null)

  const yearIdxAnnual = years.indexOf(selectedYearAnnual)
  const isFirstYearAnnual = yearIdxAnnual === years.length - 1
  const isLastYearAnnual = yearIdxAnnual === 0

  // handlePrevWeek/handleNextWeek에서 setSelectedMonth/setSelectedYearWeekly를 직접 쓰지 않고 위 함수 사용
  const handlePrevWeek = () => {
    if (selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1)
    } else if (selectedMonth > 1) {
      const prevMonth = selectedMonth - 1
      const prevWeeks = getWeeksInMonthStrict(selectedYearWeekly, prevMonth)
      setMonthAndMaybeResetWeek(selectedYearWeekly, prevMonth)
      setSelectedWeek(prevWeeks.length) // 마지막 주차로 이동
    } else if (selectedYearWeekly > Math.min(...years)) {
      const prevYear = selectedYearWeekly - 1
      const prevWeeks = getWeeksInMonthStrict(prevYear, 12)
      setMonthAndMaybeResetWeek(prevYear, 12)
      setSelectedWeek(prevWeeks.length) // 마지막 주차로 이동
    }
  }

  const handleNextWeek = () => {
    if (selectedWeek < weeksInMonth.length) {
      setSelectedWeek(selectedWeek + 1)
    } else if (selectedMonth < 12) {
      setMonthAndMaybeResetWeek(selectedYearWeekly, selectedMonth + 1)
      setSelectedWeek(1)
    } else if (selectedYearWeekly < Math.max(...years)) {
      setMonthAndMaybeResetWeek(selectedYearWeekly + 1, 1)
      setSelectedWeek(1)
    }
  }

  const isNextWeekFuture = (() => {
    const nextWeek = selectedWeek < weeksInMonth.length ? selectedWeek + 1 : 1
    const nextMonth = selectedWeek < weeksInMonth.length ? selectedMonth : (selectedMonth < 12 ? selectedMonth + 1 : 1)
    const nextYear = selectedWeek < weeksInMonth.length ? selectedYearWeekly : (selectedMonth < 12 ? selectedYearWeekly : selectedYearWeekly + 1)
    
    // 미래 월 체크
    if (nextYear > today.getFullYear() || 
        (nextYear === today.getFullYear() && nextMonth > today.getMonth() + 1)) {
      return true;
    }
    
    const nextWeeks = getWeeksInMonthStrict(nextYear, nextMonth)
    const nextWeekRange = nextWeeks[nextWeek - 1] || { start: today, end: today }
    return nextWeekRange.end.getTime() > today.getTime()
  })()

  const arrowBtn = (disabled: boolean) =>
    `rounded-full p-1.5 text-lg transition-colors ${disabled ? 'text-gray-300 bg-gray-100 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-200'}`

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

  function renderBarGraph({ data, max, labels, type, topPad = 16, bottomPad = 32 }: { data: number[]; max: number; labels: (string | number)[]; type: string; topPad?: number; bottomPad?: number }) {
    const availableWidth = containerWidth || 600; // fallback
    const minBarWidth = 24
    const gap = 8
    const totalGaps = data.length - 1
    const barWidth = Math.max(minBarWidth, (availableWidth - totalGaps * gap) / data.length)
    const graphWidth = data.length * barWidth + totalGaps * gap
    const svgWidth = leftPad + graphWidth + rightPad

    const points = data.map((v, i) => {
      const x = leftPad + i * (barWidth + gap) + barWidth / 2
      const y = topPad + height - (v / max) * height
      return { x, y }
    })
    const linePath = getLinePath(points)

    return (
      <div className="w-full" style={{ overflow: 'visible' }}>
        <svg
          width="100%"
          height={height + topPad + bottomPad}
          viewBox={`0 0 ${svgWidth} ${height + topPad + bottomPad}`}
          style={{ overflow: 'visible', display: 'block', maxWidth: '100%' }}
        >
          {/* y축 눈금 */}
          {getYTicks(max, height).map((tick, i) => (
            <g key={i}>
              <text x={leftPad - 8} y={tick.y + topPad} fontSize={12} fill="#aaa" textAnchor="end">{tick.value}</text>
              <line x1={leftPad} x2={svgWidth - rightPad} y1={tick.y + topPad} y2={tick.y + topPad} stroke="#eee" />
            </g>
          ))}
          {/* 막대그래프 */}
          {data.map((v, i) => {
            const x = leftPad + i * (barWidth + gap)
            const y = topPad + height - (v / max) * height
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
                y={height + topPad + 16}
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
      <g pointerEvents="none" className="z-20">
        <rect x={x - width / 2} y={y - 38} width={width} height={24} rx={6} fill="#fff" stroke="#fb923c" />
        <text x={x} y={y - 22} textAnchor="middle" fontSize={14} fill="#fb923c" fontWeight={700}>{label}</text>
      </g>
    )
  }

  return (
    <div className="space-y-10 mt-12" ref={containerRef}>
      {/* 연간 */}
      <div className="bg-white p-6 sm:p-10 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">연간 릴리즈</h2>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYearAnnual(y => years[Math.max(0, yearIdxAnnual + 1)] || y)}
              disabled={isFirstYearAnnual}
              className={arrowBtn(isFirstYearAnnual)}
              aria-label="이전 연도"
            >◀</button>
            <span className="text-base font-bold text-gray-700">{selectedYearAnnual}년</span>
            <button
              onClick={() => setSelectedYearAnnual(y => years[Math.max(0, yearIdxAnnual - 1)] || y)}
              disabled={isLastYearAnnual}
              className={arrowBtn(isLastYearAnnual)}
              aria-label="다음 연도"
            >▶</button>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{monthlyData.reduce((a, b) => a + b, 0)}</span>
        </div>
        {renderBarGraph({ data: monthlyData, max: maxMonthly, labels: monthLabels, type: 'monthly', topPad, bottomPad })}
      </div>
      {/* 주간 */}
      <div className="bg-white p-6 sm:p-10 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">주간 릴리즈</h2>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevWeek}
              className={arrowBtn(false)}
              aria-label="이전 주차"
            >◀</button>
            <span className="text-base font-bold text-gray-700">{selectedYearWeekly}년 {selectedMonth}월 {selectedWeek}주차</span>
            <button
              onClick={handleNextWeek}
              className={arrowBtn(isNextWeekFuture)}
              aria-label="다음 주차"
              disabled={isNextWeekFuture}
            >▶</button>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{weeklyTotal}</span>
        </div>
        {renderBarGraph({ data: weeklyData, max: maxWeekly, labels: weekLabels, type: 'weekly', topPad, bottomPad })}
      </div>
      {/* 일간 */}
      <div className="bg-white p-6 sm:p-10 rounded-lg shadow-sm flex flex-col overflow-visible">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">일간 릴리즈</h2>
        </div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 relative">
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date | null) => {
                if (!date) return;
                setSelectedDate(date);
              }}
              dateFormat="yyyy년 MM월 dd일"
              maxDate={today}
              popperPlacement="bottom-start"
              popperClassName="z-50"
              customInput={
                <button
                  className="flex items-center gap-2 border border-orange-200 rounded-lg px-4 py-2 text-base font-bold text-gray-800 bg-white hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-sm transition relative z-10"
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
                let base = "rounded-full transition";
                if (date.toDateString() === today.toDateString()) {
                  base += " bg-orange-100 text-orange-600 font-bold";
                } else {
                  base += " hover:bg-orange-50";
                }
                if (date.toDateString() === selectedDate.toDateString()) {
                  base += " ring-2 ring-orange-400";
                }
                return base;
              }}
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-orange-500">{dailyTotal}</span>
        </div>
        {renderBarGraph({ data: dailyData, max: maxDaily, labels: dayHours, type: 'daily', topPad, bottomPad })}
      </div>
    </div>
  )
} 
interface ReleaseStatsProps {
  stats: {
    totalReleases: number
    yearlyReleases: number
    avgTimeBetweenReleases: number
    monthlyStats: Array<{ month: string; count: number }>
    weeklyStats: Array<{ day: string; count: number }>
    dailyStats: Array<{ hour: string; count: number }>
  }
}

export function ReleaseStats({ stats }: ReleaseStatsProps) {
  // 주간, 일간 합계 계산
  const weeklyTotal = stats.weeklyStats.reduce((sum, d) => sum + d.count, 0)
  const dailyTotal = stats.dailyStats.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-8 w-full">
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
        <h2 className="text-base font-semibold text-gray-900 mb-2">연간 배포수</h2>
        <p className="text-3xl font-bold text-orange-500 mb-1">{stats.yearlyReleases}</p>
        <span className="text-xs text-gray-500">최근 1년간</span>
      </div>
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
        <h2 className="text-base font-semibold text-gray-900 mb-2">주간 배포수</h2>
        <p className="text-3xl font-bold text-orange-500 mb-1">{weeklyTotal}</p>
        <span className="text-xs text-gray-500">최근 7일간</span>
      </div>
      <div className="flex-1 bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
        <h2 className="text-base font-semibold text-gray-900 mb-2">일간 배포수</h2>
        <p className="text-3xl font-bold text-orange-500 mb-1">{dailyTotal}</p>
        <span className="text-xs text-gray-500">최근 24시간</span>
      </div>
    </div>
  )
} 
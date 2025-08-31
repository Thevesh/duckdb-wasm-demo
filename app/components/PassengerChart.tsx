'use client'

import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface PassengerData {
  origin: string
  destination: string
  date: string
  passengers: number
}

interface PassengerChartProps {
  data: PassengerData[]
  origin: string
  destination: string
  selectedTimeFilter: string
}

export default function PassengerChart({ data, origin, destination, selectedTimeFilter }: PassengerChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data available for charting</p>
      </div>
    )
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Calculate key metrics
  const totalPassengers = data.reduce((sum, d) => sum + d.passengers, 0)
  const latestPassengers = sortedData[sortedData.length - 1]?.passengers || 0
  const avgDaily = Math.round(totalPassengers / data.length)

  // Prepare chart data
  const chartData = {
    labels: sortedData.map(() => ''), // Empty labels since we handle formatting in callback
    datasets: [
      {
        label: 'Passengers',
        data: sortedData.map(item => item.passengers),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return 'rgba(59, 130, 246, 0.15)';
          }
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          return gradient;
        },
        borderWidth: 1,
        fill: true,
        tension: 0.4,
        pointRadius: 0, // No markers
        pointHoverRadius: 0, // No hover markers
        pointBackgroundColor: 'transparent',
        pointBorderColor: 'transparent',
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: false // Remove title since we have it above the chart
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            // Show the actual date in the tooltip
            const dataIndex = context[0].dataIndex
            const actualDate = new Date(sortedData[dataIndex].date)
            return actualDate.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          },
          label: function(context: any) {
            return `Passengers: ${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false, // Remove grid lines
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 11
          },
          autoSkip: false, // Force Chart.js to show all ticks
          maxTicksLimit: 1000, // Set a very high limit to prevent filtering
          callback: function(value: any, index: any, values: any) {
            // Format the date directly in the callback instead of relying on labels array
            if (index >= 0 && index < sortedData.length) {
              const date = new Date(sortedData[index].date)
              const day = date.getDate()
              const month = date.getMonth()
              const year = date.getFullYear()
              
              let shouldShowLabel = false
              
              if (selectedTimeFilter === 'all') {
                // All Data - show only odd months on the 1st
                shouldShowLabel = day === 1 && month % 2 === 0
              } else if (selectedTimeFilter === '1year') {
                // 1 Year - show 1st of month
                shouldShowLabel = day === 1
              } else if (selectedTimeFilter === '6months') {
                // 6 Months - show 1st of month
                shouldShowLabel = day === 1
              } else if (selectedTimeFilter === '1month') {
                // 1 Month - show 1st, 8th, 15th, 22nd, 29th
                shouldShowLabel = [1, 8, 15, 22, 29].includes(day)
              }
              
              if (shouldShowLabel) {
                if (day === 1) {
                  // If it's January, show the year
                  if (month === 0) {
                    return year.toString()
                  }
                  
                  // Otherwise show the month abbreviation
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  return monthNames[month]
                } else {
                  // For other days in 1 month view, show the date
                  return day.toString()
                }
              }
            }
            
            return ''
          }
        }
      },
      y: {
        beginAtZero: true, // Always start y-axis at 0 for accurate representation
        grid: {
          display: false, // Remove grid lines
          drawBorder: false
        },
        ticks: {
          color: '#6B7280',
          callback: function(value: any) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M'
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K'
            }
            return value.toLocaleString()
          },
          font: {
            size: 10
          }
        },
        title: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    },
    elements: {
      point: {
        hoverBackgroundColor: 'transparent',
        hoverBorderColor: 'transparent'
      }
    }
  }

  return (
    <div className="bg-white border border-gray-50 rounded-xl p-6 shadow-xs">
      {/* Key Metrics at the Top - More Compact */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {latestPassengers.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 font-medium">Latest</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {avgDaily.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 font-medium">Avg Daily</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {totalPassengers.toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 font-medium">Total</div>
        </div>
      </div>
      
      {/* Clean Line Chart - More Compact */}
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}


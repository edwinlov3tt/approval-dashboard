import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { mockCalendarEvents } from '../../lib/mockData'

export default function Calendar() {
  const [currentMonth] = useState(new Date(2025, 9, 1)) // October 2025

  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    // Add the days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getEventsForDay = (day) => {
    if (!day) return []
    const dateStr = `2025-10-${String(day).padStart(2, '0')}`
    return mockCalendarEvents.filter(
      (event) =>
        dateStr >= event.start && dateStr <= event.end
    )
  }

  const days = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  const statusColors = {
    waiting: 'bg-warning',
    in_progress: 'bg-info',
    approved: 'bg-success',
    denied: 'bg-danger',
  }

  return (
    <Layout>
      <h1 className="meta-page-title">Calendar View</h1>

      <Card padding={false} className="overflow-hidden">
        <div className="px-sp-4 py-sp-4 border-b border-divider flex justify-between items-center">
          <h2 className="text-16 font-semibold">{monthName}</h2>
          <div className="flex gap-sp-3">
            <Button variant="secondary" size="small">
              Previous
            </Button>
            <Button variant="secondary" size="small">
              Today
            </Button>
            <Button variant="secondary" size="small">
              Next
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="px-sp-3 py-sp-3 text-center font-semibold text-12 text-text-muted border-b border-divider"
            >
              {day}
            </div>
          ))}

          {days.map((day, index) => {
            const events = getEventsForDay(day)
            return (
              <div
                key={index}
                className="min-h-[100px] border-b border-r border-divider p-sp-2 last:border-r-0"
              >
                {day && (
                  <>
                    <div className="text-12 mb-sp-2 text-text-muted">{day}</div>
                    <div className="space-y-1">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className={`${
                            statusColors[event.status]
                          } text-white px-1 py-0.5 rounded text-10 cursor-pointer hover:opacity-80`}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </Layout>
  )
}

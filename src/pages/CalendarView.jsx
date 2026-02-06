import React, { useState } from 'react';
import { useSpider } from '../context/SpiderContext';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Activity } from 'lucide-react';

const CalendarView = () => {
  const { entries, setSelectedDate } = useSpider();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const hasEntry = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    return entries[key] && Object.values(entries[key]).some(e => e.feeding || e.watering || e.molting || e.notes);
  };

  const entrySummary = (date) => {
    const key = format(date, 'yyyy-MM-dd');
    const dayEntry = entries[key];
    if (!dayEntry) return null;
    
    const spiderCount = Object.keys(dayEntry).length;
    const actions = [];
    Object.values(dayEntry).forEach(e => {
      if (e.feeding) actions.push('F');
      if (e.watering) actions.push('W');
      if (e.molting) actions.push('M');
    });
    
    return [...new Set(actions)].join('');
  };

  return (
    <div className="calendar-page">
      <header className="page-header">
        <h1>Monthly Activity</h1>
        <div className="date-selector">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-icon">
            <ChevronLeft />
          </button>
          <span>{format(currentMonth, 'MMMM yyyy')}</span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-icon">
            <ChevronRight />
          </button>
        </div>
      </header>

      <div className="calendar-grid-container glass">
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-day-header">{day}</div>
          ))}
          {days.map(day => {
            const hasData = hasEntry(day);
            const summary = entrySummary(day);
            return (
              <div 
                key={day.toString()} 
                className={`calendar-day ${!isSameMonth(day, monthStart) ? 'outside' : ''} ${isSameDay(day, new Date()) ? 'today' : ''}`}
                onClick={() => {
                  if (isSameMonth(day, monthStart)) {
                    setSelectedDate(day);
                    // Navigate to home? Or just set date and stay?
                    // Usually user wants to go to that day's journal.
                    window.location.hash = '/'; // Simple way to navigate if using HashRouter, but we are using BrowserRouter.
                  }
                }}
              >
                <span className="day-number">{format(day, 'd')}</span>
                {hasData && (
                  <div className="day-indicator">
                    <Activity size={12} color="var(--accent-primary)" />
                    <span className="summary-text">{summary}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-summary glass-card" style={{ marginTop: '2rem' }}>
        <h3>Monthly Summary</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
          Days with activity: {days.filter(d => isSameMonth(d, monthStart) && hasEntry(d)).length}
        </p>
      </div>
    </div>
  );
};

export default CalendarView;

import React from 'react';
import { useSpider } from '../context/SpiderContext';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const Journal = () => {
  const { 
    activeSpiders, 
    entries, 
    selectedDate, 
    setSelectedDate, 
    dateKey, 
    updateEntry, 
    selectAll 
  } = useSpider();

  const dayEntries = entries[dateKey] || {};

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  return (
    <div className="journal-page">
      <header className="page-header">
        <h1>Spider Journal</h1>
        <div className="date-selector">
          <button onClick={handlePrevDay} className="btn-icon"><ChevronLeft /></button>
          <span onClick={handleToday} style={{ cursor: 'pointer' }}>
            {format(selectedDate, 'MMM do, yyyy')}
          </span>
          <button onClick={handleNextDay} className="btn-icon"><ChevronRight /></button>
        </div>
      </header>

      <div className="table-container glass">
        <table className="spider-table">
          <thead>
            <tr>
              <th>Spider</th>
              <th>
                <div className="header-cell">
                  <span>Fed</span>
                  <button 
                    onClick={() => selectAll('feeding', true)} 
                    className="select-all-btn"
                    title="Select All"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </th>
              <th>
                <div className="header-cell">
                  <span>Water</span>
                  <button 
                    onClick={() => selectAll('watering', true)} 
                    className="select-all-btn"
                    title="Select All"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </th>
              <th>
                <div className="header-cell">
                  <span>Molt</span>
                  <button 
                    onClick={() => selectAll('molting', true)} 
                    className="select-all-btn"
                    title="Select All"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {activeSpiders.map(spider => {
              const entry = dayEntries[spider.id] || { feeding: false, watering: false, molting: false, notes: '' };
              return (
                <tr key={spider.id}>
                  <td className="spider-name">{spider.name}</td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={entry.feeding} 
                      onChange={(e) => updateEntry(spider.id, 'feeding', e.target.checked)}
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={entry.watering} 
                      onChange={(e) => updateEntry(spider.id, 'watering', e.target.checked)}
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={entry.molting} 
                      onChange={(e) => updateEntry(spider.id, 'molting', e.target.checked)}
                    />
                  </td>
                  <td>
                    <textarea 
                      value={entry.notes} 
                      onChange={(e) => updateEntry(spider.id, 'notes', e.target.value)}
                      placeholder="Add notes..."
                      rows="1"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Journal;

import React, { useState } from 'react';
import { useTarantula } from '../context/TarantulaContext';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckCircle2, StickyNote, X } from 'lucide-react';

const Journal = () => {
  const { 
    activeSpooders, 
    entries, 
    selectedDate, 
    setSelectedDate, 
    dateKey, 
    updateEntry, 
    selectAll 
  } = useTarantula();

  const [noteModal, setNoteModal] = useState(null); // { spooderId, name }

  const dayEntries = entries[dateKey] || {};

  const handlePrevDay = () => setSelectedDate(subDays(selectedDate, 1));
  const handleNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const handleToday = () => setSelectedDate(new Date());

  const openNoteModal = (spooderId, name) => {
    setNoteModal({ spooderId, name });
  };

  const closeNoteModal = () => {
    setNoteModal(null);
  };

  return (
    <div className="journal-page">
      <header className="page-header">
        <h1>Amy's Tarantula Journal</h1>
        <div className="date-selector">
          <button onClick={handlePrevDay} className="btn-icon"><ChevronLeft /></button>
          <span onClick={handleToday} style={{ cursor: 'pointer' }}>
            {format(selectedDate, 'MMM do, yyyy')}
          </span>
          <button onClick={handleNextDay} className="btn-icon"><ChevronRight /></button>
        </div>
      </header>

      <div className="table-container glass">
        <table className="spooder-table">
          <thead>
            <tr>
              <th>Spooder</th>
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
            {activeSpooders.map(spooder => {
              const entry = dayEntries[spooder.id] || { feeding: false, watering: false, molting: false, notes: '' };
              return (
                <tr key={spooder.id}>
                  <td className="spooder-name">{spooder.name}</td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={entry.feeding} 
                      onChange={(e) => updateEntry(spooder.id, 'feeding', e.target.checked)}
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={entry.watering} 
                      onChange={(e) => updateEntry(spooder.id, 'watering', e.target.checked)}
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={entry.molting} 
                      onChange={(e) => updateEntry(spooder.id, 'molting', e.target.checked)}
                    />
                  </td>
                  <td className="notes-column">
                    <button 
                      onClick={() => openNoteModal(spooder.id, spooder.name)}
                      className={`btn-icon notes-trigger ${entry.notes ? 'has-notes' : ''}`}
                      title="Edit Notes"
                    >
                      <StickyNote size={18} />
                      {entry.notes && <div className="note-indicator" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {noteModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card note-modal">
            <div className="modal-header">
              <div>
                <h2>{noteModal.name}</h2>
                <p className="modal-subtitle">{format(selectedDate, 'MMMM do, yyyy')}</p>
              </div>
              <button onClick={closeNoteModal} className="btn-icon"><X size={24} /></button>
            </div>
            
            <textarea 
              value={dayEntries[noteModal.spooderId]?.notes || ''} 
              onChange={(e) => updateEntry(noteModal.spooderId, 'notes', e.target.value)}
              placeholder="Type your notes here..."
              autoFocus
            />
            
            <div className="modal-actions">
              <button onClick={closeNoteModal} className="btn-primary">Ok</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Journal;

import React, { useState } from 'react';
import { useSpider } from '../context/SpiderContext';
import { format } from 'date-fns';
import { Skull, PlusCircle } from 'lucide-react';

const Deceased = () => {
  const { deceasedSpiders, activeSpiders, markAsDeceased } = useSpider();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSpiderId, setSelectedSpiderId] = useState('');
  const [deceasedDate, setDeceasedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSpiderId) return;
    markAsDeceased(selectedSpiderId, deceasedDate, notes);
    setShowAddModal(false);
    setSelectedSpiderId('');
    setNotes('');
  };

  return (
    <div className="deceased-page">
      <header className="page-header">
        <h1>Memorial</h1>
        <button onClick={() => setShowAddModal(true)} className="btn-primary glass">
          <PlusCircle size={20} />
          <span>Add Deceased</span>
        </button>
      </header>

      <div className="deceased-list">
        {deceasedSpiders.length === 0 ? (
          <div className="empty-state glass-card">
            <Skull size={48} className="icon-subtle" />
            <p>No spiders have passed away. That's a good thing!</p>
          </div>
        ) : (
          deceasedSpiders.map(spider => (
            <div key={spider.id} className="deceased-card glass-card">
              <div className="card-header">
                <h3>{spider.name}</h3>
                <span className="date-badge">{format(new Date(spider.deceasedDate), 'MMM do, yyyy')}</span>
              </div>
              <p className="deceased-notes">{spider.deceasedNotes || 'No notes added.'}</p>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h2>Mark as Deceased</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Spider</label>
                <select 
                  value={selectedSpiderId} 
                  onChange={(e) => setSelectedSpiderId(e.target.value)}
                  required
                >
                  <option value="">Choose a spider...</option>
                  {activeSpiders.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date of Passing</label>
                <input 
                  type="date" 
                  value={deceasedDate} 
                  onChange={(e) => setDeceasedDate(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Final notes..."
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deceased;

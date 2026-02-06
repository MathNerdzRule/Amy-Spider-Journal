import React, { useState } from 'react';
import { useSpider } from '../context/SpiderContext';
import { Download, Upload, Plus, Sun, Moon, Monitor, Trash2 } from 'lucide-react';

const Settings = () => {
  const { 
    activeSpiders, 
    addSpider, 
    exportData, 
    importData,
    theme,
    setTheme
  } = useSpider();

  const [newSpiderName, setNewSpiderName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSpider = (e) => {
    e.preventDefault();
    if (newSpiderName) {
      addSpider(newSpiderName);
      setNewSpiderName('');
      setShowAddModal(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      importData(event.target.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="settings-page">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <section className="settings-section glass-card">
        <div className="section-header">
          <Monitor size={24} className="accent-icon" />
          <h2>Appearance</h2>
        </div>
        <div className="theme-selector">
          <button 
            className={`theme-btn ${theme === 'light' ? 'active' : ''}`} 
            onClick={() => setTheme('light')}
          >
            <Sun size={20} />
            <span>Light</span>
          </button>
          <button 
            className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} 
            onClick={() => setTheme('dark')}
          >
            <Moon size={20} />
            <span>Dark</span>
          </button>
          <button 
            className={`theme-btn ${theme === 'system' ? 'active' : ''}`} 
            onClick={() => setTheme('system')}
          >
            <Monitor size={20} />
            <span>System</span>
          </button>
        </div>
      </section>

      <section className="settings-section glass-card" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <Plus size={24} className="accent-icon" />
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <h2>Spiders</h2>
            <button onClick={() => setShowAddModal(true)} className="btn-primary glass" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={18} />
              <span>Add Spider</span>
            </button>
          </div>
        </div>

        <div className="active-spiders-list">
          {activeSpiders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No spiders added yet.</p>
          ) : (
            activeSpiders.map(spider => (
              <div key={spider.id} className="spider-item glass">
                <span>{spider.name}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="settings-section glass-card" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <Download size={24} className="accent-icon" />
          <h2>Data</h2>
        </div>
        <p>Backup or restore your care logs.</p>
        
        <div className="data-actions">
          <button onClick={exportData} className="btn-secondary glass-btn">
            <Download size={18} />
            <span>Export</span>
          </button>
          
          <label className="btn-secondary glass-btn">
            <Upload size={18} />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>
        </div>
      </section>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-card">
            <h2>Add New Spider</h2>
            <form onSubmit={handleAddSpider}>
              <div className="form-group">
                <label>Spider Name</label>
                <input 
                  type="text" 
                  value={newSpiderName} 
                  onChange={(e) => setNewSpiderName(e.target.value)}
                  placeholder="e.g. Edgar"
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Spider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

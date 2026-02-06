import React, { useState } from 'react';
import { useSpider } from '../context/SpiderContext';
import { Download, Upload, Plus, Trash2, Info } from 'lucide-react';

const Settings = () => {
  const { 
    activeSpiders, 
    addSpider, 
    exportData, 
    importData 
  } = useSpider();

  const [newSpiderName, setNewSpiderName] = useState('');

  const handleAddSpider = (e) => {
    e.preventDefault();
    if (newSpiderName) {
      addSpider(newSpiderName);
      setNewSpiderName('');
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
        <h1>Settings & Data</h1>
      </header>

      <section className="settings-section glass-card">
        <div className="section-header">
          <Plus size={24} className="accent-icon" />
          <h2>Manage Spiders</h2>
        </div>
        
        <form onSubmit={handleAddSpider} className="add-spider-form">
          <input 
            type="text" 
            value={newSpiderName} 
            onChange={(e) => setNewSpiderName(e.target.value)}
            placeholder="Spider Name (e.g. Edgar)"
            className="glass"
          />
          <button type="submit" className="btn-primary">Add</button>
        </form>

        <div className="active-spiders-list">
          {activeSpiders.map(spider => (
            <div key={spider.id} className="spider-item glass">
              <span>{spider.name}</span>
              {/* Optional: Add Rename/Delete */}
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section glass-card" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <Download size={24} className="accent-icon" />
          <h2>Data Management</h2>
        </div>
        <p>Backup or restore your data via JSON files.</p>
        
        <div className="data-actions">
          <button onClick={exportData} className="btn-secondary glass-btn">
            <Download size={18} />
            <span>Export Data</span>
          </button>
          
          <label className="btn-secondary glass-btn">
            <Upload size={18} />
            <span>Import Data</span>
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>
        </div>
      </section>

      <section className="settings-section glass-card" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <Info size={24} className="accent-icon" />
          <h2>Help & Setup</h2>
        </div>
        <div className="alert-box glass">
          <p><strong>Pro Tip:</strong> To use AI Analysis in Vercel, add an environment variable called <code>VITE_GEMINI_API_KEY</code>.</p>
        </div>
      </section>
    </div>
  );
};

export default Settings;

import React, { useState } from 'react';
import { useSpider } from '../context/SpiderContext';
import { createWorker } from 'tesseract.js';
import { 
  Download, 
  Upload, 
  Plus, 
  Sun, 
  Moon, 
  Monitor, 
  Camera, 
  FileUp, 
  Loader2, 
  Sparkles,
  Bug,
  Trash2,
  AlertTriangle
} from 'lucide-react';

const Settings = () => {
  const { 
    activeSpiders, 
    addSpider, 
    batchAddSpiders,
    deleteSpider,
    exportData, 
    importData,
    batchUpdateEntries,
    theme,
    setTheme
  } = useSpider();

  const [newSpiderName, setNewSpiderName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // OCR States
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // OCR Logic
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(file);
      setOcrText(text);
      await worker.terminate();
    } catch (err) {
      console.error(err);
      alert('Error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  // AI Entry Creation Logic
  const createEntriesFromText = async () => {
    if (!ocrText) return;
    setIsAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        alert("API Key not found. Please set VITE_GEMINI_API_KEY.");
        setIsAnalyzing(false);
        return;
      }

      const prompt = `
        Based on the following notes, extract spider care data.
        Spiders currently in the journal: ${activeSpiders.map(s => `ID: ${s.id}, Name: ${s.name}`).join('; ')}
        Notes: "${ocrText}"
        
        Rules:
        1. Identify spiders. If a spider is mentioned but not in the ID list above, create a temporary ID starting with "new_".
        2. Be strict. If you are unsure about a spider's identity or the care action (fed/watered/molted), include a "warning".
        
        Return ONLY a JSON object in this format:
        {
          "date": "YYYY-MM-DD",
          "entries": [
            { 
              "spiderId": "string", 
              "spiderName": "string", 
              "feeding": boolean, 
              "watering": boolean, 
              "molting": boolean, 
              "notes": "string",
              "warning": "string | null" 
            }
          ],
          "generalWarning": "string | null"
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(resultText);
      
      if (parsed.date && parsed.entries) {
        const warnings = [];
        if (parsed.generalWarning) warnings.push(`System: ${parsed.generalWarning}`);
        
        const finalEntries = {};
        const newSpiderNames = [];
        const entryMapping = []; // { tempId, spiderData }

        // First pass: identify new spiders and prepare entries
        parsed.entries.forEach(entry => {
          if (entry.warning) warnings.push(`${entry.spiderName}: ${entry.warning}`);
          
          if (entry.spiderId.startsWith('new_')) {
            newSpiderNames.push(entry.spiderName);
            entryMapping.push(entry);
          } else {
            finalEntries[entry.spiderId] = {
              feeding: entry.feeding,
              watering: entry.watering,
              molting: entry.molting,
              notes: entry.notes
            };
          }
        });

        // Add new spiders to system
        if (newSpiderNames.length > 0) {
          const createdSpiders = batchAddSpiders([...new Set(newSpiderNames)]);
          // Map temp IDs to real IDs
          entryMapping.forEach(entry => {
            const realSpider = createdSpiders.find(s => s.name === entry.spiderName);
            if (realSpider) {
              finalEntries[realSpider.id] = {
                feeding: entry.feeding,
                watering: entry.watering,
                molting: entry.molting,
                notes: entry.notes
              };
            }
          });
        }

        // Save entries
        batchUpdateEntries(parsed.date, finalEntries);

        // Show comprehensive alert
        let message = `Import successful for ${parsed.date}!`;
        if (newSpiderNames.length > 0) {
          message += `\n\nAdded new spiders: ${[...new Set(newSpiderNames)].join(', ')}`;
        }
        if (warnings.length > 0) {
          message += `\n\n⚠️ Issues Found:\n- ${warnings.join('\n- ')}`;
        }
        
        alert(message);
        setOcrText('');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse entries. AI might have had trouble with the format or quality of the image.");
    } finally {
      setIsAnalyzing(false);
    }
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
          <Bug size={24} className="accent-icon" />
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
                <button 
                  onClick={() => deleteSpider(spider.id)} 
                  className="btn-icon delete-btn"
                  title="Remove Spider"
                >
                  <Trash2 size={16} color="var(--error)" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="settings-section glass-card" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <Download size={24} className="accent-icon" />
          <h2>Data Management</h2>
        </div>
        <p>Import/Export backup files or scan physical notes.</p>
        
        <div className="data-actions">
          <label className="btn-secondary glass-btn">
            <Upload size={18} />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImport} hidden />
          </label>

          <button onClick={exportData} className="btn-secondary glass-btn">
            <Download size={18} />
            <span>Export JSON</span>
          </button>
          
          <label className="btn-secondary glass-btn">
            <Camera size={18} />
            <span>Scan Notes</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
          </label>
        </div>

        {isProcessing && (
          <div className="processing-state" style={{ marginTop: '1rem' }}>
            <Loader2 className="spin" />
            <span>Parsing text from image...</span>
          </div>
        )}

        {ocrText && (
          <div className="ocr-result glass" style={{ marginTop: '1rem' }}>
            <div className="section-header" style={{ marginBottom: '0.5rem' }}>
              <Sparkles size={18} className="accent-icon" />
              <h3 style={{ margin: 0 }}>Scanned Text</h3>
            </div>
            <pre style={{ maxHeight: '150px' }}>{ocrText}</pre>
            <div className="data-actions" style={{ marginTop: '1rem' }}>
              <button className="btn-primary" onClick={createEntriesFromText} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="spin" /> : <Sparkles size={16} />}
                <span>Process & Add Spiders</span>
              </button>
              <button className="btn-secondary" onClick={() => setOcrText('')}>
                Discard
              </button>
            </div>
          </div>
        )}
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

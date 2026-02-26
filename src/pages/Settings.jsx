import React, { useState } from 'react';
import { useTarantula } from '../context/TarantulaContext';
import { createWorker } from 'tesseract.js';
import { format } from 'date-fns';
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
    activeSpooders, 
    addSpooder, 
    batchAddSpooders,
    deleteSpooder,
    exportData, 
    importData,
    batchUpdateEntries,
    theme,
    setTheme
  } = useTarantula();

  const [newSpooderName, setNewSpooderName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // OCR States
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAddSpooder = (e) => {
    e.preventDefault();
    if (newSpooderName) {
      addSpooder(newSpooderName);
      setNewSpooderName('');
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

      const today = format(new Date(), 'yyyy-MM-dd');
      const prompt = `
        Based on the following notes, extract tarantula ("spooder") care data. 
        Notes: "${ocrText}"
        Current Year: ${new Date().getFullYear()}
        
        Spooders currently in the journal: ${activeSpooders.map(s => `ID: ${s.id}, Name: ${s.name}`).join('; ')}
        
        Rules:
        1. Identify the date. Use YYYY-MM-DD format. If no date is found, use "${today}".
        2. Identify care actions: feeding/fed, watering/watered, molting/molted. 
           CRITICAL: If the text implies a spooder was fed (e.g. "gave roach", "fed", "ate", "ate cricket", "fed dubia"), set feeding: true. 
           If it was watered (e.g. "refilled bowl", "watered", "mist"), set watering: true.
           If it molted (e.g. "shiny new skin", "molted"), set molting: true.
        3. Match spooders to the provided list. If you find a new spooder name not in the list, use spooderId: "new_[name]".
        4. If you are unsure about an entry, add a specific warning for that entry.
        
        Return a JSON object:
        {
          "date": "YYYY-MM-DD",
          "entries": [
            { 
              "spooderId": "string", 
              "spooderName": "string", 
              "feeding": boolean, 
              "watering": boolean, 
              "molting": boolean, 
              "notes": "string",
              "warning": "string | null" 
            }
          ]
        }
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Gemini API Error: ${response.status} - ${errData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const rawResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      if (!rawResponse) {
        throw new Error("AI returned an empty response.");
      }

      let resultText = rawResponse;
      const startIdx = rawResponse.indexOf('{');
      const endIdx = rawResponse.lastIndexOf('}');
      
      if (startIdx !== -1 && endIdx !== -1) {
        resultText = rawResponse.substring(startIdx, endIdx + 1);
      }

      let parsed;
      try {
        parsed = JSON.parse(resultText);
      } catch (e) {
        throw new Error(`JSON Parse Error: ${e.message}\n\nAI Response: ${rawResponse.substring(0, 100)}...`);
      }
      
      if (parsed) {
        const entryDate = parsed.date || today;
        const warnings = [];
        const finalEntries = {};
        const newSpooderNames = [];
        const entryMapping = [];

        const rawEntries = Array.isArray(parsed.entries) ? parsed.entries : [];
        
        rawEntries.forEach(entry => {
          if (!entry) return;
          if (entry.warning) warnings.push(`${entry.spooderName || 'Unknown'}: ${entry.warning}`);
          
          if (entry.spooderId && entry.spooderId.startsWith('new_')) {
            newSpooderNames.push(entry.spooderName);
            entryMapping.push(entry);
          } else if (entry.spooderId) {
            finalEntries[entry.spooderId] = {
              feeding: !!entry.feeding,
              watering: !!entry.watering,
              molting: !!entry.molting,
              notes: entry.notes || ''
            };
          }
        });

        if (newSpooderNames.length > 0) {
          const createdSpooders = batchAddSpooders([...new Set(newSpooderNames)]);
          entryMapping.forEach(entry => {
            const realSpooder = createdSpooders.find(s => s.name === entry.spooderName);
            if (realSpooder) {
              finalEntries[realSpooder.id] = {
                feeding: !!entry.feeding,
                watering: !!entry.watering,
                molting: !!entry.molting,
                notes: entry.notes || ''
              };
            }
          });
        }

        batchUpdateEntries(entryDate, finalEntries);

        let message = `Import successful for ${entryDate}!`;
        if (newSpooderNames.length > 0) {
          message += `\n\nAdded new spooders: ${[...new Set(newSpooderNames)].join(', ')}`;
        }
        if (warnings.length > 0) {
          message += `\n\n⚠️ Issues Found:\n- ${warnings.join('\n- ')}`;
        }
        
        alert(message);
        setOcrText('');
      } else {
        throw new Error("Invalid AI response format.");
      }
    } catch (err) {
      console.error("AI Parse Error:", err);
      alert(`Debug Info:\n${err.message}`);
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
            <h2>Spooders</h2>
            <button onClick={() => setShowAddModal(true)} className="btn-primary glass" style={{ padding: '0.5rem 1rem' }}>
              <Plus size={18} />
              <span>Add Spooder</span>
            </button>
          </div>
        </div>

        <div className="active-spooders-list">
          {activeSpooders.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No spooders added yet.</p>
          ) : (
            activeSpooders.map(spooder => (
              <div key={spooder.id} className="spooder-item glass">
                <span>{spooder.name}</span>
                <button 
                  onClick={() => deleteSpooder(spooder.id)} 
                  className="btn-icon delete-btn"
                  title="Remove Spooder"
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Verify or fix the text below before processing:
            </p>
            <textarea 
              value={ocrText} 
              onChange={(e) => setOcrText(e.target.value)}
              className="glass"
              style={{ 
                width: '100%', 
                minHeight: '150px', 
                padding: '0.75rem',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                background: 'rgba(0,0,0,0.2)'
              }}
            />
            <div className="data-actions" style={{ marginTop: '1rem' }}>
              <button className="btn-primary" onClick={createEntriesFromText} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="spin" /> : <Sparkles size={16} />}
                <span>Process & Add Spooders</span>
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
            <h2>Add New Spooder</h2>
            <form onSubmit={handleAddSpooder}>
              <div className="form-group">
                <label>Spooder Name</label>
                <input 
                  type="text" 
                  value={newSpooderName} 
                  onChange={(e) => setNewSpooderName(e.target.value)}
                  placeholder="e.g. Edgar"
                  autoFocus
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Spooder</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

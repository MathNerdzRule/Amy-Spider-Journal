import React, { useState } from 'react';
import { useSpider } from '../context/SpiderContext';
import { createWorker } from 'tesseract.js';
import { Camera, FileUp, Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { format, subMonths } from 'date-fns';

const Analysis = () => {
  const { entries, activeSpiders, batchUpdateEntries } = useSpider();
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrText, setOcrText] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // AI Analysis Logic
  const runAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setAnalysisResult("API Key not found. Please set VITE_GEMINI_API_KEY in your environment.");
        setIsAnalyzing(false);
        return;
      }

      const twoMonthsAgo = subMonths(new Date(), 2);
      const relevantEntries = Object.entries(entries).filter(([date]) => new Date(date) >= twoMonthsAgo);
      
      const prompt = `
        Analyze the following spider care logs for the past 2 months and identify trends for each spider.
        Spiders: ${activeSpiders.map(s => s.name).join(', ')}
        Logs: ${JSON.stringify(relevantEntries)}
        
        Provide a concise summary of trends (e.g., molting frequency, hydration needs, feeding regularity).
      `;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No analysis available.";
      setAnalysisResult(resultText);
    } catch (err) {
      console.error(err);
      setAnalysisResult("Failed to run analysis. Check your API key and network.");
    } finally {
      setIsAnalyzing(false);
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
        Spiders currently in the journal: ${activeSpiders.map(s => `${s.id}: ${s.name}`).join(', ')}
        Notes: "${ocrText}"
        
        Return ONLY a JSON object in this format:
        {
          "date": "YYYY-MM-DD",
          "entries": {
            "spiderId": { "feeding": boolean, "watering": boolean, "molting": boolean, "notes": "string" }
          }
        }
        If multiple dates are found, return only the most recent one.
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
        batchUpdateEntries(parsed.date, parsed.entries);
        alert("Entries created successfully for " + parsed.date);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse entries. AI might have had trouble with the format.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="analysis-page">
      <header className="page-header">
        <h1>Insights & Tools</h1>
      </header>

      <section className="analysis-section glass-card">
        <div className="section-header">
          <Camera size={24} className="accent-icon" />
          <h2>Import from Photo</h2>
        </div>
        <p>Take a photo of hand-written notes or a screenshot to automatically create entries.</p>
        
        <div className="upload-controls">
          <label className="btn-primary glass upload-btn">
            <FileUp size={20} />
            <span>Upload Image</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
          </label>
        </div>

        {isProcessing && (
          <div className="processing-state">
            <Loader2 className="spin" />
            <span>Parsing text from image...</span>
          </div>
        )}

        {ocrText && (
          <div className="ocr-result glass">
            <h3>Detected Text:</h3>
            <pre>{ocrText}</pre>
            <div className="data-actions" style={{ marginTop: '1rem' }}>
              <button className="btn-primary" onClick={createEntriesFromText} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="spin" /> : <Sparkles size={16} />}
                <span>Create Journal Entries</span>
              </button>
              <button className="btn-secondary" onClick={() => setOcrText('')}>
                Clear
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="analysis-section glass-card" style={{ marginTop: '2rem' }}>
        <div className="section-header">
          <TrendingUp size={24} className="accent-icon" />
          <h2>Trend Analysis</h2>
        </div>
        <p>AI-powered analysis of the last 2 months of data.</p>
        
        <button 
          onClick={runAnalysis} 
          className="btn-primary glass" 
          disabled={isAnalyzing || Object.keys(entries).length === 0}
          style={{ marginTop: '1rem' }}
        >
          {isAnalyzing ? <Loader2 className="spin" /> : <Sparkles size={20} />}
          <span>{isAnalyzing ? 'Analyzing...' : 'Generate Trends'}</span>
        </button>

        {analysisResult && (
          <div className="analysis-result glass">
            <h3>AI Insights:</h3>
            <div className="markdown-content">
              {analysisResult.split('\n').map((line, i) => <p key={i}>{line}</p>)}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Analysis;

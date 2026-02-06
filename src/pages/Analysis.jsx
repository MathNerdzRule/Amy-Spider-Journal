import React, { useState } from 'react';
import { useSpider } from '../context/SpiderContext';
import { Wand2, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { subMonths } from 'date-fns';

const Analysis = () => {
  const { entries, activeSpiders } = useSpider();
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  return (
    <div className="analysis-page">
      <header className="page-header">
        <h1>Analysis</h1>
      </header>

      <section className="analysis-section glass-card">
        <div className="section-header">
          <TrendingUp size={24} className="accent-icon" />
          <h2>Health Trends</h2>
        </div>
        <p>AI-powered analysis of the last 2 months of care data to identify patterns and needs.</p>
        
        <button 
          onClick={runAnalysis} 
          className="btn-primary glass" 
          disabled={isAnalyzing || Object.keys(entries).length === 0}
          style={{ marginTop: '1rem' }}
        >
          {isAnalyzing ? <Loader2 className="spin" /> : <Sparkles size={20} />}
          <span>{isAnalyzing ? 'Analyzing...' : 'Generate Insights'}</span>
        </button>

        {analysisResult && (
          <div className="analysis-result glass" style={{ marginTop: '1.5rem' }}>
            <div className="section-header" style={{ marginBottom: '1rem' }}>
              <Wand2 size={20} className="accent-icon" />
              <h3 style={{ margin: 0 }}>AI Health Summary</h3>
            </div>
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

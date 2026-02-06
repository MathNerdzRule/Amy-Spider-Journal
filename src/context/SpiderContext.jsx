import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';

const SpiderContext = createContext();

export const useSpider = () => useContext(SpiderContext);

export const SpiderProvider = ({ children }) => {
  const [activeSpiders, setActiveSpiders] = useState(() => {
    const saved = localStorage.getItem('activeSpiders');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const [deceasedSpiders, setDeceasedSpiders] = useState(() => {
    const saved = localStorage.getItem('deceasedSpiders');
    return saved ? JSON.parse(saved) : [];
  });

  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('entries');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('activeSpiders', JSON.stringify(activeSpiders));
  }, [activeSpiders]);

  useEffect(() => {
    localStorage.setItem('deceasedSpiders', JSON.stringify(deceasedSpiders));
  }, [deceasedSpiders]);

  useEffect(() => {
    localStorage.setItem('entries', JSON.stringify(entries));
  }, [entries]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const updateEntry = (spiderId, field, value) => {
    setEntries(prev => {
      const dayEntries = prev[dateKey] || {};
      const spiderEntry = dayEntries[spiderId] || { feeding: false, watering: false, molting: false, notes: '' };
      
      return {
        ...prev,
        [dateKey]: {
          ...dayEntries,
          [spiderId]: {
            ...spiderEntry,
            [field]: value
          }
        }
      };
    });
  };

  const selectAll = (field, value) => {
    setEntries(prev => {
      const dayEntries = prev[dateKey] || {};
      const newDayEntries = { ...dayEntries };
      
      activeSpiders.forEach(spider => {
        const spiderEntry = newDayEntries[spider.id] || { feeding: false, watering: false, molting: false, notes: '' };
        newDayEntries[spider.id] = { ...spiderEntry, [field]: value };
      });
      
      return {
        ...prev,
        [dateKey]: newDayEntries
      };
    });
  };

  const markAsDeceased = (spiderId, deceasedDate, notes) => {
    const spider = activeSpiders.find(s => s.id === spiderId);
    if (!spider) return;

    setDeceasedSpiders(prev => [...prev, { ...spider, deceasedDate, deceasedNotes: notes }]);
    setActiveSpiders(prev => prev.filter(s => s.id !== spiderId));
  };

  const exportData = () => {
    const data = { activeSpiders, deceasedSpiders, entries };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amy-spider-journal-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const importData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.activeSpiders) setActiveSpiders(data.activeSpiders);
      if (data.deceasedSpiders) setDeceasedSpiders(data.deceasedSpiders);
      if (data.entries) setEntries(data.entries);
    } catch (e) {
      console.error("Failed to import data", e);
      alert("Invalid JSON file");
    }
  };

  const addSpider = (name) => {
    const newSpider = { id: Date.now().toString(), name };
    setActiveSpiders(prev => [...prev, newSpider]);
  };

  const batchUpdateEntries = (date, newEntries) => {
    setEntries(prev => {
      const dayEntries = prev[date] || {};
      return {
        ...prev,
        [date]: {
          ...dayEntries,
          ...newEntries
        }
      };
    });
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (currentTheme) => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (currentTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(currentTheme);
    }
  };

  return (
    <SpiderContext.Provider value={{
      activeSpiders,
      deceasedSpiders,
      entries,
      theme,
      setTheme,
      selectedDate,
      setSelectedDate,
      dateKey,
      updateEntry,
      batchUpdateEntries,
      selectAll,
      markAsDeceased,
      exportData,
      importData,
      addSpider
    }}>
      {children}
    </SpiderContext.Provider>
  );
};

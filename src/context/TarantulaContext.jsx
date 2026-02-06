import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';

const TarantulaContext = createContext();

export const useTarantula = () => useContext(TarantulaContext);

export const TarantulaProvider = ({ children }) => {
  const [activeSpooders, setActiveSpooders] = useState(() => {
    const saved = localStorage.getItem('activeSpooders');
    return saved ? JSON.parse(saved) : [];
  });

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system';
  });

  const [deceasedSpooders, setDeceasedSpooders] = useState(() => {
    const saved = localStorage.getItem('deceasedSpooders');
    return saved ? JSON.parse(saved) : [];
  });

  const [entries, setEntries] = useState(() => {
    const saved = localStorage.getItem('entries');
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    localStorage.setItem('activeSpooders', JSON.stringify(activeSpooders));
  }, [activeSpooders]);

  useEffect(() => {
    localStorage.setItem('deceasedSpooders', JSON.stringify(deceasedSpooders));
  }, [deceasedSpooders]);

  useEffect(() => {
    localStorage.setItem('entries', JSON.stringify(entries));
  }, [entries]);

  const dateKey = format(selectedDate, 'yyyy-MM-dd');

  const updateEntry = (spooderId, field, value) => {
    setEntries(prev => {
      const dayEntries = { ...(prev[dateKey] || {}) };
      const spooderEntry = { ...(dayEntries[spooderId] || { feeding: false, watering: false, molting: false, notes: '' }) };
      
      spooderEntry[field] = value;

      const isEmpty = !spooderEntry.feeding && !spooderEntry.watering && !spooderEntry.molting && !spooderEntry.notes.trim();

      if (isEmpty) {
        delete dayEntries[spooderId];
      } else {
        dayEntries[spooderId] = spooderEntry;
      }

      const newEntries = { ...prev };
      if (Object.keys(dayEntries).length === 0) {
        delete newEntries[dateKey];
      } else {
        newEntries[dateKey] = dayEntries;
      }

      return newEntries;
    });
  };

  const selectAll = (field, value) => {
    setEntries(prev => {
      const dayEntries = prev[dateKey] || {};
      const newDayEntries = { ...dayEntries };
      
      activeSpooders.forEach(spooder => {
        const spooderEntry = newDayEntries[spooder.id] || { feeding: false, watering: false, molting: false, notes: '' };
        newDayEntries[spooder.id] = { ...spooderEntry, [field]: value };
      });
      
      return {
        ...prev,
        [dateKey]: newDayEntries
      };
    });
  };

  const markAsDeceased = (spooderId, deceasedDate, notes) => {
    const spooder = activeSpooders.find(s => s.id === spooderId);
    if (!spooder) return;

    setDeceasedSpooders(prev => [...prev, { ...spooder, deceasedDate, deceasedNotes: notes }]);
    setActiveSpooders(prev => prev.filter(s => s.id !== spooderId));
  };

  const exportData = () => {
    const data = { activeSpooders, deceasedSpooders, entries };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amy-tarantula-journal-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  const importData = (jsonData) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.activeSpooders) setActiveSpooders(data.activeSpooders);
      if (data.deceasedSpooders) setDeceasedSpooders(data.deceasedSpooders);
      if (data.entries) setEntries(data.entries);
      
      // Migration for old exports
      if (data.activeSpiders) setActiveSpooders(data.activeSpiders);
      if (data.deceasedSpiders) setDeceasedSpooders(data.deceasedSpiders);
      
    } catch (e) {
      console.error("Failed to import data", e);
      alert("Invalid JSON file");
    }
  };

  const addSpooder = (name) => {
    const newSpooder = { id: Date.now().toString(), name };
    setActiveSpooders(prev => [...prev, newSpooder]);
  };

  const batchUpdateEntries = (date, newEntries) => {
    setEntries(prev => {
      const dayEntries = { ...(prev[date] || {}), ...newEntries };
      const cleanedDayEntries = {};
      
      Object.entries(dayEntries).forEach(([spooderId, entry]) => {
        const isEmpty = !entry.feeding && !entry.watering && !entry.molting && !(entry.notes || '').trim();
        if (!isEmpty) {
          cleanedDayEntries[spooderId] = entry;
        }
      });

      const newAllEntries = { ...prev };
      if (Object.keys(cleanedDayEntries).length === 0) {
        delete newAllEntries[date];
      } else {
        newAllEntries[date] = cleanedDayEntries;
      }
      return newAllEntries;
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

  const deleteSpooder = (id) => {
    setActiveSpooders(prev => prev.filter(s => s.id !== id));
    setEntries(prev => {
      const newEntries = { ...prev };
      Object.keys(newEntries).forEach(date => {
        const dayEntries = { ...newEntries[date] };
        delete dayEntries[id];
        if (Object.keys(dayEntries).length === 0) {
          delete newEntries[date];
        } else {
          newEntries[date] = dayEntries;
        }
      });
      return newEntries;
    });
  };

  const batchAddSpooders = (names) => {
    const newSpooders = names.map((name, index) => ({
      id: (Date.now() + index).toString(),
      name
    }));
    setActiveSpooders(prev => [...prev, ...newSpooders]);
    return newSpooders;
  };

  return (
    <TarantulaContext.Provider value={{
      activeSpooders,
      deceasedSpooders,
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
      addSpooder,
      batchAddSpooders,
      deleteSpooder
    }}>
      {children}
    </TarantulaContext.Provider>
  );
};

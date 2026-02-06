import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Journal from './pages/Journal';
import CalendarView from './pages/CalendarView';
import Deceased from './pages/Deceased';
import Analysis from './pages/Analysis';
import Settings from './pages/Settings';

function App() {
  return (
    <>
      <main>
        <Routes>
          <Route path="/" element={<Journal />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/deceased" element={<Deceased />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      <Navbar />
    </>
  );
}

export default App;

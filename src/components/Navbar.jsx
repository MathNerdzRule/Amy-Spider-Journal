import React from 'react';
import { NavLink } from 'react-router-dom';
import { Table, Calendar, Ghost, Settings, Wand2 } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="glass navbar">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Table size={24} />
        <span>Journal</span>
      </NavLink>
      <NavLink to="/calendar" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Calendar size={24} />
        <span>Calendar</span>
      </NavLink>
      <NavLink to="/deceased" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Ghost size={24} />
        <span>Deceased</span>
      </NavLink>
      <NavLink to="/analysis" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Wand2 size={24} />
        <span>Analysis</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings size={24} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};

export default Navbar;

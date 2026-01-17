import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Users, UserPlus, Shield, LogOut, BarChart3, Car, MapPin } from 'lucide-react';
import api from '../services/api';
import './AdminDashboard.css';

// Components
import ManageSupervisors from '../components/admin/ManageSupervisors';
import ManageDrivers from '../components/admin/ManageDrivers';
import ManageVenues from '../components/admin/ManageVenues';
import AdminStats from '../components/admin/AdminStats';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('stats');

  const navItems = [
    { id: 'stats', label: 'Dashboard', icon: BarChart3, path: '/admin/stats' },
    { id: 'supervisors', label: 'Supervisors', icon: Shield, path: '/admin/supervisors' },
    { id: 'drivers', label: 'Drivers', icon: Car, path: '/admin/drivers' },
    { id: 'venues', label: 'Venues', icon: MapPin, path: '/admin/venues' }
  ];

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo-section">
            <Shield size={32} color="#FF6B35" />
            <h2>GrowMore Admin</h2>
            <p>{user?.name}</p>
          </div>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <nav className="dashboard-nav">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(item.id);
              navigate(item.path);
            }}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="dashboard-content">
        <Routes>
          <Route path="stats" element={<AdminStats />} />
          <Route path="supervisors" element={<ManageSupervisors />} />
          <Route path="drivers" element={<ManageDrivers />} />
          <Route path="venues" element={<ManageVenues />} />
          <Route path="/" element={<AdminStats />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminDashboard;

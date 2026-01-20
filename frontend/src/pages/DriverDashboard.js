import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { Home, PlusCircle, List, LogOut, Clock, Bell } from 'lucide-react';
import api from '../services/api';
import logo from '../logo.png';
import './DriverDashboard.css';

// Components
import CreateBooking from '../components/CreateBooking';
import MyBookings from '../components/MyBookings';
import DriverHome from '../components/DriverHome';
import Payment from '../components/Payment';

const DriverDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, on, off } = useSocket();
  const [activeTab, setActiveTab] = useState('home');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (socket) {
      const handleRecallRequest = (data) => {
        toast((t) => (
          <div>
            <strong>🚗 Car Recall Request!</strong>
            <p>Booking: {data.bookingId}</p>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setActiveTab('bookings');
                navigate('/driver/bookings');
              }}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                background: '#FF6B35',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              View Booking
            </button>
          </div>
        ), { duration: 10000 });
        
        setNotifications(prev => [...prev, data]);
      };

      on('recall-request', handleRecallRequest);

      return () => {
        off('recall-request', handleRecallRequest);
      };
    }
  }, [socket, on, off, navigate]);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/driver/home' },
    { id: 'create', label: 'Create Booking', icon: PlusCircle, path: '/driver/create-booking' },
    { id: 'bookings', label: 'My Bookings', icon: List, path: '/driver/bookings' }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <img
            src={logo}
            alt="GrowMore Logo"
            style={{ width: '40px', height: 'auto', objectFit: 'contain' }}
          />
          <div>
            <h2>GrowMore Driver</h2>
            <p>{user?.name}</p>
          </div>
        </div>
        <div className="header-right">
          {notifications.length > 0 && (
            <div className="notification-badge">
              <Bell size={20} />
              <span>{notifications.length}</span>
            </div>
          )}
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
          <Route path="home" element={<DriverHome />} />
          <Route path="create-booking" element={<CreateBooking />} />
          <Route path="payment" element={<Payment />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="/" element={<CreateBooking />} />
        </Routes>
      </main>
    </div>
  );
};

export default DriverDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { LogOut, Activity, Car, Clock, DollarSign, TrendingUp } from 'lucide-react';
import api from '../services/api';
import './SupervisorDashboard.css';

const SupervisorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, on, off } = useSocket();
  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  useEffect(() => {
    fetchStats();
    fetchBookings();
  }, [filter]);

  useEffect(() => {
    if (socket) {
      const handleNewBooking = () => {
        toast.success('New booking created!');
        fetchStats();
        fetchBookings();
      };

      on('new-booking', handleNewBooking);

      return () => {
        off('new-booking', handleNewBooking);
      };
    }
  }, [socket, on, off]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/bookings/stats/overview');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchBookings = async () => {
    try {
      const params = filter === 'all' ? {} : { status: filter === 'active' ? 'parked,recall-requested,in-transit,arrived' : 'completed' };
      const response = await api.get('/bookings/all', { params });
      setBookings(response.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const statCards = [
    { label: 'Today\'s Bookings', value: stats.todayBookings || 0, icon: TrendingUp, color: '#3B82F6' },
    { label: 'Active Bookings', value: stats.activeBookings || 0, icon: Activity, color: '#FF6B35' },
    { label: 'Completed', value: stats.completedBookings || 0, icon: Car, color: '#10B981' },
    { label: 'Revenue', value: `₹${stats.totalRevenue || 0}`, icon: DollarSign, color: '#8B5CF6' }
  ];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-left">
          <Activity size={28} color="#FF6B35" />
          <div>
            <h2>Supervisor Dashboard</h2>
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

      <main className="supervisor-content">
        <div className="stats-grid">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="stat-card"
              style={{ borderLeft: `4px solid ${stat.color}` }}
            >
              <div className="stat-icon" style={{ background: `${stat.color}20` }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <div className="stat-info">
                <p className="stat-label">{stat.label}</p>
                <h3 className="stat-value">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bookings-section">
          <div className="section-header">
            <h3>All Bookings</h3>
            <div className="filter-buttons">
              <button
                className={filter === 'active' ? 'active' : ''}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button
                className={filter === 'completed' ? 'active' : ''}
                onClick={() => setFilter('completed')}
              >
                Completed
              </button>
              <button
                className={filter === 'all' ? 'active' : ''}
                onClick={() => setFilter('all')}
              >
                All
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="bookings-table">
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking._id}>
                      <td><strong>{booking.bookingId}</strong></td>
                      <td>
                        {booking.customer.name}<br/>
                        <small>{booking.customer.phone}</small>
                      </td>
                      <td>{booking.vehicle.number}</td>
                      <td>{booking.driver?.name || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${booking.status}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <small>{new Date(booking.createdAt).toLocaleString()}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bookings.length === 0 && (
                <div className="empty-table">No bookings found</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SupervisorDashboard;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { BarChart3, Users, Car, FileText, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import './AdminStats.css';

const AdminStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading statistics...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="admin-stats-container"
    >
      <h2>Dashboard Overview</h2>

      <div className="stats-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="stat-card supervisors"
        >
          <div className="stat-icon">
            <Users size={32} />
          </div>
          <div className="stat-info">
            <h3>Supervisors</h3>
            <p className="stat-number">{stats?.supervisors.total || 0}</p>
            <span className="stat-meta">
              {stats?.supervisors.active || 0} active
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card drivers"
        >
          <div className="stat-icon">
            <Car size={32} />
          </div>
          <div className="stat-info">
            <h3>Drivers</h3>
            <p className="stat-number">{stats?.drivers.total || 0}</p>
            <span className="stat-meta">
              {stats?.drivers.active || 0} active
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card bookings"
        >
          <div className="stat-icon">
            <FileText size={32} />
          </div>
          <div className="stat-info">
            <h3>Total Bookings</h3>
            <p className="stat-number">{stats?.bookings.total || 0}</p>
            <span className="stat-meta">
              {stats?.bookings.completed || 0} completed
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card active"
        >
          <div className="stat-icon">
            <TrendingUp size={32} />
          </div>
          <div className="stat-info">
            <h3>Active Bookings</h3>
            <p className="stat-number">{stats?.bookings.active || 0}</p>
            <span className="stat-meta">In progress</span>
          </div>
        </motion.div>
      </div>

      <div className="quick-info">
        <h3>System Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Supervisor-Driver Ratio:</span>
            <span className="info-value">
              {stats?.supervisors.total > 0 
                ? (stats.drivers.total / stats.supervisors.total).toFixed(2) 
                : '0'}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Booking Completion Rate:</span>
            <span className="info-value">
              {stats?.bookings.total > 0
                ? ((stats.bookings.completed / stats.bookings.total) * 100).toFixed(1) + '%'
                : '0%'}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminStats;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlusCircle, List, Car, TrendingUp } from 'lucide-react';
import './DriverHome.css';

const DriverHome = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Create Booking',
      description: 'Add a new valet parking booking',
      icon: PlusCircle,
      color: '#FF6B35',
      action: () => navigate('/driver/create')
    },
    {
      title: 'My Bookings',
      description: 'View and manage your bookings',
      icon: List,
      color: '#3B82F6',
      action: () => navigate('/driver/bookings')
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="driver-home-container"
    >
      <div className="welcome-section">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="welcome-icon"
        >
          <Car size={80} color="#FF6B35" />
        </motion.div>
        <h1>Welcome to GrowMore</h1>
        <p>Manage your valet parking operations efficiently</p>
      </div>

      <div className="quick-actions-grid">
        {quickActions.map((action, index) => (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="action-card"
            onClick={action.action}
          >
            <div className="action-icon" style={{ background: `${action.color}20` }}>
              <action.icon size={32} color={action.color} />
            </div>
            <h3>{action.title}</h3>
            <p>{action.description}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="tips-section"
      >
        <h3>💡 Quick Tips</h3>
        <ul>
          <li>Always verify vehicle details before parking</li>
          <li>Note the parking spot for quick retrieval</li>
          <li>Respond promptly to recall requests</li>
          <li>Verify OTP before completing the booking</li>
          <li>Collect payment and confirm the method</li>
        </ul>
      </motion.div>
    </motion.div>
  );
};

export default DriverHome;

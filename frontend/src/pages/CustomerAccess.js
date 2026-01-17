import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import './CustomerLogin.css';

const CustomerAccess = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleAutoLogin();
  }, [token]);

  const handleAutoLogin = async () => {
    try {
      const response = await api.get(`/auth/customer/access/${token}`);
      const { token: authToken, user } = response.data;
      
      // Store authentication
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Update auth context
      if (setUser) {
        setUser(user);
      }
      
      toast.success(`Welcome ${user.name}!`);
      
      // Redirect to customer dashboard
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('Auto-login error:', error);
      setError(error.response?.data?.message || 'Invalid or expired link');
      toast.error('Failed to access booking. Please try the customer login.');
      
      setTimeout(() => {
        navigate('/customer/login');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="login-header"
        >
          <div className="logo-small">
            <svg width="60" height="60" viewBox="0 0 120 120" fill="none">
              <circle cx="60" cy="60" r="55" stroke="#FF6B35" strokeWidth="4" />
              <path d="M40 50 L60 30 L80 50" stroke="#FF6B35" strokeWidth="6" strokeLinecap="round" />
              <rect x="35" y="50" width="50" height="35" rx="4" fill="#FF6B35" />
              <circle cx="45" cy="75" r="8" fill="#fff" />
              <circle cx="75" cy="75" r="8" fill="#fff" />
            </svg>
          </div>
          <h1>GrowMore</h1>
          
          {loading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ marginTop: '30px' }}
            >
              <div className="spinner"></div>
            </motion.div>
          )}
          
          {loading && <p style={{ marginTop: '20px', color: '#666' }}>Accessing your booking...</p>}
          
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ 
                marginTop: '20px', 
                padding: '15px', 
                background: '#FEE2E2', 
                borderRadius: '8px',
                color: '#DC2626'
              }}
            >
              <p>{error}</p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>Redirecting to login...</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerAccess;

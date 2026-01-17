import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { LogIn, Phone, Lock, User } from 'lucide-react';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
    role: 'driver'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData, formData.role);
      
      if (result.success) {
        // Additional check to prevent admin login through regular login page
        if (result.user.role === 'admin') {
          toast.error('Admin login is not allowed here. Please use the admin portal.');
          logout();
          setLoading(false);
          return;
        }
        
        toast.success(`Welcome back, ${result.user.name}!`);
        
        if (result.user.role === 'driver') {
          navigate('/driver/create-booking');
        } else if (result.user.role === 'supervisor') {
          navigate('/supervisor/dashboard');
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
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
          <p>Staff Login</p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="login-form"
        >
          <div className="form-group">
            <label>Login As</label>
            <div className="role-selector">
              <button
                type="button"
                className={`role-btn ${formData.role === 'driver' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'driver' })}
              >
                <User size={20} />
                Driver
              </button>
              <button
                type="button"
                className={`role-btn ${formData.role === 'supervisor' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'supervisor' })}
              >
                <User size={20} />
                Supervisor
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-wrapper">
              <Phone size={20} className="input-icon" />
              <input
                type="tel"
                id="phone"
                name="phone"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                maxLength="10"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock size={20} className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn size={20} />
                Login
              </>
            )}
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            className="customer-btn"
            onClick={() => navigate('/customer/login')}
          >
            Customer Login
          </button>

          <p className="demo-credentials">
            <strong>Demo:</strong> Driver: 9999999999 / driver123 | Supervisor: 8888888888 / super123
          </p>
        </motion.form>
      </div>
    </div>
  );
};

export default LoginPage;

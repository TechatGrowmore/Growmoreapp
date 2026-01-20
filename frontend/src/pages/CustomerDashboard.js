import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';
import { LogOut, Car, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../services/api';
import logo from '../logo.png';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket, on, off } = useSocket();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleCarInTransit = (data) => {
        toast.success(`Your car is on the way! ETA: ${data.estimatedMinutes} minutes`);
        fetchBookings();
      };

      const handleCarArrived = (data) => {
        toast((t) => (
          <div>
            <strong>✅ Your car has arrived!</strong>
            <p>Verification OTP: <strong style={{fontSize: '18px', color: '#FF6B35'}}>{data.otp}</strong></p>
          </div>
        ), { duration: 15000 });
        fetchBookings();
      };

      const handleBookingCompleted = () => {
        toast.success('Booking completed! Thank you for using GrowMore');
        fetchBookings();
      };

      on('car-in-transit', handleCarInTransit);
      on('car-arrived', handleCarArrived);
      on('booking-completed', handleBookingCompleted);

      return () => {
        off('car-in-transit', handleCarInTransit);
        off('car-arrived', handleCarArrived);
        off('booking-completed', handleBookingCompleted);
      };
    }
  }, [socket, on, off]);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/customer-bookings');
      setBookings(response.data.bookings);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleRecallCar = async (bookingId) => {
    try {
      await api.post(`/bookings/${bookingId}/recall`);
      toast.success('Car recall request sent!');
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to recall car');
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/customer/login');
  };

  const getStatusColor = (status) => {
    const colors = {
      'parked': '#10B981',
      'recall-requested': '#F59E0B',
      'in-transit': '#3B82F6',
      'arrived': '#8B5CF6',
      'completed': '#6B7280'
    };
    return colors[status] || '#666';
  };

  const getStatusText = (status) => {
    const texts = {
      'parked': 'Parked Safely',
      'recall-requested': 'Recall Requested',
      'in-transit': 'On The Way',
      'arrived': 'Car Arrived',
      'completed': 'Completed'
    };
    return texts[status] || status;
  };

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
            <h2>My Bookings</h2>
            <p>{user?.name || user?.phone}</p>
          </div>
        </div>
        <div className="header-right">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      <main className="customer-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="empty-state"
          >
            <Car size={80} color="#CCC" />
            <h3>No bookings yet</h3>
            <p>Your valet parking bookings will appear here</p>
          </motion.div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking, index) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="booking-card"
              >
                <div className="booking-header">
                  <div>
                    <h3>{booking.bookingId}</h3>
                    <p className="booking-time">
                      {new Date(booking.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span 
                    className="status-badge"
                    style={{ background: getStatusColor(booking.status) }}
                  >
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="booking-details">
                  <div className="detail-row">
                    <Car size={18} />
                    <span>{booking.vehicle.number} - {booking.vehicle.type.toUpperCase()}</span>
                  </div>
                  {booking.vehicle.model && (
                    <div className="detail-row">
                      <span className="detail-label">Model:</span>
                      <span>{booking.vehicle.model}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <Clock size={18} />
                    <span>Parked for: {booking.parking.estimatedDuration} mins</span>
                  </div>
                  {booking.location.venue && (
                    <div className="detail-row">
                      <span className="detail-label">Venue:</span>
                      <span>{booking.location.venue}</span>
                    </div>
                  )}
                </div>

                {booking.status === 'in-transit' && booking.recall?.estimatedArrival && (
                  <div className="eta-banner">
                    <Clock size={20} />
                    <span>Your car will arrive in <strong>{booking.recall.estimatedArrival} minutes</strong></span>
                  </div>
                )}

                {booking.status === 'arrived' && booking.verification?.otp && (
                  <div className="otp-banner">
                    <AlertCircle size={20} />
                    <div>
                      <span>Verification OTP:</span>
                      <strong>{booking.verification.otp}</strong>
                    </div>
                  </div>
                )}

                {booking.status === 'parked' && (
                  <button 
                    className="recall-btn"
                    onClick={() => handleRecallCar(booking._id)}
                  >
                    🚗 Recall My Car
                  </button>
                )}

                {booking.status === 'completed' && (
                  <div className="completed-banner">
                    <CheckCircle size={20} />
                    <span>Completed - ₹{booking.payment?.amount || 0}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import logoVideo from '../logo.mp4';
import './SplashScreen.css';

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/login');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-screen">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="splash-content"
      >
        <div className="logo-container">
          <video
            src={logoVideo}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', maxWidth: '420px', height: 'auto', borderRadius: '16px', boxShadow: '0 6px 36px rgba(0,0,0,0.06)' }}
          />
        </div>
        
      </motion.div>
    </div>
  );
};

export default SplashScreen;

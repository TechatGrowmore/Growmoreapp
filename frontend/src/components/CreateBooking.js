import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Car, Phone, User, Clock, MapPin, FileText, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import './CreateBooking.css';

const CreateBooking = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleType: 'car',
    vehicleNumber: '',
    vehicleModel: '',
    vehicleColor: '',
    estimatedDuration: '',
    parkingSpot: '',
    venue: '',
    notes: '',
    hasValuables: false,
    valuables: []
  });
  const [carImages, setCarImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [venues, setVenues] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await api.get('/venues/active');
      setVenues(response.data.venues || []);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
      toast.error('Failed to load venues');
    } finally {
      setLoadingVenues(false);
    }
  };

  const valuableOptions = [
    'Laptop', 'Phone', 'Wallet', 'Gift', 'Snacks', 'Charger', 'HeadPhone'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleValuablesToggle = () => {
    setFormData({
      ...formData,
      hasValuables: !formData.hasValuables,
      valuables: !formData.hasValuables ? formData.valuables : []
    });
  };

  const handleValuableSelect = (valuable) => {
    const updated = formData.valuables.includes(valuable)
      ? formData.valuables.filter(v => v !== valuable)
      : [...formData.valuables, valuable];
    
    setFormData({
      ...formData,
      valuables: updated
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + carImages.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    setCarImages([...carImages, ...files]);
  };

  const removeImage = (index) => {
    setCarImages(carImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append regular form fields
      Object.keys(formData).forEach(key => {
        if (key === 'valuables') {
          submitData.append(key, JSON.stringify(formData[key]));
        } else {
          submitData.append(key, formData[key]);
        }
      });

      // Append images
      carImages.forEach((file, index) => {
        submitData.append('carImages', file);
      });

      const response = await api.post('/bookings', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Check if venue requires upfront payment
      // Check if venue requires upfront payment
      let requiresPayment = false;
      if (formData.venue) {
        try {
          const venueCheckResponse = await api.get(`/venues/check-payment/${encodeURIComponent(formData.venue)}`);
          requiresPayment = venueCheckResponse.data.requiresUpfrontPayment;
        } catch (error) {
          console.error('Failed to check venue payment requirement:', error);
          // Default to false if check fails
          requiresPayment = false;
        }
      }

      if (requiresPayment) {
        // Redirect to payment page
        navigate('/driver/payment', { 
          state: { booking: response.data.booking }
        });
      } else {
        toast.success(`Booking created! ID: ${response.data.booking.bookingId}`);
        
        // Reset form
        setFormData({
          customerName: '',
          customerPhone: '',
          customerEmail: '',
          vehicleType: 'car',
          vehicleNumber: '',
          vehicleModel: '',
          vehicleColor: '',
          estimatedDuration: '',
          parkingSpot: '',
          venue: '',
          notes: '',
          hasValuables: false,
          valuables: []
        });
        setCarImages([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="create-booking-container"
    >
      <div className="booking-header-section">
        <button 
          type="button"
          className="back-to-home-btn"
          onClick={() => navigate('/driver/home')}
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>
        <h2>Create New Booking</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="booking-form">
        <div className="form-section">
          <h3><User size={20} /> Customer Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                placeholder="Enter customer name"
              />
            </div>
            <div className="form-group">
              <label htmlFor="customerPhone">Phone Number *</label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                required
                pattern="[0-9]{10}"
                maxLength="10"
                placeholder="10-digit mobile number"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="customerEmail">Email (Optional)</label>
            <input
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="customer@example.com"
            />
          </div>
        </div>

        <div className="form-section">
          <h3><Car size={20} /> Vehicle Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicleType">Vehicle Type (Optional)</label>
              <select
                id="vehicleType"
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleChange}
              >
                <option value="car">Car</option>
                <option value="bike">Bike</option>
                <option value="suv">SUV</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="vehicleNumber">Vehicle Number *</label>
              <input
                type="text"
                id="vehicleNumber"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                required
                placeholder="MH12AB1234"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="vehicleModel">Model (Optional)</label>
              <input
                type="text"
                id="vehicleModel"
                name="vehicleModel"
                value={formData.vehicleModel}
                onChange={handleChange}
                placeholder="e.g., Honda City"
              />
            </div>
            <div className="form-group">
              <label htmlFor="vehicleColor">Color (Optional)</label>
              <input
                type="text"
                id="vehicleColor"
                name="vehicleColor"
                value={formData.vehicleColor}
                onChange={handleChange}
                placeholder="e.g., White"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3><Clock size={20} /> Parking Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estimatedDuration">Estimated Duration (minutes) (Optional)</label>
              <input
                type="number"
                id="estimatedDuration"
                name="estimatedDuration"
                value={formData.estimatedDuration}
                onChange={handleChange}
                min="1"
                placeholder="120"
              />
            </div>
            <div className="form-group">
              <label htmlFor="parkingSpot">Parking Spot (Optional)</label>
              <input
                type="text"
                id="parkingSpot"
                name="parkingSpot"
                value={formData.parkingSpot}
                onChange={handleChange}
                placeholder="e.g., A-15"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="venue">Venue *</label>
            <select
              id="venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              required
              disabled={loadingVenues}
            >
              <option value="">
                {loadingVenues ? 'Loading venues...' : 'Select a venue'}
              </option>
              {venues.map((venue) => (
                <option key={venue._id} value={venue.name}>
                  {venue.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Any special instructions..."
            />
          </div>
        </div>

        <div className="form-section">
          <h3><Car size={20} /> Vehicle Security</h3>
          
          {/* Valuables Section */}
          <div className="valuables-section">
            <div className="valuables-toggle">
              <label className="toggle-label">
                <span>Any valuables in the car?</span>
                <input
                  type="checkbox"
                  checked={formData.hasValuables}
                  onChange={handleValuablesToggle}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            {formData.hasValuables && (
              <div className="valuables-list">
                <p className="valuables-subtitle">Select valuables:</p>
                <div className="valuables-grid">
                  {valuableOptions.map(valuable => (
                    <button
                      key={valuable}
                      type="button"
                      className={`valuable-chip ${formData.valuables.includes(valuable) ? 'selected' : ''}`}
                      onClick={() => handleValuableSelect(valuable)}
                    >
                      {valuable}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Car Images Section */}
          <div className="car-images-section">
            <label className="image-upload-label">Upload Car Images (Max 4)</label>
            <p className="image-upload-hint">Capture front, back, and both sides for security</p>
            
            <div className="image-upload-buttons">
              {/* Browse Files */}
              <div className="image-upload-area">
                <input
                  type="file"
                  id="carImages"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  disabled={carImages.length >= 4}
                />
                <label htmlFor="carImages" className={`upload-label ${carImages.length >= 4 ? 'disabled' : ''}`}>
                  <Car size={40} />
                  <span>Browse Images</span>
                </label>
              </div>

              {/* Camera Capture */}
              <div className="image-upload-area">
                <input
                  type="file"
                  id="cameraCapture"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  disabled={carImages.length >= 4}
                />
                <label htmlFor="cameraCapture" className={`upload-label camera-label ${carImages.length >= 4 ? 'disabled' : ''}`}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>Use Camera</span>
                </label>
              </div>
            </div>

            <div className="upload-count-display">{carImages.length}/4 images uploaded</div>

            {carImages.length > 0 && (
              <div className="image-preview-grid">
                {carImages.map((file, index) => (
                  <div key={index} className="image-preview">
                    <img src={URL.createObjectURL(file)} alt={`Car ${index + 1}`} />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Creating Booking...' : 'Create Booking'}
        </button>
      </form>
    </motion.div>
  );
};

export default CreateBooking;

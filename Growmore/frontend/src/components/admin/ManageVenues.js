import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MapPin, Plus, Edit, Trash2, X, Check, Shield, DollarSign } from 'lucide-react';
import api from '../../services/api';
import './ManageUsers.css';

const ManageVenues = () => {
  const [venues, setVenues] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    requiresUpfrontPayment: false,
    supervisorId: '',
    isActive: true
  });

  useEffect(() => {
    fetchVenues();
    fetchSupervisors();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await api.get('/admin/venues');
      setVenues(response.data.venues);
    } catch (error) {
      toast.error('Failed to fetch venues');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupervisors = async () => {
    try {
      const response = await api.get('/admin/supervisors');
      setSupervisors(response.data.supervisors.filter(s => s.isActive));
    } catch (error) {
      console.error('Failed to fetch supervisors');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/admin/venues/${editingId}`, formData);
        toast.success('Venue updated successfully');
      } else {
        await api.post('/admin/venues', formData);
        toast.success('Venue created successfully');
      }
      resetForm();
      fetchVenues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (venue) => {
    setEditingId(venue._id);
    setFormData({
      name: venue.name,
      requiresUpfrontPayment: venue.requiresUpfrontPayment,
      supervisorId: venue.supervisor?._id || '',
      isActive: venue.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this venue?')) return;
    
    try {
      await api.delete(`/admin/venues/${id}`);
      toast.success('Venue deleted successfully');
      fetchVenues();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete venue');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', requiresUpfrontPayment: false, supervisorId: '', isActive: true });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="loading">Loading venues...</div>;
  }

  return (
    <div className="manage-users-container">
      <div className="page-header">
        <h2>Manage Venues</h2>
        <button className="add-btn" onClick={() => setShowForm(true)}>
          <Plus size={20} />
          Add Venue
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="form-container"
        >
          <div className="form-header">
            <h3>{editingId ? 'Edit Venue' : 'Add New Venue'}</h3>
            <button className="close-btn" onClick={resetForm}>
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Venue Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="e.g., Infinity Mall"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requiresUpfrontPayment}
                  onChange={(e) => setFormData({...formData, requiresUpfrontPayment: e.target.checked})}
                />
                <span>
                  <DollarSign size={16} style={{display: 'inline', marginRight: '4px'}} />
                  Requires Upfront Payment
                </span>
              </label>
              <p style={{fontSize: '13px', color: '#666', marginTop: '4px', marginLeft: '26px'}}>
                If enabled, payment will be collected before creating the booking
              </p>
            </div>

            {formData.requiresUpfrontPayment && (
              <div className="form-group">
                <label>Assign Supervisor *</label>
                <select
                  value={formData.supervisorId}
                  onChange={(e) => setFormData({...formData, supervisorId: e.target.value})}
                  required={formData.requiresUpfrontPayment}
                >
                  <option value="">Select Supervisor</option>
                  {supervisors.map(sup => (
                    <option key={sup._id} value={sup._id}>
                      {sup.name} ({sup.phone})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                />
                <span>Active</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                <Check size={18} />
                {editingId ? 'Update' : 'Create'} Venue
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Venue Name</th>
              <th>Payment</th>
              <th>Supervisor</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue._id}>
                <td>
                  <div className="user-cell">
                    <MapPin size={18} color="#FF6B35" />
                    <span>{venue.name}</span>
                  </div>
                </td>
                <td>
                  {venue.requiresUpfrontPayment ? (
                    <span style={{color: '#10B981', fontWeight: '600', fontSize: '13px'}}>
                      <DollarSign size={14} style={{display: 'inline', marginRight: '2px'}} />
                      Upfront
                    </span>
                  ) : (
                    <span style={{color: '#666', fontSize: '13px'}}>After Service</span>
                  )}
                </td>
                <td>
                  {venue.supervisor ? (
                    <div className="supervisor-cell">
                      <Shield size={14} color="#667eea" />
                      <span>{venue.supervisor.name}</span>
                    </div>
                  ) : (
                    <span style={{color: '#999'}}>Not assigned</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge ${venue.isActive ? 'active' : 'inactive'}`}>
                    {venue.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(venue.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="icon-btn edit"
                      onClick={() => handleEdit(venue)}
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      className="icon-btn delete"
                      onClick={() => handleDelete(venue._id)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {venues.length === 0 && (
          <div className="empty-state">
            <MapPin size={64} color="#CCC" />
            <p>No venues found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageVenues;

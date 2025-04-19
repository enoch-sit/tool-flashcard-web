import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CreditPackageManager.css';

interface CreditPackage {
  _id?: string;
  name: string;
  description: string;
  credits: number;
  price: number;
  isActive: boolean;
}

const CreditPackageManager: React.FC = () => {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for new/edit package
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [formData, setFormData] = useState<CreditPackage>({
    name: '',
    description: '',
    credits: 0,
    price: 0,
    isActive: true
  });

  // Load packages on component mount
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/admin/packages');
      setPackages(response.data.packages);
    } catch (err) {
      console.error('Error fetching credit packages:', err);
      setError('Failed to fetch credit packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked
      });
    } else {
      // For number inputs, convert value to number
      const processedValue = type === 'number' ? parseFloat(value) : value;
      setFormData({
        ...formData,
        [name]: processedValue
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      credits: 0,
      price: 0,
      isActive: true
    });
    setEditingPackage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Format price as cents for the API
      const packageData = {
        ...formData,
        price: Math.round(formData.price * 100) / 100
      };
      
      if (editingPackage && editingPackage._id) {
        // Update existing package
        await axios.put(`/api/admin/packages/${editingPackage._id}`, packageData);
        setSuccess('Package updated successfully!');
      } else {
        // Create new package
        await axios.post('/api/admin/packages', packageData);
        setSuccess('Package created successfully!');
      }
      
      // Refresh packages list
      fetchPackages();
      resetForm();
    } catch (err) {
      console.error('Error saving credit package:', err);
      setError('Failed to save credit package. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: CreditPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      credits: pkg.credits,
      price: pkg.price,
      isActive: pkg.isActive
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this package?')) {
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(`/api/admin/packages/${id}`);
      setSuccess('Package deleted successfully!');
      fetchPackages();
    } catch (err) {
      console.error('Error deleting credit package:', err);
      setError('Failed to delete credit package. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="credit-package-manager">
      <h2>Manage Credit Packages</h2>
      
      {/* Alert messages */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      
      {/* Package form */}
      <div className="form-container">
        <h3>{editingPackage ? 'Edit Package' : 'Create New Package'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Package Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="credits">Credits</label>
              <input
                type="number"
                id="credits"
                name="credits"
                min="1"
                value={formData.credits}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group checkbox">
            <label>
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              Active
            </label>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
            </button>
            
            {editingPackage && (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Packages list */}
      <div className="packages-list">
        <h3>Available Packages</h3>
        
        {loading && <p>Loading packages...</p>}
        
        {!loading && packages.length === 0 && (
          <p>No credit packages found. Create your first package above.</p>
        )}
        
        {!loading && packages.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Credits</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg._id} className={pkg.isActive ? '' : 'inactive'}>
                  <td>{pkg.name}</td>
                  <td>{pkg.description}</td>
                  <td>{pkg.credits}</td>
                  <td>${(pkg.price / 100).toFixed(2)}</td>
                  <td>{pkg.isActive ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button 
                      className="btn btn-small btn-edit" 
                      onClick={() => handleEdit(pkg)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-small btn-delete" 
                      onClick={() => pkg._id && handleDelete(pkg._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CreditPackageManager;
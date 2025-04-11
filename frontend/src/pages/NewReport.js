import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function NewReport() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: 'downtown',
    category: 'infrastructure',
  });

  const torontoNeighborhoods = [
    { value: 'downtown', label: 'Downtown' },
    { value: 'yorkville', label: 'Yorkville' },
    { value: 'kensington', label: 'Kensington Market' },
    { value: 'chinatown', label: 'Chinatown' },
    { value: 'distillery', label: 'Distillery District' },
    { value: 'liberty', label: 'Liberty Village' },
    { value: 'queen_west', label: 'Queen West' },
    { value: 'king_west', label: 'King West' },
    { value: 'entertainment', label: 'Entertainment District' },
    { value: 'financial', label: 'Financial District' },
    { value: 'harbourfront', label: 'Harbourfront' },
    { value: 'st_lawrence', label: 'St. Lawrence Market' },
    { value: 'corktown', label: 'Corktown' },
    { value: 'leslieville', label: 'Leslieville' },
    { value: 'riverdale', label: 'Riverdale' },
    { value: 'beaches', label: 'The Beaches' },
    { value: 'annex', label: 'The Annex' },
    { value: 'yorkville', label: 'Yorkville' },
    { value: 'rosedale', label: 'Rosedale' },
    { value: 'cabbagetown', label: 'Cabbagetown' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement report submission
    console.log('Submitting report:', formData);
    navigate('/reports');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'location' && !value.endsWith('Toronto, ON, Canada')) {
      return; // Ignore invalid locations
    }
    
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  return (
    <div className="new-report-page">
      <h1>New Report</h1>
      <form onSubmit={handleSubmit} className="report-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location</label>
          <select
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          >
            {torontoNeighborhoods.map((neighborhood) => (
              <option key={neighborhood.value} value={neighborhood.value}>
                {neighborhood.label}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
          >
            <option value="infrastructure">Infrastructure</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="safety">Safety</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit Report
        </button>
      </form>
    </div>
  );
}

export default NewReport; 
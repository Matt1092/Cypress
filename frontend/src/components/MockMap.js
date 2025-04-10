import React from 'react';

const MockMap = ({ reports }) => {
  // Helper function to get background color based on report type
  const getBackgroundColor = (type, status) => {
    // If solved, use purple
    if (status === 'Solved') {
      return '#9c27b0';
    }

    // Otherwise base on type, but show all report locations with red pins
    return '#e53935'; // Red color for all report pins
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="mock-map-container">
      <div className="mock-map-header">
        <h2>Report Visualization (API Key Required for Map)</h2>
        <p>This is a simplified visualization of the reports. For a full interactive map, please add a Google Maps API key.</p>
      </div>

      <div className="mock-map-grid">
        {reports.filter(report => 
          report.location && 
          report.location.coordinates && 
          Array.isArray(report.location.coordinates) && 
          report.location.coordinates.length === 2
        ).map(report => (
          <div 
            key={report._id} 
            className="mock-map-marker"
            style={{ 
              backgroundColor: getBackgroundColor(report.type, report.status),
            }}
          >
            <div className="mock-map-tooltip">
              <h4>{report.name}</h4>
              <p><strong>Type:</strong> {report.type}</p>
              <p><strong>Status:</strong> {report.status}</p>
              <p><strong>Description:</strong> {report.description.substring(0, 100)}{report.description.length > 100 ? '...' : ''}</p>
              <p><strong>Location:</strong> {report.userLocation}</p>
              <p><strong>Reported:</strong> {formatDate(report.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mock-map-legend">
        <div className="legend-title">Legend</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4285F4' }}></div>
            <span>Infrastructure</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#34A853' }}></div>
            <span>Cleanliness</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#FBBC05' }}></div>
            <span>Human-related</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#9c27b0' }}></div>
            <span>Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockMap; 
import React from 'react';
import { Link } from 'react-router-dom';

function Reports() {
  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reports</h1>
        <Link to="/reports/new" className="btn btn-primary">
          New Report
        </Link>
      </div>
      <div className="reports-list">
        {/* Reports will be listed here */}
        <p>No reports found.</p>
      </div>
    </div>
  );
}

export default Reports; 
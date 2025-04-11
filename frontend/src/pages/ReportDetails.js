import React from 'react';
import { useParams } from 'react-router-dom';

function ReportDetails() {
  const { id } = useParams();

  return (
    <div className="report-details-page">
      <h1>Report Details</h1>
      <div className="report-details">
        <p>Report ID: {id}</p>
        {/* Report details will be displayed here */}
        <p>Loading report details...</p>
      </div>
    </div>
  );
}

export default ReportDetails; 
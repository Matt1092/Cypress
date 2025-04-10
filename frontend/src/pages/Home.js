import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-page">
      <section className="hero">
        <h1>Report City Problems with Cypress2</h1>
        <p>Help make your city better by reporting issues like potholes, graffiti, broken streetlights, and more.</p>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/login" className="btn btn-primary" style={{ marginRight: '1rem' }}>
            Login
          </Link>
          <Link to="/register" className="btn btn-primary">
            Register
          </Link>
        </div>
      </section>

      <section className="feature-section">
        <div className="feature-card">
          <h2>Report Problems</h2>
          <p>Easily report infrastructure, cleanliness, or human-related issues with detailed descriptions and location.</p>
        </div>
        <div className="feature-card">
          <h2>Track Progress</h2>
          <p>Follow the status of your reports and see when they've been verified, are in progress, or have been resolved.</p>
        </div>
        <div className="feature-card">
          <h2>Make a Difference</h2>
          <p>Join the community of active citizens helping to improve the city for everyone.</p>
        </div>
      </section>
    </div>
  );
}

export default Home; 
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { reportService } from '../services/api';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import MockMap from '../components/MockMap';

const containerStyle = {
  width: '100%',
  height: '700px'
};

// Toronto as default center
const defaultCenter = {
  lat: 43.6532,
  lng: -79.3832
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
};

const libraries = ['places'];

function Map() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Check if API key exists and is valid
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
  useEffect(() => {
    if (!apiKey || apiKey === '' || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
      setApiKeyMissing(true);
      console.error('Google Maps API key is missing or invalid. Please add a valid key to frontend/.env file.');
    }
  }, [apiKey]);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries
  });
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Initialize search box
  const initSearchBox = useCallback(() => {
    if (isLoaded && window.google && searchBoxRef.current) {
      const searchBox = new window.google.maps.places.SearchBox(searchBoxRef.current);
      
      searchBox.addListener('places_changed', () => {
        const places = searchBox.getPlaces();
        
        if (places.length === 0) return;
        
        const place = places[0];
        if (!place.geometry || !place.geometry.location) return;
        
        const newCenter = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        };
        
        setMapCenter(newCenter);
        
        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          mapRef.current.setZoom(15);
        }
      });
    }
  }, [isLoaded]);

  // Function to filter valid reports
  const getValidReports = (reportsList) => {
    return reportsList.filter(report => 
      report.location && 
      report.location.coordinates && 
      Array.isArray(report.location.coordinates) && 
      report.location.coordinates.length === 2
    );
  };

  // Fetch all reports from the API
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reportService.getAll();
      
      if (response.data.success) {
        console.log('Fetched reports:', response.data.data);
        const allReports = response.data.data;
        setReports(allReports);
        
        // Check if there are valid reports
        const validReports = getValidReports(allReports);
        if (validReports.length === 0 && allReports.length > 0) {
          console.warn('No reports with valid location data found');
          setError('No reports with valid location data found. Please check the report data.');
        }
      } else {
        setError('Failed to load reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Error loading reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (isLoaded) {
      initSearchBox();
    }
  }, [isLoaded, initSearchBox]);

  // Add pulsing effect for flagged reports when map and reports are loaded
  useEffect(() => {
    if (isLoaded && mapRef.current && window.PulsingMarker && reports.length > 0) {
      // Clear any existing pulsing markers
      if (window.pulsingMarkers) {
        window.pulsingMarkers.forEach(marker => marker.setMap(null));
      }
      window.pulsingMarkers = [];
      
      // Create pulsing markers for flagged reports
      const flaggedReports = getValidReports(reports).filter(report => report.status === 'Report Flagged');
      
      flaggedReports.forEach(report => {
        const position = new window.google.maps.LatLng(
          report.location.coordinates[1],
          report.location.coordinates[0]
        );
        
        const pulsingMarker = new window.PulsingMarker(position, mapRef.current);
        window.pulsingMarkers.push(pulsingMarker);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (window.pulsingMarkers) {
        window.pulsingMarkers.forEach(marker => marker.setMap(null));
        window.pulsingMarkers = [];
      }
    };
  }, [isLoaded, reports, getValidReports]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    initSearchBox(); // Initialize search box after map loads

    // Add custom overlay prototype
    if (window.google && window.google.maps) {
      class PulsingMarker extends window.google.maps.OverlayView {
        constructor(position, map) {
          super();
          this.position = position;
          this.setMap(map);
        }

        onAdd() {
          this.div = document.createElement('div');
          this.div.classList.add('pulsing-dot');
          
          const pane = this.getPanes().overlayLayer;
          pane.appendChild(this.div);
        }

        draw() {
          const overlayProjection = this.getProjection();
          const position = overlayProjection.fromLatLngToDivPixel(this.position);
          
          this.div.style.left = position.x - 15 + 'px';
          this.div.style.top = position.y - 15 + 'px';
        }

        onRemove() {
          if (this.div) {
            this.div.parentNode.removeChild(this.div);
            this.div = null;
          }
        }
      }
      
      window.PulsingMarker = PulsingMarker;
    }
  }, [initSearchBox]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The searchBox will handle the place search through the places_changed event
  };

  // Customize marker options
  const getMarkerOptions = (report) => {
    return {
      position: {
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0]
      },
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new window.google.maps.Size(36, 36)
      },
      animation: window.google.maps.Animation.DROP,
      clickable: true,
      title: report.name
    };
  };

  const filterReports = (type) => {
    fetchReports().then(() => {
      if (type && type !== 'all') {
        setReports(prevReports => {
          const filteredReports = prevReports.filter(report => report.type === type);
          
          // Check if there are valid reports after filtering
          const validReports = getValidReports(filteredReports);
          if (validReports.length === 0 && filteredReports.length > 0) {
            setError('No reports with valid location data found for this filter.');
          } else {
            setError('');
          }
          
          return filteredReports;
        });
      }
    });
  };

  const filterReportsByStatus = (status) => {
    fetchReports().then(() => {
      if (status && status !== 'all') {
        setReports(prevReports => {
          const filteredReports = prevReports.filter(report => report.status === status);
          
          // Check if there are valid reports after filtering
          const validReports = getValidReports(filteredReports);
          if (validReports.length === 0 && filteredReports.length > 0) {
            setError('No reports with valid location data found for this filter.');
          } else {
            setError('');
          }
          
          return filteredReports;
        });
      }
    });
  };

  if (apiKeyMissing) {
    return (
      <div className="map-page">
        <h1>City Reports Map</h1>
        <div className="alert-error">
          <p>To use the interactive map, you need to add a valid Google Maps API key.</p>
          <h3>How to fix this:</h3>
          <ol>
            <li>Get a Google Maps API key from <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noreferrer">Google Cloud Platform</a></li>
            <li>Create or edit the file <code>frontend/.env</code></li>
            <li>Add your API key: <code>REACT_APP_GOOGLE_MAPS_API_KEY=your_api_key_here</code></li>
            <li>Restart the development server</li>
          </ol>
        </div>
        
        {/* Display the mock map as an alternative */}
        <MockMap reports={reports} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="map-container error-container">
        <h1>Error loading Google Maps</h1>
        <div className="alert-error">
          <p>There was an error loading Google Maps. This might be due to:</p>
          <ul>
            <li>Invalid API key</li>
            <li>Network connectivity issues</li>
            <li>Exceeded API quota</li>
          </ul>
          <p>Please check the console for more details.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="loading-container">Loading Maps...</div>;
  }

  return (
    <div className="map-page">
      <h1>City Reports Map</h1>
      
      <div className="map-controls">
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            ref={searchBoxRef}
            type="text"
            placeholder="Search for a location"
            value={searchValue}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
        
        <div className="filter-controls">
          <label>Filter by type:</label>
          <select onChange={(e) => filterReports(e.target.value)} className="filter-select">
            <option value="all">All Reports</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="cleanliness">Cleanliness</option>
            <option value="human">Human-related</option>
          </select>
          
          <label>Filter by status:</label>
          <select onChange={(e) => filterReportsByStatus(e.target.value)} className="filter-select">
            <option value="all">All Statuses</option>
            <option value="Report Flagged">Report Flagged</option>
            <option value="Verified">Verified</option>
            <option value="In progress">In progress</option>
            <option value="Solved">Solved</option>
          </select>
          
          <button 
            onClick={() => {
              fetchReports();
              setError('');
            }} 
            className="btn btn-secondary"
          >
            Reset Filters
          </button>
        </div>
      </div>
      
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker" style={{ backgroundColor: '#e53935' }}></div>
          <span>All Reports</span>
        </div>
        <div className="legend-item status-divider">|</div>
        <div className="legend-item">
          <div className="legend-status status-waiting"></div>
          <span>Report Flagged</span>
          <span className="legend-note">(larger markers)</span>
        </div>
        <div className="legend-item">
          <div className="legend-status status-verified"></div>
          <span>Verified</span>
        </div>
        <div className="legend-item">
          <div className="legend-status status-in-progress"></div>
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-status status-solved"></div>
          <span>Solved</span>
        </div>
      </div>
      
      {error && (
        <div className="alert-error">{error}</div>
      )}
      
      {loading ? (
        <div className="loading-container">Loading reports...</div>
      ) : (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={12}
          onLoad={onMapLoad}
          options={mapOptions}
        >
          {getValidReports(reports).map(report => (
            <Marker
              key={report._id}
              position={{
                lat: report.location.coordinates[1],
                lng: report.location.coordinates[0]
              }}
              onClick={() => setSelectedReport(report)}
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(
                  report.status === 'Report Flagged' ? 48 : 36, 
                  report.status === 'Report Flagged' ? 48 : 36
                )
              }}
              animation={window.google.maps.Animation.DROP}
              title={report.name}
              zIndex={report.status === 'Report Flagged' ? 1000 : 500}
            />
          ))}
          
          {selectedReport && selectedReport.location && selectedReport.location.coordinates && (
            <InfoWindow
              position={{
                lat: selectedReport.location.coordinates[1],
                lng: selectedReport.location.coordinates[0]
              }}
              onCloseClick={() => setSelectedReport(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -40),
                maxWidth: 320
              }}
            >
              <div className="info-window">
                <h3>{selectedReport.name}</h3>
                <div className="info-window-content">
                  <p>
                    <strong>Type:</strong> {selectedReport.type.charAt(0).toUpperCase() + selectedReport.type.slice(1)}
                  </p>
                  <p>
                    <strong>Status:</strong> 
                    <span className={`status-indicator ${
                      selectedReport.status === 'Report Flagged' ? 'status-waiting' : 
                      selectedReport.status === 'Verified' ? 'status-verified' : 
                      selectedReport.status === 'In progress' ? 'status-in-progress' : 
                      'status-solved'}`}>
                      {selectedReport.status}
                    </span>
                  </p>
                  <p>
                    <strong>Description:</strong> {selectedReport.description}
                  </p>
                  <p>
                    <strong>Location:</strong> {selectedReport.userLocation}
                  </p>
                  <p>
                    <strong>Reported:</strong> {formatDate(selectedReport.createdAt)}
                  </p>
                  {selectedReport.user && selectedReport.user.username && (
                    <p>
                      <strong>Reported by:</strong> {selectedReport.user.username}
                    </p>
                  )}
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      )}
      
      <div className="report-stats">
        <h3>Report Statistics</h3>
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-label">Total Reports:</span>
            <span className="stat-value">{reports.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Infrastructure Issues:</span>
            <span className="stat-value">{reports.filter(r => r.type === 'infrastructure').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Cleanliness Issues:</span>
            <span className="stat-value">{reports.filter(r => r.type === 'cleanliness').length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Human-related Issues:</span>
            <span className="stat-value">{reports.filter(r => r.type === 'human').length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Map; 
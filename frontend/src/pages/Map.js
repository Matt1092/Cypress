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

const markerStyle = {
  width: '20px',
  height: '20px',
  backgroundColor: '#ff0000',
  borderRadius: '50%',
  border: '2px solid white',
  boxShadow: '0 0 0 2px #ff0000',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const innerCircleStyle = {
  width: '8px',
  height: '8px',
  backgroundColor: 'white',
  borderRadius: '50%',
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
};

function Map() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [showAllReports, setShowAllReports] = useState(false);
  const mapRef = useRef(null);
  const searchBoxRef = useRef(null);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [infoWindowOffsets, setInfoWindowOffsets] = useState({});

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
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Initialize search box
  const initSearchBox = useCallback(() => {
    if (isLoaded && window.google && searchBoxRef.current) {
      const searchBox = new window.google.maps.places.SearchBox(searchBoxRef.current, {
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(43.58, -79.64), // SW bounds of Toronto
          new window.google.maps.LatLng(43.85, -79.12)  // NE bounds of Toronto
        ),
        strictBounds: true,
        componentRestrictions: { country: 'ca' }
      });

      const autocomplete = new window.google.maps.places.Autocomplete(searchBoxRef.current, {
        bounds: new window.google.maps.LatLngBounds(
          new window.google.maps.LatLng(43.58, -79.64),
          new window.google.maps.LatLng(43.85, -79.12)
        ),
        strictBounds: true,
        componentRestrictions: { country: 'ca' },
        types: ['address']
      });
      
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;
        
        // Check if the location is in Toronto
        const isInToronto = place.formatted_address.includes('Toronto, ON, Canada');
        if (!isInToronto) {
          alert('Please select a location in Toronto, ON, Canada');
          searchBoxRef.current.value = '';
          return;
        }

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
      
      console.log('API Response:', response);
      
      // Handle both response formats (with or without success field)
      const responseData = response.data;
      
      // Check if the response has the expected structure
      if (responseData && (responseData.success === true || Array.isArray(responseData))) {
        // Extract reports based on response structure
        const allReports = responseData.success === true ? responseData.data : responseData;
        console.log('Fetched reports:', allReports);
        
        if (Array.isArray(allReports)) {
          setReports(allReports);
          
          // Check if there are valid reports
          const validReports = getValidReports(allReports);
          if (validReports.length === 0 && allReports.length > 0) {
            console.warn('No reports with valid location data found');
            setError('No reports with valid location data found. Please check the report data.');
          } else if (validReports.length === 0) {
            // No reports at all
            setError('No reports found. Try creating a new report in the Dashboard.');
          } else {
            setError(''); // Clear any previous errors
          }
        } else {
          console.error('Invalid reports format:', allReports);
          setError('Received invalid data format from the server.');
        }
      } else {
        console.error('Failed to load reports - Invalid response:', responseData);
        setError('Failed to load reports. Invalid server response.');
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
    if (!isLoaded || !mapRef.current) {
      console.log('Map not loaded yet, skipping pulsing marker setup');
      return;
    }
    
    if (!window.google || !window.google.maps) {
      console.error('Google Maps API not available');
      return;
    }
    
    try {
      // Ensure PulsingMarker class is defined
      if (!window.PulsingMarker) {
        console.error('PulsingMarker class not defined');
        return;
      }
      
      // Skip if no reports
      if (!reports || reports.length === 0) {
        console.log('No reports to display');
        return;
      }
      
      console.log('Setting up pulsing markers for', reports.length, 'reports');
      
      // Clear any existing pulsing markers
      if (window.pulsingMarkers) {
        window.pulsingMarkers.forEach(marker => {
          try {
            marker.setMap(null);
          } catch (e) {
            console.error('Error clearing marker:', e);
          }
        });
      }
      window.pulsingMarkers = [];
      
      // Create pulsing markers for flagged reports
      const validReports = getValidReports(reports);
      console.log('Valid reports:', validReports.length);
      
      const flaggedReports = validReports.filter(report => report.status === 'Report Flagged');
      console.log('Flagged reports:', flaggedReports.length);
      
      flaggedReports.forEach(report => {
        try {
          const position = new window.google.maps.LatLng(
            report.location.coordinates[1],
            report.location.coordinates[0]
          );
          
          const pulsingMarker = new window.PulsingMarker(position, mapRef.current, getPulsingDotColor(report.type), report);
          window.pulsingMarkers.push(pulsingMarker);
        } catch (e) {
          console.error('Error creating pulsing marker for report:', report._id, e);
        }
      });
      
      console.log('Created', window.pulsingMarkers.length, 'pulsing markers');
    } catch (err) {
      console.error('Error setting up pulsing markers:', err);
    }
    
    // Cleanup on unmount
    return () => {
      if (window.pulsingMarkers) {
        window.pulsingMarkers.forEach(marker => {
          try {
            marker.setMap(null);
          } catch (e) {
            console.error('Error cleaning up marker:', e);
          }
        });
        window.pulsingMarkers = [];
      }
    };
  }, [isLoaded, reports, getValidReports]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    console.log('Map loaded successfully');
    initSearchBox(); // Initialize search box after map loads

    // Prevent Google Maps from capturing clicks on our markers
    if (map) {
      // Disable POI (points of interest) so they don't interfere with our markers
      const mapOptions = {
        clickableIcons: false,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
          }
        ]
      };
      map.setOptions(mapOptions);
    }

    // Add custom overlay prototype
    if (window.google && window.google.maps) {
      try {
        console.log('Defining PulsingMarker class');
        
        // Only define it once
        if (!window.PulsingMarker) {
          class PulsingMarker extends window.google.maps.OverlayView {
            constructor(position, map, color = '#e53935', reportData = null) {
              super();
              this.position = position;
              this.color = color;
              this.reportData = reportData;
              this.setMap(map);
            }

            onAdd() {
              this.div = document.createElement('div');
              this.div.classList.add('pulsing-dot');
              
              // Set fixed size for outer circle
              this.div.style.width = '40px';
              this.div.style.height = '40px';
              this.div.style.backgroundColor = `${this.color}40`;
              this.div.style.borderRadius = '50%';
              this.div.style.position = 'absolute';
              this.div.style.transform = 'translate(-50%, -50%)';
              
              // Create inner dot with fixed size
              this.innerDot = document.createElement('div');
              this.innerDot.classList.add('pulsing-dot-inner');
              this.innerDot.style.width = '16px';
              this.innerDot.style.height = '16px';
              this.innerDot.style.backgroundColor = this.color;
              this.innerDot.style.borderRadius = '50%';
              this.innerDot.style.position = 'absolute';
              this.innerDot.style.top = '50%';
              this.innerDot.style.left = '50%';
              this.innerDot.style.transform = 'translate(-50%, -50%)';
              
              this.div.appendChild(this.innerDot);
              
              const pane = this.getPanes().overlayLayer;
              pane.appendChild(this.div);
              
              // Add tooltip element
              this.tooltip = document.createElement('div');
              this.tooltip.classList.add('marker-tooltip');
              this.tooltip.style.display = 'none';
              
              if (this.reportData) {
                const reportType = this.reportData.type.charAt(0).toUpperCase() + this.reportData.type.slice(1);
                this.tooltip.innerHTML = `
                  <div class="tooltip-header">${this.reportData.name || 'Report'}</div>
                  <div class="tooltip-content">
                    <p><strong>Type:</strong> ${reportType}</p>
                    <p><strong>Status:</strong> ${this.reportData.status}</p>
                    <p><strong>Location:</strong> ${this.reportData.userLocation}</p>
                    <p class="click-for-more">🔍 Click for more details</p>
                  </div>
                `;
              }
              
              this.div.appendChild(this.tooltip);
              
              // Add hover and click events
              this.div.addEventListener('mouseover', () => {
                this.tooltip.style.display = 'block';
                setTimeout(() => this.tooltip.classList.add('tooltip-visible'), 10);
              });
              
              this.div.addEventListener('mouseout', () => {
                this.tooltip.classList.remove('tooltip-visible');
                setTimeout(() => this.tooltip.style.display = 'none', 200);
              });
              
              this.div.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.reportData) {
                  setSelectedReport(this.reportData);
                }
              });
            }

            draw() {
              const overlayProjection = this.getProjection();
              const position = overlayProjection.fromLatLngToDivPixel(this.position);
              
              // Center the dot precisely using transform
              this.div.style.left = position.x + 'px';
              this.div.style.top = position.y + 'px';
            }

            onRemove() {
              if (this.div) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
              }
            }
          }
          
          window.PulsingMarker = PulsingMarker;
          console.log('PulsingMarker class defined successfully');
        } else {
          console.log('PulsingMarker class already defined');
        }
        
        // Trigger the reports useEffect to update the markers
        if (reports.length > 0) {
          console.log('Refreshing markers for', reports.length, 'reports');
          setReports([...reports]);
        } else {
          console.log('No reports to refresh');
        }
      } catch (err) {
        console.error('Error defining PulsingMarker class:', err);
      }
    } else {
      console.error('Google Maps API not available for defining PulsingMarker');
    }
  }, [initSearchBox, reports]);

  const handleSearchChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // The searchBox will handle the place search through the places_changed event
  };

  // Customize marker options with colors based on type
  const getMarkerOptions = (report) => {
    // Get color based on problem type
    let iconUrl;
    switch(report.type) {
      case 'infrastructure':
        iconUrl = 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png';
        break;
      case 'cleanliness':
        iconUrl = 'http://maps.google.com/mapfiles/ms/icons/green-dot.png';
        break;
      case 'human':
        iconUrl = 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png';
        break;
      default:
        iconUrl = 'http://maps.google.com/mapfiles/ms/icons/red-dot.png';
    }
    
    return {
      position: {
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0]
      },
      icon: {
        url: iconUrl,
        scaledSize: new window.google.maps.Size(
          report.status === 'Report Flagged' ? 48 : 36, 
          report.status === 'Report Flagged' ? 48 : 36
        )
      },
      animation: window.google.maps.Animation.DROP,
      clickable: true,
      title: report.name
    };
  };

  // Get color for pulsing dot
  const getPulsingDotColor = (reportType) => {
    switch(reportType) {
      case 'infrastructure':
        return '#FF6F00'; // Orange
      case 'cleanliness':
        return '#4CAF50'; // Green
      case 'human':
        return '#9C27B0'; // Purple
      default:
        return '#e53935'; // Red
    }
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

  // Add this function to calculate offsets for InfoWindows
  const calculateInfoWindowOffsets = useCallback((reports) => {
    const flaggedReports = reports.filter(r => r.status === 'Report Flagged');
    const offsets = {};
    
    // Group nearby reports (within 0.001 degrees ~ 100m)
    const groups = [];
    flaggedReports.forEach(report => {
      const lat = report.location.coordinates[1];
      const lng = report.location.coordinates[0];
      
      let foundGroup = false;
      for (const group of groups) {
        const groupLat = group[0].location.coordinates[1];
        const groupLng = group[0].location.coordinates[0];
        
        if (Math.abs(lat - groupLat) < 0.001 && Math.abs(lng - groupLng) < 0.001) {
          group.push(report);
          foundGroup = true;
          break;
        }
      }
      
      if (!foundGroup) {
        groups.push([report]);
      }
    });
    
    // Calculate offsets for each group
    groups.forEach(group => {
      if (group.length > 1) {
        const baseOffset = 60; // Base pixel offset
        group.forEach((report, index) => {
          const angle = (2 * Math.PI * index) / group.length;
          const radius = baseOffset * (1 + Math.floor(index / 8)); // Increase radius for larger groups
          
          offsets[report._id] = {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius
          };
        });
      } else {
        offsets[group[0]._id] = { x: 0, y: -40 }; // Default offset for single reports
      }
    });
    
    return offsets;
  }, []);

  // Update useEffect to calculate offsets when reports change
  useEffect(() => {
    if (showAllReports) {
      const newOffsets = calculateInfoWindowOffsets(reports);
      setInfoWindowOffsets(newOffsets);
    }
  }, [showAllReports, reports, calculateInfoWindowOffsets]);

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
        <div className="legend-title">Problem Types:</div>
        <div className="legend-item">
          <div className="legend-marker" style={{ backgroundColor: '#FF6F00' }}></div>
          <span>Infrastructure</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker" style={{ backgroundColor: '#4CAF50' }}></div>
          <span>Cleanliness</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker" style={{ backgroundColor: '#9C27B0' }}></div>
          <span>Human-related</span>
        </div>
        <div className="legend-item status-divider">|</div>
        <div className="legend-title">Status:</div>
        <div className="legend-item">
          <div className="legend-status status-waiting"></div>
          <span>Report Flagged</span>
          <span className="legend-note">(larger markers)</span>
        </div>
        <div className="legend-item">
          <div className="legend-status status-solved"></div>
          <span>Solved</span>
        </div>
      </div>
      
      <div className="map-usage-hint">
        <button 
          onClick={() => setShowAllReports(!showAllReports)} 
          className="btn btn-primary show-all-btn"
        >
          {showAllReports ? 'Hide Report Details' : 'Show All Flagged Reports'}
        </button>
      </div>
      
      {error && (
        <div className="alert-error">
          <p>{error}</p>
          <button 
            onClick={() => {
              setError('');
              fetchReports();
            }} 
            className="btn btn-primary"
            style={{ marginTop: '10px' }}
          >
            Retry Loading Reports
          </button>
        </div>
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
          clickableIcons={false}
        >
          {getValidReports(reports).map(report => (
            <Marker
              key={report._id}
              position={{
                lat: report.location.coordinates[1],
                lng: report.location.coordinates[0]
              }}
              onClick={() => {
                console.log('Marker clicked:', report.name);
                setSelectedReport(report);
              }}
              onMouseOver={() => setSelectedReport(report)}
              onMouseOut={() => showAllReports ? null : setSelectedReport(null)}
              icon={{
                url: report.type === 'infrastructure' 
                     ? 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png'
                     : report.type === 'cleanliness'
                       ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                       : report.type === 'human'
                         ? 'http://maps.google.com/mapfiles/ms/icons/purple-dot.png'
                         : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
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
          
          {(selectedReport || showAllReports) && getValidReports(reports).map(report => {
            if ((!showAllReports && selectedReport && selectedReport._id !== report._id) || 
                (showAllReports && report.status !== 'Report Flagged')) {
              return null;
            }
            
            const offset = infoWindowOffsets[report._id] || { x: 0, y: -40 };
            
            return (
              <InfoWindow
                key={`info-${report._id}`}
                position={{
                  lat: report.location.coordinates[1],
                  lng: report.location.coordinates[0]
                }}
                onCloseClick={() => showAllReports ? null : setSelectedReport(null)}
                options={{
                  pixelOffset: new window.google.maps.Size(offset.x, offset.y),
                  maxWidth: 250,
                  disableAutoPan: showAllReports
                }}
                zIndex={2000}
              >
                <div className="info-window">
                  <h3>{report.name || 'Report Details'}</h3>
                  <div className="info-window-content">
                    <p>
                      <strong>Type:</strong> {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                    </p>
                    <p>
                      <strong>Status:</strong> 
                      <span className={`status-indicator ${
                        report.status === 'Report Flagged' ? 'status-waiting' : 
                        report.status === 'Solved' ? 'status-solved' :
                        'status-waiting'}`}>
                        {report.status}
                      </span>
                    </p>
                    <p className="report-description">
                      <strong>Description:</strong> {report.description}
                    </p>
                    <p>
                      <strong>Location:</strong> {report.userLocation}
                    </p>
                    <p>
                      <strong>Reported:</strong> {formatDate(report.createdAt)}
                    </p>
                    {report.user && report.user.username && (
                      <p>
                        <strong>Reported by:</strong> {report.user.username}
                      </p>
                    )}
                    <div className="info-window-actions">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${report.location.coordinates[1]},${report.location.coordinates[0]}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="info-window-link"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            );
          })}
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
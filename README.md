# Cypress - City Problem Reporting System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)

## Project Overview

Cypress is a comprehensive city problem reporting platform that empowers citizens to report and track issues they observe around the city. From infrastructure problems like sinkholes and missing signs to safety concerns, Cypress provides a streamlined way for residents to notify authorities and monitor resolution progress.

## Project Showcase

https://www.youtube.com/watch?v=678GdPBHltM

## Key Features

- **Interactive Map Interface**: View all reported issues on a city map with status indicators
- **Issue Reporting System**: Submit detailed reports with precise location selection
- **Progress Tracking**: Monitor the status and resolution actions for submitted issues
- **Duplicate Detection**: Intelligent system flags similar reports in the same area

## Contributors

| Name | Student Number |
|------|---------------|
| Kavin Ainkaran | 501250717 |
| Matthew Moga | 501253529 |
| Adan Khalid | 501246496 |
| Timur Rakhimov | 501235815 |
| Ahmad Yehya | 501124095 |
| Mohammed Ahmed | 501265966 |

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- MongoDB instance
- Google Maps API key

### Installation & Running the Application

1. Clone the repository
   ```bash
   git clone https://github.com/Matt1092/Cypress.git
   cd Cypress
   ```

2. Install dependencies
   ```bash
   # Install all dependencies for the MERN app
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. Run the development server
   ```bash
   npm run dev:both
   ```

   Note: All necessary API keys and environment variables are already configured in the code.


## Application Features

| **User Features**                                   | **Admin Features**                            |
|-----------------------------------------------------|------------------------------------------------|
| Register and login securely                         | Manage and update report statuses              |
| Submit detailed reports with location selection     | Detect and manage duplicate reports            |
| Track status of submitted reports                   |                                                |
| View all reports on an interactive map              |                                                |
| Receive notifications on report updates             |                                                |


## Project Structure and Technologies

### Backend (/backend)

```
backend/
├── config/
│   └── db.js – Sets up and connects to the MongoDB database via Mongoose.
├── controllers/
│   ├── auth.controller.js – Auth logic (login, signup, JWT).
│   ├── maps.controller.js – Handles map-related data queries.
│   └── report.controller.js – Business logic for CRUD operations on reports.
├── middleware/
│   └── auth.js – JWT middleware for route protection.
├── models/
│   ├── report.model.js – Defines report structure (title, location, status, etc.).
│   └── user.model.js – Defines user schema (email, password).
├── routes/
│   ├── auth.route.js – Routes for authentication actions.
│   ├── maps.route.js – Routes for map data access.
│   └── report.route.js – REST API for reports (GET, POST, PUT, DELETE).
└── server.js – App entry point. Sets up Express, connects DB, mounts routes, starts server.
```
- **Node.js/Express API** handling all server-side logic
- **MongoDB** database integration using Mongoose
- Features:
  - User authentication (register, login, profile)
  - Report management (create, read, update, delete)
  - Maps integration for location-based features

### Frontend (/frontend)

```
frontend/
├── public/
│   ├── index.html – HTML template
│   └── manifest.json – PWA config
├── server/
│   ├── middleware/ – Auth middleware (JWT)
│   ├── models/ – Mongoose models for User and Report
│   ├── routes/ – Express routes (auth, maps, reports)
│   └── index.js – Server entry point
├── src/
│   ├── components/
│   │   └── MockMap.js – Map mock component
│   ├── pages/
│   │   ├── Dashboard.js, Home.js, Login.js, etc. – App views
│   ├── services/
│   │   └── api.js – Axios API service
│   ├── App.js – Main React app
│   ├── index.js – Entry point
│   └── setupProxy.js – Proxy config for API requests

```
- **React**: JavaScript library for building user interfaces
- **Material UI**: React component library implementing Google's Material Design
- **Google Maps API**: For map visualization of reports
- **JWT**: For secure authentication
- Features:
  - User registration and login forms
  - Report creation and management interface
  - Maps integration for location selection

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `PUT /api/auth/profile` - Update user profile

### Reports
- `GET /api/reports` - Get all reports
- `GET /api/reports/:id` - Get single report
- `POST /api/reports` - Create new report
- `PUT /api/reports/:id` - Update a report
- `DELETE /api/reports/:id` - Delete a report
- `PUT /api/reports/:id/status` - Update report status
- `GET /api/reports/nearby` - Get reports near a location
- `GET /api/reports/user/my-reports` - Get user's reports

### Maps
- `GET /api/maps/geocode` - Get address from coordinates
- `GET /api/maps/reverse-geocode` - Get coordinates from address
- `GET /api/maps/check-boundaries` - Check if location is within boundaries

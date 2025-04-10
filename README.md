# Cypress2 Project

A full-stack application for reporting city problems. Users can register, login, and create reports about issues they find in their city.

## Project Structure

The project is organized into two main parts:

### Backend (/backend)
- **Node.js/Express API** handling all server-side logic
- **MongoDB** database integration using Mongoose
- Features:
  - User authentication (register, login, profile)
  - Report management (create, read, update, delete)
  - Maps integration for location-based features

### Frontend (/frontend)
- **React** application for the user interface
- Features:
  - User registration and login forms
  - Report creation and management interface
  - Maps integration for location selection

## API Routes

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email
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

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file
4. Start the backend: `npm run dev`
5. Start the frontend: `cd frontend && npm start`
6. Or run both: `npm run dev:both`
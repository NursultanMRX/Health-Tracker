# Health Tracker - Diabetes Self-Monitoring Platform

A comprehensive full-stack diabetes patient monitoring application with SQLite backend, featuring patient self-logging and doctor review dashboards.

![Health Tracker](https://img.shields.io/badge/Health-Tracker-blue?style=for-the-badge&logo=health)
![React](https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat-square&logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-3-green?style=flat-square&logo=sqlite)
![Express](https://img.shields.io/badge/Express-5.1-black?style=flat-square&logo=express)

## 🎯 Overview

This Health Tracker application provides a complete solution for diabetes management, enabling patients to log their daily health data and allowing healthcare providers to monitor patient progress through comprehensive dashboards.

## ✨ Key Features

### 👤 For Patients
- ✅ **Daily Glucose Tracking** - Multiple measurement types with customizable units
- ✅ **Meal Logging** - Carbohydrate counting and nutritional tracking
- ✅ **Medication Adherence** - Track medication intake and missed doses
- ✅ **Physical Activity** - Log exercise and physical activities
- ✅ **Mood Tracking** - Daily mood and feeling check-ins
- ✅ **Customizable Settings** - Glucose units, targets, accessibility options
- ✅ **Interactive Charts** - Visual data representation (ready for implementation)

### 👨‍⚕️ For Healthcare Providers
- ✅ **Patient Management** - Comprehensive patient list with search functionality
- ✅ **Dual View Modes** - Grid and List view options
- ✅ **Clinical Alerts** - Real-time health alerts and trend detection
- ✅ **Patient Details** - Comprehensive patient data views
- ✅ **Status Monitoring** - Real-time patient status indicators (Stable/Alerts)

## 🏗️ Technology Stack

### Frontend
- **React 18.3** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for responsive styling
- **Lucide React** for modern icons
- **Recharts** for data visualization

### Backend
- **Express.js** server
- **SQLite** database with better-sqlite3
- **bcryptjs** for secure password hashing
- **JWT-like session** management
- **CORS** enabled for cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/NursultanMRX/Health-Tracker.git
cd Health-Tracker
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize the database**
```bash
# Create database schema
node server.js

# Create test accounts
node init-sqlite-data.js

# Seed patient data (optional - adds sample data)
node seed-patient-data.js
```

4. **Start the application**
```bash
# Run both frontend and backend
npm run dev:all
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔐 Test Accounts

### Doctor Account
- **Email**: `doctor@test.com`
- **Password**: `doctor123456`

### Patient Accounts (password: `patient123456`)
- `amelia@test.com` - Amelia Harper (female, 40y)
- `ethan@test.com` - Ethan Carter (male, 47y) ⚠️ **Has active alert**
- `olivia@test.com` - Olivia Bennett (female, 33y)
- `noah@test.com` - Noah Thompson (male, 37y)
- `isabella@test.com` - Isabella Wright (female, 30y) ⚠️ **Has active alert**

## 📊 Database Schema

The application uses SQLite with the following key tables:

- **`profiles`** - User accounts (doctors & patients)
- **`patient_settings`** - Patient preferences and configurations
- **`sessions`** - Authentication sessions
- **`glucose_readings`** - Blood glucose measurements
- **`meals`** - Food intake logs
- **`medications`** - Medication tracking
- **`activities`** - Exercise and physical activity logs
- **`feelings`** - Mood and emotional tracking
- **`clinical_alerts`** - Health alerts and notifications
- **`onboarding_data`** - Patient onboarding information

## 🎨 User Interface

### Doctor Dashboard
- **Grid View**: 3-column card layout for patient overview
- **List View**: Full-width rows with patient avatars
- **Search Functionality**: Filter patients by name or ID
- **Status Badges**: Visual indicators for patient health status
- **Clinical Alerts**: Real-time alert detection and management

### Patient Dashboard
- **Daily Logging**: Modal-based data entry for all health metrics
- **Settings Panel**: Customizable preferences and accessibility options
- **Onboarding Flow**: Guided setup for new users
- **Data Visualization**: Ready for chart implementation

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### Patient Data
- `GET/POST /api/glucose-readings` - Blood glucose data
- `GET/POST /api/meals` - Meal logging
- `GET/POST /api/medications` - Medication tracking
- `GET/POST /api/activities` - Physical activity logs
- `GET/POST /api/feelings` - Mood tracking
- `GET /api/clinical-alerts` - Health alerts

### Settings & Profiles
- `GET /api/profiles` - List all profiles
- `GET /api/profiles/:id` - Get specific profile
- `GET/PATCH /api/patient-settings/:patientId` - Patient settings

## 📁 Project Structure

```
Health-Tracker/
├── src/
│   ├── components/
│   │   ├── auth/           # Authentication screens
│   │   ├── patient/        # Patient dashboard & modals
│   │   ├── doctor/         # Doctor dashboard & views
│   │   └── common/         # Shared components
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── SettingsContext.tsx  # Patient settings
│   └── lib/
│       ├── sqlite-client.ts     # SQLite API client
│       └── supabase.ts          # Type definitions
├── server.js               # Express backend
├── diabetes.db            # SQLite database
├── init-sqlite-data.js    # Create test accounts
├── seed-patient-data.js   # Populate health data
└── package.json
```

## 🛠️ Development Scripts

```bash
# Run both server and client
npm run dev:all

# Run server only
npm run server

# Run client only
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📊 Sample Data

The application includes comprehensive test data:
- **6 patients** with complete profiles
- **14 days** of realistic health data per patient
- **339 glucose readings** across all patients
- **253 meal logs** with nutritional information
- **421 medication records** with adherence tracking
- **43 physical activities** logged
- **31 mood entries** for emotional tracking
- **2 clinical alerts** for demonstration

## 🔄 Database Management

### Reset Database
```bash
# Remove existing database
rm diabetes.db

# Recreate schema
node server.js

# Add test accounts
node init-sqlite-data.js

# Add sample health data
node seed-patient-data.js
```

### Verify Data
```bash
# Check user accounts
node verify-db.js

# Check health data
node verify-patient-data.js
```

## 🚧 Future Enhancements

- [ ] **Chart Components** - Glucose trends, histograms, and analytics
- [ ] **Export Functionality** - PDF/CSV data export
- [ ] **Real-time Notifications** - Push notifications for alerts
- [ ] **Advanced Analytics** - AI-powered health insights
- [ ] **Mobile App** - React Native version
- [ ] **Data Backup/Restore** - Cloud synchronization
- [ ] **Multi-language Support** - Internationalization
- [ ] **Telemedicine Integration** - Video consultations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation files:
  - `SQLITE_MIGRATION.md` - Database migration details
  - `FEATURES.md` - Feature documentation

## 🎉 Getting Started

Ready to start? Run `npm run dev:all` and login as a doctor to see all patients with real data!

---

**Built with ❤️ for better diabetes management**

# URLhaus-GUI

A full-stack web application for exploring and analyzing malicious URLs from the URLhaus database. Built with React, TypeScript, Material-UI, and Node.js, this tool provides security researchers and analysts with an intuitive interface to search, filter, and export threat intelligence data with intelligent caching and rate limiting.

## Features

### **Advanced Search & Analysis**
- **Dual Search Modes**: Automatic detection between URL and Host/IP search
- **Real-time Search**: Instant results with intelligent query parsing
- **Smart Detection**: Automatically determines search type based on input format
- **Comprehensive Results**: Detailed threat information with visual indicators

### **Interactive Dashboard**
- **Modern Table Interface**: Sortable columns with fixed headers and smooth scrolling
- **Visual Threat Indicators**: Color-coded status badges and threat level indicators
- **Pagination**: Efficient data browsing with customizable page sizes
- **Export Capabilities**: CSV and JSON export functionality

### **Real-time Updates**
- **Manual Refresh System**: Rate-limited API calls (5-minute intervals)
- **Intelligent Caching**: Redis-based caching with 5-minute TTL for recent URLs, 1-hour for searches
- **New Entry Highlighting**: Visual indicators for recently added threats
- **Countdown Timer**: Clear indication of next available refresh
- **Auto-dismiss Notifications**: Error messages with automatic cleanup
- **Performance Optimization**: 80-90% reduction in API calls through smart caching

### **Security & Authentication**
- **API Key Authentication**: Secure access to URLhaus API through backend proxy
- **Session Management**: Persistent authentication with secure logout
- **Rate Limiting**: Built-in protection against API abuse (10 requests per 5 minutes)
- **Error Handling**: Comprehensive error management with pill-shaped notifications and stacking
- **Backend Security**: Helmet.js security headers, CORS protection, input validation

### **Modern UI/UX**
- **Material-UI Design**: Consistent, professional interface
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Social Integration**: Facebook links for community engagement
- **Modern Visual Design**: Clean, professional interface with subtle effects
- **Smooth Animations**: Polished user interactions and transitions
- **Audio Notifications**: Sound alerts for new threat entries

### **Detailed URL Analysis**
- **Comprehensive Details**: Two-card layout for organized information display
- **Payload Information**: Detailed malware and file analysis
- **Threat Intelligence**: Tags, blacklist status, and reputation data
- **Abuse Reporting**: Integration with abuse complaint tracking
- **Hash Analysis**: MD5, SHA256, and other cryptographic hashes

## Stack

### **Frontend**
- **React 19** with TypeScript
- **Material-UI 7** for UI components
- **Vite 7** for build tooling
- **Axios** for HTTP requests
- **React Router DOM** for routing
- **Emotion** for CSS-in-JS styling

### **Backend**
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Redis** for intelligent caching
- **Axios** for URLhaus API integration
- **Helmet.js** for security headers
- **CORS** for cross-origin protection

## Quick Start

### Prerequisites
- **Node.js 18+** 
- **npm or yarn**
- **Redis** (for caching - optional but recommended)
- **URLhaus Auth key**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/VETEIS/urlhaus-gui.git
   cd urlhaus-ui
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Set up Redis** (Optional but recommended)
   ```bash
   # Download Redis for Windows from:
   # https://github.com/microsoftarchive/redis/releases
   # Extract to C:\Redis and run: redis-server.exe
   ```

5. **Configure environment**
   ```bash
   # Copy backend environment template
   cd backend
   cp env.example .env
   # Edit .env with your settings (optional for basic testing)
   cd ..
   ```

6. **Start the application**
   ```bash
   # Terminal 1: Start Redis (if installed)
   cd C:\Redis
   redis-server.exe
   
   # Terminal 2: Start Backend
   cd backend
   npm start
   
   # Terminal 3: Start Frontend
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:5173`

### Production Build

```bash
# Build frontend
npm run build

# Build backend
cd backend
npm run build
cd ..

# Start production
cd backend
npm start
# In another terminal: serve the frontend build
```

## Usage

### Getting Started
1. **Authentication**: Enter your URLhaus Auth key on the login screen
2. **Refresh**: Use the refresh or search bar to find URLs or hosts
3. **Explore**: Click on any URL to view detailed threat information
4. **Export**: Use the export button to download data in CSV or JSON format

### Search Modes
- **URL Search**: Enter complete URLs (e.g., `https://example.com/malware.exe`)
- **Host/IP Search**: Enter domain names or IP addresses (e.g., `example.com` or `192.168.1.1`)

### Data Management
- **Refresh**: Manual refresh with 5-minute rate limiting
- **Persistence**: Data persists across browser sessions
- **New Entries**: Recently added threats are highlighted for easy identification
- **Error Notifications**: Stacked pill-shaped error messages with auto-dismiss
- **Audio Alerts**: Sound notifications for new threat entries
- **Intelligent Caching**: Automatic caching reduces API calls by 80-90%

## Configuration

### Backend Environment Variables
Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# URLhaus API Configuration
URLHAUS_API_URL=https://urlhaus-api.abuse.ch
URLHAUS_API_TIMEOUT=30000

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT Configuration
JWT_SECRET=secreyyyt-ranii-syaaa
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=300000
RATE_LIMIT_MAX_REQUESTS=10

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### API Rate Limiting
The backend implements intelligent rate limiting:
- **URLhaus API calls**: 10 requests per 5 minutes per IP
- **General API calls**: 100 requests per 15 minutes per IP
- **Caching**: Reduces actual API calls to URLhaus by 80-90%

## Project Structure

```
urlhaus-ui/
├── src/                    # Frontend (React + TypeScript)
│   ├── api/               # API client and type definitions
│   ├── components/        # Reusable UI components
│   │   ├── AuthGate.tsx  # Authentication wrapper
│   │   └── UrlDetailDialog.tsx # URL details modal
│   ├── context/          # React context providers
│   │   └── AuthContext.tsx # Authentication state management
│   ├── pages/            # Main application pages
│   │   └── Dashboard.tsx # Main dashboard component
│   ├── utils/            # Utility functions
│   │   └── export.ts     # Data export utilities
│   └── App.tsx           # Main application component
├── backend/              # Backend (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── controllers/  # API request handlers
│   │   ├── middleware/   # Authentication, rate limiting
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # URLhaus API integration
│   │   ├── types/        # TypeScript type definitions
│   │   ├── utils/        # Redis, caching utilities
│   │   └── index.ts      # Application entry point
│   ├── env.example       # Environment configuration template
│   └── package.json      # Backend dependencies
└── README.md             # This file
```

### Development Guidelines
- Follow TypeScript best practices
- Use Material-UI components consistently
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [URLhaus](https://urlhaus.abuse.ch/) for providing the threat intelligence API
- [Material-UI](https://mui.com/) for the comprehensive component library
- [React](https://reactjs.org/) for the powerful frontend framework
- [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/) for the backend framework
- [Redis](https://redis.io/) for intelligent caching
- [Vite](https://vitejs.dev/) for the fast build tool

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/VETEIS/urlhaus-gui/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

---

**⚠️ Disclaimer**: This tool is designed for security research and threat analysis purposes. Users are responsible for complying with applicable laws and regulations when using this software. - @vete
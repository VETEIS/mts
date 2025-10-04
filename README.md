# MTS (Menace to Society)

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=for-the-badge&logo=nextauth.js&logoColor=white)](https://next-auth.js.org/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![npm](https://img.shields.io/badge/npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](http://makeapullrequest.com)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/your-username/mts)
[![Issues](https://img.shields.io/github/issues/your-username/mts?style=for-the-badge&logo=github)](https://github.com/your-username/mts/issues)
[![Stars](https://img.shields.io/github/stars/your-username/mts?style=for-the-badge&logo=github)](https://github.com/your-username/mts/stargazers)
[![Forks](https://img.shields.io/github/forks/your-username/mts?style=for-the-badge&logo=github)](https://github.com/your-username/mts/network/members)

[![Security](https://img.shields.io/badge/Security-🔒-green?style=for-the-badge)](https://github.com/your-username/mts/security)
[![Code Quality](https://img.shields.io/badge/Code%20Quality-A+-green?style=for-the-badge)](https://github.com/your-username/mts)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=for-the-badge)](https://github.com/your-username/mts/actions)
[![Deployment](https://img.shields.io/badge/Deployment-Vercel-blue?style=for-the-badge)](https://vercel.com/)

---

A comprehensive traffic violation reporting platform built for the Philippines. This full-stack web application enables citizens to report traffic violations with evidence capture, GPS location tracking, and anonymous reporting capabilities. Built with Next.js, TypeScript, Prisma, and NextAuth, this platform provides a secure and efficient way to combat traffic violations while protecting whistleblower privacy.

## Features

### **Evidence Capture & Reporting**
- **Real-time Camera**: Live camera feed with photo and video capture
- **GPS Location Tracking**: Automatic location detection with accuracy indicators
- **Anonymous Reporting**: Complete privacy protection for whistleblowers
- **Evidence Management**: Multiple media uploads with cloud storage
- **Offline Support**: Evidence captured even without internet connection

### **Smart Violation Detection**
- **Offense Database**: Comprehensive list of traffic violations with penalties
- **Automatic Penalty Calculation**: Real-time penalty amount calculation
- **Location Validation**: GPS-based location verification
- **Evidence Requirements**: Smart prompts for required evidence types
- **Report Validation**: Comprehensive form validation and error handling

### **Admin Dashboard & Moderation**
- **Report Review**: Complete admin interface for report moderation
- **Evidence Analysis**: Detailed evidence viewing with zoom capabilities
- **Status Management**: Approve, reject, or mark reports as paid
- **System Logs**: Comprehensive audit trail of all admin actions
- **Revenue Tracking**: Real-time earnings and payment tracking

### **Payment & Rewards System**
- **Earnings Distribution**: 5% to reporters, 93% to system, 2% to developers
- **GCash Integration**: Direct payment to reporter's GCash account
- **Payment Tracking**: Complete payment history and status
- **Receipt Management**: Payment receipt upload and verification
- **Monthly Developer Payments**: Automated developer earnings distribution

### **Security & Privacy**
- **Anonymous User Protection**: Complete identity protection for anonymous reports
- **Secure Authentication**: Google OAuth integration with NextAuth
- **Role-based Access**: Admin and reporter role separation
- **Data Encryption**: Secure data transmission and storage
- **Privacy Compliance**: GDPR-compliant data handling

### **Modern UI/UX**
- **Mobile-First Design**: Optimized for mobile devices
- **Responsive Layout**: Seamless experience across all devices
- **Intuitive Navigation**: Clean, professional interface
- **Real-time Updates**: Live status updates and notifications
- **Accessibility**: WCAG-compliant design patterns

## Stack

### **Frontend**
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Shadcn/ui** for UI components
- **Material-UI Icons** for iconography
- **React Hook Form** for form management
- **Zod** for schema validation

### **Backend**
- **Next.js API Routes** for serverless functions
- **Prisma ORM** for database management
- **NextAuth.js** for authentication
- **Cloudinary** for media storage
- **PostgreSQL** for data persistence
- **Zod** for API validation

### **Database**
- **PostgreSQL** with Prisma ORM
- **User Management** with role-based access
- **Report System** with evidence tracking
- **Payment Tracking** with earnings distribution
- **System Logs** for audit trails

## Quick Start

### Prerequisites
- **Node.js 18+**
- **npm or yarn**
- **PostgreSQL** database
- **Cloudinary account** (for media storage)
- **Google OAuth** credentials

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/mts.git
   cd mts
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mts"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Admin Email (for automatic admin role)
ADMIN_EMAIL="your-admin@email.com"
```

## Usage

### For Reporters
1. **Sign In**: Use Google OAuth to authenticate
2. **Set Up Profile**: Add your GCash number for payments
3. **Report Violations**: Use the camera to capture evidence
4. **Track Reports**: Monitor your report status and earnings
5. **Receive Payments**: Get paid directly to your GCash account

### For Admins
1. **Access Dashboard**: Sign in with admin credentials
2. **Review Reports**: Moderate submitted traffic violation reports
3. **Process Payments**: Mark reports as paid with receipt verification
4. **Monitor System**: Track revenue, user activity, and system logs
5. **Manage Users**: Promote users and manage system settings

### Report Submission Process
1. **Capture Evidence**: Take photos/videos of the violation
2. **Select Offense**: Choose from the database of traffic violations
3. **Add Location**: GPS location is automatically detected
4. **Add Description**: Provide additional context if needed
5. **Choose Anonymity**: Option to report anonymously for protection
6. **Submit Report**: Report is queued for admin review

## Project Structure

```
mts/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   └── dashboard/        # Reporter dashboard
│   ├── components/            # Reusable components
│   │   ├── ui/                # Shadcn/ui components
│   │   ├── camera/            # Camera components
│   │   └── admin/             # Admin-specific components
│   ├── lib/                   # Utility functions
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── prisma.ts          # Database client
│   │   └── utils.ts           # Helper functions
│   └── types/                 # TypeScript definitions
├── prisma/                    # Database schema and migrations
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Database seeding
├── public/                    # Static assets
└── README.md                  # This file
```

## Database Schema

### Core Entities
- **Users**: Reporter and admin accounts with role-based access
- **Reports**: Traffic violation reports with evidence and status
- **Offenses**: Database of traffic violations with penalties
- **Media**: Evidence files (photos/videos) with cloud storage
- **SystemLogs**: Audit trail of all system actions
- **DeveloperPayments**: Monthly developer earnings tracking

### Key Relationships
- Users can submit multiple reports
- Reports contain multiple media files
- Reports reference specific offenses
- System logs track all admin actions
- Payment tracking for earnings distribution

## Security Features

### **Anonymous Reporting Protection**
- Complete identity protection for anonymous users
- No personal data exposure in admin interfaces
- Secure API responses that filter sensitive information
- System logs that respect privacy choices
- Database queries that protect anonymous identities

### **Authentication & Authorization**
- Google OAuth integration for secure login
- Role-based access control (Admin/Reporter)
- Session management with NextAuth
- Protected API routes with authentication
- Secure password handling

### **Data Protection**
- Encrypted data transmission
- Secure media storage with Cloudinary
- Privacy-compliant data handling
- Audit trails for all system actions
- Secure database connections

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure Cloudinary for media storage
3. Set up Google OAuth credentials
4. Configure environment variables
5. Run database migrations

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## Development Guidelines

### Code Standards
- Follow TypeScript best practices
- Use Tailwind CSS for styling
- Implement proper error handling
- Write comprehensive tests
- Document all functions and components

### Database Management
- Use Prisma migrations for schema changes
- Seed database with initial data
- Maintain data integrity constraints
- Implement proper indexing for performance

### Security Best Practices
- Validate all user inputs
- Implement proper authentication
- Protect against SQL injection
- Use HTTPS in production
- Regular security audits

## API Endpoints

### Authentication
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signout` - User logout

### Reports
- `GET /api/reports` - Get user's reports
- `POST /api/reports` - Submit new report
- `GET /api/admin/reports` - Admin report management
- `POST /api/admin/reports/[id]/moderate` - Moderate reports
- `POST /api/admin/reports/[id]/pay` - Mark reports as paid

### Media
- `POST /api/upload` - Upload evidence files
- `GET /api/upload/[id]` - Retrieve media files

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/logs` - System logs
- `POST /api/admin/logs` - Create system logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) for the powerful React framework
- [Prisma](https://prisma.io/) for the excellent ORM
- [NextAuth.js](https://next-auth.js.org/) for authentication
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Shadcn/ui](https://ui.shadcn.com/) for UI components
- [Cloudinary](https://cloudinary.com/) for media storage

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/mts/issues) page
2. Create a new issue with detailed information
3. Contact the maintainers

---

**⚠️ Disclaimer**: This platform is designed for legitimate traffic violation reporting in the Philippines. Users are responsible for complying with applicable laws and regulations when using this software. Anonymous reporting is protected to ensure whistleblower safety.

**🔒 Privacy Notice**: Anonymous users' identities are completely protected. The system is designed to prevent identification of anonymous reporters while maintaining the integrity of the reporting process.

---

**Built with ❤️ for safer roads in the Philippines** 🇵🇭
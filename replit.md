# Aureto Wallet

## Overview

Aureto Wallet is a mobile-compatible Progressive Web App (PWA) for collaborative financial management, designed for households, families, and teams. It provides comprehensive expense tracking, budget management, and financial analytics through a responsive web application optimized for mobile devices. The system supports multiple wallet types (personal, shared, savings goals) with role-based access control, allowing users to invite team members with different permission levels. Key features include transaction management, category-based expense tracking, budget monitoring, financial reporting, team collaboration tools, and offline functionality through PWA capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Market Analysis & Strategy

### Target Markets with Strong Demand:
- **Families with Children (High Priority)**: Need shared expense tracking, allowances, savings goals for kids
- **Small Business Teams**: Expense reporting, team budgets, receipt management
- **Roommates/Shared Living**: Split bills, utilities, groceries with fair tracking
- **Young Professionals**: Personal finance management, savings goals, career-focused budgeting
- **Couples**: Joint financial planning, shared goals, expense transparency

### Key Pain Points Aureto Wallet Solves:
- Manual expense tracking frustration
- Lack of family financial collaboration tools
- Complex budgeting that doesn't adapt to real life
- No visibility into family spending patterns
- Difficulty achieving savings goals together

## Recent Changes

### August 16, 2025 - Complete Authentication System Implementation
- **Enhancement**: Replaced Replit Auth with comprehensive basic auth and Google OAuth system
- **New Features**:
  - Basic username/password authentication with secure password hashing
  - Google OAuth integration with automatic account linking
  - New authentication pages with modern UI (login/register forms)
  - Session management with PostgreSQL storage
  - Protected routes with authentication middleware
  - Comprehensive user schema supporting multiple auth providers
- **Technical Implementation**:
  - Created new auth system in `server/auth.ts` with passport.js strategies
  - Updated user schema to support both basic and OAuth authentication
  - Implemented `useAuth` hook and `AuthProvider` context for frontend
  - Added protected route wrapper for secure page access
  - Created comprehensive authentication pages with form validation
- **Configuration**: Added `.env.example` with Google OAuth setup instructions
- **Security**: Password hashing with scrypt, secure session management, CSRF protection
- **UI/UX Enhancement**: Generated and integrated custom financial dashboard background image with aesthetic blue-to-purple gradients and modern financial elements for the authentication page

### August 12, 2025 - Critical API Parameter Order Fix
- **Critical Bug Fix**: Resolved widespread API call parameter order issue affecting all POST/PUT/DELETE operations
- **Root Cause**: apiRequest function calls had incorrect parameter order (method, url, data) instead of correct (url, method, data)
- **Impact**: Fixed wallet creation, transaction creation, goal management, team operations, profile reset, and all other API mutations
- **Files Fixed**:
  - Fixed 20+ apiRequest calls across settings, wallets, goals, transactions, categories, and team management
  - Affected files: settings.tsx, create-wallet-modal.tsx, goals.tsx, team.tsx, add-transaction-modal.tsx, and others
- **Validation**: Profile reset feature now working correctly with confirmation text "delete-all-data-by-courage"

### August 11, 2025 - Project Rebranding to SendWise
- **Enhancement**: Complete project rebranding from SpendWise Pro to SendWise
- **Changes Made**:
  - Updated project title and branding across all user-facing components
  - Modified landing page header to display "SendWise" instead of "SpendWise Pro"
  - Updated sidebar application name to "SendWise"
  - Changed PWA manifest.json to reflect new "SendWise" branding
  - Updated project documentation to reflect the name change
- **Technical Implementation**:
  - Maintained all existing functionality while updating visual branding
  - Preserved backward compatibility for existing users and data
  - Updated documentation to reflect the new project identity

## Recent Changes

### August 9, 2025 - Enhanced Budget Management System with Templates
- **Enhancement**: Implemented comprehensive budget management system with professional template library
- **New Features**:
  - Budget template system with 4 predefined templates (Essential, Balanced, Student, Family)
  - Enhanced budget creation workflow with improved UI/UX design
  - Smart progress tracking with color-coded status indicators (green/yellow/red)
  - Advanced budget analytics and comparison features
  - Customizable alert thresholds for spending warnings
  - Mobile-responsive budget management interface
  - Budget category selection with visual icons
- **Technical Implementation**:
  - Fixed all TypeScript type safety errors across components
  - Enhanced error handling and loading states
  - Proper data typing for wallets, budgets, and user data
  - Improved apiRequest calls with correct parameter structure
  - Fixed sidebar user profile display issues
- **UX Improvements**:
  - Professional budget creation dialog matching provided design mockups
  - Template selection interface with realistic budget amounts
  - Enhanced progress visualization with percentage completion
  - Color-coded budget status (good/warning/over budget)
  - Intuitive budget editing and deletion functionality

### August 9, 2025 - Comprehensive Goals Management System
- **Enhancement**: Implemented full-featured financial goals management with advanced functionality
- **New Features**:
  - Complete CRUD operations (create, read, update, delete) for financial goals
  - Goal contribution system allowing users to add money to any goal
  - Advanced progress tracking with visual progress bars and percentage completion
  - Goal categorization with emoji icons (emergency, vacation, house, car, education, retirement, etc.)
  - Priority levels (high, medium, low) with color-coded indicators
  - Target date tracking for better financial planning
  - Achievement celebrations when goals are completed
  - Modal-based forms for creating, editing, and contributing to goals
- **Technical Implementation**:
  - Enhanced `client/src/pages/goals.tsx` with comprehensive goal management interface
  - Updated server API routes with PUT/DELETE endpoints for goal management
  - Fixed TopBar component to accept `showAddTransaction` prop for better navigation control
  - Removed duplicate goal routes in server/routes.ts for cleaner API structure
- **UX Improvements**:
  - Mobile-optimized interface with responsive design
  - Real-time progress visualization with color-coded progress bars
  - Intuitive goal creation with 10+ predefined categories
  - Edit functionality with pre-populated forms
  - Confirmation dialogs for destructive actions

### August 9, 2025 - Cougeon Company Branding Integration
- **Enhancement**: Created Cougeon Investments company logo component for corporate branding
- **Implementation**: 
  - Built `client/src/components/branding/cougeon-logo.tsx` component
  - Replicated the beautiful gradient bird logo from user-provided design
  - Supports multiple sizes (sm, md, lg, xl) and optional company text display
  - Maintains SpendWise bird icon for PWA while using Cougeon for company branding
- **Design**: Modern gradient bird with blue-to-purple wings and purple-to-orange body matching corporate identity

### August 9, 2025 - Feature Gap Analysis
- **Analysis**: Completed comprehensive comparison against advanced specification documentation
- **Documentation**: Created `missing-features-analysis.md` identifying critical missing features:
  - AI-powered intelligence (receipt scanning, smart categorization, predictive analytics)
  - Advanced transaction capture (voice entry, bulk imports, receipt processing)
  - Enhanced financial analytics (cash flow projections, spending pattern recognition)
  - Banking integrations (account sync, real-time balance updates)
  - Advanced security (end-to-end encryption, biometric auth, zero-knowledge architecture)
- **Roadmap**: Defined 4-phase implementation plan spanning 6 months for full feature parity

### August 9, 2025 - React useRef Error Resolution
- **Issue**: React "Cannot read properties of null (reading 'useRef')" error causing application crashes
- **Root Cause**: TooltipProvider components in App.tsx and sidebar.tsx had React version mismatch
- **Solution**: Completely removed all TooltipProvider, Tooltip, TooltipTrigger, and TooltipContent components
- **Result**: Goals functionality now works perfectly without React compatibility issues

### August 9, 2025 - Custom PWA Icon Implementation
- **Enhancement**: Replaced default wallet-themed PWA icons with custom bird logo branding
- **Implementation**: Created SVG-based icons in 192x192 and 512x512 sizes based on user-provided bird design
- **Design**: Modern gradient bird logo with blue-to-purple wings and purple-to-orange body on dark background
- **Result**: Aureto Wallet now displays custom branding across all PWA installations and browser tabs

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type-safe component development
- **Build System**: Vite for fast development and optimized production builds
- **PWA Features**: Service Worker, Web App Manifest, offline caching, install prompts
- **Mobile Optimization**: Touch-friendly interfaces, responsive design, mobile navigation
- **Styling**: Tailwind CSS with Shadcn/ui component library for consistent design
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Forms**: React Hook Form with Zod validation for robust form handling
- **UI Components**: Radix UI primitives with custom styling for accessibility and consistency

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for REST API development
- **Language**: TypeScript for full-stack type safety
- **Database ORM**: Drizzle ORM for type-safe database operations and schema management
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **Session Management**: PostgreSQL-based session storage with connect-pg-simple
- **API Design**: RESTful endpoints with consistent error handling and logging middleware

### Data Storage Solutions
- **Primary Database**: PostgreSQL via Neon Database for production-grade data storage
- **Schema Management**: Drizzle Kit for database migrations and schema evolution
- **Connection Pooling**: Neon serverless connection pooling for efficient database access
- **Session Storage**: PostgreSQL sessions table for secure session management

### Authentication and Authorization
- **Authentication Provider**: Replit Auth with OpenID Connect protocol
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Authorization**: Role-based access control with owner, manager, contributor, and viewer roles
- **Security**: HTTPS-only cookies, secure session handling, and CSRF protection

### Key Data Models
- **Users**: Profile information with Replit integration
- **Wallets**: Support for personal, shared, and savings goal wallet types with member management
- **Transactions**: Income and expense tracking with category classification
- **Categories**: Customizable expense categories with icons and colors (33 default categories)
- **Budgets**: Budget allocation and tracking per category
- **Team Management**: Wallet member invitations and role management with email notifications
- **Wallet Invitations**: Email-based invitation system for collaborative wallet access

### PWA Features
- **Service Worker**: Offline caching and background sync capabilities
- **Web App Manifest**: Installable app experience with custom icons and shortcuts
- **Mobile Navigation**: Responsive sidebar and bottom tab navigation for mobile devices
- **Touch Optimization**: 44px minimum touch targets and mobile-friendly interactions
- **Install Prompts**: Smart PWA installation prompts for eligible devices
- **Offline Support**: Core functionality available without internet connection

### External Dependencies
- **Database**: Neon Database (PostgreSQL) for data persistence
- **Authentication**: Replit Auth service for user identity management
- **UI Framework**: Radix UI for accessible component primitives
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for date manipulation and formatting
- **Development Tools**: Replit-specific plugins for development environment integration
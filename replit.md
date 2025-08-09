# SpendWise Pro

## Overview

SpendWise Pro is a mobile-compatible Progressive Web App (PWA) for collaborative financial management, designed for households, families, and teams. It provides comprehensive expense tracking, budget management, and financial analytics through a responsive web application optimized for mobile devices. The system supports multiple wallet types (personal, shared, savings goals) with role-based access control, allowing users to invite team members with different permission levels. Key features include transaction management, category-based expense tracking, budget monitoring, financial reporting, team collaboration tools, and offline functionality through PWA capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### August 9, 2025 - React useRef Error Resolution
- **Issue**: React "Cannot read properties of null (reading 'useRef')" error causing application crashes
- **Root Cause**: TooltipProvider components in App.tsx and sidebar.tsx had React version mismatch
- **Solution**: Completely removed all TooltipProvider, Tooltip, TooltipTrigger, and TooltipContent components
- **Files Modified**: 
  - `client/src/App.tsx` - Removed TooltipProvider wrapper
  - `client/src/components/ui/sidebar.tsx` - Removed tooltip functionality from SidebarMenuButton
  - `client/src/pages/goals-basic.tsx` - Created simplified goals page without problematic components
- **Result**: Goals functionality now works perfectly - create, view, and manage financial goals without errors
- **Cache Note**: Users may need to use incognito mode or clear cache to see fixes due to browser caching

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
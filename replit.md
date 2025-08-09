# SpendWise Pro

## Overview

SpendWise Pro is a collaborative financial management platform designed for households, families, and teams. It provides comprehensive expense tracking, budget management, and financial analytics through a modern web application. The system supports multiple wallet types (personal, shared, savings goals) with role-based access control, allowing users to invite team members with different permission levels. Key features include transaction management, category-based expense tracking, budget monitoring, financial reporting, and team collaboration tools.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type-safe component development
- **Build System**: Vite for fast development and optimized production builds
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
- **Wallets**: Support for personal, shared, and savings goal wallet types
- **Transactions**: Income and expense tracking with category classification
- **Categories**: Customizable expense categories with icons and colors
- **Budgets**: Budget allocation and tracking per category
- **Team Management**: Wallet member invitations and role management

### External Dependencies
- **Database**: Neon Database (PostgreSQL) for data persistence
- **Authentication**: Replit Auth service for user identity management
- **UI Framework**: Radix UI for accessible component primitives
- **Validation**: Zod for runtime type validation and schema definition
- **Date Handling**: date-fns for date manipulation and formatting
- **Development Tools**: Replit-specific plugins for development environment integration
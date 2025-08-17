# Aureto Wallet

A modern financial management and wallet application built with React, Node.js, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)
- PostgreSQL (or use Docker container)

### Development Setup
```bash
# Clone the repository
git clone https://github.com/CourageT/Aureto-Wallet.git
cd Aureto-Wallet

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Production Deployment
See our comprehensive deployment guides in the [`docs/`](./docs/) folder.

## 📁 Project Structure

```
aureto_wallet/
├── client/                 # React frontend application
├── server/                 # Express.js backend API
├── shared/                 # Shared utilities and types
├── docs/                   # Deployment and maintenance documentation
├── migrations/             # Database migration files
├── Dockerfile.backend      # Backend container configuration
├── Dockerfile.frontend     # Frontend container configuration
└── docker-compose.yml      # Local development setup
```

## 📖 Documentation

### Deployment Guides
- **[System Deployment](./docs/SYSTEM_DEPLOYMENT.md)** - Overall system architecture and subdomain management
- **[Frontend Deployment](./docs/FRONTEND_DEPLOYMENT.md)** - React app deployment and maintenance
- **[Backend Deployment](./docs/BACKEND_DEPLOYMENT.md)** - Express API deployment and configuration
- **[Database Deployment](./docs/DATABASE_DEPLOYMENT.md)** - PostgreSQL setup and management

### Quick Links
- [Environment Configuration](./.env.example)
- [Database Migrations](./migrations/)
- [API Documentation](./server/README.md) *(if exists)*
- [Frontend Components](./client/src/components/) 

## 🛠 Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database ORM
- **Passport.js** - Authentication (Google OAuth)

### Database
- **PostgreSQL** - Primary database
- **Redis** *(optional)* - Caching and sessions

### Infrastructure
- **Docker** - Containerization
- **nginx-proxy** - Reverse proxy and SSL
- **Let's Encrypt** - SSL certificates
- **GitHub Actions** *(planned)* - CI/CD

## 🌐 Live Deployment

### Production URLs
- **Main App**: https://cougeon.co.zw
- **Aureto Wallet**: https://aureto.cougeon.co.zw

### Development URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## 🔧 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Database
```bash
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Docker
```bash
# Build containers
docker build -f Dockerfile.frontend -t aureto-frontend .
docker build -f Dockerfile.backend -t aureto-backend .

# Run with docker-compose
docker-compose up -d
```

## 🔒 Security

### Authentication
- Google OAuth 2.0 integration
- JWT-based session management
- Secure cookie handling

### Data Protection
- Environment variable encryption
- Database connection security
- HTTPS enforcement
- CORS configuration

### Best Practices
- Regular dependency updates
- Security headers implementation
- Input validation and sanitization
- Rate limiting on API endpoints

## 🗃 Database Schema

The application uses PostgreSQL with Drizzle ORM. Key entities include:

- **Users** - User accounts and profiles
- **Wallets** - Financial accounts and balances
- **Transactions** - Financial transaction records
- **Categories** - Transaction categorization
- **Budgets** - Budget planning and tracking

See [Database Deployment Guide](./docs/DATABASE_DEPLOYMENT.md) for detailed schema information.

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Wallet Management
- `GET /api/wallets` - List user wallets
- `POST /api/wallets` - Create new wallet
- `PUT /api/wallets/:id` - Update wallet
- `DELETE /api/wallets/:id` - Delete wallet

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

For complete API documentation, see the [Backend Deployment Guide](./docs/BACKEND_DEPLOYMENT.md).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation for API changes
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Support

### Reporting Issues
- Use GitHub Issues for bug reports
- Include detailed reproduction steps
- Provide environment information

### Getting Help
- Check the [documentation](./docs/)
- Review existing GitHub Issues
- Contact the development team

## 🚀 Roadmap

### Phase 1 (Current)
- [x] User authentication (Google OAuth)
- [x] Basic wallet management
- [x] Transaction tracking
- [x] Docker deployment
- [x] SSL configuration

### Phase 2 (Planned)
- [ ] Mobile responsive design
- [ ] Advanced reporting and analytics
- [ ] Budget planning tools
- [ ] Multi-currency support
- [ ] Data export functionality

### Phase 3 (Future)
- [ ] Mobile app (React Native)
- [ ] Third-party bank integration
- [ ] Investment tracking
- [ ] AI-powered insights
- [ ] Team collaboration features

## 📊 Performance

### Metrics
- **Frontend Bundle Size**: ~500KB (gzipped)
- **API Response Time**: <200ms average
- **Database Query Time**: <50ms average
- **Page Load Time**: <2s on 3G

### Optimization
- Code splitting for frontend
- Database query optimization
- CDN for static assets
- Caching strategies implemented

---

**Last Updated**: August 17, 2025  
**Version**: 1.0.0  
**Maintainer**: [CourageT](https://github.com/CourageT)

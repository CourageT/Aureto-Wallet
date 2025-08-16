-- Database initialization script for production deployment
-- This file will be executed when the database container starts

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE aureto_wallet'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'aureto_wallet')\gexec

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE aureto_wallet TO postgres;

-- Note: Drizzle migrations will handle table creation automatically
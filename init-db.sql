-- Create database if it doesn't exist
-- (PostgreSQL automatically creates the database specified in POSTGRES_DB)

-- Create any additional database objects here
-- For example, extensions:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE spendwise_production TO spendwise;

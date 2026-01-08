#!/bin/bash

echo "🚀 Setting up InvoiceXRP Backend..."

# Navigate to backend directory
cd backend

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p src/routes src/services database

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup database
echo "🗄️ Setting up database..."
psql -U xrpuser -d invoicexrp -f database/schema.sql

echo ""
echo "✅ Backend setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update .env file with your XRPL credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Test API at http://localhost:5000/health"
echo ""
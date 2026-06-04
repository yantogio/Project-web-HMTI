#!/bin/bash
# QUICK START: Performance Optimization Setup untuk HMTI Dokumentasi

echo "================================"
echo "HMTI Backend Performance Setup"
echo "================================"
echo ""

# Step 1: Install Dependencies
echo "📦 Step 1: Installing dependencies..."
cd "c:\PROJECT WEB HMTI\hmti-backend"

if command -v npm &> /dev/null; then
    npm install node-cache@5.1.2 express-rate-limit@7.1.5 --save
    echo "✅ Dependencies installed via npm"
elif command -v pnpm &> /dev/null; then
    pnpm install
    echo "✅ Dependencies installed via pnpm"
else
    echo "❌ ERROR: npm or pnpm not found!"
    exit 1
fi

# Step 2: Run Prisma Migration
echo ""
echo "🗄️ Step 2: Running database migration..."
npx prisma migrate dev --name "add_performance_indexes"

if [ $? -eq 0 ]; then
    echo "✅ Database migration successful"
else
    echo "⚠️ Migration may have failed. Run manually: npx prisma migrate dev"
fi

# Step 3: Build Backend
echo ""
echo "🔨 Step 3: Building backend..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Build failed. Check errors above."
    exit 1
fi

# Step 4: Start Backend
echo ""
echo "🚀 Step 4: Starting backend server..."
echo "Server will be available at: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop"
echo ""

npm run start:dev

EOF

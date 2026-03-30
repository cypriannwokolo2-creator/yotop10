#!/bin/bash

# ============================================================================
# COMPREHENSIVE DEBUG SCRIPT FOR "LOOP FIXE" ISSUE
# This script will diagnose why your categories page is stuck loading
# ============================================================================

set -e

echo "=========================================="
echo "🔍 YOTOP10 DEBUGGING SCRIPT"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# STEP 1: Check if backend server is running
# ============================================================================
echo -e "${BLUE}STEP 1: Checking if backend server is running...${NC}"
echo ""

if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running on port 8000${NC}"
    HEALTH_RESPONSE=$(curl -s http://localhost:8000/api/health)
    echo "   Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}❌ Backend server is NOT running on port 8000${NC}"
    echo ""
    echo "   To fix this, run:"
    echo "   cd backend && pnpm dev"
    echo ""
    echo "   Or if using Docker:"
    echo "   docker-compose up -d"
    echo ""
    exit 1
fi

echo ""

# ============================================================================
# STEP 2: Check if categories API endpoint is accessible
# ============================================================================
echo -e "${BLUE}STEP 2: Testing categories API endpoint...${NC}"
echo ""

CATEGORIES_RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8000/api/categories)
HTTP_CODE=$(echo "$CATEGORIES_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CATEGORIES_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✅ Categories API returned HTTP 200${NC}"
    echo "   Response preview: $(echo $RESPONSE_BODY | head -c 200)..."
else
    echo -e "${RED}❌ Categories API returned HTTP $HTTP_CODE${NC}"
    echo "   Response: $RESPONSE_BODY"
    echo ""
    echo "   This indicates a backend error. Check backend logs."
    echo ""
fi

echo ""

# ============================================================================
# STEP 3: Check if database has categories
# ============================================================================
echo -e "${BLUE}STEP 3: Checking if database has categories...${NC}"
echo ""

# Check if we can connect to MongoDB
if command -v mongosh &> /dev/null; then
    echo "   Using mongosh to check database..."
    MONGO_CHECK=$(mongosh --quiet --eval "db.categories.countDocuments()" mongodb://localhost:27017/yotop10 2>/dev/null || echo "ERROR")
    
    if [ "$MONGO_CHECK" = "ERROR" ]; then
        echo -e "${RED}❌ Cannot connect to MongoDB${NC}"
        echo "   Make sure MongoDB is running on localhost:27017"
    else
        echo -e "${GREEN}✅ MongoDB is accessible${NC}"
        echo "   Categories count: $MONGO_CHECK"
        
        if [ "$MONGO_CHECK" -eq 0 ]; then
            echo -e "${YELLOW}⚠️  No categories found in database${NC}"
            echo ""
            echo "   To seed categories, run:"
            echo "   cd backend && pnpm seed:categories"
            echo ""
        else
            echo -e "${GREEN}✅ Database has $MONGO_CHECK categories${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  mongosh not found, skipping database check${NC}"
    echo "   Install mongosh or check MongoDB manually"
fi

echo ""

# ============================================================================
# STEP 4: Check CORS configuration
# ============================================================================
echo -e "${BLUE}STEP 4: Checking CORS configuration...${NC}"
echo ""

# Check if .env file exists
if [ -f "backend/.env" ]; then
    echo "   Found backend/.env file"
    CORS_ORIGINS=$(grep CORS_ORIGINS backend/.env | cut -d '=' -f2- || echo "NOT_SET")
    echo "   CORS_ORIGINS: $CORS_ORIGINS"
    
    if [ "$CORS_ORIGINS" = "NOT_SET" ]; then
        echo -e "${YELLOW}⚠️  CORS_ORIGINS not set in backend/.env${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No backend/.env file found${NC}"
    echo "   Copy .env.example to backend/.env and configure it"
fi

echo ""

# ============================================================================
# STEP 5: Check frontend environment
# ============================================================================
echo -e "${BLUE}STEP 5: Checking frontend environment...${NC}"
echo ""

if [ -f "frontend/.env.local" ]; then
    echo "   Found frontend/.env.local file"
    API_URL=$(grep NEXT_PUBLIC_API_URL frontend/.env.local | cut -d '=' -f2- || echo "NOT_SET")
    echo "   NEXT_PUBLIC_API_URL: $API_URL"
    
    if [ "$API_URL" = "NOT_SET" ]; then
        echo -e "${YELLOW}⚠️  NEXT_PUBLIC_API_URL not set in frontend/.env.local${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No frontend/.env.local file found${NC}"
    echo "   Create frontend/.env.local with NEXT_PUBLIC_API_URL=http://localhost:8000/api"
fi

echo ""

# ============================================================================
# STEP 6: Test API from frontend perspective
# ============================================================================
echo -e "${BLUE}STEP 6: Testing API from frontend perspective...${NC}"
echo ""

# Simulate what the frontend does
echo "   Testing: http://localhost:8000/api/categories"
FRONTEND_TEST=$(curl -s -H "Content-Type: application/json" http://localhost:8000/api/categories)

if echo "$FRONTEND_TEST" | grep -q '"categories"'; then
    echo -e "${GREEN}✅ API returns correct structure with 'categories' key${NC}"
    echo "   Response preview: $(echo $FRONTEND_TEST | head -c 200)..."
else
    echo -e "${RED}❌ API response doesn't have expected 'categories' key${NC}"
    echo "   Response: $FRONTEND_TEST"
fi

echo ""

# ============================================================================
# STEP 7: Check Docker services (if using Docker)
# ============================================================================
echo -e "${BLUE}STEP 7: Checking Docker services...${NC}"
echo ""

if command -v docker &> /dev/null; then
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "yotop10"; then
        echo "   Docker containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}" | grep yotop10 || echo "   No yotop10 containers found"
    else
        echo -e "${YELLOW}⚠️  No yotop10 Docker containers running${NC}"
        echo "   Run: docker-compose up -d"
    fi
else
    echo -e "${YELLOW}⚠️  Docker not found, skipping Docker check${NC}"
fi

echo ""

# ============================================================================
# STEP 8: Check backend logs
# ============================================================================
echo -e "${BLUE}STEP 8: Recent backend logs (if available)...${NC}"
echo ""

if [ -f "backend/logs/app.log" ]; then
    echo "   Last 10 lines from backend logs:"
    tail -n 10 backend/logs/app.log
else
    echo "   No backend log file found"
fi

echo ""

# ============================================================================
# SUMMARY AND RECOMMENDED ACTIONS
# ============================================================================
echo "=========================================="
echo "📊 DIAGNOSIS SUMMARY"
echo "=========================================="
echo ""

# Determine the most likely issue
if ! curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo -e "${RED}🔴 PRIMARY ISSUE: Backend server is not running${NC}"
    echo ""
    echo "   FIX: Start the backend server"
    echo "   cd backend && pnpm dev"
    echo ""
elif [ "$HTTP_CODE" -ne 200 ]; then
    echo -e "${RED}🔴 PRIMARY ISSUE: Categories API endpoint is failing (HTTP $HTTP_CODE)${NC}"
    echo ""
    echo "   FIX: Check backend logs for errors"
    echo "   tail -f backend/logs/app.log"
    echo ""
elif [ "$MONGO_CHECK" = "0" ] 2>/dev/null; then
    echo -e "${YELLOW}🟡 PRIMARY ISSUE: Database has no categories${NC}"
    echo ""
    echo "   FIX: Seed the database with categories"
    echo "   cd backend && pnpm seed:categories"
    echo ""
else
    echo -e "${GREEN}🟢 All checks passed! The issue might be:${NC}"
    echo ""
    echo "   1. Browser cache - Hard refresh (Ctrl+Shift+R)"
    echo "   2. CORS issue - Check browser console for errors"
    echo "   3. Network issue - Check browser Network tab"
    echo "   4. Frontend code error - Check browser Console"
    echo ""
fi

echo "=========================================="
echo "🔧 QUICK FIX COMMANDS"
echo "=========================================="
echo ""
echo "1. Start everything fresh:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "2. Seed the database:"
echo "   cd backend && pnpm seed:categories"
echo ""
echo "3. Check backend logs:"
echo "   tail -f backend/logs/app.log"
echo ""
echo "4. Test API directly:"
echo "   curl http://localhost:8000/api/categories"
echo ""
echo "5. Check browser console:"
echo "   Open DevTools (F12) → Console tab"
echo ""
echo "=========================================="

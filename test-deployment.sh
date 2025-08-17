#!/bin/bash

# Test script to verify deployment setup

echo "🔍 SpendWise Frontend Deployment Test"
echo "======================================"

# Check if build exists
if [ -d "dist/public" ]; then
    echo "✅ Frontend build found"
    echo "   Files: $(ls -la dist/public | wc -l) items"
    echo "   Size: $(du -sh dist/public | cut -f1)"
else
    echo "❌ Frontend build not found. Run 'npm run build' first."
    exit 1
fi

# Check required files
echo ""
echo "📁 Checking deployment files:"
files=("deploy-frontend.sh")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✅ $file"
    else
        echo "   ❌ $file (missing)"
    fi
done

# Check if deployment script is executable
if [ -x "deploy-frontend.sh" ]; then
    echo "   ✅ deploy-frontend.sh (executable)"
else
    echo "   ❌ deploy-frontend.sh (not executable)"
fi

# Test volume mount structure (simulate deployment)
echo ""
echo "� Testing deployment structure:"
echo "   Creating test deployment..."

# Create temporary deployment structure
mkdir -p temp-test/html
mkdir -p temp-test/conf
cp -r dist/public/* temp-test/html/ 2>/dev/null || echo "   ⚠️  No dist/public files to copy"

# Test if files are in the right structure
if [ -f "temp-test/html/index.html" ]; then
    echo "   ✅ Frontend files structured correctly"
else
    echo "   ❌ Frontend files not found in expected structure"
fi

rm -rf temp-test

# Check server connectivity
echo ""
echo "🌐 Testing server connectivity:"
if ping -c 1 68.183.86.219 >/dev/null 2>&1; then
    echo "   ✅ Server reachable"
else
    echo "   ❌ Server not reachable"
fi

# Summary
echo ""
echo "📋 Deployment Summary:"
echo "   Domain: cougeon.co.zw"
echo "   Server: 68.183.86.219" 
echo "   Method: Volume mounts (no custom image)"
echo "   Static files: /srv/spendwise-frontend/html"
echo "   Nginx config: /srv/nginx/vhost.d/cougeon.co.zw"
echo "   Container: spendwise-frontend (nginx:alpine)"
echo "   Network: nginx-net"
echo ""
echo "🚀 Ready to deploy? Run: ./deploy-frontend.sh"
echo ""
echo "📚 Need help? Check: DEPLOYMENT.md"

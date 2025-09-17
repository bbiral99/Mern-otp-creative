#!/bin/bash

echo "🔍 Checking Git Configuration..."
echo ""

# Check Git version
echo "📍 Git Version:"
git --version
echo ""

# Check if user name and email are configured
echo "👤 Git User Configuration:"
USER_NAME=$(git config --global user.name)
USER_EMAIL=$(git config --global user.email)

if [ -z "$USER_NAME" ]; then
    echo "❌ Git user.name is not configured"
    echo "   Run: git config --global user.name \"Your Name\""
else
    echo "✅ User Name: $USER_NAME"
fi

if [ -z "$USER_EMAIL" ]; then
    echo "❌ Git user.email is not configured"
    echo "   Run: git config --global user.email \"your.email@example.com\""
else
    echo "✅ User Email: $USER_EMAIL"
fi

echo ""

# Check remote repository
echo "🌐 Remote Repository:"
REMOTE_URL=$(git remote get-url origin 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Remote origin configured: $REMOTE_URL"
else
    echo "❌ No remote repository configured"
    echo "   Add remote: git remote add origin https://github.com/username/repository.git"
fi

echo ""

# Check Git status
echo "📊 Repository Status:"
git status --porcelain | wc -l | { 
    read count
    if [ $count -eq 0 ]; then
        echo "✅ Working directory is clean"
    else
        echo "📝 $count files have changes"
    fi
}

# Check if there are commits
COMMIT_COUNT=$(git rev-list --count HEAD 2>/dev/null || echo "0")
echo "📚 Commits: $COMMIT_COUNT"

echo ""
echo "🚀 Next Steps:"
if [ -z "$USER_NAME" ] || [ -z "$USER_EMAIL" ]; then
    echo "1. Configure Git user information (see above)"
fi

if [ "$COMMIT_COUNT" = "0" ]; then
    echo "2. Make initial commit: git commit -m 'Initial commit: OTP MERN authentication system'"
fi

if [ $? -ne 0 ]; then
    echo "3. Add GitHub remote: git remote add origin https://github.com/username/repo.git"
fi

echo "4. Push to GitHub: git push -u origin main"
echo ""
echo "✨ Your OTP MERN project is ready for GitHub! ✨"
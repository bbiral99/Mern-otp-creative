# VERCEL DEPLOYMENT - Quick Fix Guide

## 🚨 IMMEDIATE FIX FOR "FAILED TO FETCH" ERROR

### Step 1: Deploy Backend to Vercel

1. **Push your code to GitHub** (if not already done)
2. **Go to Vercel Dashboard** → Import Project
3. **Select your backend folder** for deployment
4. **Set Environment Variables** in Vercel:
   ```
   MONGODB_URI=mongodb+srv://bhotkabelai_db_user:Udo4sY4xHik2VmHC@cluster0.esq1dug.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
   JWT_SECRET=some_random_secret
   EMAIL_USER=tesibelai@gmail.com
   EMAIL_PASS=vsox gqdj wfwk okjl
   CLIENT_URL=https://your-frontend-name.vercel.app
   NODE_ENV=production
   ```

5. **Deploy** and note your backend URL (e.g., `https://your-backend-name.vercel.app`)

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard** → Import Project
2. **Select your frontend folder** for deployment
3. **Set Environment Variables** in Vercel:
   ```
   REACT_APP_API_URL=https://your-backend-name.vercel.app/api
   ```
4. **Deploy** and note your frontend URL

### Step 3: Update Backend CORS

1. **Go back to backend Vercel project**
2. **Update CLIENT_URL environment variable**:
   ```
   CLIENT_URL=https://your-frontend-name.vercel.app
   ```
3. **Redeploy backend**

## 🔧 ALTERNATIVE QUICK TEST

If you want to test with your current deployed backend:

1. **Find your backend Vercel URL** (check Vercel dashboard)
2. **Update frontend environment variable** in Vercel:
   ```
   REACT_APP_API_URL=https://your-actual-backend-url.vercel.app/api
   ```
3. **Redeploy frontend**

## 🐛 DEBUGGING STEPS

1. **Check browser console** (F12) for exact error messages
2. **Check Vercel function logs** for backend errors
3. **Test API directly**: Visit `https://your-backend-url.vercel.app/health`
4. **Verify CORS**: Check if preflight requests are succeeding

## 📋 ENVIRONMENT VARIABLES CHECKLIST

### Backend (Vercel):
- [ ] MONGODB_URI (your MongoDB Atlas connection)
- [ ] JWT_SECRET
- [ ] EMAIL_USER
- [ ] EMAIL_PASS
- [ ] CLIENT_URL (your frontend Vercel URL)
- [ ] NODE_ENV=production

### Frontend (Vercel):
- [ ] REACT_APP_API_URL (your backend Vercel URL + /api)

## 🚀 QUICK COMMANDS

```bash
# Test your deployed API
curl https://your-backend-name.vercel.app/health

# Test signup endpoint
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}' \
  https://your-backend-name.vercel.app/api/auth/signup
```

## ⚡ MOST COMMON ISSUE

The #1 cause of "failed to fetch" on Vercel is **mismatched URLs**:
- Frontend trying to call `localhost:5000` instead of Vercel backend URL
- Backend CORS not allowing the frontend Vercel domain

**Solution**: Make sure REACT_APP_API_URL points to your actual Vercel backend URL!
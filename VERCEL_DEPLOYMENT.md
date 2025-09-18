# Vercel Deployment Guide - Gmail SMTP Priority

## Prerequisites

1. **Gmail Account**: Primary email service (2FA enabled)
2. **MongoDB Atlas**: Cloud database (Vercel doesn't support local MongoDB)
3. **Vercel Account**: For deployment
4. **SendGrid Account**: Optional fallback service

## Setup Steps

### 1. Gmail SMTP Configuration (Primary)

1. **Enable 2-Factor Authentication**:
   - Go to Google Account → Security → 2-Step Verification
   - Follow the setup process if not already enabled

2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Select "Mail" and generate password
   - Copy the 16-character password (remove spaces)

### 2. SendGrid Configuration (Optional Fallback)

1. Go to [SendGrid](https://app.sendgrid.com)
2. Create API Key:
   - Settings → API Keys → Create API Key
   - Choose "Restricted Access"
   - Grant "Mail Send" permissions
   - Copy the API key

3. Verify Sender Email:
   - Settings → Sender Authentication
   - Add your sender email and verify it

### 3. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create a cluster (free tier available)
3. Get connection string:
   - Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database password

### 4. Environment Variables for Vercel

Set these in Vercel dashboard (Settings → Environment Variables):

**Required (Gmail SMTP):**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/otpmernproject
JWT_SECRET=your_super_secret_jwt_key_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_character_app_password
CLIENT_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

**Optional (SendGrid Fallback):**
```
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
```

### 5. Deploy Backend to Vercel

1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically

### 6. Deploy Frontend to Vercel

1. Update frontend API URL to your backend deployment URL
2. Deploy frontend to Vercel
3. Update `CLIENT_URL` environment variable in backend

## Testing

Run the test script locally with production environment variables:

```bash
node gmail-vercel-test.js
```

## Email Service Priority

1. **Gmail SMTP** (Primary) - Fast, reliable, works great with Vercel
2. **SendGrid** (Fallback) - Only used if Gmail SMTP fails

## Troubleshooting

### Gmail SMTP Issues
- **Invalid login**: Use App Password, not regular password
- **Authentication failed**: Ensure 2FA is enabled first
- **Connection timeout**: Check Gmail credentials

### SendGrid Issues (Fallback)
- **401 Error**: Check SendGrid API key validity
- **403 Error**: Verify sender email in SendGrid

### Database Issues
- **Connection Error**: Verify MongoDB connection string
- **Authentication Error**: Check database username/password

### CORS Issues
- Ensure `CLIENT_URL` matches your frontend domain exactly
- Include protocol (https://)

## Key Advantages of Gmail SMTP + Vercel

- ✅ **No API Key Required**: Just use your Gmail credentials
- ✅ **Instant Setup**: Works immediately with App Password
- ✅ **Reliable Delivery**: Gmail's robust infrastructure
- ✅ **Cost Effective**: Free for reasonable usage
- ✅ **Vercel Compatible**: Optimized for serverless functions

## Production Checklist

- [ ] Gmail 2FA enabled
- [ ] Gmail App Password generated
- [ ] MongoDB Atlas connection working
- [ ] All environment variables set in Vercel
- [ ] Frontend deployed and connected
- [ ] CORS configured correctly
- [ ] Test email delivery working with Gmail SMTP
- [ ] SendGrid configured as fallback (optional)
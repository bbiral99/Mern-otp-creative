# Email OTP Verification - Backend

## Requirements
- Node.js (v16+ recommended)
- MongoDB Atlas (you already have)
- VS Code (optional)
- Postman or Thunder Client for API testing

## Setup
1. Copy `.env.example` to `.env` and fill in values (set MONGO_URI, JWT_SECRET).
2. If you don't have SMTP credentials, leave SMTP_ env vars empty — the app will create an Ethereal test account automatically for dev.
3. Install dependencies:

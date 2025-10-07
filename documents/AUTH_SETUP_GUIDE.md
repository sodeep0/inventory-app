# Authentication Setup Guide

This guide will help you set up and test the new authentication system with email verification and password reset functionality.

## 🚀 Quick Start

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB
MONGODB_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/inventory-app?retryWrites=true&w=majority

# Server
PORT=5000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend
FRONTEND_URL=http://localhost:3000

# Email Configuration (Gmail Example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
FROM_EMAIL=noreply@yourdomain.com
```

#### Gmail App Password Setup (Recommended)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security → 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password and use it as `SMTP_PASS`

#### Start Backend
```bash
npm run dev
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install
```

#### Configure Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Start Frontend
```bash
npm run dev
```

## 🧪 Testing the Features

### Test 1: User Registration with Email Verification

1. Navigate to `http://localhost:3000/register`
2. Fill in:
   - Username: `testuser`
   - Email: `your-email@gmail.com`
   - Password: `Test1234`
   - Confirm Password: `Test1234`
3. Click "Create account"
4. Check your email for the 6-digit verification code
5. Enter the code in the verification screen
6. You should be automatically logged in and redirected to the home page

**Expected Result:** ✅ Account created and automatically logged in

### Test 2: Login with Existing Account

1. Navigate to `http://localhost:3000/login`
2. Enter:
   - Email: `your-email@gmail.com`
   - Password: `Test1234`
3. Click "Sign in"
4. You should be logged in and redirected to home

**Expected Result:** ✅ Successfully logged in

### Test 3: Login with Unverified Email

1. Register a new account but don't verify it
2. Try to login with the unverified email
3. You should see a message: "Email not verified. Verification code resent."
4. A new verification code will be sent to your email
5. The verification screen should appear
6. Enter the code and complete verification

**Expected Result:** ✅ Prompted to verify email with new code sent

### Test 4: Forgot Password Flow

1. Navigate to `http://localhost:3000/forgot-password`
2. Enter your email address
3. Click "Send Reset Code"
4. Check your email for the 6-digit reset code
5. Enter the code in the verification screen
6. Click "Verify Code"
7. Enter your new password (twice)
8. Click "Reset Password"
9. You should be redirected to login
10. Login with your new password

**Expected Result:** ✅ Password reset successfully

### Test 5: Resend Verification Code

1. During registration verification step, wait a moment
2. Click "Resend Code"
3. A new code should be sent to your email
4. Enter the new code

**Expected Result:** ✅ New code sent and works

## 🔍 Troubleshooting

### Email Not Sending

**Problem:** Verification codes not arriving in email

**Solutions:**
1. Check your SMTP credentials in `.env`
2. For Gmail: Make sure you're using an App Password, not your regular password
3. Check spam/junk folder
4. Enable "Less secure app access" (not recommended) or use App Passwords
5. Check backend logs for email errors: `backend/dist/logs/error.log`

### Backend Errors

**Problem:** Backend crashes or API errors

**Solutions:**
1. Check MongoDB connection string
2. Ensure all environment variables are set
3. Check backend console for error messages
4. Verify all dependencies are installed: `npm install`

### Frontend Can't Connect to Backend

**Problem:** Frontend shows network errors

**Solutions:**
1. Ensure backend is running on port 5000
2. Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
3. Verify CORS settings in backend allow `http://localhost:3000`

### Token Expired

**Problem:** User gets logged out automatically

**Solution:** This is expected behavior. Tokens expire after 7 days for security.

## 📧 Email Template

The verification emails sent will look like this:

```
Subject: Your Verification Code

Your verification code is: 123456

This code will expire in 15 minutes.

If you didn't request this code, please ignore this email.
```

## 🛠️ API Endpoints Reference

| Endpoint | Method | Body | Response |
|----------|--------|------|----------|
| `/auth/register` | POST | `{ username, email, password }` | `{ message }` |
| `/auth/verify` | POST | `{ email, code }` | `{ message, token, username, email }` |
| `/auth/login` | POST | `{ email, password }` | `{ token, username, email }` |
| `/auth/forgot-password` | POST | `{ email }` | `{ message }` |
| `/auth/verify-reset-code` | POST | `{ email, code }` | `{ message }` |
| `/auth/reset-password` | POST | `{ email, code, newPassword }` | `{ message }` |

## 🎯 Code Expiration Times

- **Registration verification code:** 15 minutes
- **Password reset code:** 15 minutes
- **JWT token:** 7 days

## 📱 Supported Email Providers

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Outlook/Hotmail
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
```

### SendGrid (Production Recommended)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun (Production Recommended)
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## 🚀 Production Deployment

### Environment Variables to Update

**Backend:**
- `MONGODB_URI` - Use production MongoDB cluster
- `JWT_SECRET` - Use a strong, random secret (minimum 32 characters)
- `FRONTEND_URL` - Your production frontend URL
- `SMTP_*` - Use production email service (SendGrid, Mailgun, etc.)

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Your production backend URL

### Security Checklist

- [ ] Change JWT_SECRET to a strong random value
- [ ] Use production email service (not Gmail)
- [ ] Enable HTTPS for both frontend and backend
- [ ] Set up proper CORS configuration
- [ ] Enable rate limiting on authentication endpoints
- [ ] Monitor failed login attempts
- [ ] Set up email delivery monitoring

## 📝 Additional Notes

1. **Security:** Verification codes are 6 digits (100000-999999)
2. **Expiration:** Codes expire after 15 minutes
3. **Auto-login:** Users are automatically logged in after successful verification
4. **Password:** Minimum 8 characters required
5. **Username:** 3-30 characters, required during registration

## 💡 Tips

- Test with a real email address you have access to
- Use different email addresses for testing multiple accounts
- Clear browser localStorage if you encounter auth issues
- Check both frontend and backend console logs for debugging

## 🎉 Success Indicators

✅ Registration sends verification email
✅ Login works with email and password
✅ Auto-login after verification
✅ Forgot password sends reset code
✅ Password can be reset successfully
✅ Error messages are user-friendly
✅ Loading states show during operations

---

**Need Help?** Check the console logs in both frontend and backend for detailed error messages.


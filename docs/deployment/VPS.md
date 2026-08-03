# Production Deployment Guide - Teaching Platform

## 🎯 Overview

This guide provides the **complete, production-ready setup** for deploying the teaching platform on VPS with Nginx reverse proxy, MongoDB, and NextAuth Google OAuth.

---

## ✅ Pre-requisites

- VPS with Ubuntu/Debian (tested on Ubuntu 20.04+)
- Domain name (e.g., `toiladuykhanh.com`)
- MongoDB installed and running
- Node.js 18+ and npm
- PM2 process manager
- Nginx web server
- SSL certificate (Let's Encrypt)

---

## 📋 Step 1: Environment Variables

Create `/var/www/webofficial/.env.local` with the following content:

```env
# ═══════════════════════════════════════════════════
# MongoDB Connection
# ═══════════════════════════════════════════════════
MONGODB_URI=mongodb://127.0.0.1:27017/my_teaching_platform

# ═══════════════════════════════════════════════════
# NextAuth Configuration
# ═══════════════════════════════════════════════════
# Must match your production domain (include https://)
NEXTAUTH_URL=https://toiladuykhanh.com

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-super-secret-key-min-32-characters

# ═══════════════════════════════════════════════════
# Google OAuth Credentials
# ═══════════════════════════════════════════════════
# Get from: https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# ═══════════════════════════════════════════════════
# Server Configuration
# ═══════════════════════════════════════════════════
# Must match Nginx proxy_pass port
PORT=4000
NODE_ENV=production

# ═══════════════════════════════════════════════════
# Inquiry delivery (admin + email)
# ═══════════════════════════════════════════════════
# Every submission is saved to MongoDB and listed at /admin/inquiries.
# Resend notifies INQUIRY_NOTIFY_EMAIL; missing keys leave status "pending".
RESEND_API_KEY=re_xxxxxxxx
INQUIRY_FROM_EMAIL="Duy Khánh <noreply@toiladuykhanh.com>"
INQUIRY_NOTIFY_EMAIL=khanhnd2208@gmail.com
INQUIRY_RATE_LIMIT_SECRET=replace-with-a-strong-secret
```

### Inquiry checklist

1. Confirm `INQUIRY_NOTIFY_EMAIL=khanhnd2208@gmail.com` on the VPS `.env.local`.
2. Verify the From domain in [Resend](https://resend.com) matches `INQUIRY_FROM_EMAIL`.
3. After deploy: `pm2 reload nextjs-app --update-env`
4. Submit a test message on `/lien-he` → check `/admin/inquiries` and the Gmail inbox.

### Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

---

## 📋 Step 2: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `https://toiladuykhanh.com`
   - Authorized redirect URIs: `https://toiladuykhanh.com/api/auth/callback/google`

5. Copy **Client ID** and **Client Secret** to `.env.local`

---

## 📋 Step 3: Nginx Configuration

Create/edit `/etc/nginx/sites-available/toiladuykhanh.com`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name toiladuykhanh.com www.toiladuykhanh.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name toiladuykhanh.com www.toiladuykhanh.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/toiladuykhanh.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/toiladuykhanh.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        
        # Essential headers for NextAuth
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/toiladuykhanh.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📋 Step 4: MongoDB Database Setup

### 4.1 Create Database and Collections

```bash
mongosh
```

```javascript
// Switch to database
use my_teaching_platform

// Verify database is created
show dbs
```

### 4.2 Set Admin Role

**CRITICAL**: NextAuth's MongoDBAdapter creates users without Mongoose schema defaults. You must manually set the admin role:

```javascript
// Find your user (created after first login)
db.users.find({ email: "khanhnd2208@gmail.com" })

// Set admin role
db.users.updateOne(
  { email: "khanhnd2208@gmail.com" },
  { $set: { role: "admin" } }
)

// Verify
db.users.findOne({ email: "khanhnd2208@gmail.com" })
// Should show: { ..., role: "admin", ... }
```

### 4.3 Create Indexes (Optional but Recommended)

```javascript
// Text search index for blog posts
db.posts.createIndex({ title: "text", summary: "text" })

// User email index (usually auto-created, but verify)
db.users.createIndex({ email: 1 }, { unique: true })

// Performance indexes
db.posts.createIndex({ publishedAt: -1 })
db.lessons.createIndex({ updatedAt: -1 })
```

---

## 📋 Step 5: Deploy Application

```bash
# Navigate to project directory
cd /var/www/webofficial

# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Build Next.js
npm run build

# Start with PM2
PORT=4000 pm2 start npm --name "nextjs-app" -- start

# Save PM2 configuration
pm2 save

# Enable PM2 startup on boot
pm2 startup
# Follow the command it outputs
```

---

## 📋 Step 6: Verify Deployment

### 6.1 Check PM2 Status

```bash
pm2 status
pm2 logs nextjs-app --lines 20
```

Expected output:
```
✓ Ready in XXXms
```

### 6.2 Test Authentication Flow

1. **Clear browser cookies** for `toiladuykhanh.com`
2. Open **Incognito/Private window**
3. Navigate to `https://toiladuykhanh.com`
4. Click "Đăng nhập với Google"
5. Complete Google OAuth flow
6. Should redirect to `/dashboard` successfully

### 6.3 Test Admin Access

1. Login with admin email (`khanhnd2208@gmail.com`)
2. Navigate to `https://toiladuykhanh.com/admin`
3. Should see admin panel (not redirect to dashboard)

### 6.4 Test Regular User

1. Login with a different Google account
2. Navigate to `https://toiladuykhanh.com/admin`
3. Should redirect to `/dashboard` (access denied)
4. Can access `/vocabulary`, `/blog`, etc.

---

## 🔧 Troubleshooting

### Issue: "Couldn't sign you in" from Google

**Cause**: OAuth redirect URI mismatch

**Solution**:
1. Verify Google Console has exact URI: `https://toiladuykhanh.com/api/auth/callback/google`
2. Verify `NEXTAUTH_URL=https://toiladuykhanh.com` in `.env.local`
3. Restart PM2: `pm2 restart nextjs-app --update-env`

---

### Issue: User logged in but can't access `/admin`

**Cause**: User role not set in database

**Solution**:
```bash
mongosh
use my_teaching_platform
db.users.updateOne(
  { email: "your-admin@email.com" },
  { $set: { role: "admin" } }
)
```

Then **logout and login again** to refresh JWT token.

---

### Issue: Session lost after login (redirect loop)

**Cause**: Cookie issues or missing headers

**Solution**:
1. Verify Nginx has all headers (especially `X-Forwarded-Proto` and `X-Forwarded-Host`)
2. Verify `trustHost: true` in `src/lib/auth.ts`
3. Clear browser cookies completely
4. Check PM2 logs: `pm2 logs nextjs-app --lines 50`

---

### Issue: Build errors on VPS

**Cause**: Node modules or cache issues

**Solution**:
```bash
cd /var/www/webofficial
rm -rf node_modules .next package-lock.json
npm install
npm run build
pm2 restart nextjs-app
```

---

## 🔄 Update Workflow

When deploying updates:

```bash
cd /var/www/webofficial
git pull origin main
npm install
rm -rf .next
npm run build
pm2 restart nextjs-app --update-env
pm2 logs nextjs-app --lines 20
```

---

## 🛡️ Security Notes

### What's in Production:

1. ✅ **JWT session strategy** - Stateless, scales horizontally
2. ✅ **trustHost: true** - Required for reverse proxy
3. ✅ **Default OAuth checks** - Google's standard security flow
4. ✅ **Role-based access control** - Admin/Teacher/Student
5. ✅ **HTTPS enforced** - All traffic encrypted
6. ✅ **MongoDB authentication** - Localhost only (secure by default)

### What's NOT Needed:

- ❌ Custom OAuth checks (`nonce`, `state` workarounds) - Standard flow works
- ❌ `checks: ["none"]` - Insecure and rejected by Google
- ❌ ADMIN_EMAIL env var - Deprecated, using database role

---

## 📊 Database Schema Reference

### Users Collection

```javascript
{
  _id: ObjectId("..."),
  name: "User Name",
  email: "user@example.com",
  role: "student" | "teacher" | "admin",  // Default: "student"
  image: "https://...",
  emailVerified: null,
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

**Important**: 
- New users automatically get `role: "student"` via `createUser` event
- To make admin: `db.users.updateOne({email: "..."}, {$set: {role: "admin"}})`
- Must logout/login after role change to refresh JWT

---

## 📞 Support

If issues persist:

1. Check PM2 logs: `pm2 logs nextjs-app --lines 100`
2. Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`
3. Check MongoDB status: `sudo systemctl status mongod`
4. Verify environment variables are loaded: `pm2 env 0`

---

## ✅ Final Checklist

Before going live:

- [ ] `.env.local` has all required variables
- [ ] `NEXTAUTH_SECRET` is strong (32+ characters)
- [ ] Google OAuth redirect URI matches exactly
- [ ] Nginx forwards all required headers
- [ ] SSL certificate is valid and auto-renews
- [ ] MongoDB is running and accessible
- [ ] Admin user has `role: "admin"` in database
- [ ] PM2 is set to start on boot
- [ ] Application builds without errors
- [ ] Login/logout flow works
- [ ] Admin panel is accessible to admin only
- [ ] Regular users can access `/vocabulary`, `/blog`

---

**Last Updated**: 2026-02-16  
**Next.js Version**: 16.1.6  
**NextAuth Version**: 5.0.0-beta.30

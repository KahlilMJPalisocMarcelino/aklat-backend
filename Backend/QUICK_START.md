# Quick Start Guide - Deploy Aklat Backend

## 🎯 Recommended: Render + MongoDB Atlas

### 1. MongoDB Atlas Setup (5 minutes)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create free M0 cluster
3. Create database user (save username/password!)
4. Add IP: `0.0.0.0/0` (allow all IPs)
5. Get connection string: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aklat?retryWrites=true&w=majority`

### 2. Deploy to Render (10 minutes)
1. Push code to GitHub
2. Go to [Render](https://render.com) and sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Name**: `aklat-backend`
   - **Root Directory**: `Backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   JWT_SECRET=generate_a_random_32_character_string_here
   MONGODB_URI=your_mongodb_atlas_connection_string_here
   ```
7. Click "Create Web Service"
8. Wait for deployment (2-5 minutes)

### 3. Test Your API
Your API will be at: `https://aklat-backend.onrender.com`

Test it:
```bash
curl https://aklat-backend.onrender.com/api/health
```

Should return:
```json
{"status":"OK","message":"Aklat API is running"}
```

### 4. Update Frontend
Update your frontend to use the new API URL:
```javascript
const API_URL = 'https://aklat-backend.onrender.com/api';
```

---

## 🔑 Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use online tool: https://generate-secret.vercel.app/32

---

## ✅ Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Web service created on Render
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Health check endpoint working
- [ ] Frontend updated with new API URL

---

## 🆘 Common Issues

**"MongoDB connection failed"**
- Check connection string has correct username/password
- Verify IP whitelist includes 0.0.0.0/0
- Check database name is in connection string

**"Build failed"**
- Check package.json has all dependencies
- Verify Node.js version compatibility
- Check build logs in Render dashboard

**"Environment variables not working"**
- Make sure variables are set in Render dashboard
- Redeploy after adding variables
- Check variable names are exact (case-sensitive)

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)

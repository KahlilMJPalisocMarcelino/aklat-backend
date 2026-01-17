# Deployment Guide for Aklat Backend

This guide will help you deploy the Aklat backend to **Render** or **Vercel** with **MongoDB Atlas**.

## 🗄️ Step 1: Set Up MongoDB Atlas (Required for Both Platforms)

### 1.1 Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up for a free account (M0 Free Tier is perfect for development)
3. Verify your email

### 1.2 Create a Cluster
1. After logging in, click **"Build a Database"**
2. Choose **"M0 FREE"** tier (Free forever)
3. Select a cloud provider and region (choose closest to your deployment region)
4. Give your cluster a name (e.g., "AklatCluster")
5. Click **"Create"** (takes 3-5 minutes)

### 1.3 Configure Database Access
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Create a username and password (save these!)
5. Set user privileges to **"Atlas admin"** or **"Read and write to any database"**
6. Click **"Add User"**

### 1.4 Configure Network Access
1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. For development: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - ⚠️ For production, add specific IPs only
4. Click **"Confirm"**

### 1.5 Get Your Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<username>` and `<password>` with your database user credentials
6. Add your database name at the end: `...mongodb.net/aklat?retryWrites=true&w=majority`
7. **Save this connection string** - you'll need it for deployment!

---

## 🚀 Option A: Deploy to Render (Recommended for Express Apps)

Render is better suited for traditional Node.js/Express applications.

### Step 1: Prepare Your Code
1. Make sure all your code is committed to Git
2. Push to GitHub, GitLab, or Bitbucket

### Step 2: Create Render Account
1. Go to [Render](https://render.com)
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed

### Step 3: Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your repository (GitHub/GitLab/Bitbucket)
3. Select your repository and branch

### Step 4: Configure Service
- **Name**: `aklat-backend` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` or `master`
- **Root Directory**: `Backend` (if your backend is in a Backend folder)
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Step 5: Set Environment Variables
Click **"Environment"** tab and add:

```
NODE_ENV=production
PORT=10000
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aklat?retryWrites=true&w=majority
```

**Important Notes:**
- Replace `username:password` with your MongoDB Atlas credentials
- Replace the cluster URL with your actual MongoDB Atlas connection string
- Generate a strong JWT_SECRET (you can use: `openssl rand -base64 32`)

### Step 6: Deploy
1. Click **"Create Web Service"**
2. Render will automatically build and deploy
3. Wait for deployment to complete (usually 2-5 minutes)
4. Your API will be available at: `https://aklat-backend.onrender.com` (or your custom domain)

### Step 7: Test Your Deployment
```bash
curl https://your-app-name.onrender.com/api/health
```

Expected response:
```json
{"status":"OK","message":"Aklat API is running"}
```

---

## ⚡ Option B: Deploy to Vercel (Serverless)

Vercel is great for serverless functions, but requires some adjustments for Express.

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
cd Backend
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? **Your account**
- Link to existing project? **No**
- Project name: **aklat-backend**
- Directory: **./** (current directory)
- Override settings? **No**

### Step 4: Set Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following:

```
NODE_ENV=production
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters_long
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aklat?retryWrites=true&w=majority
```

### Step 5: Redeploy
After adding environment variables, redeploy:
```bash
vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

### Step 6: Test Your Deployment
Your API will be at: `https://your-project-name.vercel.app/api/health`

---

## 🔧 Additional Configuration

### CORS Configuration
The backend already has CORS enabled. If you need to restrict it to your frontend domain, update `server.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://your-frontend-domain.com',
  credentials: true
}));
```

### Custom Domain (Optional)
Both Render and Vercel support custom domains:
- **Render**: Settings → Custom Domains
- **Vercel**: Settings → Domains

---

## 🧪 Testing Your Deployment

### Test Authentication
```bash
# Register a user
curl -X POST https://your-api-url.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Test Books Endpoint
```bash
# Get all books
curl https://your-api-url.com/api/books
```

---

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your MongoDB Atlas IP whitelist includes `0.0.0.0/0` (or Render/Vercel IPs)
- Check your connection string has the correct username/password
- Ensure database name is included in the connection string

### Build Failures
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check build logs in Render/Vercel dashboard

### Environment Variables Not Working
- Make sure variables are set in the platform dashboard
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### CORS Errors
- Update CORS configuration in `server.js`
- Add your frontend URL to allowed origins

---

## 📊 Monitoring

### Render
- View logs: Dashboard → Your Service → Logs
- View metrics: Dashboard → Your Service → Metrics

### Vercel
- View logs: Dashboard → Your Project → Functions → Logs
- View analytics: Dashboard → Your Project → Analytics

---

## 🔐 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use strong JWT_SECRET** - Minimum 32 characters, random
3. **Restrict MongoDB IP access** - Use specific IPs in production
4. **Use HTTPS** - Both platforms provide this automatically
5. **Regular updates** - Keep dependencies updated

---

## 📝 Next Steps

After deployment:
1. Update your frontend to use the new API URL
2. Test all endpoints
3. Set up monitoring/alerts
4. Configure custom domain (optional)
5. Set up CI/CD for automatic deployments

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com

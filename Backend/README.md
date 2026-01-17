# Aklat Backend API

Backend API for Aklat - Para Sa Lahat e-commerce platform.

## Features

- User Authentication (Register, Login, Profile Management)
- Book/Product Management
- Shopping Cart Management
- Order Management
- User Management (Admin)

## 🚀 Deployment

**Ready to deploy?** Check out our deployment guides:
- **[QUICK_START.md](./QUICK_START.md)** - Fast 15-minute deployment guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Comprehensive deployment instructions

**Recommended:** Deploy to **Render** with **MongoDB Atlas** (easiest setup)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the Backend directory:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
MONGODB_URI=mongodb://localhost:27017/aklat
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### 3. Start MongoDB

Make sure MongoDB is running on your system. If not installed, you can:
- Install MongoDB locally, or
- Use MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

### 4. Run the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `PUT /api/auth/profile` - Update user profile (requires auth)
- `POST /api/auth/forgot-password` - Request password reset

### Books
- `GET /api/books` - Get all books (public)
- `GET /api/books/:id` - Get single book (public)
- `POST /api/books` - Create book (admin only)
- `PUT /api/books/:id` - Update book (admin only)
- `DELETE /api/books/:id` - Delete book (admin only)

### Cart
- `GET /api/cart` - Get user's cart (requires auth)
- `POST /api/cart/add` - Add item to cart (requires auth)
- `PUT /api/cart/update/:itemId` - Update cart item quantity (requires auth)
- `DELETE /api/cart/remove/:itemId` - Remove item from cart (requires auth)
- `DELETE /api/cart/clear` - Clear cart (requires auth)

### Orders
- `POST /api/orders` - Create order (requires auth)
- `GET /api/orders/my-orders` - Get user's orders (requires auth)
- `GET /api/orders/:id` - Get single order (requires auth)
- `PUT /api/orders/:id/status` - Update order status (admin only)
- `GET /api/orders` - Get all orders (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get single user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Authentication

Most endpoints require authentication. Include the JWT token in the request header:

```
Authorization: Bearer <your_jwt_token>
```

or

```
x-auth-token: <your_jwt_token>
```

## Example Requests

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan dela Cruz",
  "email": "juan@example.com",
  "password": "password123"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

### Add to Cart
```bash
POST /api/cart/add
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookId": "507f1f77bcf86cd799439011",
  "quantity": 2
}
```

## Notes

- Maximum quantity per item in cart: 50
- Shipping fee: AED 20.00
- Delivery fee: AED 10.00
- Default user role: 'user'
- Admin role required for book/user management

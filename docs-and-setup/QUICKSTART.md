# 🚗 growmore - Quick Start Guide

## 🎯 What You Have

A complete, production-ready Valet Parking Management System with:
- ✅ Driver Dashboard (Create & manage bookings)
- ✅ Customer Portal (OTP login, track car, recall)
- ✅ Supervisor Dashboard (Monitor all operations)
- ✅ Real-time notifications (Socket.io)
- ✅ SMS/OTP service (Twilio - works in mock mode without setup)
- ✅ Secure authentication (JWT)
- ✅ Professional UI (White & Orange theme with animations)
- ✅ Free tier deployment ready (Render + MongoDB Atlas)

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run install-all
```

### Step 2: Start Development

```bash
# Run both backend and frontend
npm run dev
```

That's it! The app will open at:
- **Frontend**: http://localhost:3000
- **Backend**: api

### Step 3: Login & Test

**Driver Login:**
- Phone: `9999999999`
- Password: `driver123`

**Supervisor Login:**
- Phone: `8888888888`
- Password: `super123`

**Customer Login:**
- Any 10-digit phone number
- OTP: Check terminal/console (in mock mode)

## 📱 Test the Complete Flow

1. **As Driver** (http://localhost:3000/login):
   - Login with driver credentials
   - Create a new booking
   - Note the booking ID

2. **As Customer** (http://localhost:3000/customer/login):
   - Login with OTP (any phone)
   - See your booking
   - Click "Recall My Car"

3. **Back to Driver**:
   - See recall notification
   - Set estimated arrival time
   - Mark as arrived
   - Note the OTP

4. **Back to Customer**:
   - See arrival notification and OTP

5. **Driver - Complete**:
   - Enter OTP from customer
   - Choose payment method
   - Complete booking

## 🌐 Deploy to Production

### Option 1: Render (Recommended - Free)

1. **Setup MongoDB Atlas** (Free):
   - Go to https://www.mongodb.com/cloud/atlas
   - Create free cluster
   - Get connection string

2. **Deploy to Render**:
   - Push to GitHub
   - Connect to Render
   - Follow [DEPLOYMENT.md](DEPLOYMENT.md)

3. **Access**: `https://your-app.onrender.com`

### Option 2: Other Platforms

Works on: Heroku, Railway, Vercel (backend on Vercel Functions), AWS, etc.

## 📂 Project Structure

```
growmore/
├── backend/              # Node.js + Express API
│   ├── models/          # MongoDB models
│   ├── routes/          # API endpoints
│   ├── middleware/      # Auth middleware
│   ├── services/        # SMS service
│   └── server.js        # Main server
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/       # Main pages
│   │   ├── context/     # React context (Auth, Socket)
│   │   └── services/    # API & Socket services
│   └── public/
└── package.json         # Root scripts
```

## 🔑 Key Features

### For Drivers
- Create bookings quickly
- Manage active bookings
- Real-time recall notifications
- OTP verification
- Cash/QR payment options

### For Customers
- OTP-based login (no password needed)
- SMS notifications
- Track booking status
- One-click car recall
- Real-time ETA updates

### For Supervisors
- Monitor all bookings
- Real-time statistics
- Filter by status
- Track revenue

## 🔒 Security Features

✅ JWT authentication
✅ Password hashing (bcrypt)
✅ Input validation
✅ Rate limiting
✅ CORS protection
✅ XSS prevention
✅ Helmet.js security headers

## 📝 Important Notes

### SMS Service
- **Development**: Works in MOCK mode (prints to console)
- **Production**: Add Twilio credentials for real SMS
- Get free Twilio credits: https://www.twilio.com/try-twilio

### Database
- **Development**: Uses MongoDB locally (install MongoDB)
- **Production**: MongoDB Atlas (free 512MB cluster)

### Multiple Users
- System supports concurrent drivers, customers, supervisors
- Socket.io handles real-time updates
- Works perfectly on Render free tier

## 🛠️ Development Commands

```bash
# Install all dependencies
npm run install-all

# Run both frontend and backend
npm run dev

# Run backend only
npm run server

# Run frontend only
npm run client

# Build for production
npm run build

# Seed database with default users
cd backend && node seed.js
```

## 📖 Documentation

- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Testing Guide**: See [TESTING.md](TESTING.md)
- **API Documentation**: Check backend/routes/ files

## 🐛 Troubleshooting

### Port already in use
```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

### MongoDB connection error
```bash
# Make sure MongoDB is running
mongod

# Or use MongoDB Atlas connection string
```

### Dependencies not installing
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🎨 Customization

### Change Theme Colors
Edit: `frontend/src/index.css`

```css
:root {
  --primary-orange: #FF6B35;  /* Change this */
  --white: #FFFFFF;
}
```

### Add New Features
- Backend: Add routes in `backend/routes/`
- Frontend: Add components in `frontend/src/components/`
- Real-time: Use Socket.io events in context

## 📊 Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Socket.io (real-time)
- JWT (authentication)
- Twilio (SMS - optional)

**Frontend:**
- React 18
- React Router (routing)
- Framer Motion (animations)
- Axios (API calls)
- Socket.io-client (real-time)

**Deployment:**
- Render (free tier)
- MongoDB Atlas (free tier)

## 🤝 Support

For issues:
1. Check [TESTING.md](TESTING.md)
2. Check [DEPLOYMENT.md](DEPLOYMENT.md)
3. Review console logs
4. Check browser DevTools

## 📄 License

MIT License - Free to use and modify

---

**Made with ❤️ for growmore**

Happy Coding! 🚀

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://manthetic-admin.vercel.app",
        "https://manthetic.onrender.com"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    exposedHeaders: ['x-auth-token'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/variants', require('./routes/variantRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/order', require('./routes/orderRoutes'));
app.use('/api/wishlist', require('./routes/wishlistRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/analytic', require('./routes/analyticsRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));



module.exports = app;

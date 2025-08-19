const express = require('express');
const cors = require('cors');
const app = express();

// Allow multiple origins
const allowedOrigins = [
    "http://localhost:5173",
    "https://manthetic-admin.vercel.app",
    "https://manthetic-storefront.vercel.app",
    "https://manthetic.onrender.com"
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.log('CORS blocked origin:', origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// Test CORS route
app.get('/test-cors', (req, res) => {
    console.log('Origin header:', req.headers.origin);
    res.json({ message: 'CORS is working!', origin: req.headers.origin });
});

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

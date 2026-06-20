const express = require('express');
const cors = require('cors');
const { config } = require('./config');
const errorHandler = require('./middleware/errorHandler');
const app = express();

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || config.corsOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

app.get('/test-cors', (req, res) => {
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
app.use('/api/ai', require('./routes/aiRoutes'));

app.use(errorHandler);

module.exports = app;

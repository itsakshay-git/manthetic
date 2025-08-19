# Manthetic Backend

A robust and scalable e-commerce backend API built with Node.js, Express.js, and PostgreSQL. This project provides a comprehensive solution for managing products, orders, customers, and analytics in an e-commerce platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control (Admin/Customer)
- **Product Management**: Complete CRUD operations for products, categories, and variants
- **Order Management**: Comprehensive order processing with status tracking
- **Shopping Cart**: Persistent cart functionality with size and price selection
- **Wishlist System**: User wishlist management for products and variants
- **Review System**: Product rating and review functionality
- **Address Management**: User address storage and management
- **Analytics**: Business intelligence and reporting capabilities
- **File Upload**: Cloudinary integration for image management
- **Input Validation**: Joi-based request validation
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **File Upload**: Multer + Cloudinary
- **Validation**: Joi
- **CORS**: Cross-origin resource sharing
- **Environment**: dotenv

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- Node.js (v14 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd manthetic-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/manthetic_db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key"

# Server Configuration
PORT=5000

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Start the Application

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000` (or the port specified in your `.env` file).

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/logout` | User logout |

### Product Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products |
| GET | `/products/:id` | Get product by ID |
| POST | `/products` | Create new product (Admin only) |
| PUT | `/products/:id` | Update product (Admin only) |
| DELETE | `/products/:id` | Delete product (Admin only) |

### Category Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | Get all categories |
| GET | `/categories/:id` | Get category by ID |
| POST | `/categories` | Create new category (Admin only) |
| PUT | `/categories/:id` | Update category (Admin only) |
| DELETE | `/categories/:id` | Delete category (Admin only) |

### Cart Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/cart` | Get user's cart items |
| POST | `/cart` | Add item to cart |
| PUT | `/cart/:id` | Update cart item |
| DELETE | `/cart/:id` | Remove item from cart |

### Order Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/order` | Get user's orders |
| POST | `/order` | Create new order |
| PUT | `/order/:id` | Update order status |
| GET | `/order/:id` | Get order details |

### Additional Endpoints

- **Variants**: `/api/variants` - Product variant management
- **Reviews**: `/api/reviews` - Product review system
- **Wishlist**: `/api/wishlist` - User wishlist management
- **Addresses**: `/api/addresses` - User address management
- **Analytics**: `/api/analytic` - Business analytics and reporting
- **Customer**: `/api/customer` - Customer profile management

## 🗄️ Database Schema

The application uses the following main entities:

- **User**: Authentication and user management
- **Product**: Product information and metadata
- **ProductVariant**: Product variations with sizes and images
- **Category**: Product categorization
- **Order**: Customer orders and status tracking
- **CartItem**: Shopping cart functionality
- **Review**: Product ratings and feedback
- **Wishlist**: User wishlist items
- **Address**: User shipping addresses

## 🔐 Authentication & Authorization

The API uses JWT tokens for authentication. Protected routes require a valid token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles

- **CUSTOMER**: Can view products, manage cart, place orders, and manage profile
- **ADMIN**: Full access to all endpoints including product and user management

## 📁 Project Structure

```
manthetic-backend/
├── app.js                 # Main application setup
├── server.js             # Server entry point
├── package.json          # Dependencies and scripts
├── prisma/
│   └── schema.prisma     # Database schema
├── routes/               # API route definitions
├── controllers/          # Business logic handlers
├── models/               # Data models
├── middleware/           # Custom middleware
├── validation/           # Request validation schemas
├── utils/                # Utility functions
└── uploads/              # File upload directory
```



## 📦 Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon

## 🔧 Development

### Code Style
- Follow standard JavaScript/Node.js conventions
- Use meaningful variable and function names
- Add comments for complex logic

### Adding New Features
1. Create the database model in `prisma/schema.prisma`
2. Generate and run migrations
3. Create the controller in `controllers/`
4. Add validation in `validation/`
5. Create routes in `routes/`
6. Update `app.js` with new routes


## 🔄 Version History

- **v1.0.0** - Initial release with core e-commerce functionality

---

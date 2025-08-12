process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1); // Optional: let the app crash visibly
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});


require('dotenv').config(); // ✅ Load .env
const aiSearchRoute = require('./api/aisearch/ai-search.route')(process.env.OPENAI_API_KEY);

console.log('Starting the application...');
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
const config = require('config');
const swaggerUi = require('swagger-ui-express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const https = require('https');
const swaggerDocument = require('./swagger.json');
const logger = require('./utils/logger');
const redisClient = require('./utils/redisClient');
const venueReviewRoutes = require('./api/venue/venueReview');

const { url } = config.get('db');
mongoose.set('strictQuery', false);

console.log('Connecting to MongoDB...');
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected successfully.');
    logger.infoLog.info('MongoDB client has been successfully created from app.js');
  })
  .catch(err => {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  });

// Initialize Redis connection
console.log('Connecting to Redis...');
redisClient.connect()
  .then(() => {
    console.log('Redis connected successfully.');
    logger.infoLog.info('Redis client has been successfully created from app.js');
  })
  .catch(err => {
    console.error(`Error connecting to Redis: ${err.message}`);
    // Don't exit on Redis connection failure, continue without caching
    logger.errorLog.error('Redis connection failed, continuing without caching');
  });

// Global error handlers for uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  logger.errorLog.error('Uncaught Exception:', err);
  process.exit(1); // Exit the process to avoid an unstable state
});

process.on('unhandledRejection', (reason, promise) => {
  logger.errorLog.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Optional: exit the process if needed
});

// Load additional configurations and services
require('./passport');
const SeedService = require('./api/seedService');

// Common controllers
const authController = require('./api/common/auth/authController');
const settingsController = require('./api/common/settings/settingsController');
const commonController = require('./api/common/common/commonController');

// Import routers
const userRoutes = require('./api/user/user');
const userroleRoutes = require('./api/userrole/userrole');
const categoryRoutes = require('./api/category/category');
const venueRoutes = require('./api/venue/venue');
const cmsmoduleRoutes = require('./api/cmsmodule/cmsmodule');
const moduleRoutes = require('./api/module/module');
const utilityController = require('./api/utility/utilityController');
const bannerRoutes = require('./api/banner/banner');
const newsLetterRoutes = require('./api/newsletter/newsLetter');
const contactUsRoutes = require('./api/contactus/contactUs');
const productreviewRoutes = require('./api/productreview/productreview');
const orderreviewRoutes = require('./api/orderreview/orderreview');
const countryRoutes = require('./api/country/country');
const stateRoutes = require('./api/state/state');
const cityRoutes = require('./api/city/city');
const subareaRoutes = require('./api/subarea/subarea');
const eventplannerRoutes = require('./api/eventplanner/eventplanner');
const slotRoutes = require('./api/slot/slot');
const postAvailabilityRoutes = require('./api/postavailability/postavailability');
const venueorderRoutes = require('./api/venueorder/venueorder');
const wishlistRoutes = require('./api/wishlist/wishlist');
const offerRoutes = require('./api/offer/offer');
const vendorRoutes = require('./api/vendor/vendor');
const vendorOrderRoutes = require('./api/vendororder/vendororder');
const analyticsRoutes = require('./api/analytics/geography/analytics');
const bookingRoutes = require('./api/bookings/bookingRoutes');

// Initialize the application
const app = express();
const { port, root } = config.get('api') || { port: 3000, root: '/api' };
// CORS configuration - Enable for frontend access
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://localhost:3000',
    'https://eazyvenue.in',
    'https://www.eazyvenue.in',
    'https://eazyvenue.com',
    'https://www.eazyvenue.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
// Body parser configuration
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use('/api/venue', venueRoutes);
app.use('/api/aiSearch', aiSearchRoute);

// Middleware for error handling
function logErrors(err, req, res, next) {
  logger.errorLog.error(err);
  next(err);
}

function clientErrorHandler(err, req, res, next) {
  if (req.xhr) {
    res.status(500).send({ error: 'Something went wrong.' });
  } else {
    next(err);
  }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



const auth = passport.authenticate('jwt', { session: false });

// Swagger setup
const customSwaggerOptions = {
  showExplorer: true,
  swaggerOptions: {
    authAction: {
      JWT: {
        name: 'JWT',
        schema: {
          type: 'apiKey',
          in: 'header',
          name: 'Authorization',
          description: 'Bearer <my own JWT token>',
        },
        value: 'Bearer <my own JWT token>',
      },
    },
  },
};

app.use(`${root}/swagger`, (req, res, next) => {
  swaggerDocument.host = req.get('host');
  req.swaggerDoc = swaggerDocument;
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerDocument, customSwaggerOptions));

// Seed data in case of empty database
const seedService = new SeedService();
seedService.checkAndSeed();

// Middleware configuration
app.use(express.json());
app.use(aiSearchRoute);

const profileDir = path.join(__dirname, 'public');
app.use(express.static(profileDir));
// Serve uploads directory - PRIMARY PATH for migrated images

// Serve uploads directory
const publicUploadsDir = path.join(__dirname, 'public/uploads');
app.use('/uploads', express.static(publicUploadsDir));

// Log the uploads directory path for debugging
console.log('Serving uploads from:', publicUploadsDir);

// Routes for common controllers
app.use(`${root}/auth`, authController);
app.use(`${root}/venues`, venueReviewRoutes);
app.use(`${root}`, commonController);
app.use(`${root}/settings`, auth, settingsController);

// Route middlewares
app.use(`${root}/user`, userRoutes);
app.use(`${root}/userrole`, userroleRoutes);
app.use(`${root}/category`, categoryRoutes);
app.use(`${root}/venue`, venueRoutes);
app.use(`${root}/module`, moduleRoutes);
app.use(`${root}/cmsmodule`, cmsmoduleRoutes);
app.use(`${root}/utility`, utilityController);
app.use(`${root}/banner`, bannerRoutes);
app.use(`${root}/subscribe`, newsLetterRoutes);
app.use(`${root}/contact-us`, contactUsRoutes);
app.use(`${root}/productreview`, productreviewRoutes);
app.use(`${root}/orderreview`, orderreviewRoutes);
app.use(`${root}/countrylist`, countryRoutes);
app.use(`${root}/statelist`, stateRoutes);
app.use(`${root}/citylist`, cityRoutes);
app.use(`${root}/subarea`, subareaRoutes);
app.use(`${root}/slot`, slotRoutes);
app.use(`${root}/postavailability`, postAvailabilityRoutes);
app.use(`${root}/venueorder`, venueorderRoutes);
app.use(`${root}/vendororder`, vendorOrderRoutes);
app.use(`${root}/eventplanner`, eventplannerRoutes);
app.use(`${root}/wishlist`, wishlistRoutes);
app.use(`${root}/offer`, offerRoutes);
app.use(`${root}/vendor`, vendorRoutes);
app.use(`${root}/analytics/geography`, analyticsRoutes);
app.use(`${root}/analytics/venue`, require('./api/analytics/venueAnalytics'));
app.use(`${root}/bookings`, bookingRoutes);

app.use(logErrors);
app.use(clientErrorHandler);

// Health check endpoint
app.get(`${root}/health`, async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    service: 'eazyvenue-backend',
    version: require('../package.json').version,
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    pid: process.pid
  };
  
  // Check MongoDB connection
  if (mongoose.connection.readyState === 1) {
    healthCheck.database = 'connected';
  } else {
    healthCheck.database = 'disconnected';
  }
  
  // Check Redis connection
  try {
    const redisHealth = await redisClient.healthCheck();
    healthCheck.redis = redisHealth;
  } catch (error) {
    healthCheck.redis = { status: 'error', error: error.message };
  }
  
  res.status(200).json(healthCheck);
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Hello World!');
  console.log('GET request to /');
});

// Start the server
app.listen(port, () => {
  console.log(`Server started and listening on port ${port}`);
  logger.infoLog.info(`Server started and listening on port ${port}`);
});

module.exports = app;

module.exports = {
  api: {
    port: process.env.PORT || 3006,
    root: "/api",
  },
  frontEnd: {
    domain: process.env.FRONTEND_DOMAIN || 'https://eazyvenue.in',
    picPath: process.env.API_DOMAIN || 'https://api.eazyvenue.in'
  },
  auth: {
    jwt: {
      accessTokenSecret: process.env.JWT_ACCESS_SECRET || "A78D2E0F6823BF1F437C3E2B64D7D6C5098407C8B21D92E12D62B43527E00A97",
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || "y6DNKhzqRdGthMBDsYclOUcCGenNZ42GKqi7Vh17wvJDRggK8eUGD7j4H9swh2G",
      accessTokenLife: 75600,
      refreshTokenLife: 2592000,
    },
    resetPassword: {
      secret: process.env.RESET_PASSWORD_SECRET || "56gXxY{+D6/4m#kZ394j2=bT2eHqTAu>r8zAT>yEn:;TM#9*Vg",
      ttl: 86400 * 1000, // 1 day
      algorithm: "aes256",
      inputEncoding: "utf8",
      outputEncoding: "hex",
    },
  },
  db: {
    url: process.env.MONGODB_URL || "mongodb://13.61.182.152:27017/admin",
    name: process.env.MONGODB_DB_NAME || "admin",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    options: {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      lazyConnect: true,
      maxRetriesPerRequest: null,
      retryDelayOnFailover: null,
      db: 0
    }
  },
  payment: {
    liveKey: process.env.RAZORPAY_LIVE_KEY || 'rzp_live_oyCHow0OxfS8oL',
    liveSecret: process.env.RAZORPAY_LIVE_SECRET || 'epGc231JkMUV7jlaJ3NpKO9e',
  },
  picture: {
    profilePicFolder: "src/public/uploads/profilepic/",
    showPicFolderPath: "uploads/profilepic/",
    defaultPicFolderPath: "images/",
    bannerImageFolder: "src/public/uploads/bannerimage/",
    showBannerPicFolderPath: "uploads/bannerimage/",
    defaultPicFolderPath: "images/",
    cmsPicFolder: "src/public/uploads/cmsPic/",
    showCmsPicFolderPath: "uploads/cmsPic/",
    venuePicFolder: "src/public/uploads/venuePic/",
    showVenuePicFolderPath: "uploads/venuePic/",
    showVendorPicFolderPath:'uploads/vendorpic/',
    decorPicFolder: "src/public/uploads/decorPic/",
    showDecorPicFolderPath: "uploads/decorPic/",
    venueVideoFolder: "src/public/uploads/venueVideo/",
    showVenueVideoFolderPath: "uploads/venueVideo/",
    categoryPicFolder: "src/public/uploads/categoryPic/",
    showCategoryPicFolderPath: "uploads/categoryPic/",
    portfolioPicFolder: "src/public/uploads/portfolioPic/",
    showPortfolioPicFolderPath: "uploads/portfolioPic/",
    venueCSVFolder: "src/public/uploads/venueCsv/",
    showPortfolioPicFolderPath: "uploads/venueCsv/",
    menuPDFFolder: "src/public/uploads/menus/",
    showMenuPDFPath: "uploads/menus/",
  },
  logger: {
    console: {
      level: process.env.LOG_LEVEL || "info",
    },
    file: {
      logDir: "logs",
      logFile: "info_node.log",
      level: process.env.LOG_LEVEL || "info",
      maxsize: 1024 * 1024 * 10, // 10MB
      maxFiles: 5,
    },
  },
  errorLogger: {
    console: {
      level: "error",
    },
    file: {
      logDir: "logs",
      logFile: "error_node.log",
      level: "error",
      maxsize: 1024 * 1024 * 10, // 10MB
      maxFiles: 5,
    },
  },
  sms: {
    smsapi: process.env.SMS_API_URL || "https://api2.nexgplatforms.com/sms/1/text/query",
    username: process.env.SMS_USERNAME || "EzyvnuGuiT",
    password: process.env.SMS_PASSWORD || "Anchal@123",
    from: process.env.SMS_FROM || "EZYVNU",
    indiaDltContentTemplateId: process.env.SMS_DLT_TEMPLATE_ID || "1207168932394709023",
    indiaDltPrincipalEntityId: process.env.SMS_DLT_ENTITY_ID || "1201166521573805146",
  },
  security: {
    corsOrigins: [
      process.env.FRONTEND_DOMAIN || 'https://eazyvenue.in',
      'https://www.eazyvenue.in',
      'https://eazyvenue.com',
      'https://www.eazyvenue.com'
    ],
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 1000 // limit each IP to requests per windowMs
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          fontSrc: ["'self'", "https:", "data:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  }
};

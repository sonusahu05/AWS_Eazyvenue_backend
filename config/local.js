module.exports = {
  api: {
    port: 3006,
    root: "/api",
  },
  frontEnd: {
        // Use production server for images since that's where they're stored
        domain: 'http://localhost:4200',
        picPath: 'https://api.eazyvenue.com'
    },
  auth: {
    jwt: {
      accessTokenSecret:
        "A78D2E0F6823BF1F437C3E2B64D7D6C5098407C8B21D92E12D62B43527E00A97",
      refreshTokenSecret:
        "y6DNKhzqRdGthMBDsYclOUcCGenNZ42GKqi7Vh17wvJDRggK8eUGD7j4H9swh2G",
      accessTokenLife: 75600,
      refreshTokenLife: 2592000,
    },
    resetPassword: {
      secret: "56gXxY{+D6/4m#kZ394j2=bT2eHqTAu>r8zAT>yEn:;TM#9*Vg",
      ttl: 86400 * 1000, // 1 day
      algorithm: "aes256",
      inputEncoding: "utf8",
      outputEncoding: "hex",
    },
  },
  db: {
    url: "mongodb://admin:Pass_9702@160.153.173.104:27017/admin",
    name: "admin",
  },
  payment: {
    liveKey: 'rzp_live_oyCHow0OxfS8oL',
    liveSecret: 'epGc231JkMUV7jlaJ3NpKO9e',
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
  },
  sms: {
    smsapi: "https://api2.nexgplatforms.com/sms/1/text/query",
    username: "EzyvnuGuiT",
    password: "Anchal@123",
    from: "EZYVNU",
    indiaDltContentTemplateId: "1207168932394709023",
    indiaDltPrincipalEntityId: "1201166521573805146",
  },
  frontUrl: "http://localhost:3000",
  testMode: true,
  logger: {
    file: {
      logDir: "logs",
      logFile: "app.log",
    },
    console: {
      level: "debug",
    },
  },
  errorLogger: {
    file: {
      logDir: "logs",
      logFile: "error.log",
    },
    console: {
      level: "error",
    },
  },
  mail: {
    smtp: {
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "test@example.com",
        pass: "testpass",
      },
    },
    fromAddress: "test@example.com",
  },
};

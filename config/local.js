module.exports = {
  api: {
    port: 3006,
    root: "/api",
  },
  frontEnd: {
    domain: "http://localhost:3000", // local
    picPath: "http://localhost:3006", // local
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
    url: "mongodb://localhost:27017/eazyvenue_test",
    name: "eazyvenue_test",
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

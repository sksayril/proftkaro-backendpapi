var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');
const { encryptPassword, decryptPassword, comparePassword } = require('../utilities/crypto');
const multer = require('multer');
const mongoose = require('mongoose');
const { uploadToS3, uploadBase64ToS3 } = require('../utilities/s3Upload');

// Configure multer for memory storage (we'll upload directly to S3)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

let userModel = require('../models/user.model')
let captchaSettingsModel = require('../models/captchaSettings.model')
let captchaSolveModel = require('../models/captchaSolve.model')
let referralSettingsModel = require('../models/referralSettings.model')
let dailyBonusSettingsModel = require('../models/dailyBonusSettings.model')
let dailyBonusClaimModel = require('../models/dailyBonusClaim.model')
let dailySpinSettingsModel = require('../models/dailySpinSettings.model')
let dailySpinUsageModel = require('../models/dailySpinUsage.model')
let withdrawalRequestModel = require('../models/withdrawalRequest.model')
let appModel = require('../models/app.model')
let appInstallationSubmissionModel = require('../models/appInstallationSubmission.model')
let coinConversionSettingsModel = require('../models/coinConversionSettings.model')
let scratchCardSettingsModel = require('../models/scratchCardSettings.model')
let scratchCardClaimModel = require('../models/scratchCardClaim.model')
let withdrawalSettingsModel = require('../models/withdrawalSettings.model')

// Function to generate unique referCode (format: PRK08F9 - 3 letters + 2 digits + 1 letter)
function generateReferCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  let code = '';
  // First 3 letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // 2 digits
  for (let i = 0; i < 2; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  // Last letter
  code += letters.charAt(Math.floor(Math.random() * letters.length));
  
  return code;
}

// User Signup API
router.post('/signup', async (req, res) => {
  try {
    let { MobileNumber, Password, DeviceId, ReferralCode } = req.body
    
    // Validate required fields
    if (!MobileNumber || !Password) {
      return res.status(400).json({
        message: "MobileNumber and Password are required"
      })
    }

    // Validate DeviceId is required
    if (!DeviceId || typeof DeviceId !== 'string' || DeviceId.trim().length === 0) {
      return res.status(400).json({
        message: "DeviceId is required"
      })
    }

    // Validate MobileNumber format (basic validation)
    if (typeof MobileNumber !== 'string' || MobileNumber.trim().length === 0) {
      return res.status(400).json({
        message: "MobileNumber must be a valid string"
      })
    }

    // Validate Password strength (minimum length)
    if (typeof Password !== 'string' || Password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long"
      })
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Signup Error: Database not connected');
      return res.status(500).json({
        message: "Database connection error. Please try again later."
      })
    }

    // Check if mobile number already exists
    let checkMobile = await userModel.findOne({ MobileNumber: MobileNumber.trim() })
    if (checkMobile) {
      return res.status(400).json({
        message: "User with this MobileNumber already exists"
      })
    }

    // Check if DeviceId already exists (one device per user)
    let checkDevice = await userModel.findOne({ DeviceId: DeviceId.trim() })
    if (checkDevice) {
      return res.status(400).json({
        message: "DeviceId already registered. This device is already associated with another account."
      })
    }

    // Encrypt password using crypto-js
    let encryptedPassword;
    try {
      encryptedPassword = encryptPassword(Password);
    } catch (encryptError) {
      console.error('Signup Error - Password encryption failed:', encryptError);
      return res.status(500).json({
        message: "Failed to process password. Please try again."
      })
    }

    // Validate referral code if provided
    let referredBy = null;
    let referrer = null;
    if (ReferralCode) {
      if (typeof ReferralCode !== 'string' || ReferralCode.trim().length === 0) {
        return res.status(400).json({
          message: "Invalid Referral Code format"
        })
      }
      try {
        referrer = await userModel.findOne({ ReferCode: ReferralCode.trim() })
        if (!referrer) {
          return res.status(400).json({
            message: "Invalid Referral Code"
          })
        }
        referredBy = ReferralCode.trim();
      } catch (referralError) {
        console.error('Signup Error - Referral code validation failed:', referralError);
        return res.status(500).json({
          message: "Failed to validate referral code. Please try again."
        })
      }
    }

    // Generate unique referCode with retry limit to prevent infinite loop
    let referCode;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 50; // Prevent infinite loop
    
    while (!isUnique && attempts < maxAttempts) {
      referCode = generateReferCode();
      try {
        let checkReferCode = await userModel.findOne({ ReferCode: referCode })
        if (!checkReferCode) {
          isUnique = true;
        }
      } catch (checkError) {
        console.error('Signup Error - Refer code check failed:', checkError);
        return res.status(500).json({
          message: "Failed to generate referral code. Please try again."
        })
      }
      attempts++;
    }

    if (!isUnique) {
      console.error('Signup Error: Failed to generate unique refer code after', maxAttempts, 'attempts');
      return res.status(500).json({
        message: "Failed to generate unique referral code. Please try again."
      })
    }

    // Get referral settings
    let referralSettings = null;
    try {
      referralSettings = await referralSettingsModel.findOne()
      if (!referralSettings) {
        // Create default settings if not exists
        try {
          referralSettings = await referralSettingsModel.create({
            RewardForNewUser: 0,
            RewardForReferrer: 0,
            RewardType: 'Coins'
          })
        } catch (createError) {
          // If create fails (e.g., duplicate key), try to find again
          console.warn('Signup Warning - Failed to create referral settings, trying to find again:', createError.message);
          referralSettings = await referralSettingsModel.findOne()
          if (!referralSettings) {
            // Use default values if still not found
            referralSettings = {
              RewardForNewUser: 0,
              RewardForReferrer: 0,
              RewardType: 'Coins'
            }
          }
        }
      }
    } catch (settingsError) {
      // If settings fetch/create fails, use default values
      console.warn('Signup Warning - Failed to fetch referral settings, using defaults:', settingsError.message);
      referralSettings = {
        RewardForNewUser: 0,
        RewardForReferrer: 0,
        RewardType: 'Coins'
      }
    }

    // Calculate initial rewards for new user
    let initialCoins = 0;
    let initialWalletBalance = 0;
    if (referrer && referralSettings && referralSettings.RewardForNewUser > 0) {
      if (referralSettings.RewardType === 'Coins') {
        initialCoins = referralSettings.RewardForNewUser;
      } else {
        initialWalletBalance = referralSettings.RewardForNewUser;
      }
    }

    // Create user
    let User_data;
    try {
      User_data = await userModel.create({
        MobileNumber: MobileNumber.trim(),
        Password: encryptedPassword,
        DeviceId: DeviceId.trim(),
        ReferCode: referCode,
        ReferredBy: referredBy,
        Coins: initialCoins,
        WalletBalance: initialWalletBalance,
        SignupTime: new Date()
      })
    } catch (createError) {
      console.error('Signup Error - User creation failed:', createError);
      
      // Handle duplicate key errors
      if (createError.code === 11000) {
        const field = Object.keys(createError.keyPattern)[0];
        if (field === 'MobileNumber') {
          return res.status(400).json({
            message: "User with this MobileNumber already exists"
          })
        } else if (field === 'ReferCode') {
          // Retry with new refer code (shouldn't happen, but handle it)
          return res.status(500).json({
            message: "Failed to create user. Please try again."
          })
        }
      }
      
      // Handle validation errors
      if (createError.name === 'ValidationError') {
        const errors = Object.values(createError.errors).map(err => err.message).join(', ');
        return res.status(400).json({
          message: "Validation error: " + errors
        })
      }
      
      throw createError; // Re-throw to be caught by outer catch
    }

    // Give reward to referrer if referral code was used
    if (referrer && referralSettings && referralSettings.RewardForReferrer > 0) {
      try {
        if (referralSettings.RewardType === 'Coins') {
          referrer.Coins = (referrer.Coins || 0) + referralSettings.RewardForReferrer;
        } else {
          referrer.WalletBalance = (referrer.WalletBalance || 0) + referralSettings.RewardForReferrer;
        }
        await referrer.save();
      } catch (referrerError) {
        // Log error but don't fail user creation if referrer update fails
        console.error('Error updating referrer rewards:', referrerError);
      }
    }
    
    // Generate JWT token with 30 days expiration
    const token = jwt.sign(
      { 
        id: User_data._id,
        MobileNumber: User_data.MobileNumber 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    )
    
    // Remove password from response for security
    const userResponse = User_data.toObject();
    delete userResponse.Password;
    
    return res.json({
      message: "User Created Successfully",
      data: userResponse,
      token: token
    })

  } catch (err) {
    console.error('Signup Error:', err);
    console.error('Signup Error Stack:', err.stack);
    console.error('Signup Error Details:', {
      name: err.name,
      message: err.message,
      code: err.code,
      keyPattern: err.keyPattern,
      errors: err.errors
    });
    
    // Don't expose internal error details in production
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? "Internal Server Error. Please try again later." 
      : err.message;
    
    return res.status(500).json({
      message: "Internal Server Error",
      error: errorMessage
    })
  }
})

// User Login API
router.post('/login', async (req, res) => {
  try {
    let { MobileNumber, Password, DeviceId } = req.body
    
    if (!MobileNumber || !Password) {
      return res.status(400).json({
        message: "MobileNumber and Password are required"
      })
    }

    // Validate DeviceId is required
    if (!DeviceId || typeof DeviceId !== 'string' || DeviceId.trim().length === 0) {
      return res.status(400).json({
        message: "DeviceId is required"
      })
    }

    let user = await userModel.findOne({ MobileNumber: MobileNumber })
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Verify password using crypto-js decryption
    const isPasswordValid = comparePassword(Password, user.Password)
    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid password"
      })
    }

    // Verify DeviceId matches the user's registered device
    if (user.DeviceId !== DeviceId.trim()) {
      return res.status(403).json({
        message: "Device ID mismatch. You can only login from your registered device."
      })
    }

    // Check if user is blocked
    if (user.IsBlocked === true) {
      return res.status(403).json({
        message: "Your account has been blocked",
        isBlocked: true,
        blockedAt: user.BlockedAt,
        blockedReason: user.BlockedReason || "Account blocked by administrator"
      })
    }

    // Update LastLoginTime
    user.LastLoginTime = new Date()
    await user.save()

    // Generate JWT token with 30 days expiration
    const token = jwt.sign(
      { 
        id: user._id,
        MobileNumber: user.MobileNumber 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    )

    return res.json({
      message: "Login Successful",
      data: {
        MobileNumber: user.MobileNumber,
        DeviceId: user.DeviceId,
        ReferCode: user.ReferCode,
        Coins: user.Coins || 0,
        WalletBalance: user.WalletBalance || 0,
        _id: user._id,
        LastLoginTime: user.LastLoginTime,
        isBlocked: user.IsBlocked || false
      },
      token: token
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Middleware to verify JWT token and check if user is blocked
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization
  
  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided."
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    req.user = decoded
    
    // Check if user is blocked
    const user = await userModel.findById(decoded.id)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }
    
    if (user.IsBlocked === true) {
      return res.status(403).json({
        message: "Your account has been blocked",
        isBlocked: true,
        blockedAt: user.BlockedAt,
        blockedReason: user.BlockedReason || "Account blocked by administrator"
      })
    }
    
    next()
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    })
  }
}

// Get User Profile API
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    return res.json({
      message: "User profile retrieved successfully",
      data: {
        userId: user._id,
        mobileNumber: user.MobileNumber,
        deviceId: user.DeviceId,
        referCode: user.ReferCode,
        coins: user.Coins || 0,
        walletBalance: user.WalletBalance || 0,
        referredBy: user.ReferredBy || null,
        isBlocked: user.IsBlocked || false,
        blockedAt: user.BlockedAt || null,
        blockedReason: user.BlockedReason || null,
        signupTime: user.SignupTime,
        lastLoginTime: user.LastLoginTime,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get User Wallet Balance and Coins API
router.get('/wallet', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    return res.json({
      message: "Wallet details retrieved successfully",
      data: {
        Coins: user.Coins || 0,
        WalletBalance: user.WalletBalance || 0,
        MobileNumber: user.MobileNumber
      }
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Add Coins to User Wallet API
router.post('/addcoins', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { Coins } = req.body
    
    // Validate required fields
    if (Coins === undefined || Coins === null) {
      return res.status(400).json({
        message: "Coins is required"
      })
    }

    // Validate coins value
    if (typeof Coins !== 'number' || isNaN(Coins)) {
      return res.status(400).json({
        message: "Coins must be a valid number"
      })
    }

    if (Coins <= 0) {
      return res.status(400).json({
        message: "Coins must be greater than 0"
      })
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Add Coins Error: Database not connected');
      return res.status(500).json({
        message: "Database connection error. Please try again later."
      })
    }

    // Find user
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get current coins balance
    const currentCoins = user.Coins || 0
    
    // Add coins to user's wallet
    user.Coins = currentCoins + Coins
    await user.save()

    // Refresh user data to get latest values
    user = await userModel.findById(userId)

    return res.json({
      message: "Coins added successfully",
      data: {
        coinsAdded: Coins,
        previousCoins: currentCoins,
        currentCoins: user.Coins || 0,
        walletBalance: user.WalletBalance || 0,
        MobileNumber: user.MobileNumber
      }
    })

  } catch (err) {
    console.error('Add Coins Error:', err);
    console.error('Add Coins Error Stack:', err.stack);
    return res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'production' 
        ? "Failed to add coins. Please try again later." 
        : err.message
    })
  }
})

// Add RS (Rupees) to User WalletBalance API
router.post('/addwallet', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { Amount } = req.body

    // Validate required fields
    if (Amount === undefined || Amount === null) {
      return res.status(400).json({
        message: "Amount is required"
      })
    }

    // Validate amount value
    if (typeof Amount !== 'number' || isNaN(Amount)) {
      return res.status(400).json({
        message: "Amount must be a valid number"
      })
    }

    if (Amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      })
    }

    // Check database connection
    if (mongoose.connection.readyState !== 1) {
      console.error('Add Wallet Error: Database not connected');
      return res.status(500).json({
        message: "Database connection error. Please try again later."
      })
    }

    // Find user
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    const previousWalletBalance = user.WalletBalance || 0
    user.WalletBalance = previousWalletBalance + Amount
    await user.save()

    // Refresh
    user = await userModel.findById(userId)

    return res.json({
      message: "Wallet balance added successfully",
      data: {
        amountAdded: Amount,
        previousWalletBalance: previousWalletBalance,
        currentWalletBalance: user.WalletBalance || 0,
        coins: user.Coins || 0,
        MobileNumber: user.MobileNumber
      }
    })
  } catch (err) {
    console.error('Add Wallet Error:', err);
    console.error('Add Wallet Error Stack:', err.stack);
    return res.status(500).json({
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'production'
        ? "Failed to add wallet balance. Please try again later."
        : err.message
    })
  }
})

// Get User Refer Code API
router.get('/refercode', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Count how many users have joined using this referral code
    const referralCount = await userModel.countDocuments({ ReferredBy: user.ReferCode })

    // Get referral settings to calculate total earnings
    let referralSettings = null;
    try {
      referralSettings = await referralSettingsModel.findOne()
    } catch (settingsError) {
      // If settings fetch fails, use default values
      referralSettings = {
        RewardForReferrer: 0,
        RewardType: 'Coins'
      }
    }

    // Calculate total earnings from referrals
    const rewardPerReferral = referralSettings ? (referralSettings.RewardForReferrer || 0) : 0;
    const totalEarnings = referralCount * rewardPerReferral;
    const rewardType = referralSettings ? (referralSettings.RewardType || 'Coins') : 'Coins';

    return res.json({
      message: "Refer code retrieved successfully",
      data: {
        ReferCode: user.ReferCode,
        MobileNumber: user.MobileNumber,
        ReferralCount: referralCount,
        TotalEarnings: totalEarnings,
        RewardType: rewardType,
        RewardPerReferral: rewardPerReferral
      }
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Function to generate captcha (format: 3 letters + 2 digits, e.g., ABC12)
function generateCaptcha() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  
  let captcha = '';
  // First 3 letters
  for (let i = 0; i < 3; i++) {
    captcha += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // 2 digits
  for (let i = 0; i < 2; i++) {
    captcha += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  
  return captcha;
}

// Get Captcha API
router.get('/captcha', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Generate captcha
    const captcha = generateCaptcha()

    return res.json({
      message: "Captcha generated successfully",
      data: {
        Captcha: captcha
      }
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Solve Captcha API
router.post('/captcha/solve', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { Captcha } = req.body
    
    if (!Captcha) {
      return res.status(400).json({
        message: "Captcha is required"
      })
    }

    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get captcha settings
    let settings = await captchaSettingsModel.findOne()
    if (!settings) {
      // Create default settings if not exists
      settings = await captchaSettingsModel.create({
        DailyCaptchaLimit: 10,
        RewardPerCaptcha: 1,
        RewardType: 'Coins'
      })
    }

    // Check today's captcha solves count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaySolves = await captchaSolveModel.countDocuments({
      UserId: userId,
      SolveDate: {
        $gte: today,
        $lt: tomorrow
      }
    })

    if (todaySolves >= settings.DailyCaptchaLimit) {
      return res.status(400).json({
        message: `Daily captcha limit reached. You can solve ${settings.DailyCaptchaLimit} captchas per day.`
      })
    }

    // Validate captcha format (3 letters + 2 digits)
    const captchaPattern = /^[A-Z]{3}[0-9]{2}$/
    if (!captchaPattern.test(Captcha)) {
      return res.status(400).json({
        message: "Invalid captcha format. Should be 3 letters followed by 2 digits (e.g., ABC12)"
      })
    }

    // Add reward to user
    if (settings.RewardType === 'Coins') {
      user.Coins = (user.Coins || 0) + settings.RewardPerCaptcha
    } else if (settings.RewardType === 'WalletBalance') {
      user.WalletBalance = (user.WalletBalance || 0) + settings.RewardPerCaptcha
    }
    await user.save()

    // Record captcha solve
    await captchaSolveModel.create({
      UserId: userId,
      SolveDate: new Date(),
      RewardAmount: settings.RewardPerCaptcha,
      RewardType: settings.RewardType
    })

    return res.json({
      message: "Captcha solved successfully",
      data: {
        RewardAmount: settings.RewardPerCaptcha,
        RewardType: settings.RewardType,
        TodaySolves: todaySolves + 1,
        DailyLimit: settings.DailyCaptchaLimit,
        Coins: user.Coins,
        WalletBalance: user.WalletBalance
      }
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Helper function to get start of week (Monday) normalized to midnight
function getWeekStartDate(date = new Date()) {
  const d = new Date(date)
  // Set to midnight to ensure consistent date comparison
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff))
  // Ensure it's set to midnight
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// Helper function to get day name
function getDayName(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

// Get All Daily Bonuses API
router.get('/dailybonus', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get daily bonus settings
    let bonusSettings = await dailyBonusSettingsModel.findOne()
    if (!bonusSettings) {
      bonusSettings = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0,
        RewardType: 'Coins'
      }
    }

    // Get current week start date (normalized to midnight for consistent comparison)
    const weekStart = getWeekStartDate()
    
    // Get claim tracking for this week (don't create if doesn't exist - only read)
    // Use date range query to handle any timezone or precision issues
    const weekStartStart = new Date(weekStart)
    weekStartStart.setHours(0, 0, 0, 0)
    const weekStartEnd = new Date(weekStart)
    weekStartEnd.setHours(23, 59, 59, 999)
    
    let claimTracking = await dailyBonusClaimModel.findOne({
      UserId: userId,
      WeekStartDate: {
        $gte: weekStartStart,
        $lte: weekStartEnd
      }
    })

    // If no tracking exists, all days are unclaimed
    if (!claimTracking) {
      claimTracking = {
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false
      }
    }

    // Build response with all days
    const currentDay = getDayName()
    const bonuses = [
      {
        day: 'Monday',
        amount: bonusSettings.Monday,
        claimed: claimTracking.Monday,
        isToday: currentDay === 'Monday'
      },
      {
        day: 'Tuesday',
        amount: bonusSettings.Tuesday,
        claimed: claimTracking.Tuesday,
        isToday: currentDay === 'Tuesday'
      },
      {
        day: 'Wednesday',
        amount: bonusSettings.Wednesday,
        claimed: claimTracking.Wednesday,
        isToday: currentDay === 'Wednesday'
      },
      {
        day: 'Thursday',
        amount: bonusSettings.Thursday,
        claimed: claimTracking.Thursday,
        isToday: currentDay === 'Thursday'
      },
      {
        day: 'Friday',
        amount: bonusSettings.Friday,
        claimed: claimTracking.Friday,
        isToday: currentDay === 'Friday'
      },
      {
        day: 'Saturday',
        amount: bonusSettings.Saturday,
        claimed: claimTracking.Saturday,
        isToday: currentDay === 'Saturday'
      },
      {
        day: 'Sunday',
        amount: bonusSettings.Sunday,
        claimed: claimTracking.Sunday,
        isToday: currentDay === 'Sunday'
      }
    ]

    return res.json({
      message: "Daily bonuses retrieved successfully",
      data: {
        bonuses: bonuses,
        rewardType: bonusSettings.RewardType,
        weekStartDate: weekStart,
        currentDay: currentDay,
        totalCoins: user.Coins || 0,
        totalWalletBalance: user.WalletBalance || 0
      }
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Claim Daily Bonus API
router.post('/dailybonus/claim', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    console.log('Daily Bonus Claim - User ID:', userId)
    
    let user = await userModel.findById(userId)
    if (!user) {
      console.error('Daily Bonus Claim - User not found:', userId)
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get daily bonus settings
    let bonusSettings = await dailyBonusSettingsModel.findOne()
    if (!bonusSettings) {
      console.error('Daily Bonus Claim - Settings not found')
      return res.status(400).json({
        message: "Daily bonus settings not configured"
      })
    }
    console.log('Daily Bonus Claim - Settings found:', bonusSettings)

    // Get current day
    const currentDay = getDayName()
    const dayField = currentDay // Model uses capitalized day names (Monday, Tuesday, etc.)
    console.log('Daily Bonus Claim - Current day:', currentDay, 'Field:', dayField)

    // Get current week start date (normalized to midnight for consistent comparison)
    const weekStart = getWeekStartDate()
    console.log('Daily Bonus Claim - Week start:', weekStart)
    console.log('Daily Bonus Claim - Week start ISO:', weekStart.toISOString())
    
    // Get bonus amount for today
    const bonusAmount = bonusSettings[currentDay]
    console.log('Daily Bonus Claim - Bonus amount:', bonusAmount)
    
    if (bonusAmount <= 0) {
      console.error('Daily Bonus Claim - No bonus available for:', currentDay)
      return res.status(400).json({
        message: `No bonus available for ${currentDay}`
      })
    }

    // Use atomic operation to prevent multiple claims
    // Strategy: Use findOneAndUpdate with condition that day is NOT true
    // This ensures only one request can successfully claim per day
    console.log('Daily Bonus Claim - Attempting atomic update:', {
      UserId: userId,
      WeekStartDate: weekStart,
      dayField: dayField
    })
    
    let updatedTracking
    try {
      // Build the update object - set current day to true
      const updateField = {}
      updateField[dayField] = true
      
      // Build default days for $setOnInsert (only for days that are NOT the current day)
      // This avoids MongoDB conflict error
      const setOnInsertFields = {}
      const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      allDays.forEach(day => {
        if (day !== dayField) {
          setOnInsertFields[day] = false
        }
      })
      
      // Use findOneAndUpdate with condition to atomically update
      // Query: Find by UserId and WeekStartDate, and ensure the day field is NOT true
      // Using $ne: true to match documents where day is false or doesn't exist
      // This prevents updating if already claimed, and is atomic
      const queryCondition = {
        UserId: userId,
        WeekStartDate: weekStart,
        [dayField]: { $ne: true }  // Only match if day is not true (false or doesn't exist)
      }
      
      console.log('Daily Bonus Claim - Query condition:', JSON.stringify(queryCondition, null, 2))
      console.log('Daily Bonus Claim - Update field:', updateField)
      console.log('Daily Bonus Claim - SetOnInsert fields:', setOnInsertFields)
      
      updatedTracking = await dailyBonusClaimModel.findOneAndUpdate(
        queryCondition,
        {
          $set: {
            ...updateField,
            WeekStartDate: weekStart  // Ensure WeekStartDate is set correctly on upsert
          },
          $setOnInsert: setOnInsertFields
        },
        {
          upsert: true,
          new: true
        }
      )
      
      // If update returned null, it means the condition didn't match (day was already true)
      if (!updatedTracking) {
        console.error('Daily Bonus Claim - Update returned null, day already claimed')
        // Double-check by querying the database
        const checkTracking = await dailyBonusClaimModel.findOne({
          UserId: userId,
          WeekStartDate: weekStart
        })
        if (checkTracking && checkTracking[dayField] === true) {
          return res.status(400).json({
            message: `Daily bonus for ${currentDay} has already been claimed. You can only claim once per day.`
          })
        }
        return res.status(500).json({
          message: "Failed to claim daily bonus. Please try again."
        })
      }
      
      // Verify the day was actually set to true
      if (updatedTracking[dayField] !== true) {
        console.error('Daily Bonus Claim - Day field not set to true after update:', updatedTracking[dayField])
        // This shouldn't happen, but if it does, check if another request claimed it
        const checkTracking = await dailyBonusClaimModel.findOne({
          UserId: userId,
          WeekStartDate: weekStart
        })
        if (checkTracking && checkTracking[dayField] === true) {
          return res.status(400).json({
            message: `Daily bonus for ${currentDay} has already been claimed. You can only claim once per day.`
          })
        }
        return res.status(500).json({
          message: "Failed to claim daily bonus. Please try again."
        })
      }
      
      // Final verification: Double-check that the day was actually set to true
      // This is a safety check in case of race conditions
      const finalCheck = await dailyBonusClaimModel.findOne({
        UserId: userId,
        WeekStartDate: weekStart
      })
      
      if (!finalCheck || finalCheck[dayField] !== true) {
        console.error('Daily Bonus Claim - Final check failed. Day not set to true after update.')
        // Check if another request claimed it
        if (finalCheck && finalCheck[dayField] === true) {
          // This shouldn't happen, but if it does, it means another request claimed it
          return res.status(400).json({
            message: `Daily bonus for ${currentDay} has already been claimed. You can only claim once per day.`
          })
        }
        return res.status(500).json({
          message: "Failed to claim daily bonus. Please try again."
        })
      }
      
      console.log('Daily Bonus Claim - Successfully updated tracking record and verified')
    } catch (updateError) {
      console.error('Daily Bonus Claim - Update error:', updateError)
      console.error('Daily Bonus Claim - Update error stack:', updateError.stack)
      console.error('Daily Bonus Claim - Update error details:', {
        message: updateError.message,
        name: updateError.name,
        code: updateError.code,
        codeName: updateError.codeName
      })
      
      // If it's a conflict error or duplicate key, check if day is already claimed
      if (updateError.code === 40 || updateError.codeName === 'ConflictingUpdateOperators' || updateError.code === 11000) {
        const existingTracking = await dailyBonusClaimModel.findOne({
          UserId: userId,
          WeekStartDate: weekStart
        })
        
        if (existingTracking && existingTracking[dayField] === true) {
          return res.status(400).json({
            message: `Daily bonus for ${currentDay} has already been claimed. You can only claim once per day.`
          })
        }
      }
      
      throw updateError
    }

    // Final safety check: Verify one more time before applying reward
    // This prevents race conditions where multiple requests might have passed the atomic update
    const preRewardCheck = await dailyBonusClaimModel.findOne({
      UserId: userId,
      WeekStartDate: weekStart
    })
    
    if (!preRewardCheck || preRewardCheck[dayField] !== true) {
      console.error('Daily Bonus Claim - Pre-reward check failed. Day not claimed or already claimed by another request.')
      return res.status(400).json({
        message: `Daily bonus for ${currentDay} has already been claimed. You can only claim once per day.`
      })
    }

    console.log('Daily Bonus Claim - Adding reward to user:', {
      rewardType: bonusSettings.RewardType,
      amount: bonusAmount,
      currentCoins: user.Coins,
      currentWalletBalance: user.WalletBalance
    })

    // Add reward to user
    if (bonusSettings.RewardType === 'Coins') {
      user.Coins = (user.Coins || 0) + bonusAmount
    } else {
      user.WalletBalance = (user.WalletBalance || 0) + bonusAmount
    }
    await user.save()
    console.log('Daily Bonus Claim - User saved successfully')

    // Refresh user data to get latest values
    user = await userModel.findById(userId)
    console.log('Daily Bonus Claim - Final user balance:', {
      coins: user.Coins,
      walletBalance: user.WalletBalance
    })

    return res.json({
      message: `Daily bonus for ${currentDay} claimed successfully`,
      data: {
        day: currentDay,
        amount: bonusAmount,
        rewardType: bonusSettings.RewardType,
        coins: user.Coins || 0,
        walletBalance: user.WalletBalance || 0,
        totalCoins: user.Coins || 0,
        totalWalletBalance: user.WalletBalance || 0
      }
    })

  } catch (err) {
    console.error('Daily Bonus Claim - Error:', err)
    console.error('Daily Bonus Claim - Error stack:', err.stack)
    console.error('Daily Bonus Claim - Error details:', {
      message: err.message,
      name: err.name,
      code: err.code
    })
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Withdrawal Threshold API
router.get('/withdrawal/threshold', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get withdrawal settings
    let settings = await withdrawalSettingsModel.getSettings()

    return res.json({
      message: "Withdrawal threshold retrieved successfully",
      data: {
        minimumWithdrawalAmount: settings.MinimumWithdrawalAmount,
        currentWalletBalance: user.WalletBalance || 0,
        canWithdraw: (user.WalletBalance || 0) >= settings.MinimumWithdrawalAmount
      }
    })

  } catch (err) {
    console.error('Get Withdrawal Threshold - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Submit Withdrawal Request API
router.post('/withdrawal/request', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    const { Amount, PaymentMethod, UPIId, VirtualId, BankAccountNumber, BankIFSC, BankName, AccountHolderName } = req.body

    // Validate required fields
    if (!Amount || Amount <= 0) {
      return res.status(400).json({
        message: "Amount is required and must be greater than 0"
      })
    }

    if (!PaymentMethod || !['UPI', 'BankTransfer'].includes(PaymentMethod)) {
      return res.status(400).json({
        message: "PaymentMethod is required and must be either 'UPI' or 'BankTransfer'"
      })
    }

    // Get withdrawal settings and validate minimum withdrawal amount
    let withdrawalSettings = await withdrawalSettingsModel.getSettings()
    const minimumWithdrawalAmount = withdrawalSettings.MinimumWithdrawalAmount || 100
    
    if (Amount < minimumWithdrawalAmount) {
      return res.status(400).json({
        message: `Minimum withdrawal amount is ${minimumWithdrawalAmount}. You requested ${Amount}`
      })
    }

    // Validate wallet balance
    const currentWalletBalance = user.WalletBalance || 0
    if (currentWalletBalance < Amount) {
      return res.status(400).json({
        message: `Insufficient wallet balance. Available: ${currentWalletBalance}, Requested: ${Amount}`
      })
    }

    // Validate payment method specific fields
    if (PaymentMethod === 'UPI') {
      if (!UPIId && !VirtualId) {
        return res.status(400).json({
          message: "UPIId or VirtualId is required for UPI payment method"
        })
      }
    } else if (PaymentMethod === 'BankTransfer') {
      if (!BankAccountNumber || !BankIFSC || !BankName || !AccountHolderName) {
        return res.status(400).json({
          message: "BankAccountNumber, BankIFSC, BankName, and AccountHolderName are required for Bank Transfer"
        })
      }
    }

    // Check for pending withdrawal requests
    const pendingRequests = await withdrawalRequestModel.countDocuments({
      UserId: userId,
      Status: 'Pending'
    })

    if (pendingRequests > 0) {
      return res.status(400).json({
        message: "You have a pending withdrawal request. Please wait for it to be processed."
      })
    }

    // Create withdrawal request
    const withdrawalRequest = await withdrawalRequestModel.create({
      UserId: userId,
      Amount: Amount,
      PaymentMethod: PaymentMethod,
      UPIId: UPIId || null,
      VirtualId: VirtualId || null,
      BankAccountNumber: BankAccountNumber || null,
      BankIFSC: BankIFSC || null,
      BankName: BankName || null,
      AccountHolderName: AccountHolderName || null,
      Status: 'Pending'
    })

    // Deduct amount from wallet
    user.WalletBalance = currentWalletBalance - Amount
    await user.save()

    return res.json({
      message: "Withdrawal request submitted successfully",
      data: {
        requestId: withdrawalRequest._id,
        amount: withdrawalRequest.Amount,
        paymentMethod: withdrawalRequest.PaymentMethod,
        status: withdrawalRequest.Status,
        remainingWalletBalance: user.WalletBalance,
        createdAt: withdrawalRequest.createdAt
      }
    })

  } catch (err) {
    console.error('Withdrawal Request - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get User Withdrawal Requests API
router.get('/withdrawal/requests', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get all withdrawal requests for this user
    const requests = await withdrawalRequestModel.find({
      UserId: userId
    }).sort({ createdAt: -1 }).populate('UserId', 'MobileNumber')

    // Format response
    const formattedRequests = requests.map(req => ({
      requestId: req._id,
      amount: req.Amount,
      paymentMethod: req.PaymentMethod,
      upiId: req.UPIId,
      virtualId: req.VirtualId,
      bankAccountNumber: req.BankAccountNumber ? req.BankAccountNumber.replace(/\d(?=\d{4})/g, "*") : null, // Mask account number
      bankIFSC: req.BankIFSC,
      bankName: req.BankName,
      accountHolderName: req.AccountHolderName,
      status: req.Status,
      adminNotes: req.AdminNotes,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt
    }))

    return res.json({
      message: "Withdrawal requests retrieved successfully",
      data: {
        requests: formattedRequests,
        totalRequests: formattedRequests.length,
        currentWalletBalance: user.WalletBalance || 0
      }
    })

  } catch (err) {
    console.error('Get Withdrawal Requests - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== APP INSTALLATION APIs ====================

// Get All Available Apps API
router.get('/apps', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { filter, difficulty } = req.query
    
    // Build query - only show active apps
    let query = { Status: 'Active' }
    
    if (difficulty && ['Easiest', 'Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query.Difficulty = difficulty
    }

    let sortOptions = { createdAt: -1 } // Default: newest first
    
    // Apply filters
    if (filter === 'highest') {
      // Highest paying (highest reward coins)
      sortOptions = { RewardCoins: -1 }
    } else if (filter === 'easiest') {
      // Easiest apps first
      const difficultyOrder = { 'Easiest': 1, 'Easy': 2, 'Medium': 3, 'Hard': 4 }
      // We'll sort in memory for difficulty
    }

    let apps = await appModel.find(query).sort(sortOptions)

    // If sorting by easiest, sort in memory
    if (filter === 'easiest') {
      const difficultyOrder = { 'Easiest': 1, 'Easy': 2, 'Medium': 3, 'Hard': 4 }
      apps = apps.sort((a, b) => difficultyOrder[a.Difficulty] - difficultyOrder[b.Difficulty])
    }

    // Get user's submission status for each app
    const appsWithStatus = await Promise.all(apps.map(async (app) => {
      // Check if user has already submitted and been approved for this app
      const approvedSubmission = await appInstallationSubmissionModel.findOne({
        UserId: userId,
        AppId: app._id,
        Status: 'Approved'
      })

      // Check if user has pending submission
      const pendingSubmission = await appInstallationSubmissionModel.findOne({
        UserId: userId,
        AppId: app._id,
        Status: 'Pending'
      })

      // Check if user has rejected submission
      const rejectedSubmission = await appInstallationSubmissionModel.findOne({
        UserId: userId,
        AppId: app._id,
        Status: 'Rejected'
      })

      let userStatus = 'available' // available, pending, approved, rejected
      if (approvedSubmission) {
        userStatus = 'approved'
      } else if (pendingSubmission) {
        userStatus = 'pending'
      } else if (rejectedSubmission) {
        userStatus = 'rejected'
      }

      return {
        appId: app._id,
        appName: app.AppName,
        appImage: app.AppImage,
        appDownloadUrl: app.AppDownloadUrl,
        rewardCoins: app.RewardCoins,
        difficulty: app.Difficulty,
        description: app.Description,
        userStatus: userStatus, // available, pending, approved, rejected
        canSubmit: userStatus === 'available' || userStatus === 'rejected', // Can submit if available or previously rejected
        createdAt: app.createdAt
      }
    }))

    return res.json({
      message: "Apps retrieved successfully",
      data: {
        apps: appsWithStatus,
        totalApps: appsWithStatus.length,
        availableApps: appsWithStatus.filter(a => a.userStatus === 'available').length,
        pendingApps: appsWithStatus.filter(a => a.userStatus === 'pending').length,
        approvedApps: appsWithStatus.filter(a => a.userStatus === 'approved').length
      }
    })

  } catch (err) {
    console.error('Get Apps - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Submit App Installation API - Supports both file upload and base64
router.post('/apps/:appId/submit', verifyToken, upload.single('screenshot'), async (req, res) => {
  try {
    const userId = req.user.id
    const { appId } = req.params
    let screenshotUrl = null

    // Check if app exists and is active
    const app = await appModel.findById(appId)
    if (!app) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    if (app.Status !== 'Active') {
      return res.status(400).json({
        message: "This app is not available for installation"
      })
    }

    // Check if user already has an approved submission for this app
    const existingApproved = await appInstallationSubmissionModel.findOne({
      UserId: userId,
      AppId: appId,
      Status: 'Approved'
    })

    if (existingApproved) {
      return res.status(400).json({
        message: "You have already submitted and been approved for this app"
      })
    }

    // Check if user has a pending submission
    const existingPending = await appInstallationSubmissionModel.findOne({
      UserId: userId,
      AppId: appId,
      Status: 'Pending'
    })

    if (existingPending) {
      return res.status(400).json({
        message: "You already have a pending submission for this app. Please wait for admin approval."
      })
    }

    // Handle image upload - support both file upload and base64
    if (req.file) {
      // File upload via multipart/form-data
      try {
        const fileName = req.file.originalname || `screenshot-${Date.now()}.jpg`
        screenshotUrl = await uploadToS3(req.file.buffer, fileName, 'app-screenshots', req.file.mimetype)
      } catch (uploadError) {
        console.error('S3 Upload Error:', uploadError)
        return res.status(500).json({
          message: "Failed to upload screenshot to S3",
          error: uploadError.message
        })
      }
    } else if (req.body.screenshotBase64) {
      // Base64 image upload
      try {
        const fileName = req.body.fileName || `screenshot-${Date.now()}.jpg`
        screenshotUrl = await uploadBase64ToS3(req.body.screenshotBase64, fileName, 'app-screenshots')
      } catch (uploadError) {
        console.error('S3 Base64 Upload Error:', uploadError)
        return res.status(500).json({
          message: "Failed to upload screenshot to S3",
          error: uploadError.message
        })
      }
    } else if (req.body.ScreenshotUrl) {
      // Legacy support: Direct URL (for backward compatibility)
      screenshotUrl = req.body.ScreenshotUrl
    } else {
      return res.status(400).json({
        message: "Screenshot is required. Please provide either a file upload, base64 image, or ScreenshotUrl"
      })
    }

    if (!screenshotUrl) {
      return res.status(400).json({
        message: "Failed to process screenshot"
      })
    }

    // Create new submission with S3 URL
    const submission = await appInstallationSubmissionModel.create({
      UserId: userId,
      AppId: appId,
      ScreenshotUrl: screenshotUrl,
      Status: 'Pending'
    })

    // Populate to get app details
    await submission.populate('AppId', 'AppName AppImage RewardCoins')

    return res.json({
      message: "App installation submitted successfully. Please wait for admin approval.",
      data: {
        submissionId: submission._id,
        appName: submission.AppId.AppName,
        appImage: submission.AppId.AppImage,
        rewardCoins: submission.AppId.RewardCoins,
        screenshotUrl: submission.ScreenshotUrl,
        status: submission.Status,
        createdAt: submission.createdAt
      }
    })

  } catch (err) {
    console.error('Submit App Installation - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get User's App Installation History API
router.get('/apps/submissions', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { status } = req.query

    let query = { UserId: userId }
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.Status = status
    }

    const submissions = await appInstallationSubmissionModel.find(query)
      .populate('AppId', 'AppName AppImage RewardCoins Difficulty')
      .sort({ createdAt: -1 })

    const formattedSubmissions = submissions.map(sub => ({
      submissionId: sub._id,
      appId: sub.AppId._id,
      appName: sub.AppId.AppName,
      appImage: sub.AppId.AppImage,
      appRewardCoins: sub.AppId.RewardCoins,
      appDifficulty: sub.AppId.Difficulty,
      screenshotUrl: sub.ScreenshotUrl,
      status: sub.Status,
      adminNotes: sub.AdminNotes,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt
    }))

    // Calculate total earnings
    const approvedSubmissions = submissions.filter(s => s.Status === 'Approved')
    const totalEarnings = approvedSubmissions.reduce((sum, sub) => sum + (sub.AppId.RewardCoins || 0), 0)

    return res.json({
      message: "App installation submissions retrieved successfully",
      data: {
        submissions: formattedSubmissions,
        totalSubmissions: formattedSubmissions.length,
        pendingCount: formattedSubmissions.filter(s => s.status === 'Pending').length,
        approvedCount: formattedSubmissions.filter(s => s.status === 'Approved').length,
        rejectedCount: formattedSubmissions.filter(s => s.status === 'Rejected').length,
        totalEarnings: totalEarnings
      }
    })

  } catch (err) {
    console.error('Get User Submissions - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== COIN CONVERSION APIs ====================

// Get Coin Conversion Rate API
router.get('/coinconversion/rate', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get conversion settings
    let settings = await coinConversionSettingsModel.getSettings()

    // Calculate user's potential conversion
    const userCoins = user.Coins || 0
    const rupeesValue = userCoins / settings.CoinsPerRupee

    return res.json({
      message: "Coin conversion rate retrieved successfully",
      data: {
        coinsPerRupee: settings.CoinsPerRupee,
        minimumCoinsToConvert: settings.MinimumCoinsToConvert,
        userCoins: userCoins,
        rupeesValue: rupeesValue.toFixed(2),
        canConvert: userCoins >= settings.MinimumCoinsToConvert
      }
    })

  } catch (err) {
    console.error('Get Coin Conversion Rate - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Convert Coins to RS (Rupees) API
router.post('/coinconversion/convert', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { Coins } = req.body
    
    if (Coins === undefined || Coins === null) {
      return res.status(400).json({
        message: "Coins is required"
      })
    }

    if (Coins <= 0) {
      return res.status(400).json({
        message: "Coins must be greater than 0"
      })
    }

    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get conversion settings
    let settings = await coinConversionSettingsModel.getSettings()

    // Check minimum coins requirement
    if (Coins < settings.MinimumCoinsToConvert) {
      return res.status(400).json({
        message: `Minimum ${settings.MinimumCoinsToConvert} coins required to convert`
      })
    }

    // Check if user has enough coins
    const userCoins = user.Coins || 0
    if (userCoins < Coins) {
      return res.status(400).json({
        message: `Insufficient coins. You have ${userCoins} coins, but trying to convert ${Coins} coins`
      })
    }

    // Calculate rupees to add
    const rupeesToAdd = Coins / settings.CoinsPerRupee

    // Update user: deduct coins and add rupees to wallet
    user.Coins = userCoins - Coins
    user.WalletBalance = (user.WalletBalance || 0) + rupeesToAdd
    await user.save()

    return res.json({
      message: "Coins converted to RS successfully",
      data: {
        coinsConverted: Coins,
        rupeesAdded: rupeesToAdd.toFixed(2),
        remainingCoins: user.Coins,
        walletBalance: user.WalletBalance.toFixed(2),
        conversionRate: settings.CoinsPerRupee
      }
    })

  } catch (err) {
    console.error('Convert Coins to RS - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SCRATCH CARD APIs ====================

// Helper function to get start of week (Monday) normalized to midnight
function getWeekStartDate(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const weekStart = new Date(d.setDate(diff))
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// Helper function to get day name
function getDayName(date = new Date()) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[date.getDay()]
}

// Get Scratch Card Info API
router.get('/scratchcard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get scratch card settings
    let settings = await scratchCardSettingsModel.findOne()
    if (!settings) {
      settings = {
        Sunday: 0,
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        RewardType: 'Coins'
      }
    }

    // Get current week start date
    const weekStart = getWeekStartDate()
    const currentDay = getDayName()

    // Check if user has already claimed today's scratch card
    const todayClaim = await scratchCardClaimModel.findOne({
      UserId: userId,
      Day: currentDay,
      WeekStartDate: weekStart
    })

    const todayAmount = settings[currentDay] || 0
    const isClaimed = !!todayClaim
    const canClaim = !isClaimed && todayAmount > 0

    return res.json({
      message: "Scratch card info retrieved successfully",
      data: {
        currentDay: currentDay,
        todayAmount: todayAmount,
        rewardType: settings.RewardType,
        isClaimed: isClaimed,
        canClaim: canClaim,
        weekStartDate: weekStart,
        allDays: {
          Sunday: settings.Sunday,
          Monday: settings.Monday,
          Tuesday: settings.Tuesday,
          Wednesday: settings.Wednesday,
          Thursday: settings.Thursday,
          Friday: settings.Friday,
          Saturday: settings.Saturday
        }
      }
    })

  } catch (err) {
    console.error('Get Scratch Card Info - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Claim Scratch Card API
router.post('/scratchcard/claim', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get scratch card settings
    let settings = await scratchCardSettingsModel.findOne()
    if (!settings) {
      return res.status(400).json({
        message: "Scratch card settings not configured"
      })
    }

    // Get current day and week start
    const currentDay = getDayName()
    const weekStart = getWeekStartDate()

    // Get reward amount for today
    const rewardAmount = settings[currentDay] || 0

    if (rewardAmount <= 0) {
      return res.status(400).json({
        message: `No scratch card reward available for ${currentDay}`
      })
    }

    // Check if already claimed today
    const existingClaim = await scratchCardClaimModel.findOne({
      UserId: userId,
      Day: currentDay,
      WeekStartDate: weekStart
    })

    if (existingClaim) {
      return res.status(400).json({
        message: `Scratch card for ${currentDay} has already been claimed. You can only claim once per day.`
      })
    }

    // Use atomic operation to prevent duplicate claims
    let claimRecord
    try {
      claimRecord = await scratchCardClaimModel.create({
        UserId: userId,
        Day: currentDay,
        RewardAmount: rewardAmount,
        RewardType: settings.RewardType,
        WeekStartDate: weekStart
      })
    } catch (createError) {
      // If duplicate key error, it means another request claimed it
      if (createError.code === 11000) {
        return res.status(400).json({
          message: `Scratch card for ${currentDay} has already been claimed. You can only claim once per day.`
        })
      }
      throw createError
    }

    // Add reward to user
    if (settings.RewardType === 'Coins') {
      user.Coins = (user.Coins || 0) + rewardAmount
    } else {
      user.WalletBalance = (user.WalletBalance || 0) + rewardAmount
    }
    await user.save()

    // Refresh user data
    user = await userModel.findById(userId)

    return res.json({
      message: `Scratch card for ${currentDay} claimed successfully`,
      data: {
        day: currentDay,
        rewardAmount: rewardAmount,
        rewardType: settings.RewardType,
        coins: user.Coins || 0,
        walletBalance: user.WalletBalance || 0,
        claimedAt: claimRecord.createdAt
      }
    })

  } catch (err) {
    console.error('Claim Scratch Card - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get User's Scratch Card History API
router.get('/scratchcard/history', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { page = 1, limit = 50 } = req.query
    
    let user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get total count
    const totalClaims = await scratchCardClaimModel.countDocuments({ UserId: userId })

    // Get claims with pagination
    const claims = await scratchCardClaimModel.find({ UserId: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    const formattedClaims = claims.map(claim => ({
      claimId: claim._id,
      day: claim.Day,
      rewardAmount: claim.RewardAmount,
      rewardType: claim.RewardType,
      weekStartDate: claim.WeekStartDate,
      claimedAt: claim.createdAt
    }))

    // Calculate statistics
    const totalCoinsEarned = await scratchCardClaimModel.aggregate([
      { $match: { UserId: userId, RewardType: 'Coins' } },
      { $group: { _id: null, total: { $sum: '$RewardAmount' } } }
    ])
    const totalWalletEarned = await scratchCardClaimModel.aggregate([
      { $match: { UserId: userId, RewardType: 'WalletBalance' } },
      { $group: { _id: null, total: { $sum: '$RewardAmount' } } }
    ])

    return res.json({
      message: "Scratch card history retrieved successfully",
      data: {
        claims: formattedClaims,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalClaims / limitNum),
          totalClaims: totalClaims,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalClaims / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics: {
          totalCoinsEarned: totalCoinsEarned[0]?.total || 0,
          totalWalletEarned: totalWalletEarned[0]?.total || 0,
          totalClaims: totalClaims
        }
      }
    })

  } catch (err) {
    console.error('Get Scratch Card History - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== DAILY SPIN APIs ====================

// Get Daily Spin Status API
router.get('/dailyspin/status', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id

    const user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Get spin settings
    let settings = await dailySpinSettingsModel.findOne()
    if (!settings) {
      settings = { DailySpinLimit: 10 }
    }

    // Today range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Spins used today
    const todayAgg = await dailySpinUsageModel.aggregate([
      {
        $match: {
          UserId: user._id,
          SpinDate: { $gte: today, $lt: tomorrow }
        }
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$SpinCount', 0] } } } }
    ])
    const spinsUsedToday = todayAgg[0]?.total || 0

    const dailyLimit = settings.DailySpinLimit || 10
    const remainingToday = Math.max(dailyLimit - spinsUsedToday, 0)

    // Total spins (lifetime)
    const totalAgg = await dailySpinUsageModel.aggregate([
      { $match: { UserId: user._id } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$SpinCount', 0] } } } }
    ])
    const totalSpins = totalAgg[0]?.total || 0

    return res.json({
      message: "Daily spin status retrieved successfully",
      data: {
        dailySpinLimit: dailyLimit,
        spinsUsedToday: spinsUsedToday,
        spinsRemainingToday: remainingToday,
        totalSpins: totalSpins
      }
    })
  } catch (err) {
    console.error('Get Daily Spin Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Use Daily Spin API (consume spins)
router.post('/dailyspin/use', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { SpinCount } = req.body

    const user = await userModel.findById(userId)
    if (!user) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    const countToUse = SpinCount === undefined || SpinCount === null ? 1 : SpinCount
    if (typeof countToUse !== 'number' || isNaN(countToUse)) {
      return res.status(400).json({
        message: "SpinCount must be a valid number"
      })
    }
    if (!Number.isInteger(countToUse) || countToUse <= 0) {
      return res.status(400).json({
        message: "SpinCount must be a positive integer"
      })
    }

    // Get spin settings
    let settings = await dailySpinSettingsModel.findOne()
    if (!settings) {
      settings = { DailySpinLimit: 10 }
    }

    const dailyLimit = settings.DailySpinLimit || 10

    // Today range
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Spins used today
    const todayAgg = await dailySpinUsageModel.aggregate([
      {
        $match: {
          UserId: user._id,
          SpinDate: { $gte: today, $lt: tomorrow }
        }
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$SpinCount', 0] } } } }
    ])
    const spinsUsedToday = todayAgg[0]?.total || 0
    const remainingToday = Math.max(dailyLimit - spinsUsedToday, 0)

    if (countToUse > remainingToday) {
      return res.status(400).json({
        message: `Daily spin limit exceeded. Remaining spins today: ${remainingToday}`,
        data: {
          dailySpinLimit: dailyLimit,
          spinsUsedToday: spinsUsedToday,
          spinsRemainingToday: remainingToday
        }
      })
    }

    // Record usage (note down)
    await dailySpinUsageModel.create({
      UserId: user._id,
      SpinDate: new Date(),
      SpinCount: countToUse
    })

    // Recompute today usage after insert
    const afterAgg = await dailySpinUsageModel.aggregate([
      {
        $match: {
          UserId: user._id,
          SpinDate: { $gte: today, $lt: tomorrow }
        }
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$SpinCount', 0] } } } }
    ])
    const newUsedToday = afterAgg[0]?.total || (spinsUsedToday + countToUse)
    const newRemaining = Math.max(dailyLimit - newUsedToday, 0)

    // Total spins (lifetime)
    const totalAgg = await dailySpinUsageModel.aggregate([
      { $match: { UserId: user._id } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$SpinCount', 0] } } } }
    ])
    const totalSpins = totalAgg[0]?.total || 0

    return res.json({
      message: "Spin usage recorded successfully",
      data: {
        spinCountUsed: countToUse,
        dailySpinLimit: dailyLimit,
        spinsUsedToday: newUsedToday,
        spinsRemainingToday: newRemaining,
        totalSpins: totalSpins
      }
    })
  } catch (err) {
    console.error('Use Daily Spin - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== LEADERBOARD APIs ====================

// Get Users Leaderboard API (Top Wallet Balance)
router.get('/leaderboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id
    const { type = 'wallet', limit = 100, page = 1 } = req.query
    
    // Validate user exists
    let currentUser = await userModel.findById(userId)
    if (!currentUser) {
      return res.status(404).json({
        message: "User Not Found"
      })
    }

    // Validate type
    const validTypes = ['wallet', 'coins']
    const leaderboardType = validTypes.includes(type) ? type : 'wallet'
    
    // Validate limit and page
    const limitNum = Math.min(parseInt(limit) || 100, 500) // Max 500
    const pageNum = Math.max(parseInt(page) || 1, 1)
    const skip = (pageNum - 1) * limitNum

    // Build sort criteria based on type
    let sortCriteria = {}
    if (leaderboardType === 'wallet') {
      sortCriteria = { WalletBalance: -1, Coins: -1 } // Sort by wallet balance, then coins
    } else {
      sortCriteria = { Coins: -1, WalletBalance: -1 } // Sort by coins, then wallet balance
    }

    // Get total count for pagination
    const totalUsers = await userModel.countDocuments({ IsBlocked: { $ne: true } })

    // Get leaderboard users (exclude blocked users)
    const leaderboardUsers = await userModel.find({ IsBlocked: { $ne: true } })
      .sort(sortCriteria)
      .skip(skip)
      .limit(limitNum)
      .select('ReferCode Coins WalletBalance')

    // Format leaderboard data - only rank, referCode, coins, walletBalance
    const leaderboard = leaderboardUsers.map((user, index) => ({
      rank: skip + index + 1,
      referCode: user.ReferCode,
      coins: user.Coins || 0,
      walletBalance: user.WalletBalance || 0
    }))

    // Find current user's rank
    let userRank = null
    let userPosition = null
    
    if (leaderboardType === 'wallet') {
      // Count users with higher wallet balance
      const usersAbove = await userModel.countDocuments({
        $or: [
          { WalletBalance: { $gt: currentUser.WalletBalance || 0 } },
          {
            WalletBalance: currentUser.WalletBalance || 0,
            Coins: { $gt: currentUser.Coins || 0 }
          }
        ],
        IsBlocked: { $ne: true }
      })
      userRank = usersAbove + 1
    } else {
      // Count users with higher coins
      const usersAbove = await userModel.countDocuments({
        $or: [
          { Coins: { $gt: currentUser.Coins || 0 } },
          {
            Coins: currentUser.Coins || 0,
            WalletBalance: { $gt: currentUser.WalletBalance || 0 }
          }
        ],
        IsBlocked: { $ne: true }
      })
      userRank = usersAbove + 1
    }

    // Check if current user is in the current page
    const currentUserInLeaderboard = leaderboard.find(u => u.referCode === currentUser.ReferCode)
    if (currentUserInLeaderboard) {
      userPosition = currentUserInLeaderboard.rank
    }

    // Get current user's stats - only rank, referCode, coins, walletBalance
    const currentUserStats = {
      rank: userRank,
      referCode: currentUser.ReferCode,
      coins: currentUser.Coins || 0,
      walletBalance: currentUser.WalletBalance || 0
    }

    return res.json({
      message: "Leaderboard retrieved successfully",
      data: {
        type: leaderboardType,
        leaderboard: leaderboard,
        currentUser: currentUserStats,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers: totalUsers,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrevPage: pageNum > 1
        },
        userRank: userRank,
        userInCurrentPage: userPosition !== null
      }
    })

  } catch (err) {
    console.error('Get Leaderboard - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Top Users by Wallet Balance API (Public - No Auth Required)
router.get('/leaderboard/top', async (req, res) => {
  try {
    const { type = 'wallet', limit = 10 } = req.query
    
    // Validate type
    const validTypes = ['wallet', 'coins']
    const leaderboardType = validTypes.includes(type) ? type : 'wallet'
    
    // Validate limit
    const limitNum = Math.min(parseInt(limit) || 10, 100) // Max 100, default 10

    // Build sort criteria based on type
    let sortCriteria = {}
    if (leaderboardType === 'wallet') {
      sortCriteria = { WalletBalance: -1, Coins: -1 }
    } else {
      sortCriteria = { Coins: -1, WalletBalance: -1 }
    }

    // Get top users (exclude blocked users)
    const topUsers = await userModel.find({ IsBlocked: { $ne: true } })
      .sort(sortCriteria)
      .limit(limitNum)
      .select('ReferCode Coins WalletBalance')

    // Format leaderboard data - only rank, referCode, coins, walletBalance
    const leaderboard = topUsers.map((user, index) => ({
      rank: index + 1,
      referCode: user.ReferCode,
      coins: user.Coins || 0,
      walletBalance: user.WalletBalance || 0
    }))

    return res.json({
      message: "Top users leaderboard retrieved successfully",
      data: {
        type: leaderboardType,
        leaderboard: leaderboard,
        totalShown: leaderboard.length
      }
    })

  } catch (err) {
    console.error('Get Top Leaderboard - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

module.exports = router;

var express = require('express');
var router = express.Router();
const jwt = require('jsonwebtoken');

let adminModel = require('../models/admin.model')
let captchaSettingsModel = require('../models/captchaSettings.model')
let referralSettingsModel = require('../models/referralSettings.model')
let dailyBonusSettingsModel = require('../models/dailyBonusSettings.model')
let withdrawalRequestModel = require('../models/withdrawalRequest.model')
let userModel = require('../models/user.model')
let appModel = require('../models/app.model')
let appInstallationSubmissionModel = require('../models/appInstallationSubmission.model')
let coinConversionSettingsModel = require('../models/coinConversionSettings.model')
let scratchCardSettingsModel = require('../models/scratchCardSettings.model')
let scratchCardClaimModel = require('../models/scratchCardClaim.model')
let withdrawalSettingsModel = require('../models/withdrawalSettings.model')

// Admin Signup API
router.post('/signup', async (req, res) => {
  try {
    let { Email, Password } = req.body
    
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password are required"
      })
    }

    let checkAdmin = await adminModel.find({ Email: Email })
    if (checkAdmin.length > 0) {
      return res.status(400).json({
        message: "Admin Already Exist"
      })
    }
    else {
      let Admin_data = await adminModel.create({ Email: Email, Password: Password })
      
      // Generate JWT token with 30 days expiration
      const token = jwt.sign(
        { 
          id: Admin_data._id,
          Email: Admin_data.Email 
        },
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        { expiresIn: '30d' }
      )
      
      return res.json({
        message: "Admin Created Successfully",
        data: Admin_data,
        token: token
      })
    }

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Admin Login API
router.post('/login', async (req, res) => {
  try {
    let { Email, Password } = req.body
    
    if (!Email || !Password) {
      return res.status(400).json({
        message: "Email and Password are required"
      })
    }

    let admin = await adminModel.findOne({ Email: Email })
    if (!admin) {
      return res.status(404).json({
        message: "Admin Not Found"
      })
    }

    if (admin.Password !== Password) {
      return res.status(401).json({
        message: "Invalid Password"
      })
    }

    // Generate JWT token with 30 days expiration
    const token = jwt.sign(
      { 
        id: admin._id,
        Email: admin.Email 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '30d' }
    )

    return res.json({
      message: "Login Successful",
      data: {
        Email: admin.Email,
        _id: admin._id
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

// Middleware to verify JWT token for admin
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers.authorization
  
  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided."
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production')
    req.admin = decoded
    next()
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token"
    })
  }
}

// Alias for backward compatibility
const verifyAdminToken = verifyToken

// Set Captcha Settings API
router.post('/captcha/settings', verifyAdminToken, async (req, res) => {
  try {
    const { DailyCaptchaLimit, RewardPerCaptcha, RewardType } = req.body
    
    if (!DailyCaptchaLimit || RewardPerCaptcha === undefined) {
      return res.status(400).json({
        message: "DailyCaptchaLimit and RewardPerCaptcha are required"
      })
    }

    if (DailyCaptchaLimit <= 0) {
      return res.status(400).json({
        message: "DailyCaptchaLimit must be greater than 0"
      })
    }

    if (RewardPerCaptcha < 0) {
      return res.status(400).json({
        message: "RewardPerCaptcha must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await captchaSettingsModel.findOne()
    if (settings) {
      settings.DailyCaptchaLimit = DailyCaptchaLimit
      settings.RewardPerCaptcha = RewardPerCaptcha
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await captchaSettingsModel.create({
        DailyCaptchaLimit: DailyCaptchaLimit,
        RewardPerCaptcha: RewardPerCaptcha,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Captcha settings updated successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Captcha Settings API
router.get('/captcha/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await captchaSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        DailyCaptchaLimit: 10,
        RewardPerCaptcha: 1,
        RewardType: 'Coins'
      }
    }

    return res.json({
      message: "Captcha settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Set Referral Settings API
router.post('/referral/settings', verifyAdminToken, async (req, res) => {
  try {
    const { RewardForNewUser, RewardForReferrer, RewardType } = req.body
    
    if (RewardForNewUser === undefined || RewardForReferrer === undefined) {
      return res.status(400).json({
        message: "RewardForNewUser and RewardForReferrer are required"
      })
    }

    if (RewardForNewUser < 0 || RewardForReferrer < 0) {
      return res.status(400).json({
        message: "Reward amounts must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await referralSettingsModel.findOne()
    if (settings) {
      settings.RewardForNewUser = RewardForNewUser
      settings.RewardForReferrer = RewardForReferrer
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await referralSettingsModel.create({
        RewardForNewUser: RewardForNewUser,
        RewardForReferrer: RewardForReferrer,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Referral settings updated successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Referral Settings API
router.get('/referral/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await referralSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
        RewardForNewUser: 0,
        RewardForReferrer: 0,
        RewardType: 'Coins'
      }
    }

    return res.json({
      message: "Referral settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Set Daily Bonus Settings API
router.post('/dailybonus/settings', verifyAdminToken, async (req, res) => {
  try {
    const { Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, RewardType } = req.body
    
    // Validate all days are provided
    if (Monday === undefined || Tuesday === undefined || Wednesday === undefined || 
        Thursday === undefined || Friday === undefined || Saturday === undefined || 
        Sunday === undefined) {
      return res.status(400).json({
        message: "All days (Monday through Sunday) are required"
      })
    }

    if (Monday < 0 || Tuesday < 0 || Wednesday < 0 || Thursday < 0 || 
        Friday < 0 || Saturday < 0 || Sunday < 0) {
      return res.status(400).json({
        message: "All bonus amounts must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await dailyBonusSettingsModel.findOne()
    if (settings) {
      settings.Monday = Monday
      settings.Tuesday = Tuesday
      settings.Wednesday = Wednesday
      settings.Thursday = Thursday
      settings.Friday = Friday
      settings.Saturday = Saturday
      settings.Sunday = Sunday
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await dailyBonusSettingsModel.create({
        Monday: Monday,
        Tuesday: Tuesday,
        Wednesday: Wednesday,
        Thursday: Thursday,
        Friday: Friday,
        Saturday: Saturday,
        Sunday: Sunday,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Daily bonus settings updated successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Daily Bonus Settings API
router.get('/dailybonus/settings', verifyAdminToken, async (req, res) => {
  try {
    let settings = await dailyBonusSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
      settings = {
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

    return res.json({
      message: "Daily bonus settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get All Withdrawal Requests API
router.get('/withdrawal/requests', verifyToken, async (req, res) => {
  try {
    const { status } = req.query // Optional filter by status
    
    let query = {}
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.Status = status
    }

    // Get all withdrawal requests
    const requests = await withdrawalRequestModel.find(query)
      .populate('UserId', 'MobileNumber DeviceId')
      .sort({ createdAt: -1 })

    // Format response
    const formattedRequests = requests.map(req => ({
      requestId: req._id,
      userId: req.UserId._id,
      userMobileNumber: req.UserId.MobileNumber,
      userDeviceId: req.UserId.DeviceId,
      amount: req.Amount,
      paymentMethod: req.PaymentMethod,
      upiId: req.UPIId,
      virtualId: req.VirtualId,
      bankAccountNumber: req.BankAccountNumber,
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
        pendingCount: formattedRequests.filter(r => r.status === 'Pending').length,
        approvedCount: formattedRequests.filter(r => r.status === 'Approved').length,
        rejectedCount: formattedRequests.filter(r => r.status === 'Rejected').length
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

// Approve/Reject Withdrawal Request API
router.post('/withdrawal/request/:requestId/status', verifyToken, async (req, res) => {
  try {
    const { requestId } = req.params
    const { status, adminNotes } = req.body

    // Validate status
    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status is required and must be either 'Approved' or 'Rejected'"
      })
    }

    // Find withdrawal request
    const withdrawalRequest = await withdrawalRequestModel.findById(requestId)
      .populate('UserId')

    if (!withdrawalRequest) {
      return res.status(404).json({
        message: "Withdrawal request not found"
      })
    }

    // Check if already processed
    if (withdrawalRequest.Status !== 'Pending') {
      return res.status(400).json({
        message: `This withdrawal request has already been ${withdrawalRequest.Status.toLowerCase()}`
      })
    }

    // Get user
    const user = await userModel.findById(withdrawalRequest.UserId._id)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Update withdrawal request status
    withdrawalRequest.Status = status
    if (adminNotes) {
      withdrawalRequest.AdminNotes = adminNotes
    }
    await withdrawalRequest.save()

    // If rejected, return amount to wallet
    if (status === 'Rejected') {
      user.WalletBalance = (user.WalletBalance || 0) + withdrawalRequest.Amount
      await user.save()
    }
    // If approved, amount stays deducted (already deducted when request was created)

    return res.json({
      message: `Withdrawal request ${status.toLowerCase()} successfully`,
      data: {
        requestId: withdrawalRequest._id,
        amount: withdrawalRequest.Amount,
        paymentMethod: withdrawalRequest.PaymentMethod,
        status: withdrawalRequest.Status,
        adminNotes: withdrawalRequest.AdminNotes,
        userWalletBalance: user.WalletBalance,
        updatedAt: withdrawalRequest.updatedAt
      }
    })

  } catch (err) {
    console.error('Update Withdrawal Request Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get All Users API
router.get('/users', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query
    
    // Build query
    let query = {}
    if (search) {
      query.$or = [
        { MobileNumber: { $regex: search, $options: 'i' } },
        { DeviceId: { $regex: search, $options: 'i' } },
        { ReferCode: { $regex: search, $options: 'i' } }
      ]
    }

    // Calculate pagination
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    const skip = (pageNum - 1) * limitNum

    // Get total count for pagination
    const totalUsers = await userModel.countDocuments(query)

    // Get users with pagination
    const users = await userModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)

    // Format response with all user details
    const formattedUsers = users.map(user => ({
      userId: user._id,
      mobileNumber: user.MobileNumber,
      deviceId: user.DeviceId,
      referCode: user.ReferCode,
      coins: user.Coins || 0,
      walletBalance: user.WalletBalance || 0,
      referredBy: user.ReferredBy || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    // Calculate statistics
    const totalCoins = await userModel.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$Coins' } } }
    ])
    const totalWalletBalance = await userModel.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$WalletBalance' } } }
    ])

    return res.json({
      message: "Users retrieved successfully",
      data: {
        users: formattedUsers,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(totalUsers / limitNum),
          totalUsers: totalUsers,
          limit: limitNum,
          hasNextPage: pageNum < Math.ceil(totalUsers / limitNum),
          hasPrevPage: pageNum > 1
        },
        statistics: {
          totalCoins: totalCoins[0]?.total || 0,
          totalWalletBalance: totalWalletBalance[0]?.total || 0
        }
      }
    })

  } catch (err) {
    console.error('Get All Users - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Single User Details API
router.get('/users/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params

    // Get user details
    const user = await userModel.findById(userId)

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Get user's withdrawal requests
    const withdrawalRequests = await withdrawalRequestModel.find({ UserId: userId })
      .sort({ createdAt: -1 })

    // Get referral statistics
    const referralCount = await userModel.countDocuments({ ReferredBy: user.ReferCode })
    const totalReferralEarnings = await withdrawalRequestModel.aggregate([
      { $match: { UserId: userId, Status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$Amount' } } }
    ])

    // Format response with all user details
    const userDetails = {
      userId: user._id,
      mobileNumber: user.MobileNumber,
      deviceId: user.DeviceId,
      referCode: user.ReferCode,
      coins: user.Coins || 0,
      walletBalance: user.WalletBalance || 0,
      referredBy: user.ReferredBy || null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      statistics: {
        referralCount: referralCount,
        totalWithdrawalRequests: withdrawalRequests.length,
        pendingWithdrawals: withdrawalRequests.filter(r => r.Status === 'Pending').length,
        approvedWithdrawals: withdrawalRequests.filter(r => r.Status === 'Approved').length,
        rejectedWithdrawals: withdrawalRequests.filter(r => r.Status === 'Rejected').length,
        totalWithdrawn: totalReferralEarnings[0]?.total || 0
      },
      withdrawalRequests: withdrawalRequests.map(req => ({
        requestId: req._id,
        amount: req.Amount,
        paymentMethod: req.PaymentMethod,
        status: req.Status,
        createdAt: req.createdAt,
        updatedAt: req.updatedAt
      }))
    }

    return res.json({
      message: "User details retrieved successfully",
      data: userDetails
    })

  } catch (err) {
    console.error('Get User Details - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== APP MANAGEMENT APIs ====================

// Create App API
router.post('/apps', verifyToken, async (req, res) => {
  try {
    const { AppName, AppImage, AppDownloadUrl, RewardCoins, Difficulty, Status, Description } = req.body
    
    if (!AppName || !AppImage || !AppDownloadUrl || RewardCoins === undefined) {
      return res.status(400).json({
        message: "AppName, AppImage, AppDownloadUrl, and RewardCoins are required"
      })
    }

    if (RewardCoins < 0) {
      return res.status(400).json({
        message: "RewardCoins must be 0 or greater"
      })
    }

    const validDifficulties = ['Easiest', 'Easy', 'Medium', 'Hard']
    const validStatuses = ['Active', 'Inactive']
    
    const difficulty = Difficulty || 'Medium'
    const status = Status || 'Active'

    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        message: "Difficulty must be one of: Easiest, Easy, Medium, Hard"
      })
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Status must be either 'Active' or 'Inactive'"
      })
    }

    const app = await appModel.create({
      AppName: AppName,
      AppImage: AppImage,
      AppDownloadUrl: AppDownloadUrl,
      RewardCoins: RewardCoins,
      Difficulty: difficulty,
      Status: status,
      Description: Description || ''
    })

    return res.json({
      message: "App created successfully",
      data: app
    })

  } catch (err) {
    console.error('Create App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get All Apps API
router.get('/apps', verifyToken, async (req, res) => {
  try {
    const { status, difficulty, sortBy } = req.query
    
    let query = {}
    if (status && ['Active', 'Inactive'].includes(status)) {
      query.Status = status
    }
    if (difficulty && ['Easiest', 'Easy', 'Medium', 'Hard'].includes(difficulty)) {
      query.Difficulty = difficulty
    }

    let sortOptions = { createdAt: -1 } // Default: newest first
    if (sortBy === 'reward') {
      sortOptions = { RewardCoins: -1 } // Highest paying first
    } else if (sortBy === 'difficulty') {
      const difficultyOrder = { 'Easiest': 1, 'Easy': 2, 'Medium': 3, 'Hard': 4 }
      // We'll sort in memory for difficulty
    }

    let apps = await appModel.find(query).sort(sortOptions)

    // If sorting by difficulty, sort in memory
    if (sortBy === 'difficulty') {
      const difficultyOrder = { 'Easiest': 1, 'Easy': 2, 'Medium': 3, 'Hard': 4 }
      apps = apps.sort((a, b) => difficultyOrder[a.Difficulty] - difficultyOrder[b.Difficulty])
    }

    // Get statistics for each app
    const appsWithStats = await Promise.all(apps.map(async (app) => {
      const totalSubmissions = await appInstallationSubmissionModel.countDocuments({ AppId: app._id })
      const approvedSubmissions = await appInstallationSubmissionModel.countDocuments({ 
        AppId: app._id, 
        Status: 'Approved' 
      })
      const pendingSubmissions = await appInstallationSubmissionModel.countDocuments({ 
        AppId: app._id, 
        Status: 'Pending' 
      })

      return {
        appId: app._id,
        appName: app.AppName,
        appImage: app.AppImage,
        appDownloadUrl: app.AppDownloadUrl,
        rewardCoins: app.RewardCoins,
        difficulty: app.Difficulty,
        status: app.Status,
        description: app.Description,
        statistics: {
          totalSubmissions: totalSubmissions,
          approvedSubmissions: approvedSubmissions,
          pendingSubmissions: pendingSubmissions
        },
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }
    }))

    return res.json({
      message: "Apps retrieved successfully",
      data: {
        apps: appsWithStats,
        totalApps: appsWithStats.length
      }
    })

  } catch (err) {
    console.error('Get All Apps - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== APP INSTALLATION SUBMISSION APIs ====================

// Get All App Installation Submissions API (MUST come before /apps/:appId route)
router.get('/apps/submissions', verifyToken, async (req, res) => {
  try {
    const { status, appId, userId, sortBy } = req.query
    
    let query = {}
    if (status && ['Pending', 'Approved', 'Rejected'].includes(status)) {
      query.Status = status
    }
    if (appId) {
      query.AppId = appId
    }
    if (userId) {
      query.UserId = userId
    }

    let sortOptions = { createdAt: -1 } // Default: newest first
    if (sortBy === 'oldest') {
      sortOptions = { createdAt: 1 }
    }

    const submissions = await appInstallationSubmissionModel.find(query)
      .populate('UserId', 'MobileNumber DeviceId ReferCode')
      .populate('AppId', 'AppName AppImage RewardCoins Difficulty')
      .sort(sortOptions)

    const formattedSubmissions = submissions.map(sub => ({
      submissionId: sub._id,
      userId: sub.UserId._id,
      userMobileNumber: sub.UserId.MobileNumber,
      userDeviceId: sub.UserId.DeviceId,
      userReferCode: sub.UserId.ReferCode,
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

    return res.json({
      message: "App installation submissions retrieved successfully",
      data: {
        submissions: formattedSubmissions,
        totalSubmissions: formattedSubmissions.length,
        pendingCount: formattedSubmissions.filter(s => s.status === 'Pending').length,
        approvedCount: formattedSubmissions.filter(s => s.status === 'Approved').length,
        rejectedCount: formattedSubmissions.filter(s => s.status === 'Rejected').length
      }
    })

  } catch (err) {
    console.error('Get App Submissions - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Single App API
router.get('/apps/:appId', verifyToken, async (req, res) => {
  try {
    const { appId } = req.params

    const app = await appModel.findById(appId)
    if (!app) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    // Get statistics
    const totalSubmissions = await appInstallationSubmissionModel.countDocuments({ AppId: appId })
    const approvedSubmissions = await appInstallationSubmissionModel.countDocuments({ 
      AppId: appId, 
      Status: 'Approved' 
    })
    const pendingSubmissions = await appInstallationSubmissionModel.countDocuments({ 
      AppId: appId, 
      Status: 'Pending' 
    })
    const rejectedSubmissions = await appInstallationSubmissionModel.countDocuments({ 
      AppId: appId, 
      Status: 'Rejected' 
    })

    return res.json({
      message: "App retrieved successfully",
      data: {
        appId: app._id,
        appName: app.AppName,
        appImage: app.AppImage,
        appDownloadUrl: app.AppDownloadUrl,
        rewardCoins: app.RewardCoins,
        difficulty: app.Difficulty,
        status: app.Status,
        description: app.Description,
        statistics: {
          totalSubmissions: totalSubmissions,
          approvedSubmissions: approvedSubmissions,
          pendingSubmissions: pendingSubmissions,
          rejectedSubmissions: rejectedSubmissions
        },
        createdAt: app.createdAt,
        updatedAt: app.updatedAt
      }
    })

  } catch (err) {
    console.error('Get App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Update App API
router.put('/apps/:appId', verifyToken, async (req, res) => {
  try {
    const { appId } = req.params
    const { AppName, AppImage, AppDownloadUrl, RewardCoins, Difficulty, Status, Description } = req.body

    const app = await appModel.findById(appId)
    if (!app) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    if (RewardCoins !== undefined && RewardCoins < 0) {
      return res.status(400).json({
        message: "RewardCoins must be 0 or greater"
      })
    }

    const validDifficulties = ['Easiest', 'Easy', 'Medium', 'Hard']
    const validStatuses = ['Active', 'Inactive']
    
    if (Difficulty && !validDifficulties.includes(Difficulty)) {
      return res.status(400).json({
        message: "Difficulty must be one of: Easiest, Easy, Medium, Hard"
      })
    }

    if (Status && !validStatuses.includes(Status)) {
      return res.status(400).json({
        message: "Status must be either 'Active' or 'Inactive'"
      })
    }

    // Update fields
    if (AppName !== undefined) app.AppName = AppName
    if (AppImage !== undefined) app.AppImage = AppImage
    if (AppDownloadUrl !== undefined) app.AppDownloadUrl = AppDownloadUrl
    if (RewardCoins !== undefined) app.RewardCoins = RewardCoins
    if (Difficulty !== undefined) app.Difficulty = Difficulty
    if (Status !== undefined) app.Status = Status
    if (Description !== undefined) app.Description = Description

    await app.save()

    return res.json({
      message: "App updated successfully",
      data: app
    })

  } catch (err) {
    console.error('Update App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Delete App API
router.delete('/apps/:appId', verifyToken, async (req, res) => {
  try {
    const { appId } = req.params

    const app = await appModel.findById(appId)
    if (!app) {
      return res.status(404).json({
        message: "App not found"
      })
    }

    // Check if there are any submissions for this app
    const submissionsCount = await appInstallationSubmissionModel.countDocuments({ AppId: appId })
    if (submissionsCount > 0) {
      return res.status(400).json({
        message: `Cannot delete app. There are ${submissionsCount} submission(s) associated with this app.`
      })
    }

    await appModel.findByIdAndDelete(appId)

    return res.json({
      message: "App deleted successfully"
    })

  } catch (err) {
    console.error('Delete App - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Approve/Reject App Installation Submission API
router.post('/apps/submissions/:submissionId/status', verifyToken, async (req, res) => {
  try {
    const { submissionId } = req.params
    const { status, adminNotes } = req.body

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        message: "Status is required and must be either 'Approved' or 'Rejected'"
      })
    }

    const submission = await appInstallationSubmissionModel.findById(submissionId)
      .populate('UserId')
      .populate('AppId')

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found"
      })
    }

    if (submission.Status !== 'Pending') {
      return res.status(400).json({
        message: `This submission has already been ${submission.Status.toLowerCase()}`
      })
    }

    // Get user
    const user = await userModel.findById(submission.UserId._id)
    if (!user) {
      return res.status(404).json({
        message: "User not found"
      })
    }

    // Update submission status
    submission.Status = status
    if (adminNotes) {
      submission.AdminNotes = adminNotes
    }
    await submission.save()

    // If approved, add reward coins to user's wallet
    if (status === 'Approved') {
      user.Coins = (user.Coins || 0) + submission.AppId.RewardCoins
      await user.save()
    }

    return res.json({
      message: `Submission ${status.toLowerCase()} successfully`,
      data: {
        submissionId: submission._id,
        appName: submission.AppId.AppName,
        rewardCoins: submission.AppId.RewardCoins,
        status: submission.Status,
        adminNotes: submission.AdminNotes,
        userCoins: user.Coins,
        updatedAt: submission.updatedAt
      }
    })

  } catch (err) {
    console.error('Update Submission Status - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== COIN CONVERSION SETTINGS APIs ====================

// Set Coin Conversion Settings API
router.post('/coinconversion/settings', verifyToken, async (req, res) => {
  try {
    const { CoinsPerRupee, MinimumCoinsToConvert } = req.body
    
    if (CoinsPerRupee === undefined || MinimumCoinsToConvert === undefined) {
      return res.status(400).json({
        message: "CoinsPerRupee and MinimumCoinsToConvert are required"
      })
    }

    if (CoinsPerRupee <= 0) {
      return res.status(400).json({
        message: "CoinsPerRupee must be greater than 0"
      })
    }

    if (MinimumCoinsToConvert < 0) {
      return res.status(400).json({
        message: "MinimumCoinsToConvert must be 0 or greater"
      })
    }

    // Get or create settings
    let settings = await coinConversionSettingsModel.findOne()
    if (settings) {
      settings.CoinsPerRupee = CoinsPerRupee
      settings.MinimumCoinsToConvert = MinimumCoinsToConvert
      await settings.save()
    } else {
      settings = await coinConversionSettingsModel.create({
        CoinsPerRupee: CoinsPerRupee,
        MinimumCoinsToConvert: MinimumCoinsToConvert
      })
    }

    return res.json({
      message: "Coin conversion settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Coin Conversion Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Coin Conversion Settings API
router.get('/coinconversion/settings', verifyToken, async (req, res) => {
  try {
    let settings = await coinConversionSettingsModel.getSettings()

    return res.json({
      message: "Coin conversion settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Coin Conversion Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== SCRATCH CARD SETTINGS APIs ====================

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

// Set Scratch Card Settings API
router.post('/scratchcard/settings', verifyToken, async (req, res) => {
  try {
    const { Sunday, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, RewardType } = req.body
    
    // Validate all days are provided
    if (Sunday === undefined || Monday === undefined || Tuesday === undefined || 
        Wednesday === undefined || Thursday === undefined || Friday === undefined || 
        Saturday === undefined) {
      return res.status(400).json({
        message: "All days (Sunday through Saturday) are required"
      })
    }

    if (Sunday < 0 || Monday < 0 || Tuesday < 0 || Wednesday < 0 || 
        Thursday < 0 || Friday < 0 || Saturday < 0) {
      return res.status(400).json({
        message: "All scratch card amounts must be 0 or greater"
      })
    }

    const validRewardTypes = ['Coins', 'WalletBalance']
    const rewardType = RewardType || 'Coins'
    
    if (!validRewardTypes.includes(rewardType)) {
      return res.status(400).json({
        message: "RewardType must be either 'Coins' or 'WalletBalance'"
      })
    }

    // Update or create settings
    let settings = await scratchCardSettingsModel.findOne()
    if (settings) {
      settings.Sunday = Sunday
      settings.Monday = Monday
      settings.Tuesday = Tuesday
      settings.Wednesday = Wednesday
      settings.Thursday = Thursday
      settings.Friday = Friday
      settings.Saturday = Saturday
      settings.RewardType = rewardType
      await settings.save()
    } else {
      settings = await scratchCardSettingsModel.create({
        Sunday: Sunday,
        Monday: Monday,
        Tuesday: Tuesday,
        Wednesday: Wednesday,
        Thursday: Thursday,
        Friday: Friday,
        Saturday: Saturday,
        RewardType: rewardType
      })
    }

    return res.json({
      message: "Scratch card settings updated successfully",
      data: settings
    })

  } catch (err) {
    console.error('Set Scratch Card Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Scratch Card Settings API
router.get('/scratchcard/settings', verifyToken, async (req, res) => {
  try {
    let settings = await scratchCardSettingsModel.findOne()
    
    if (!settings) {
      // Return default settings if not exists
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

    return res.json({
      message: "Scratch card settings retrieved successfully",
      data: settings
    })

  } catch (err) {
    console.error('Get Scratch Card Settings - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// ==================== WITHDRAWAL SETTINGS APIs ====================

// Set Withdrawal Threshold API
router.post('/withdrawal/threshold', verifyAdminToken, async (req, res) => {
  try {
    const { MinimumWithdrawalAmount } = req.body
    
    if (MinimumWithdrawalAmount === undefined || MinimumWithdrawalAmount === null) {
      return res.status(400).json({
        message: "MinimumWithdrawalAmount is required"
      })
    }

    if (typeof MinimumWithdrawalAmount !== 'number' || isNaN(MinimumWithdrawalAmount)) {
      return res.status(400).json({
        message: "MinimumWithdrawalAmount must be a valid number"
      })
    }

    if (MinimumWithdrawalAmount < 1) {
      return res.status(400).json({
        message: "MinimumWithdrawalAmount must be at least 1"
      })
    }

    // Update or create settings
    let settings = await withdrawalSettingsModel.findOne()
    if (settings) {
      settings.MinimumWithdrawalAmount = MinimumWithdrawalAmount
      await settings.save()
    } else {
      settings = await withdrawalSettingsModel.create({
        MinimumWithdrawalAmount: MinimumWithdrawalAmount
      })
    }

    return res.json({
      message: "Withdrawal threshold updated successfully",
      data: {
        MinimumWithdrawalAmount: settings.MinimumWithdrawalAmount,
        updatedAt: settings.updatedAt
      }
    })

  } catch (err) {
    console.error('Set Withdrawal Threshold - Error:', err)
    return res.status(500).json({
      message: "Internal Server Error",
      error: err.message
    })
  }
})

// Get Withdrawal Threshold API
router.get('/withdrawal/threshold', verifyAdminToken, async (req, res) => {
  try {
    let settings = await withdrawalSettingsModel.getSettings()

    return res.json({
      message: "Withdrawal threshold retrieved successfully",
      data: {
        MinimumWithdrawalAmount: settings.MinimumWithdrawalAmount,
        updatedAt: settings.updatedAt
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

module.exports = router;

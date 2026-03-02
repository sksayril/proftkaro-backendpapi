var express = require('express');
var router = express.Router();

let userModel = require('../models/user.model')

// Referral Link Redirect API - Public endpoint (no auth required)
router.get('/refer/:referCode', async (req, res) => {
  try {
    const { referCode } = req.params
    
    if (!referCode || referCode.trim().length === 0) {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Referral Link</title></head>
          <body>
            <h1>Invalid Referral Link</h1>
            <p>The referral code is missing or invalid.</p>
          </body>
        </html>
      `)
    }

    // Validate refer code exists in database
    const user = await userModel.findOne({ ReferCode: referCode.trim().toUpperCase() })
    
    if (!user) {
      return res.status(404).send(`
        <html>
          <head><title>Referral Code Not Found</title></head>
          <body>
            <h1>Referral Code Not Found</h1>
            <p>The referral code "${referCode}" does not exist.</p>
            <p><a href="https://play.google.com/store/apps/details?id=com.profitkaro">Download ProfitKaro App</a></p>
          </body>
        </html>
      `)
    }

    // Android Intent URL format for deep linking
    // This will try to open the app first, then fallback to Play Store
    const appPackage = 'com.profitkaro'
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${appPackage}&referrer=${referCode}`
    const intentUrl = `intent://refer?code=${referCode}#Intent;scheme=profitkaro;package=${appPackage};S.refer=${referCode};end`
    
    // Custom scheme fallback
    const customScheme = `profitkaro://refer?code=${referCode}`

    // Return HTML page with JavaScript to handle redirect
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Redirecting to ProfitKaro...</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 20px;
            }
            .spinner {
              border: 4px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 4px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            a {
              color: white;
              text-decoration: underline;
              margin-top: 20px;
              display: inline-block;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Redirecting to ProfitKaro...</h1>
            <div class="spinner"></div>
            <p>Opening app with referral code: <strong>${referCode}</strong></p>
            <p id="fallback" style="display:none;">
              <a href="${playStoreUrl}">Click here if app doesn't open automatically</a>
            </p>
          </div>
          <script>
            // Try Android Intent URL first (works on Android Chrome)
            function tryOpenApp() {
              // Method 1: Try Intent URL (Android)
              window.location.href = '${intentUrl}';
              
              // Method 2: Try custom scheme after a delay
              setTimeout(function() {
                window.location.href = '${customScheme}';
              }, 500);
              
              // Method 3: Fallback to Play Store after 2 seconds
              setTimeout(function() {
                document.getElementById('fallback').style.display = 'block';
                window.location.href = '${playStoreUrl}';
              }, 2000);
            }
            
            // Detect if Android
            const isAndroid = /Android/i.test(navigator.userAgent);
            
            if (isAndroid) {
              tryOpenApp();
            } else {
              // For iOS or desktop, redirect to Play Store
              window.location.href = '${playStoreUrl}';
            }
          </script>
        </body>
      </html>
    `)

  } catch (err) {
    console.error('Referral Redirect Error:', err)
    return res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>An error occurred while processing your referral link.</p>
          <p><a href="https://play.google.com/store/apps/details?id=com.profitkaro">Download ProfitKaro App</a></p>
        </body>
      </html>
    `)
  }
})

// Alternative: Query parameter version (e.g., /refer?code=VYD62W)
router.get('/refer', async (req, res) => {
  try {
    const referCode = req.query.code || req.query.refer
    
    if (!referCode || referCode.trim().length === 0) {
      return res.status(400).send(`
        <html>
          <head><title>Invalid Referral Link</title></head>
          <body>
            <h1>Invalid Referral Link</h1>
            <p>Please provide a referral code. Example: /refer?code=VYD62W</p>
          </body>
        </html>
      `)
    }

    // Redirect to the path-based version
    return res.redirect(`/refer/${referCode.trim().toUpperCase()}`)

  } catch (err) {
    console.error('Referral Redirect Error:', err)
    return res.status(500).send(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>An error occurred while processing your referral link.</p>
        </body>
      </html>
    `)
  }
})

/* GET home page. */
// router.get('/', function(req, res, next) {
 
// });
router.post('/signUp',async (req, res)=>{
  try{
  let {Email,Password} =  req.body
  let checkUser = await userModel.find({Email:Email})
  if(checkUser.length >0){
    return res.json({
      message:"User Alredy Exist"
    })
  }
  else{
    let User_data = await userModel.create({Email:Email,Password:Password})
    return res.json({
      message:"User Cerated Successfull",
      data:User_data
    })
  }

  }catch(err){
return res.status(500)
  }
})

module.exports = router;

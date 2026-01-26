# User API Documentation

This document describes the User APIs available in the application.

## Base URL
```
http://localhost:3100/users
```

---

## 1. User Signup

Create a new user account with auto-generated refer code.

### Endpoint
```
POST /users/signup
```

### Request Body

**Required Fields:**
```json
{
  "MobileNumber": "9876543210",
  "Password": "yourpassword123"
}
```

**With Optional Referral Code:**
```json
{
  "MobileNumber": "9876543210",
  "Password": "yourpassword123",
  "ReferralCode": "PRK08F9"
}
```


**With Optional DeviceId:**
```json
{
  "MobileNumber": "9876543210",
  "Password": "yourpassword123",
  "DeviceId": "device123456",
  "ReferralCode": "PRK08F9"
}
```

**Note:** 
- `MobileNumber` and `Password` are **required** fields.
- `DeviceId` is **optional**.
- `ReferralCode` is **optional**. If provided, it must be a valid referral code from another existing user.

### Request Headers
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "User Created Successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "MobileNumber": "9876543210",
    "DeviceId": "device123456",
    "ReferCode": "PRK08F9",
    "ReferredBy": "ABC12X",
    "Coins": 0,
    "WalletBalance": 0,
    "__v": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIk1vYmlsZU51bWJlciI6Ijk4NzY1NDMyMTAiLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** 
- The JWT token is valid for 30 days from the time of generation.
- A unique ReferCode is automatically generated for each user (format: 3 letters + 2 digits + 1 letter, e.g., "PRK08F9", "ABC12X").
- Each user must have a unique MobileNumber and DeviceId.
- If a ReferralCode is provided during signup, it will be validated and stored in the `ReferredBy` field. If no referral code is provided, `ReferredBy` will be `null`.
- **Referral Rewards**: If a valid referral code is used during signup, rewards are automatically calculated and distributed:
  - The new user receives `RewardForNewUser` (configured by admin)
  - The referrer (user whose code was used) receives `RewardForReferrer` (configured by admin)
  - Rewards are added to Coins or WalletBalance based on admin settings

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "MobileNumber and Password are required"
}
```

#### 400 Bad Request - MobileNumber Already Exists
```json
{
  "message": "User with this MobileNumber already exists"
}
```

#### 400 Bad Request - Invalid Referral Code
```json
{
  "message": "Invalid Referral Code"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 2. User Login

Authenticate a user and retrieve their information.

### Endpoint
```
POST /users/login
```

### Request Body
```json
{
  "MobileNumber": "9876543210",
  "Password": "yourpassword123"
}
```

### Request Headers
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Login Successful",
  "data": {
    "MobileNumber": "9876543210",
    "DeviceId": "device123456",
    "ReferCode": "PRK08F9",
    "_id": "507f1f77bcf86cd799439011"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIk1vYmlsZU51bWJlciI6Ijk4NzY1NDMyMTAiLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** The JWT token is valid for 30 days from the time of generation.

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "MobileNumber and Password are required"
}
```

#### 401 Unauthorized - Invalid Password
```json
{
  "message": "Invalid password"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```


#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 3. Get User Profile

Retrieve the complete user profile including mobile number, device ID, wallet balance, coins, and referral code.

### Endpoint
```
GET /users/profile
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "User profile retrieved successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "9876543210",
    "deviceId": "device123",
    "referCode": "PRK08F9",
    "coins": 100,
    "walletBalance": 500.50,
    "referredBy": null,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** 
- Returns complete user profile information
- Includes mobile number, device ID, referral code, coins, wallet balance
- Shows if user was referred by someone (referredBy field)
- Includes account creation and update timestamps

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 4. Get User Wallet Balance and Coins

Retrieve the wallet balance and coins for the authenticated user.

### Endpoint
```
GET /users/wallet
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Wallet details retrieved successfully",
  "data": {
    "Coins": 100,
    "WalletBalance": 500.50,
    "MobileNumber": "9876543210"
  }
}
```

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 5. Get User Refer Code

Retrieve the refer code for the authenticated user.

### Endpoint
```
GET /users/refercode
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Refer code retrieved successfully",
  "data": {
    "ReferCode": "PRK08F9",
    "MobileNumber": "9876543210",
    "ReferralCount": 5,
    "TotalEarnings": 25,
    "RewardType": "Coins",
    "RewardPerReferral": 5
  }
}
```

**Note:** 
- `ReferCode` is the user's unique referral code
- `ReferralCount` shows how many users have joined using this referral code (users who have `ReferredBy` matching this `ReferCode`)
- `TotalEarnings` shows the total amount earned from all referrals (ReferralCount × RewardPerReferral)
- `RewardType` indicates whether rewards are in "Coins" or "WalletBalance"
- `RewardPerReferral` shows the reward amount given per referral (configured by admin)

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 6. Get Captcha

Get a captcha challenge to solve.

### Endpoint
```
GET /users/captcha
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Captcha generated successfully",
  "data": {
    "Captcha": "ABC12"
  }
}
```

**Note:** 
- Captcha format: 3 uppercase letters followed by 2 digits (e.g., "ABC12", "XYZ45")
- Captcha is case-sensitive

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

## 6. Solve Captcha

Solve a captcha and earn rewards (Coins or WalletBalance).

### Endpoint
```
POST /users/captcha/solve
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "Captcha": "ABC12"
}
```

### Success Response (200 OK)
```json
{
  "message": "Captcha solved successfully",
  "data": {
    "RewardAmount": 1,
    "RewardType": "Coins",
    "TodaySolves": 3,
    "DailyLimit": 10,
    "Coins": 15,
    "WalletBalance": 0
  }
}
```

**Note:** 
- Users have a daily limit for solving captchas (set by admin)
- Rewards can be in Coins or WalletBalance (set by admin)
- Each captcha solve is tracked and counted per day
- Once daily limit is reached, user cannot solve more captchas until next day

### Error Responses

#### 400 Bad Request - Missing Captcha
```json
{
  "message": "Captcha is required"
}
```

#### 400 Bad Request - Invalid Captcha Format
```json
{
  "message": "Invalid captcha format. Should be 3 letters followed by 2 digits (e.g., ABC12)"
}
```

#### 400 Bad Request - Daily Limit Reached
```json
{
  "message": "Daily captcha limit reached. You can solve 10 captchas per day."
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

## Example Usage

### Using cURL

#### Signup (without referral code)
```bash
curl -X POST http://localhost:3100/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "MobileNumber": "9876543210",
    "Password": "yourpassword123"
  }'
```

#### Signup (with referral code)
```bash
curl -X POST http://localhost:3100/users/signup \
  -H "Content-Type: application/json" \
  -d '{
    "MobileNumber": "9876543210",
    "Password": "yourpassword123",
    "ReferralCode": "PRK08F9"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3100/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "MobileNumber": "9876543210",
    "Password": "yourpassword123"
  }'
```

#### Get Wallet Balance and Coins
```bash
curl -X GET http://localhost:3100/users/wallet \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Refer Code
```bash
curl -X GET http://localhost:3100/users/refercode \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get All Daily Bonuses
```bash
curl -X GET http://localhost:3100/users/dailybonus \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Claim Daily Bonus
```bash
curl -X POST http://localhost:3100/users/dailybonus/claim \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Captcha
```bash
curl -X GET http://localhost:3100/users/captcha \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Solve Captcha
```bash
curl -X POST http://localhost:3100/users/captcha/solve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Captcha": "ABC12"
  }'
```

### Using JavaScript (Fetch API)

#### Signup (without referral code)
```javascript
fetch('http://localhost:3100/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    MobileNumber: '9876543210',
    Password: 'yourpassword123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User created:', data);
  console.log('Refer Code:', data.data.ReferCode);
  console.log('Token:', data.token);
})
.catch(error => console.error('Error:', error));
```

#### Signup (with referral code)
```javascript
fetch('http://localhost:3100/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    MobileNumber: '9876543210',
    Password: 'yourpassword123',
    ReferralCode: 'PRK08F9'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User created:', data);
  console.log('Refer Code:', data.data.ReferCode);
  console.log('Referred By:', data.data.ReferredBy);
  console.log('Token:', data.token);
})
.catch(error => console.error('Error:', error));
```

#### Login
```javascript
fetch('http://localhost:3100/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    MobileNumber: '9876543210',
    Password: 'yourpassword123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Login successful:', data);
  console.log('User Refer Code:', data.data.ReferCode);
  console.log('Token:', data.token);
  // Store token for future requests
  localStorage.setItem('token', data.token);
})
.catch(error => console.error('Error:', error));
```

#### Get Wallet Balance and Coins
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/wallet', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Wallet details:', data);
  console.log('Coins:', data.data.Coins);
  console.log('Wallet Balance:', data.data.WalletBalance);
})
.catch(error => console.error('Error:', error));
```

#### Get Refer Code
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/refercode', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Refer Code:', data.data.ReferCode);
  console.log('Users Joined:', data.data.ReferralCount);
  console.log('Total Earnings:', data.data.TotalEarnings, data.data.RewardType);
  console.log('Reward Per Referral:', data.data.RewardPerReferral);
})
.catch(error => console.error('Error:', error));
```

#### Get All Daily Bonuses
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/dailybonus', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Daily Bonuses:', data.data.bonuses);
  console.log('Current Day:', data.data.currentDay);
  console.log('Reward Type:', data.data.rewardType);
  console.log('Total Coins:', data.data.totalCoins);
  console.log('Total Wallet Balance:', data.data.totalWalletBalance);
  // Display bonuses with claim status
  data.data.bonuses.forEach(bonus => {
    console.log(`${bonus.day}: ${bonus.amount} ${data.data.rewardType} - ${bonus.claimed ? 'Claimed' : 'Available'}${bonus.isToday ? ' (Today)' : ''}`);
  });
})
.catch(error => console.error('Error:', error));
```

#### Claim Daily Bonus
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/dailybonus/claim', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Bonus claimed:', data.message);
  console.log('Amount:', data.data.amount, data.data.rewardType);
  console.log('Total Coins:', data.data.totalCoins);
  console.log('Total Wallet Balance:', data.data.totalWalletBalance);
  console.log('Note: You can only claim once per day');
})
.catch(error => console.error('Error:', error));
```

#### Get Captcha
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/captcha', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Captcha:', data.data.Captcha);
  // Display captcha to user for solving
})
.catch(error => console.error('Error:', error));
```

#### Solve Captcha
```javascript
const token = localStorage.getItem('token');
const captcha = 'ABC12'; // User input

fetch('http://localhost:3100/users/captcha/solve', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Captcha: captcha
  })
})
.then(response => response.json())
.then(data => {
  console.log('Captcha solved!');
  console.log('Reward:', data.data.RewardAmount, data.data.RewardType);
  console.log('Today Solves:', data.data.TodaySolves, '/', data.data.DailyLimit);
  console.log('Total Coins:', data.data.Coins);
})
.catch(error => console.error('Error:', error));
```

---

## JWT Token

Both signup and login endpoints return a JWT (JSON Web Token) that should be used for authenticating subsequent API requests.

### Token Details
- **Expiration:** 30 days from generation
- **Payload:** Contains user ID and MobileNumber
- **Usage:** Include the token in the `Authorization` header for protected routes:
  ```
  Authorization: Bearer <token>
  ```

### Example: Using Token in Requests
```bash
curl -X GET http://localhost:3100/protected-route \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/protected-route', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

---

## User Model Fields

### Required Fields
- **MobileNumber**: User's mobile phone number (must be unique)
- **Password**: User's password (will be hashed and stored securely)

### Auto-Generated Fields
- **ReferCode**: Automatically generated unique referral code (format: 3 letters + 2 digits + 1 letter)
  - Example: "PRK08F9", "ABC12X", "XYZ45M"
  - Each user gets a unique refer code upon signup

### Optional Fields
- **DeviceId**: Device identifier (optional, not unique)
- **ReferredBy**: Referral code used during signup (stored if a valid referral code is provided, otherwise null)

### Default Fields
- **Coins**: User's coin balance (default: 0)
- **WalletBalance**: User's wallet balance in currency (default: 0)

---

## Validation Rules

1. **MobileNumber Uniqueness**: Each mobile number can only be registered once. One mobile number = one user.
2. **Password Security**: Passwords are hashed using bcrypt before storage. Never store plain text passwords.
3. **DeviceId**: Optional field, not required and not unique. Can be provided during signup but is not mandatory.
4. **ReferCode Uniqueness**: Each refer code is automatically generated and guaranteed to be unique.
5. **Required Fields**: MobileNumber and Password are mandatory for signup.

---

## 7. Get All Daily Bonuses

Retrieve all daily bonuses with claim status for the current week.

### Endpoint
```
GET /users/dailybonus
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Daily bonuses retrieved successfully",
  "data": {
    "bonuses": [
      {
        "day": "Monday",
        "amount": 10,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Tuesday",
        "amount": 15,
        "claimed": true,
        "isToday": false
      },
      {
        "day": "Wednesday",
        "amount": 20,
        "claimed": false,
        "isToday": true
      },
      {
        "day": "Thursday",
        "amount": 25,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Friday",
        "amount": 30,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Saturday",
        "amount": 50,
        "claimed": false,
        "isToday": false
      },
      {
        "day": "Sunday",
        "amount": 100,
        "claimed": false,
        "isToday": false
      }
    ],
    "rewardType": "Coins",
    "weekStartDate": "2024-01-01T00:00:00.000Z",
    "currentDay": "Wednesday",
    "totalCoins": 150,
    "totalWalletBalance": 0
  }
}
```

**Note:** 
- `bonuses` array contains all 7 days with their bonus amounts and claim status
- `claimed` indicates if the bonus for that day has been claimed this week
- `isToday` indicates which day is today
- `weekStartDate` shows when the current week started (Monday)
- `totalCoins` shows the user's total coins balance
- `totalWalletBalance` shows the user's total wallet balance
- Weekly reset happens automatically - all claims reset every Monday

### Error Responses

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 8. Claim Daily Bonus

Claim the daily bonus for the current day.

### Endpoint
```
POST /users/dailybonus/claim
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Daily bonus for Wednesday claimed successfully",
  "data": {
    "day": "Wednesday",
    "amount": 20,
    "rewardType": "Coins",
    "coins": 45,
    "walletBalance": 0,
    "totalCoins": 45,
    "totalWalletBalance": 0
  }
}
```

**Note:** 
- Users can claim each day's bonus **only once per day** - cannot claim the same day multiple times
- Weekly reset happens automatically every Monday
- Bonus is added to Coins or WalletBalance based on admin settings
- `totalCoins` and `totalWalletBalance` show updated balances after claiming

### Error Responses

#### 400 Bad Request - Already Claimed
```json
{
  "message": "Daily bonus for Wednesday has already been claimed. You can only claim once per day."
}
```

#### 400 Bad Request - No Bonus Available
```json
{
  "message": "No bonus available for Sunday"
}
```

#### 400 Bad Request - Settings Not Configured
```json
{
  "message": "Daily bonus settings not configured"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## Withdrawal Request APIs

### POST /users/withdrawal/request
Submit a withdrawal request.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "Amount": 100,
  "PaymentMethod": "UPI",
  "UPIId": "user@upi",
  "VirtualId": "VIRTUAL123"
}
```

OR for Bank Transfer:
```json
{
  "Amount": 500,
  "PaymentMethod": "BankTransfer",
  "BankAccountNumber": "1234567890",
  "BankIFSC": "BANK0001234",
  "BankName": "Bank Name",
  "AccountHolderName": "John Doe"
}
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal request submitted successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "amount": 100,
    "paymentMethod": "UPI",
    "status": "Pending",
    "remainingWalletBalance": 400,
    "createdAt": "2024-01-18T22:00:00.000Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "message": "Insufficient wallet balance. Available: 50, Requested: 100"
}
```

**Response (Error - 400):**
```json
{
  "message": "You have a pending withdrawal request. Please wait for it to be processed."
}
```

**Validation Rules:**
- Amount must be greater than 0
- Wallet balance must be sufficient
- Only one pending request allowed at a time
- For UPI: UPIId or VirtualId is required
- For Bank Transfer: BankAccountNumber, BankIFSC, BankName, and AccountHolderName are required
- Amount is deducted from wallet immediately when request is submitted

---

### GET /users/withdrawal/requests
Get all withdrawal requests for the authenticated user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal requests retrieved successfully",
  "data": {
    "requests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "amount": 100,
        "paymentMethod": "UPI",
        "upiId": "user@upi",
        "virtualId": "VIRTUAL123",
        "bankAccountNumber": null,
        "bankIFSC": null,
        "bankName": null,
        "accountHolderName": null,
        "status": "Pending",
        "adminNotes": null,
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      },
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "amount": 500,
        "paymentMethod": "BankTransfer",
        "upiId": null,
        "virtualId": null,
        "bankAccountNumber": "****7890",
        "bankIFSC": "BANK0001234",
        "bankName": "Bank Name",
        "accountHolderName": "John Doe",
        "status": "Approved",
        "adminNotes": "Payment processed",
        "createdAt": "2024-01-17T20:00:00.000Z",
        "updatedAt": "2024-01-18T10:00:00.000Z"
      }
    ],
    "totalRequests": 2,
    "currentWalletBalance": 400
  }
}
```

**Notes:**
- Bank account numbers are masked for security (only last 4 digits visible)
- Requests are sorted by creation date (newest first)
- If request is rejected, amount is returned to wallet
- If request is approved, amount stays deducted

---

## Notes

- All endpoints require `Content-Type: application/json` header
- MobileNumber and Password are required for login
- MobileNumber and Password are required for signup
- DeviceId is optional for signup (not required)
- Passwords are securely hashed using bcrypt before storage
- GET endpoints (`/users/wallet` and `/users/refercode`) require JWT token authentication
- Include JWT token in `Authorization: Bearer <token>` header for protected routes
- JWT tokens expire after 30 days - users will need to login again after expiration
- Set `JWT_SECRET` environment variable for production (defaults to a placeholder if not set)
- The base URL may vary depending on your server configuration
- ReferCode is automatically generated and cannot be manually set
- Each user must have a unique combination of MobileNumber and DeviceId
- Coins and WalletBalance are initialized to 0 when a user signs up
- ReferralCode is optional during signup - if provided, it must be a valid referral code from an existing user
- If a valid ReferralCode is provided, it will be stored in the ReferredBy field
- Daily bonus APIs require JWT token authentication
- Daily bonuses reset automatically every week (Monday to Sunday cycle)
- Users can claim each day's bonus once per week
- Weekly reset happens automatically - when a new week starts, all claim statuses reset
- Withdrawal request APIs require JWT token authentication
- Users can only have one pending withdrawal request at a time
- Amount is deducted from wallet immediately when withdrawal request is submitted
- If withdrawal is rejected by admin, amount is automatically returned to wallet
- If withdrawal is approved, amount stays deducted (payment should be processed externally)
- Bank account numbers are masked in user-facing APIs for security

---

## App Installation Reward APIs

### GET /users/apps
Get all available apps for installation with filters.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `filter`: Filter by "highest" (highest paying) or "easiest" (easiest apps first)
- `difficulty`: Filter by difficulty ("Easiest", "Easy", "Medium", "Hard")

**Example Request:**
```
GET /users/apps?filter=highest&difficulty=Easy
```

**Success Response (200 OK):**
```json
{
  "message": "Apps retrieved successfully",
  "data": {
    "apps": [
      {
        "appId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
        "rewardCoins": 50,
        "difficulty": "Easy",
        "description": "Install this app and earn coins!",
        "userStatus": "available",
        "canSubmit": true,
        "createdAt": "2024-01-18T20:00:00.000Z"
      }
    ],
    "totalApps": 1,
    "availableApps": 1,
    "pendingApps": 0,
    "approvedApps": 0
  }
}
```

**Note:**
- `userStatus` can be: "available" (can submit), "pending" (waiting for approval), "approved" (already approved), "rejected" (can resubmit)
- `canSubmit` indicates if user can submit a new installation for this app
- Apps are filtered to show only "Active" apps
- Filter "highest" sorts by highest reward coins first
- Filter "easiest" sorts by easiest difficulty first (Easiest → Easy → Medium → Hard)

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

---

### POST /users/apps/:appId/submit
Submit app installation with screenshot for review. Supports multiple upload methods:
1. **File Upload** (multipart/form-data) - Recommended
2. **Base64 Image** (JSON)
3. **Direct URL** (JSON) - Legacy support

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data (for file upload) OR application/json (for base64/URL)
```

**Method 1: File Upload (Recommended)**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `screenshot`: Image file (JPEG, PNG, etc.) - Max 5MB

**Method 2: Base64 Image**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "screenshotBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "fileName": "screenshot.jpg"
}
```

**Method 3: Direct URL (Legacy - for backward compatibility)**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "ScreenshotUrl": "https://example.com/screenshot.png"
}
```

**Note:**
- When using file upload, the image is automatically uploaded to AWS S3
- The S3 URL is stored in the database
- Supported image formats: JPEG, PNG, GIF, etc.
- Maximum file size: 5MB
- Base64 images should include the data URL prefix (e.g., "data:image/jpeg;base64,")

**Success Response (200 OK):**
```json
{
  "message": "App installation submitted successfully. Please wait for admin approval.",
  "data": {
    "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "appName": "Example App",
    "appImage": "https://example.com/app-image.png",
    "rewardCoins": 50,
    "screenshotUrl": "https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/1234567890-screenshot.jpg",
    "status": "Pending",
    "createdAt": "2024-01-18T22:00:00.000Z"
  }
}
```

**Note:**
- `screenshotUrl` will be the AWS S3 URL when using file upload or base64
- The image is stored in the `app-screenshots` folder in S3
- The URL format: `https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/timestamp-filename.jpg`

**Error Responses:**

#### 400 Bad Request - Missing Screenshot
```json
{
  "message": "Screenshot is required. Please provide either a file upload, base64 image, or ScreenshotUrl"
}
```

#### 400 Bad Request - Invalid File Type
```json
{
  "message": "Only image files are allowed"
}
```

#### 400 Bad Request - File Too Large
```json
{
  "message": "File size exceeds 5MB limit"
}
```

#### 500 Internal Server Error - S3 Upload Failed
```json
{
  "message": "Failed to upload screenshot to S3",
  "error": "Error details"
}
```

#### 400 Bad Request - Already Submitted
```json
{
  "message": "You have already submitted and been approved for this app"
}
```

#### 400 Bad Request - Pending Submission
```json
{
  "message": "You already have a pending submission for this app. Please wait for admin approval."
}
```

#### 404 Not Found - App Not Found
```json
{
  "message": "App not found"
}
```

#### 400 Bad Request - App Not Active
```json
{
  "message": "This app is not available for installation"
}
```

**Note:**
- Users can only have one approved submission per app
- Users can resubmit if their previous submission was rejected
- Users cannot submit if they have a pending submission for the same app
- **File upload is recommended** - images are automatically uploaded to AWS S3
- Screenshots are stored in AWS S3 bucket: `streaming-bucket-123`
- S3 URL format: `https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/timestamp-filename.jpg`
- Maximum file size: 5MB
- Supported formats: JPEG, PNG, GIF, WebP, etc.

---

### GET /users/apps/submissions
Get user's app installation submission history.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Pending", "Approved", "Rejected")

**Example Request:**
```
GET /users/apps/submissions?status=Approved
```

**Success Response (200 OK):**
```json
{
  "message": "App installation submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "appId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appRewardCoins": 50,
        "appDifficulty": "Easy",
        "screenshotUrl": "https://example.com/screenshot.png",
        "status": "Approved",
        "adminNotes": "Screenshot verified successfully",
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:30:00.000Z"
      }
    ],
    "totalSubmissions": 1,
    "pendingCount": 0,
    "approvedCount": 1,
    "rejectedCount": 0,
    "totalEarnings": 50
  }
}
```

**Note:**
- `totalEarnings` shows the sum of reward coins from all approved submissions
- Submissions are sorted by creation date (newest first)
- Shows all app details including name, image, reward coins, and difficulty

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "message": "Invalid or expired token"
}
```

---

## Example Usage for App Installation APIs

### Using cURL

#### Get All Apps (Highest Paying)
```bash
curl -X GET "http://localhost:3100/users/apps?filter=highest" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Easiest Apps
```bash
curl -X GET "http://localhost:3100/users/apps?filter=easiest" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Submit App Installation (File Upload - Recommended)
```bash
curl -X POST http://localhost:3100/users/apps/60f7b3b3b3b3b3b3b3b3b1/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "screenshot=@/path/to/screenshot.jpg"
```

#### Submit App Installation (Base64)
```bash
curl -X POST http://localhost:3100/users/apps/60f7b3b3b3b3b3b3b3b3b1/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "screenshotBase64": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "fileName": "screenshot.jpg"
  }'
```

#### Submit App Installation (Direct URL - Legacy)
```bash
curl -X POST http://localhost:3100/users/apps/60f7b3b3b3b3b3b3b3b3b1/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ScreenshotUrl": "https://example.com/screenshot.png"
  }'
```

#### Get User's Submission History
```bash
curl -X GET "http://localhost:3100/users/apps/submissions?status=Approved" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch API)

#### Get All Apps
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/apps?filter=highest', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Available Apps:', data.data.apps);
  data.data.apps.forEach(app => {
    console.log(`${app.appName}: ${app.rewardCoins} coins - ${app.userStatus}`);
  });
})
.catch(error => console.error('Error:', error));
```

#### Submit App Installation (File Upload - Recommended)
```javascript
const token = localStorage.getItem('token');
const appId = '60f7b3b3b3b3b3b3b3b3b3b1';
const fileInput = document.getElementById('screenshotFile'); // File input element
const file = fileInput.files[0];

const formData = new FormData();
formData.append('screenshot', file);

fetch(`http://localhost:3100/users/apps/${appId}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
    // Don't set Content-Type - browser will set it with boundary for FormData
  },
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('Submission successful:', data.message);
  console.log('S3 URL:', data.data.screenshotUrl);
  console.log('Reward Coins:', data.data.rewardCoins);
  console.log('Status:', data.data.status);
})
.catch(error => console.error('Error:', error));
```

#### Submit App Installation (Base64)
```javascript
const token = localStorage.getItem('token');
const appId = '60f7b3b3b3b3b3b3b3b3b3b1';

// Convert file to base64
const fileInput = document.getElementById('screenshotFile');
const file = fileInput.files[0];
const reader = new FileReader();

reader.onload = function(e) {
  const base64String = e.target.result;
  
  fetch(`http://localhost:3100/users/apps/${appId}/submit`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      screenshotBase64: base64String,
      fileName: file.name
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Submission successful:', data.message);
    console.log('S3 URL:', data.data.screenshotUrl);
    console.log('Reward Coins:', data.data.rewardCoins);
  })
  .catch(error => console.error('Error:', error));
};

reader.readAsDataURL(file);
```

#### Submit App Installation (Direct URL - Legacy)
```javascript
const token = localStorage.getItem('token');
const appId = '60f7b3b3b3b3b3b3b3b3b3b3b1';
const screenshotUrl = 'https://example.com/screenshot.png';

fetch(`http://localhost:3100/users/apps/${appId}/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    ScreenshotUrl: screenshotUrl
  })
})
.then(response => response.json())
.then(data => {
  console.log('Submission successful:', data.message);
  console.log('Reward Coins:', data.data.rewardCoins);
  console.log('Status:', data.data.status);
})
.catch(error => console.error('Error:', error));
```

#### Get Submission History
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/apps/submissions', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Total Submissions:', data.data.totalSubmissions);
  console.log('Total Earnings:', data.data.totalEarnings, 'coins');
  console.log('Approved:', data.data.approvedCount);
  console.log('Pending:', data.data.pendingCount);
  data.data.submissions.forEach(sub => {
    console.log(`${sub.appName}: ${sub.status} - ${sub.appRewardCoins} coins`);
  });
})
.catch(error => console.error('Error:', error));
```

---

## Notes for App Installation System

- App installation APIs require JWT token authentication
- Users can browse available apps with filters (highest paying, easiest)
- Users can filter apps by difficulty level
- Users submit screenshots after installing apps
- **Screenshots are automatically uploaded to AWS S3** when using file upload or base64
- S3 bucket: `streaming-bucket-123`, Region: `us-east-1`
- S3 URL format: `https://streaming-bucket-123.s3.us-east-1.amazonaws.com/app-screenshots/timestamp-filename.jpg`
- Admin reviews and approves/rejects submissions
- When approved, reward coins are automatically added to user's wallet
- Users can only have one approved submission per app
- Users can resubmit if their submission was rejected
- Users can track their submission history and total earnings
- Maximum file size: 5MB
- Supported image formats: JPEG, PNG, GIF, WebP, etc.

---

## Coin Conversion APIs

### GET /users/coinconversion/rate
Get coin-to-RS (rupees) conversion rate and user's conversion potential.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Coin conversion rate retrieved successfully",
  "data": {
    "coinsPerRupee": 10,
    "minimumCoinsToConvert": 100,
    "userCoins": 500,
    "rupeesValue": "50.00",
    "canConvert": true
  }
}
```

**Note:**
- `coinsPerRupee`: How many coins equal 1 rupee (set by admin)
- `minimumCoinsToConvert`: Minimum coins required to convert (set by admin)
- `userCoins`: Current coins balance of the user
- `rupeesValue`: How much rupees the user's coins are worth
- `canConvert`: Whether user has enough coins to convert (meets minimum requirement)

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

### POST /users/coinconversion/convert
Convert coins to RS (rupees). Coins are deducted and rupees are added to wallet balance.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Coins": 200
}
```

**Success Response (200 OK):**
```json
{
  "message": "Coins converted to RS successfully",
  "data": {
    "coinsConverted": 200,
    "rupeesAdded": "20.00",
    "remainingCoins": 300,
    "walletBalance": "50.00",
    "conversionRate": 10
  }
}
```

**Note:**
- Coins are deducted from user's coin balance
- Rupees are added to user's wallet balance
- Conversion is irreversible
- Must meet minimum coins requirement set by admin

**Error Responses:**

#### 400 Bad Request - Missing Coins
```json
{
  "message": "Coins is required"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "Coins must be greater than 0"
}
```

#### 400 Bad Request - Below Minimum
```json
{
  "message": "Minimum 100 coins required to convert"
}
```

#### 400 Bad Request - Insufficient Coins
```json
{
  "message": "Insufficient coins. You have 50 coins, but trying to convert 200 coins"
}
```

---

## Example Usage for Coin Conversion APIs

### Using cURL

#### Get Conversion Rate
```bash
curl -X GET http://localhost:3100/users/coinconversion/rate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Convert Coins to RS
```bash
curl -X POST http://localhost:3100/users/coinconversion/convert \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Coins": 200
  }'
```

### Using JavaScript (Fetch API)

#### Get Conversion Rate
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/coinconversion/rate', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Conversion Rate:', data.data.coinsPerRupee, 'coins per rupee');
  console.log('Your Coins:', data.data.userCoins);
  console.log('Worth:', data.data.rupeesValue, 'rupees');
  console.log('Can Convert:', data.data.canConvert);
})
.catch(error => console.error('Error:', error));
```

#### Convert Coins to RS
```javascript
const token = localStorage.getItem('token');
const coinsToConvert = 200;

fetch('http://localhost:3100/users/coinconversion/convert', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Coins: coinsToConvert
  })
})
.then(response => response.json())
.then(data => {
  console.log('Conversion successful!');
  console.log('Coins Converted:', data.data.coinsConverted);
  console.log('Rupees Added:', data.data.rupeesAdded);
  console.log('Remaining Coins:', data.data.remainingCoins);
  console.log('Wallet Balance:', data.data.walletBalance);
})
.catch(error => console.error('Error:', error));
```

---

## Notes for Coin Conversion System

- Coin conversion APIs require JWT token authentication
- Admin sets the conversion rate (coins per rupee) and minimum coins required
- Users can check their conversion potential using the rate API
- Users can convert coins to rupees which are added to wallet balance
- Conversion is irreversible - coins are deducted permanently
- Must meet minimum coins requirement to convert
- Cannot convert more coins than user has

---

## Scratch Card APIs

### GET /users/scratchcard
Get scratch card information for the current day.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card info retrieved successfully",
  "data": {
    "currentDay": "Wednesday",
    "todayAmount": 40,
    "rewardType": "Coins",
    "isClaimed": false,
    "canClaim": true,
    "weekStartDate": "2024-01-15T00:00:00.000Z",
    "allDays": {
      "Sunday": 50,
      "Monday": 20,
      "Tuesday": 30,
      "Wednesday": 40,
      "Thursday": 25,
      "Friday": 35,
      "Saturday": 100
    }
  }
}
```

**Note:**
- `currentDay`: Current day of the week
- `todayAmount`: Reward amount for today's scratch card
- `isClaimed`: Whether user has already claimed today's scratch card
- `canClaim`: Whether user can claim today's scratch card
- `allDays`: Shows reward amounts for all days of the week

**Error Responses:**

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User Not Found"
}
```

---

### POST /users/scratchcard/claim
Claim today's scratch card reward.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card for Wednesday claimed successfully",
  "data": {
    "day": "Wednesday",
    "rewardAmount": 40,
    "rewardType": "Coins",
    "coins": 140,
    "walletBalance": 0,
    "claimedAt": "2024-01-17T10:30:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Already Claimed
```json
{
  "message": "Scratch card for Wednesday has already been claimed. You can only claim once per day."
}
```

#### 400 Bad Request - No Reward Available
```json
{
  "message": "No scratch card reward available for Sunday"
}
```

#### 400 Bad Request - Settings Not Configured
```json
{
  "message": "Scratch card settings not configured"
}
```

**Note:**
- Users can claim scratch card once per day
- Reward is automatically added to coins or wallet balance based on admin settings
- Weekly reset happens automatically every Monday

---

### GET /users/scratchcard/history
Get user's scratch card claim history.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Number of records per page (default: 50)

**Example Request:**
```
GET /users/scratchcard/history?page=1&limit=20
```

**Success Response (200 OK):**
```json
{
  "message": "Scratch card history retrieved successfully",
  "data": {
    "claims": [
      {
        "claimId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "day": "Wednesday",
        "rewardAmount": 40,
        "rewardType": "Coins",
        "weekStartDate": "2024-01-15T00:00:00.000Z",
        "claimedAt": "2024-01-17T10:30:00.000Z"
      },
      {
        "claimId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "day": "Tuesday",
        "rewardAmount": 30,
        "rewardType": "Coins",
        "weekStartDate": "2024-01-15T00:00:00.000Z",
        "claimedAt": "2024-01-16T09:15:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalClaims": 25,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "totalCoinsEarned": 500,
      "totalWalletEarned": 0,
      "totalClaims": 25
    }
  }
}
```

**Note:**
- Returns all scratch card claims with pagination
- Includes statistics: total coins earned, total wallet earned, total claims
- Claims are sorted by creation date (newest first)

---

## Example Usage for Scratch Card APIs

### Using cURL

#### Get Scratch Card Info
```bash
curl -X GET http://localhost:3100/users/scratchcard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Claim Scratch Card
```bash
curl -X POST http://localhost:3100/users/scratchcard/claim \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get Scratch Card History
```bash
curl -X GET "http://localhost:3100/users/scratchcard/history?page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch API)

#### Get Scratch Card Info
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/scratchcard', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Today:', data.data.currentDay);
  console.log('Reward Amount:', data.data.todayAmount, data.data.rewardType);
  console.log('Can Claim:', data.data.canClaim);
  console.log('Is Claimed:', data.data.isClaimed);
})
.catch(error => console.error('Error:', error));
```

#### Claim Scratch Card
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/scratchcard/claim', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Claimed successfully!');
  console.log('Reward:', data.data.rewardAmount, data.data.rewardType);
  console.log('Total Coins:', data.data.coins);
  console.log('Wallet Balance:', data.data.walletBalance);
})
.catch(error => console.error('Error:', error));
```

#### Get Scratch Card History
```javascript
const token = localStorage.getItem('token');
fetch('http://localhost:3100/users/scratchcard/history?page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Total Claims:', data.data.statistics.totalClaims);
  console.log('Total Coins Earned:', data.data.statistics.totalCoinsEarned);
  console.log('Total Wallet Earned:', data.data.statistics.totalWalletEarned);
  data.data.claims.forEach(claim => {
    console.log(`${claim.day}: ${claim.rewardAmount} ${claim.rewardType} - ${claim.claimedAt}`);
  });
})
.catch(error => console.error('Error:', error));
```

---

## Notes for Scratch Card System

- Scratch card APIs require JWT token authentication
- Admin sets different reward amounts for each day of the week
- Users can claim scratch card once per day
- Weekly reset happens automatically every Monday
- Rewards can be in Coins or WalletBalance (set by admin)
- Users can view their complete scratch card claim history
- History includes pagination and statistics
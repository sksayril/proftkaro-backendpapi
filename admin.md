# Admin API Documentation

This document describes the Admin APIs available in the application.

## Base URL
```
http://localhost:3000/admin
```

---

## Password Encryption

The application uses **crypto-js** with **AES encryption** for password storage. This allows:
- **Encryption**: Passwords are encrypted before storage in the database
- **Decryption**: Passwords can be decrypted to retrieve the original password text
- **Retrieval**: Admin can view the original password text via API endpoints

### Encryption Key Configuration

The encryption key is stored in the `ENCRYPTION_KEY` environment variable. For production, set a strong encryption key (minimum 32 characters):

```bash
ENCRYPTION_KEY=your-very-secure-encryption-key-minimum-32-characters-long
```

If not set, a default key is used (not recommended for production).

### Important Notes

- Passwords are encrypted using AES encryption (not hashed)
- Original passwords can be retrieved/decrypted
- Admin endpoints return the original decrypted password text
- User signup and login use crypto-js encryption/decryption
- All password operations use the same encryption key

---

## 1. Admin Signup

Create a new admin account.

### Endpoint
```
POST /admin/signup
```

### Request Body
```json
{
  "Email": "admin@example.com",
  "Password": "admin123"
}
```

### Request Headers
```
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Admin Created Successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "Email": "admin@example.com",
    "Password": "admin123",
    "__v": 0
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIkVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** The JWT token is valid for 30 days from the time of generation.

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "Email and Password are required"
}
```

#### 400 Bad Request - Admin Already Exists
```json
{
  "message": "Admin Already Exist"
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

## 2. Admin Login

Authenticate an admin user.

### Endpoint
```
POST /admin/login
```

### Request Body
```json
{
  "Email": "admin@example.com",
  "Password": "admin123"
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
    "Email": "admin@example.com",
    "_id": "507f1f77bcf86cd799439011"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsIkVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJpYXQiOjE2ODk1MjM0NTYsImV4cCI6MTY5MjExNTQ1Nn0.example"
}
```

**Note:** The JWT token is valid for 30 days from the time of generation.

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "Email and Password are required"
}
```

#### 404 Not Found - Admin Not Found
```json
{
  "message": "Admin Not Found"
}
```

#### 401 Unauthorized - Invalid Password
```json
{
  "message": "Invalid Password"
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

## 3. Set Captcha Settings

Configure captcha settings including daily limit per user and reward per captcha.

### Endpoint
```
POST /admin/captcha/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "DailyCaptchaLimit": 10,
  "RewardPerCaptcha": 1,
  "RewardType": "Coins"
}
```

**Note:** 
- `DailyCaptchaLimit`: Maximum number of captchas a user can solve per day (must be > 0)
- `RewardPerCaptcha`: Reward amount per captcha solve (must be >= 0)
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")

### Success Response (200 OK)
```json
{
  "message": "Captcha settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "DailyCaptchaLimit": 10,
    "RewardPerCaptcha": 1,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "DailyCaptchaLimit and RewardPerCaptcha are required"
}
```

#### 400 Bad Request - Invalid Daily Limit
```json
{
  "message": "DailyCaptchaLimit must be greater than 0"
}
```

#### 400 Bad Request - Invalid Reward Amount
```json
{
  "message": "RewardPerCaptcha must be 0 or greater"
}
```

#### 400 Bad Request - Invalid Reward Type
```json
{
  "message": "RewardType must be either 'Coins' or 'WalletBalance'"
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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 4. Get Captcha Settings

Retrieve current captcha settings.

### Endpoint
```
GET /admin/captcha/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Captcha settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "DailyCaptchaLimit": 10,
    "RewardPerCaptcha": 1,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

**Note:** If no settings exist, default values will be returned:
- DailyCaptchaLimit: 10
- RewardPerCaptcha: 1
- RewardType: "Coins"

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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 5. Set Referral Settings

Configure referral reward settings for when users join using a referral code.

### Endpoint
```
POST /admin/referral/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "RewardForNewUser": 10,
  "RewardForReferrer": 5,
  "RewardType": "Coins"
}
```

**Note:** 
- `RewardForNewUser`: Reward amount given to the new user who joins using a referral code (must be >= 0)
- `RewardForReferrer`: Reward amount given to the user whose referral code was used (must be >= 0)
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")

### Success Response (200 OK)
```json
{
  "message": "Referral settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "RewardForNewUser": 10,
    "RewardForReferrer": 5,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "RewardForNewUser and RewardForReferrer are required"
}
```

#### 400 Bad Request - Invalid Reward Amount
```json
{
  "message": "Reward amounts must be 0 or greater"
}
```

#### 400 Bad Request - Invalid Reward Type
```json
{
  "message": "RewardType must be either 'Coins' or 'WalletBalance'"
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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 6. Get Referral Settings

Retrieve current referral reward settings.

### Endpoint
```
GET /admin/referral/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Referral settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "RewardForNewUser": 10,
    "RewardForReferrer": 5,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

**Note:** If no settings exist, default values will be returned:
- RewardForNewUser: 0
- RewardForReferrer: 0
- RewardType: "Coins"

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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## Example Usage

### Using cURL

#### Signup
```bash
curl -X POST http://localhost:3000/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@example.com",
    "Password": "admin123"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@example.com",
    "Password": "admin123"
  }'
```

#### Set Captcha Settings
```bash
curl -X POST http://localhost:3000/admin/captcha/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "DailyCaptchaLimit": 10,
    "RewardPerCaptcha": 1,
    "RewardType": "Coins"
  }'
```

#### Get Captcha Settings
```bash
curl -X GET http://localhost:3000/admin/captcha/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Set Referral Settings
```bash
curl -X POST http://localhost:3000/admin/referral/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "RewardForNewUser": 10,
    "RewardForReferrer": 5,
    "RewardType": "Coins"
  }'
```

#### Get Referral Settings
```bash
curl -X GET http://localhost:3000/admin/referral/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Set Daily Bonus Settings
```bash
curl -X POST http://localhost:3000/admin/dailybonus/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Monday": 10,
    "Tuesday": 15,
    "Wednesday": 20,
    "Thursday": 25,
    "Friday": 30,
    "Saturday": 50,
    "Sunday": 100,
    "RewardType": "Coins"
  }'
```

#### Get Daily Bonus Settings
```bash
curl -X GET http://localhost:3000/admin/dailybonus/settings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Fetch API)

#### Signup
```javascript
fetch('http://localhost:3000/admin/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    Email: 'admin@example.com',
    Password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

#### Login
```javascript
fetch('http://localhost:3000/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    Email: 'admin@example.com',
    Password: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

#### Set Captcha Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/captcha/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    DailyCaptchaLimit: 10,
    RewardPerCaptcha: 1,
    RewardType: 'Coins'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Settings updated:', data);
})
.catch(error => console.error('Error:', error));
```

#### Get Captcha Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/captcha/settings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Captcha Settings:', data.data);
  console.log('Daily Limit:', data.data.DailyCaptchaLimit);
  console.log('Reward per Captcha:', data.data.RewardPerCaptcha);
})
.catch(error => console.error('Error:', error));
```

#### Set Referral Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/referral/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    RewardForNewUser: 10,
    RewardForReferrer: 5,
    RewardType: 'Coins'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Referral settings updated:', data);
})
.catch(error => console.error('Error:', error));
```

#### Get Referral Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/referral/settings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Referral Settings:', data.data);
  console.log('Reward for New User:', data.data.RewardForNewUser);
  console.log('Reward for Referrer:', data.data.RewardForReferrer);
})
.catch(error => console.error('Error:', error));
```

#### Set Daily Bonus Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/dailybonus/settings', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    Monday: 10,
    Tuesday: 15,
    Wednesday: 20,
    Thursday: 25,
    Friday: 30,
    Saturday: 50,
    Sunday: 100,
    RewardType: 'Coins'
  })
})
.then(response => response.json())
.then(data => {
  console.log('Daily bonus settings updated:', data);
})
.catch(error => console.error('Error:', error));
```

#### Get Daily Bonus Settings
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/dailybonus/settings', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Daily Bonus Settings:', data.data);
  console.log('Monday Bonus:', data.data.Monday);
  console.log('Sunday Bonus:', data.data.Sunday);
})
.catch(error => console.error('Error:', error));
```

---

## JWT Token

Both signup and login endpoints return a JWT (JSON Web Token) that should be used for authenticating subsequent API requests.

### Token Details
- **Expiration:** 30 days from generation
- **Payload:** Contains admin ID and Email
- **Usage:** Include the token in the `Authorization` header for protected routes:
  ```
  Authorization: Bearer <token>
  ```

### Example: Using Token in Requests
```bash
curl -X GET http://localhost:3000/protected-route \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

```javascript
fetch('http://localhost:3000/protected-route', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

---

## 7. Set Daily Bonus Settings

Configure daily bonus amounts for each day of the week.

### Endpoint
```
POST /admin/dailybonus/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "Monday": 10,
  "Tuesday": 15,
  "Wednesday": 20,
  "Thursday": 25,
  "Friday": 30,
  "Saturday": 50,
  "Sunday": 100,
  "RewardType": "Coins"
}
```

**Note:** 
- All days (Monday through Sunday) are required
- Each day's bonus amount must be 0 or greater
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")
- Weekly reset happens automatically - users can claim each day's bonus once per week

### Success Response (200 OK)
```json
{
  "message": "Daily bonus settings updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "Monday": 10,
    "Tuesday": 15,
    "Wednesday": 20,
    "Thursday": 25,
    "Friday": 30,
    "Saturday": 50,
    "Sunday": 100,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Fields
```json
{
  "message": "All days (Monday through Sunday) are required"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "All bonus amounts must be 0 or greater"
}
```

#### 400 Bad Request - Invalid Reward Type
```json
{
  "message": "RewardType must be either 'Coins' or 'WalletBalance'"
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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## 8. Get Daily Bonus Settings

Retrieve current daily bonus settings.

### Endpoint
```
GET /admin/dailybonus/settings
```

### Request Headers
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Success Response (200 OK)
```json
{
  "message": "Daily bonus settings retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "Monday": 10,
    "Tuesday": 15,
    "Wednesday": 20,
    "Thursday": 25,
    "Friday": 30,
    "Saturday": 50,
    "Sunday": 100,
    "RewardType": "Coins",
    "__v": 0
  }
}
```

**Note:** If no settings exist, default values will be returned (all days: 0, RewardType: "Coins")

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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

---

## Daily Spin Settings APIs

### POST /admin/dailyspin/settings
Set the **daily spin limit** (how many spins a user can use per day).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "DailySpinLimit": 20
}
```

**Validation Rules:**
- `DailySpinLimit` is required
- Must be a valid number
- Must be greater than 0

**Response (Success - 200):**
```json
{
  "message": "Daily spin settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "DailySpinLimit": 20
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Field
```json
{
  "message": "DailySpinLimit is required"
}
```

#### 400 Bad Request - Invalid Value
```json
{
  "message": "DailySpinLimit must be a valid number"
}
```

#### 400 Bad Request - Must be > 0
```json
{
  "message": "DailySpinLimit must be greater than 0"
}
```

---

### GET /admin/dailyspin/settings
Get the current daily spin settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Daily spin settings retrieved successfully",
  "data": {
    "DailySpinLimit": 20
  }
}
```

**Note:**
- If settings are not saved yet, default `DailySpinLimit: 10` is returned

---

## Withdrawal Request Management APIs

### GET /admin/withdrawal/requests
Get all withdrawal requests (with optional status filter).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `status`: Filter by status (`Pending`, `Approved`, `Rejected`)

**Example Request:**
```
GET /admin/withdrawal/requests?status=Pending
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal requests retrieved successfully",
  "data": {
    "requests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userMobileNumber": "1234567890",
        "userDeviceId": "device123",
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
        "userId": "60f7b3b3b3b3b3b3b3b3b3b2",
        "userMobileNumber": "9876543210",
        "userDeviceId": "device456",
        "amount": 500,
        "paymentMethod": "BankTransfer",
        "upiId": null,
        "virtualId": null,
        "bankAccountNumber": "1234567890",
        "bankIFSC": "BANK0001234",
        "bankName": "Bank Name",
        "accountHolderName": "John Doe",
        "status": "Pending",
        "adminNotes": null,
        "createdAt": "2024-01-17T20:00:00.000Z",
        "updatedAt": "2024-01-17T20:00:00.000Z"
      }
    ],
    "totalRequests": 2,
    "pendingCount": 2,
    "approvedCount": 0,
    "rejectedCount": 0
  }
}
```

**Notes:**
- All bank details are shown in full (not masked) for admin
- Requests are sorted by creation date (newest first)
- Can filter by status using query parameter

---

### POST /admin/withdrawal/request/:requestId/status
Approve or reject a withdrawal request.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `requestId`: The ID of the withdrawal request

**Request Body:**
```json
{
  "status": "Approved",
  "adminNotes": "Payment processed successfully"
}
```

OR for rejection:
```json
{
  "status": "Rejected",
  "adminNotes": "Invalid bank details provided"
}
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal request approved successfully",
  "data": {
    "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "amount": 100,
    "paymentMethod": "UPI",
    "status": "Approved",
    "adminNotes": "Payment processed successfully",
    "userWalletBalance": 400,
    "updatedAt": "2024-01-18T22:30:00.000Z"
  }
}
```

**Response (Error - 400):**
```json
{
  "message": "This withdrawal request has already been approved"
}
```

**Response (Error - 404):**
```json
{
  "message": "Withdrawal request not found"
}
```

**Important Notes:**
- When a withdrawal request is **approved**: The amount stays deducted from the user's wallet (already deducted when request was created)
- When a withdrawal request is **rejected**: The amount is automatically returned to the user's wallet
- Admin can add notes when approving/rejecting
- Once a request is processed (approved/rejected), it cannot be changed

---

## User Management APIs

### GET /admin/users
Get all users with pagination and search functionality.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `page`: Page number (default: 1)
- `limit`: Number of users per page (default: 50)
- `search`: Search by MobileNumber, DeviceId, or ReferCode

**Example Request:**
```
GET /admin/users?page=1&limit=20&search=123
```

**Response (Success - 200):**
```json
{
  "message": "Users retrieved successfully",
  "data": {
    "users": [
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "mobileNumber": "1234567890",
        "deviceId": "device123",
        "referCode": "PRK08F9",
        "coins": 100,
        "walletBalance": 500,
        "referredBy": null,
        "isBlocked": false,
        "blockedAt": null,
        "blockedReason": null,
        "createdAt": "2024-01-18T20:00:00.000Z",
        "updatedAt": "2024-01-18T20:00:00.000Z"
      },
      {
        "userId": "60f7b3b3b3b3b3b3b3b3b2",
        "mobileNumber": "9876543210",
        "deviceId": "device456",
        "referCode": "PRK12A5",
        "coins": 50,
        "walletBalance": 200,
        "referredBy": "PRK08F9",
        "createdAt": "2024-01-17T18:00:00.000Z",
        "updatedAt": "2024-01-17T18:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 100,
      "limit": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "statistics": {
      "totalCoins": 15000,
      "totalWalletBalance": 75000
    }
  }
}
```

**Notes:**
- Returns all user fields including MobileNumber, DeviceId, ReferCode, Coins, WalletBalance, ReferredBy, and blocked status
- Includes blocked status fields: `isBlocked`, `blockedAt`, `blockedReason`
- Includes pagination information
- Includes aggregate statistics (total coins and wallet balance across all users)
- Supports search functionality across MobileNumber, DeviceId, and ReferCode

---

### GET /admin/users/:userId
Get detailed information about a specific user.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**URL Parameters:**
- `userId`: The ID of the user

**Response (Success - 200):**
```json
{
  "message": "User details retrieved successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "1234567890",
    "password": "userpassword123",
    "deviceId": "device123",
    "referCode": "PRK08F9",
    "coins": 100,
    "walletBalance": 500,
    "referredBy": null,
    "isBlocked": false,
    "blockedAt": null,
    "blockedReason": null,
    "signupTime": "2024-01-18T20:00:00.000Z",
    "lastLoginTime": "2024-01-19T10:00:00.000Z",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z",
    "statistics": {
      "referralCount": 5,
      "totalWithdrawalRequests": 3,
      "pendingWithdrawals": 1,
      "approvedWithdrawals": 2,
      "rejectedWithdrawals": 0,
      "totalWithdrawn": 300,
      "totalAppSubmissions": 10,
      "approvedAppSubmissions": 8,
      "pendingAppSubmissions": 1,
      "rejectedAppSubmissions": 1,
      "totalEarningsFromApps": 400
    },
    "withdrawalRequests": [
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "amount": 100,
        "paymentMethod": "UPI",
        "status": "Pending",
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      },
      {
        "requestId": "60f7b3b3b3b3b3b3b3b3b3b4",
        "amount": 200,
        "paymentMethod": "BankTransfer",
        "status": "Approved",
        "createdAt": "2024-01-17T20:00:00.000Z",
        "updatedAt": "2024-01-18T10:00:00.000Z"
      }
    ],
    "appSubmissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b5",
        "appId": "60f7b3b3b3b3b3b3b3b3b3b6",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appRewardCoins": 50,
        "appDifficulty": "Easy",
        "screenshotUrl": "https://example.com/screenshot.png",
        "status": "Approved",
        "adminNotes": "Verified successfully",
        "createdAt": "2024-01-18T21:00:00.000Z",
        "updatedAt": "2024-01-18T21:30:00.000Z"
      }
    ]
  }
}
```

**Response (Error - 404):**
```json
{
  "message": "User not found"
}
```

**Notes:**
- Returns complete user profile with all fields including signupTime and lastLoginTime
- **Password Field**: Returns the original decrypted password text (not encrypted/hashed)
- Passwords are encrypted using crypto-js AES encryption and can be decrypted to retrieve the original password
- **Blocked Status**: Includes `isBlocked`, `blockedAt`, and `blockedReason` fields to show if user is blocked
- Includes comprehensive user statistics (referral count, withdrawal history, app submission/task completion data)
- Includes all withdrawal requests for the user with full details
- Includes all app installation submissions (task completions) with app details and status
- Shows referral performance, withdrawal activity, and task completion statistics
- App submission statistics include total submissions, approved/pending/rejected counts, and total earnings from apps
- **Security Note**: Passwords are encrypted using crypto-js (AES encryption) which allows decryption to retrieve the original password text

---

### PUT /admin/users/:userId
Edit user data including MobileNumber, Password, DeviceId, Coins, and WalletBalance.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `userId`: The ID of the user to update

**Request Body (All fields optional - provide only fields you want to update):**
```json
{
  "MobileNumber": "9876543210",
  "Password": "newpassword123",
  "DeviceId": "new-device-id",
  "Coins": 500,
  "WalletBalance": 1000
}
```

**Note:**
- All fields are optional - you can update any combination of fields
- `MobileNumber`: Must be unique, cannot be used by another user
- `Password`: Will be encrypted using crypto-js (AES encryption) automatically (minimum 6 characters)
  - Password updates are supported and the original password text is shown in the response
  - The `password` field in the response contains the decrypted/updated password text
  - The `changes.password` object shows the old password (from) and new password (to)
- `DeviceId`: Must be unique, cannot be used by another user
- `Coins`: Must be a number >= 0
- `WalletBalance`: Must be a number >= 0
- At least one field must be provided to update

**Response (Success - 200):**
```json
{
  "message": "User updated successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "9876543210",
    "password": "newpassword123",
    "deviceId": "new-device-id",
    "referCode": "PRK08F9",
    "coins": 500,
    "walletBalance": 1000,
    "referredBy": null,
    "isBlocked": false,
    "blockedAt": null,
    "blockedReason": null,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T22:30:00.000Z",
    "changes": {
      "mobileNumber": {
        "from": "1234567890",
        "to": "9876543210"
      },
      "password": {
        "from": "oldpassword123",
        "to": "newpassword123"
      },
      "deviceId": {
        "from": "device123",
        "to": "new-device-id"
      },
      "coins": {
        "from": 100,
        "to": 500
      },
      "walletBalance": {
        "from": 500,
        "to": 1000
      }
    },
    "statistics": {
      "referralCount": 5,
      "totalWithdrawalRequests": 3
    }
  }
}
```

**Error Responses:**

#### 400 Bad Request - No Fields Provided
```json
{
  "message": "No fields provided to update. Please provide at least one field: MobileNumber, Password, DeviceId, Coins, or WalletBalance"
}
```

#### 400 Bad Request - Invalid MobileNumber
```json
{
  "message": "MobileNumber must be a valid non-empty string"
}
```

#### 400 Bad Request - MobileNumber Already Exists
```json
{
  "message": "MobileNumber already exists for another user"
}
```

#### 400 Bad Request - Invalid Password
```json
{
  "message": "Password must be at least 6 characters long"
}
```

#### 400 Bad Request - Invalid DeviceId
```json
{
  "message": "DeviceId must be a valid non-empty string"
}
```

#### 400 Bad Request - DeviceId Already Exists
```json
{
  "message": "DeviceId already exists for another user"
}
```

#### 400 Bad Request - Invalid Coins
```json
{
  "message": "Coins must be a valid number"
}
```

#### 400 Bad Request - Negative Coins
```json
{
  "message": "Coins cannot be negative"
}
```

#### 400 Bad Request - Invalid WalletBalance
```json
{
  "message": "WalletBalance must be a valid number"
}
```

#### 400 Bad Request - Negative WalletBalance
```json
{
  "message": "WalletBalance cannot be negative"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- Admin can update any user's data including profile information, device ID, coins, wallet balance, and **password**
- **Password Update**: Admin can update user passwords by providing the new password in the request body
- Password is automatically encrypted using crypto-js (AES encryption) before storage
- Passwords can be decrypted to retrieve the original password text
- The response shows the updated password in plain text (decrypted) in the `password` field
- The `changes.password` object shows both the old password (from) and new password (to) for password updates
- **Blocked Status**: Response includes `isBlocked`, `blockedAt`, and `blockedReason` fields showing user's blocked status
- All uniqueness validations are enforced (MobileNumber and DeviceId must be unique)
- Response includes before/after values for all changed fields including password
- User statistics are included in the response
- This endpoint requires admin authentication token

**Example Usage:**

**Using cURL - Update Password and Other Fields:**
```bash
curl -X PUT http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Password": "newpassword123",
    "Coins": 500,
    "WalletBalance": 1000
  }'
```

**Using cURL - Update Only Password:**
```bash
curl -X PUT http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "Password": "newsecurepassword456"
  }'
```

**Using JavaScript (Fetch API) - Update Password:**
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Password: 'newpassword123',
    Coins: 500,
    WalletBalance: 1000,
    DeviceId: 'new-device-id'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User updated:', data);
  console.log('Updated password:', data.data.password);
  console.log('Password changes:', data.data.changes.password);
  console.log('All changes:', data.data.changes);
})
.catch(error => console.error('Error:', error));
```

---

### POST /admin/users/:userId/block
Block a user account. Blocked users cannot access the system.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `userId`: The ID of the user to block

**Request Body (Optional):**
```json
{
  "reason": "Violation of terms of service"
}
```

**Note:**
- `reason`: Optional reason for blocking the user (can be null)
- User must not already be blocked
- Blocked users will have `isBlocked: true` and `blockedAt` timestamp set

**Response (Success - 200):**
```json
{
  "message": "User blocked successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "1234567890",
    "isBlocked": true,
    "blockedAt": "2024-01-18T22:30:00.000Z",
    "blockedReason": "Violation of terms of service"
  }
}
```

**Error Responses:**

#### 400 Bad Request - User Already Blocked
```json
{
  "message": "User is already blocked"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Example Usage:**

**Using cURL:**
```bash
curl -X POST http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/block \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Violation of terms of service"
  }'
```

**Using JavaScript (Fetch API):**
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/block', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Violation of terms of service'
  })
})
.then(response => response.json())
.then(data => {
  console.log('User blocked:', data);
  console.log('Blocked at:', data.data.blockedAt);
})
.catch(error => console.error('Error:', error));
```

---

### POST /admin/users/:userId/unblock
Unblock a user account. Unblocked users can access the system again.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**URL Parameters:**
- `userId`: The ID of the user to unblock

**Response (Success - 200):**
```json
{
  "message": "User unblocked successfully",
  "data": {
    "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "mobileNumber": "1234567890",
    "isBlocked": false,
    "blockedAt": null,
    "blockedReason": null
  }
}
```

**Error Responses:**

#### 400 Bad Request - User Already Unblocked
```json
{
  "message": "User is already unblocked"
}
```

#### 404 Not Found - User Not Found
```json
{
  "message": "User not found"
}
```

#### 401 Unauthorized - No Token
```json
{
  "message": "Access denied. No token provided."
}
```

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Example Usage:**

**Using cURL:**
```bash
curl -X POST http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/unblock \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Using JavaScript (Fetch API):**
```javascript
const token = localStorage.getItem('adminToken');
fetch('http://localhost:3000/admin/users/60f7b3b3b3b3b3b3b3b3b3b1/unblock', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => {
  console.log('User unblocked:', data);
  console.log('Is blocked:', data.data.isBlocked);
})
.catch(error => console.error('Error:', error));
```

**Notes:**
- Admin can block/unblock users to control access to the system
- Blocked users have `isBlocked: true` and a `blockedAt` timestamp
- Optional `reason` field can be provided when blocking a user
- Unblocking clears the blocked status, timestamp, and reason
- Blocked status is visible in all user endpoints (GET /admin/users, GET /admin/users/:userId, PUT /admin/users/:userId)
- This endpoint requires admin authentication token

---

## Notes

- All endpoints require `Content-Type: application/json` header
- Email and Password fields are required for both signup and login
- Passwords are stored in plain text (consider implementing password hashing for production)
- JWT tokens expire after 30 days - users will need to login again after expiration
- Set `JWT_SECRET` environment variable for production (defaults to a placeholder if not set)
- The base URL may vary depending on your server configuration
- Captcha settings APIs require JWT token authentication
- Captcha settings control how many captchas users can solve per day and the reward amount
- Reward type can be either "Coins" or "WalletBalance"
- Referral settings APIs require JWT token authentication
- Referral rewards are automatically calculated and distributed when a user signs up with a referral code
- Both the new user and the referrer receive rewards based on admin-configured settings
- Daily bonus settings APIs require JWT token authentication
- Daily bonuses reset automatically every week (Monday to Sunday cycle)
- Users can claim each day's bonus once per week
- Withdrawal request management APIs require JWT token authentication
- Admin can view all withdrawal requests with full user and payment details
- Admin can filter withdrawal requests by status (Pending, Approved, Rejected)
- When approving a withdrawal request, the amount stays deducted from user's wallet (already deducted when request was created)
- When rejecting a withdrawal request, the amount is automatically returned to user's wallet
- Admin can add notes when approving or rejecting withdrawal requests
- User management APIs require JWT token authentication
- Admin can view all users with pagination and search functionality
- Admin can get detailed information about individual users including statistics and withdrawal history
- Admin can edit user data including MobileNumber, Password, DeviceId, Coins, and WalletBalance
- All user edit operations validate uniqueness constraints and data types
- Password updates are automatically encrypted using crypto-js (AES encryption) and can be decrypted to retrieve the original password
- Edit response includes before/after values for all changed fields

---

## Coin Conversion Settings APIs

### POST /admin/coinconversion/settings
Set coin-to-RS (rupees) conversion rate and minimum coins required for conversion.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "CoinsPerRupee": 10,
  "MinimumCoinsToConvert": 100
}
```

**Note:**
- `CoinsPerRupee`: How many coins equal 1 rupee (must be > 0)
- `MinimumCoinsToConvert`: Minimum coins required to convert (must be >= 0)
- Example: If CoinsPerRupee = 10, then 100 coins = 10 rupees

**Response (Success - 200):**
```json
{
  "message": "Coin conversion settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "CoinsPerRupee": 10,
    "MinimumCoinsToConvert": 100,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Fields
```json
{
  "message": "CoinsPerRupee and MinimumCoinsToConvert are required"
}
```

#### 400 Bad Request - Invalid CoinsPerRupee
```json
{
  "message": "CoinsPerRupee must be greater than 0"
}
```

---

### GET /admin/coinconversion/settings
Get current coin-to-RS conversion settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Coin conversion settings retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "CoinsPerRupee": 10,
    "MinimumCoinsToConvert": 100,
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default values will be created (CoinsPerRupee: 1, MinimumCoinsToConvert: 100)

---

## Notes for Coin Conversion System

- Coin conversion settings APIs require JWT token authentication
- Admin can set how many coins equal 1 rupee
- Admin can set minimum coins required for conversion
- Users can convert their coins to rupees (RS) which are added to their wallet balance
- Conversion is irreversible - coins are deducted and rupees are added to wallet

---

## Scratch Card Settings APIs

### POST /admin/scratchcard/settings
Set scratch card reward amounts for each day of the week.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Sunday": 50,
  "Monday": 20,
  "Tuesday": 30,
  "Wednesday": 40,
  "Thursday": 25,
  "Friday": 35,
  "Saturday": 100,
  "RewardType": "Coins"
}
```

**Note:**
- All days (Sunday through Saturday) are required
- Each day's amount must be 0 or greater
- `RewardType`: Either "Coins" or "WalletBalance" (default: "Coins")
- Users can claim scratch card once per day
- Weekly reset happens automatically every Monday

**Response (Success - 200):**
```json
{
  "message": "Scratch card settings updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "Sunday": 50,
    "Monday": 20,
    "Tuesday": 30,
    "Wednesday": 40,
    "Thursday": 25,
    "Friday": 35,
    "Saturday": 100,
    "RewardType": "Coins",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Fields
```json
{
  "message": "All days (Sunday through Saturday) are required"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "All scratch card amounts must be 0 or greater"
}
```

---

### GET /admin/scratchcard/settings
Get current scratch card settings.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Scratch card settings retrieved successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "Sunday": 50,
    "Monday": 20,
    "Tuesday": 30,
    "Wednesday": 40,
    "Thursday": 25,
    "Friday": 35,
    "Saturday": 100,
    "RewardType": "Coins",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default values will be returned (all days: 0, RewardType: "Coins")

---

## Notes for Scratch Card System

- Scratch card settings APIs require JWT token authentication
- Admin can set different reward amounts for each day of the week
- Rewards can be in Coins or WalletBalance
- Users can claim scratch card once per day
- Weekly reset happens automatically every Monday
- Each user can only claim one scratch card per day

---

## Withdrawal Settings APIs

### POST /admin/withdrawal/threshold
Set the minimum withdrawal amount threshold.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "MinimumWithdrawalAmount": 500
}
```

**Note:**
- `MinimumWithdrawalAmount`: The minimum amount users must have in their wallet to make a withdrawal request (must be >= 1)
- This threshold is enforced when users submit withdrawal requests
- Users cannot withdraw amounts below this threshold

**Response (Success - 200):**
```json
{
  "message": "Withdrawal threshold updated successfully",
  "data": {
    "MinimumWithdrawalAmount": 500,
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Error Responses:**

#### 400 Bad Request - Missing Field
```json
{
  "message": "MinimumWithdrawalAmount is required"
}
```

#### 400 Bad Request - Invalid Value
```json
{
  "message": "MinimumWithdrawalAmount must be a valid number"
}
```

#### 400 Bad Request - Invalid Amount
```json
{
  "message": "MinimumWithdrawalAmount must be at least 1"
}
```

---

### GET /admin/withdrawal/threshold
Get the current minimum withdrawal amount threshold.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "Withdrawal threshold retrieved successfully",
  "data": {
    "MinimumWithdrawalAmount": 500,
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

**Note:** If no settings exist, default value will be created (MinimumWithdrawalAmount: 100)

---

## Notes for Withdrawal Settings System

- Withdrawal settings APIs require JWT token authentication
- Admin can set the minimum withdrawal amount that users must meet
- This threshold is enforced when users submit withdrawal requests
- Users will receive an error if they try to withdraw less than the minimum amount
- Default minimum withdrawal amount is 100 if not set by admin

---

## Admin Dashboard API

### GET /admin/dashboard
Get comprehensive dashboard statistics including total users, wallet balances, registration charts, and withdrawal statistics.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters:**
- `days` (optional): Number of days for registration chart (default: 30, max recommended: 365)

**Example:**
```
GET /admin/dashboard?days=30
```

**Response (Success - 200):**
```json
{
  "message": "Dashboard statistics retrieved successfully",
  "data": {
    "users": {
      "totalUsers": 1250,
      "todayRegistrations": 15,
      "recentRegistrations": 85
    },
    "wallet": {
      "totalWalletBalance": 125000.50,
      "totalCoins": 500000
    },
    "withdrawals": {
      "totalWithdrawals": 50000.00,
      "statistics": {
        "pending": {
          "count": 25,
          "totalAmount": 12500.00
        },
        "approved": {
          "count": 150,
          "totalAmount": 50000.00
        },
        "rejected": {
          "count": 10,
          "totalAmount": 3000.00
        }
      }
    },
    "registrationChart": {
      "days": 30,
      "data": [
        {
          "date": "2024-01-01",
          "registrations": 5
        },
        {
          "date": "2024-01-02",
          "registrations": 8
        },
        {
          "date": "2024-01-03",
          "registrations": 12
        }
      ]
    }
  }
}
```

**Response Fields:**

**Users Section:**
- `totalUsers`: Total number of registered users
- `todayRegistrations`: Number of users registered today
- `recentRegistrations`: Number of users registered in the last 7 days

**Wallet Section:**
- `totalWalletBalance`: Sum of all users' wallet balances
- `totalCoins`: Sum of all users' coins

**Withdrawals Section:**
- `totalWithdrawals`: Total amount of all approved withdrawals
- `statistics.pending`: Count and total amount of pending withdrawals
- `statistics.approved`: Count and total amount of approved withdrawals
- `statistics.rejected`: Count and total amount of rejected withdrawals

**Registration Chart Section:**
- `days`: Number of days included in the chart
- `data`: Array of daily registration counts
  - `date`: Date in YYYY-MM-DD format
  - `registrations`: Number of users registered on that date

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

#### 500 Internal Server Error
```json
{
  "message": "Internal Server Error",
  "error": "Error message details"
}
```

**Notes:**
- Dashboard API requires JWT token authentication
- Registration chart data includes all days in the specified range, with 0 for days with no registrations
- Total withdrawals amount only includes approved withdrawals
- All amounts are in the same currency as wallet balance
- The chart data is sorted chronologically from oldest to newest

---

## App Installation Reward Management APIs

### POST /admin/apps
Create a new app with reward coins.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "AppName": "Example App",
  "AppImage": "https://example.com/app-image.png",
  "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
  "RewardCoins": 50,
  "Difficulty": "Easy",
  "Status": "Active",
  "Description": "Install this app and earn coins!"
}
```

**Note:**
- `AppName`, `AppImage`, `AppDownloadUrl`, and `RewardCoins` are required
- `RewardCoins` must be 0 or greater
- `Difficulty` must be one of: "Easiest", "Easy", "Medium", "Hard" (default: "Medium")
- `Status` must be either "Active" or "Inactive" (default: "Active")
- `Description` is optional

**Response (Success - 200):**
```json
{
  "message": "App created successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "AppName": "Example App",
    "AppImage": "https://example.com/app-image.png",
    "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
    "RewardCoins": 50,
    "Difficulty": "Easy",
    "Status": "Active",
    "Description": "Install this app and earn coins!",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

---

### GET /admin/apps
Get all apps with optional filters.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Active", "Inactive")
- `difficulty`: Filter by difficulty ("Easiest", "Easy", "Medium", "Hard")
- `sortBy`: Sort by "reward" (highest paying first) or default (newest first)

**Example Request:**
```
GET /admin/apps?status=Active&difficulty=Easy&sortBy=reward
```

**Response (Success - 200):**
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
        "status": "Active",
        "description": "Install this app and earn coins!",
        "statistics": {
          "totalSubmissions": 25,
          "approvedSubmissions": 20,
          "pendingSubmissions": 5
        },
        "createdAt": "2024-01-18T20:00:00.000Z",
        "updatedAt": "2024-01-18T20:00:00.000Z"
      }
    ],
    "totalApps": 1
  }
}
```

---

### GET /admin/apps/:appId
Get detailed information about a specific app.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "App retrieved successfully",
  "data": {
    "appId": "60f7b3b3b3b3b3b3b3b3b3b1",
    "appName": "Example App",
    "appImage": "https://example.com/app-image.png",
    "appDownloadUrl": "https://play.google.com/store/apps/details?id=com.example",
    "rewardCoins": 50,
    "difficulty": "Easy",
    "status": "Active",
    "description": "Install this app and earn coins!",
    "statistics": {
      "totalSubmissions": 25,
      "approvedSubmissions": 20,
      "pendingSubmissions": 5,
      "rejectedSubmissions": 0
    },
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T20:00:00.000Z"
  }
}
```

---

### PUT /admin/apps/:appId
Update an existing app.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body (All fields optional):**
```json
{
  "AppName": "Updated App Name",
  "AppImage": "https://example.com/new-image.png",
  "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.new",
  "RewardCoins": 75,
  "Difficulty": "Medium",
  "Status": "Active",
  "Description": "Updated description"
}
```

**Response (Success - 200):**
```json
{
  "message": "App updated successfully",
  "data": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b1",
    "AppName": "Updated App Name",
    "AppImage": "https://example.com/new-image.png",
    "AppDownloadUrl": "https://play.google.com/store/apps/details?id=com.new",
    "RewardCoins": 75,
    "Difficulty": "Medium",
    "Status": "Active",
    "Description": "Updated description",
    "createdAt": "2024-01-18T20:00:00.000Z",
    "updatedAt": "2024-01-18T21:00:00.000Z"
  }
}
```

---

### DELETE /admin/apps/:appId
Delete an app (only if no submissions exist).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (Success - 200):**
```json
{
  "message": "App deleted successfully"
}
```

**Response (Error - 400):**
```json
{
  "message": "Cannot delete app. There are 25 submission(s) associated with this app."
}
```

---

### GET /admin/apps/submissions
Get all app installation submissions with optional filters.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Query Parameters (Optional):**
- `status`: Filter by status ("Pending", "Approved", "Rejected")
- `appId`: Filter by app ID
- `userId`: Filter by user ID
- `sortBy`: Sort by "oldest" or default (newest first)

**Example Request:**
```
GET /admin/apps/submissions?status=Pending&sortBy=oldest
```

**Response (Success - 200):**
```json
{
  "message": "App installation submissions retrieved successfully",
  "data": {
    "submissions": [
      {
        "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
        "userId": "60f7b3b3b3b3b3b3b3b3b3b1",
        "userMobileNumber": "1234567890",
        "userDeviceId": "device123",
        "userReferCode": "PRK08F9",
        "appId": "60f7b3b3b3b3b3b3b3b3b3b2",
        "appName": "Example App",
        "appImage": "https://example.com/app-image.png",
        "appRewardCoins": 50,
        "appDifficulty": "Easy",
        "screenshotUrl": "https://example.com/screenshot.png",
        "status": "Pending",
        "adminNotes": null,
        "createdAt": "2024-01-18T22:00:00.000Z",
        "updatedAt": "2024-01-18T22:00:00.000Z"
      }
    ],
    "totalSubmissions": 1,
    "pendingCount": 1,
    "approvedCount": 0,
    "rejectedCount": 0
  }
}
```

---

### POST /admin/apps/submissions/:submissionId/status
Approve or reject an app installation submission.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "Approved",
  "adminNotes": "Screenshot verified successfully"
}
```

OR for rejection:
```json
{
  "status": "Rejected",
  "adminNotes": "Screenshot does not show app installation"
}
```

**Response (Success - 200):**
```json
{
  "message": "Submission approved successfully",
  "data": {
    "submissionId": "60f7b3b3b3b3b3b3b3b3b3b3",
    "appName": "Example App",
    "rewardCoins": 50,
    "status": "Approved",
    "adminNotes": "Screenshot verified successfully",
    "userCoins": 150,
    "updatedAt": "2024-01-18T22:30:00.000Z"
  }
}
```

**Important Notes:**
- When a submission is **approved**: Reward coins are automatically added to the user's wallet
- When a submission is **rejected**: No coins are added, user can resubmit
- Admin can add notes when approving/rejecting
- Once a submission is processed (approved/rejected), it cannot be changed
- Users can only have one approved submission per app

---

## Notes for App Installation System

- App management APIs require JWT token authentication
- Admin can create, update, and delete apps with reward coins
- Apps can be filtered by difficulty (Easiest, Easy, Medium, Hard) and status (Active, Inactive)
- Apps can be sorted by highest paying (reward coins) or difficulty
- Users submit screenshots after installing apps
- Admin reviews and approves/rejects submissions
- When approved, reward coins are automatically added to user's wallet
- Users can only have one approved submission per app
- Users can resubmit if their submission was rejected
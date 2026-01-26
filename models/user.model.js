let mongoose = require('mongoose')

let schema = new mongoose.Schema({
    MobileNumber: {
        type: String,
        require: true,
        unique: true
    },
    Password: {
        type: String,
        require: true
    },
    DeviceId: {
        type: String,
        require: false,
        unique: false
    },
    ReferCode: {
        type: String,
        unique: true
    },
    Coins: {
        type: Number,
        default: 0
    },
    WalletBalance: {
        type: Number,
        default: 0
    },
    ReferredBy: {
        type: String,
        default: null
    }
})

module.exports = mongoose.model('user', schema)
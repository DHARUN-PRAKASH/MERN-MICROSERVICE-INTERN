const mongoose = require('mongoose')

var bank_account = new mongoose.Schema({
    username : {type:String},
    accountNumber : {type:Number},
    accountBalance : {type:Number},
    accountStatus : {typr:String},
});

module.exports = mongoose.model('bank_account',bank_account);
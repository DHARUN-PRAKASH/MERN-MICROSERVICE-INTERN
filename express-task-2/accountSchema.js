const mongoose = require('mongoose')

var bank_account = new mongoose.Schema({
    accountNumber : {type:Number},
    accountBalance : {type:Number},
    customer : {type:String},
    accountStatus : {typr:String}
});

module.exports = mongoose.model('bank_account',bank_account);
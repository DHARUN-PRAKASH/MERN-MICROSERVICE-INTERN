const mongoose = require('mongoose')

var account = new mongoose.Schema({
    username : {type:String},
    accountNumber : {type:Number},
    accountBalance : {type:Number},
    accountStatus : {typr:String},
});

module.exports = mongoose.model('account',account);
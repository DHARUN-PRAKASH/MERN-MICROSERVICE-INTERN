const mongoose = require('mongoose')

var Card = new mongoose.Schema({
    cardNumber : {type:Number},
    cvv : {type:Number},
    expiry : {type:String},
    status : {typr:String},
    accountNumber : {type:Number},
});

module.exports = mongoose.model('Card',Card);
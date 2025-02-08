require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db');
const account = require('./accountSchema');  // Fixed variable name issue
const Consul = require('consul');
const axios = require('axios')
const jwt = require("jsonwebtoken");
require('dotenv').config()
const bcrypt = require("bcryptjs");

const app = express();
app.use(bodyParser.json());

const consul = new Consul();
const serviceKey = "account";

// REGISTERING ACCOUNT SERVICE TO DISCOVERY SERVER
consul.agent.service.register({
    id: serviceKey,
    name: serviceKey,
    address: "localhost",
    port: 4000
}, (err) => {
    if (err) throw err;
    console.log('Account Service successfully registered');
});

// DEREGISTER SERVICE ON PROCESS EXIT
process.on("SIGINT", async () => {
    consul.agent.service.deregister(serviceKey, () => {
        console.log("Account service deregistered");
        process.exit();
    });
});

// TOKEN VERFICATION 
let token = ''
const authenticateToken=(req,res,next)=>{
    const receivedHeader = req.headers['authorization']
    if(!receivedHeader){
        return res.json({message:"No header has provided"})
    }
    // fetch the token alone from header using split by space delimiter
    token = receivedHeader.split(' ')[1]
    jwt.verify(token,process.env.secret,(err,decoded)=>{
        if(err){
            return res.json({message:"Unauthorized Access/ Invalid Token"})
        }
        req.user = decoded
        next()
    })
}

// forward Token
const authForward = (req,res,next)=>{
    const header = req.headers['authorization']
    if(header){
        req.headers['authorization']=header
        // create an new header with same value for forwarding to the service
    }
    next()// forwarding invoked
}


// ADD ACCOUNT

const SECRET_KEY = process.env.JWT_SECRET;
 // Load secret key from .env

 app.post('/',authenticateToken, async (req, res) => {
    try {
        const obj = new account({
            username: req.body.username,
            accountNumber: req.body.accountNumber,
            accountBalance: req.body.accountBalance,
            accountStatus: req.body.accountStatus,
        });
        const result = await obj.save();
        res.json({ message: "Account Created", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ACCOUNT ONLY
// app.get('/', async (req, res) => {
//     try {
//         const accounts = await account.find();
//         res.json(accounts);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// GET ACCOUNT BY ID 
app.get('/:id', authenticateToken,async (req, res) => {
    try {
        const acc = await account.findById(req.params.id);
        if (!acc) return res.status(404).json({ message: "Account not found" });
        res.json(acc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE ACCOUNT BY ID 
app.put('/:id', authenticateToken,async (req, res) => {
    try {
        const updatedAccount = await account.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAccount) return res.status(404).json({ message: "Account not found" });
        res.json({ message: "Account Updated", updatedAccount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//DELETE AACCOUNT BY ID

app.delete('/:id',authenticateToken, async (req, res) => {
    try {
        const deletedAccount = await account.findByIdAndDelete(req.params.id);
        if (!deletedAccount) return res.status(404).json({ message: "Account not found" });
        res.json({ message: "Account Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ACCOUNT BY ACCOUNT NUMBER
app.get('/accountNumber/:acc_no',authenticateToken, async (req, res) => {
    try {
        const acc = await account.findOne({ accountNumber: req.params.acc_no });
        if (!acc) return res.status(404).json({ message: "Account not found" });
        res.json(acc);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ACCOUNT FROM USERNAME 

app.get('/username/:username',authenticateToken,async(req,res)=>{
  const list = await account.find({username:req.params.username})
  res.json(list)
})

// GET ALL ACCOUNT AND CARD 

app.get('/',authenticateToken,async(req,res)=>{
  var acc = await account.find()
  const services = await consul.catalog.service.nodes('card')
  if(services.length==0)
      throw new Error("card service not registered in consul")
  const accServ = services[0]
  const updatedExperts = await Promise.all(
      acc.map(async(each)=>{
          let customer_account = []
          try{
              const received = await axios.get(`http://${accServ.Address}:${accServ.ServicePort}/accountNumber/${each.accountNumber}`)
              customer_account = received.data
          }
          catch(error){return res.json({message:"Error fetching card"})}
          // building new response json for each expert
          return {"Account":each,"Card":customer_account}
      })
  )
  res.json(updatedExperts)
})


// Start Server
app.listen(4000, () => {
    console.log('Account Running on 4000');
});

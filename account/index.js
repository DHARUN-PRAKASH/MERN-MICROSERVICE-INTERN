const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db');
const BankAccount = require('./accountSchema');  // Fixed variable name issue
const Consul = require('consul');
const axios = require('axios')

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

// 🔹 CREATE - Add a new bank account
app.post('/account', async (req, res) => {
    try {
        const obj = new BankAccount({
            username: req.body.username,
            accountNumber: req.body.accountNumber,
            accountBalance: req.body.accountBalance,
            accountStatus: req.body.accountStatus,
            card: req.body.card || []  // Default to empty array if no cards provided
        });
        const result = await obj.save();
        res.json({ message: "Account Created", result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 READ - Get all bank accounts
app.get('/account', async (req, res) => {
    try {
        const accounts = await BankAccount.find();
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 READ - Get bank account by ID
app.get('/account/:id', async (req, res) => {
    try {
        const account = await BankAccount.findById(req.params.id);
        if (!account) return res.status(404).json({ message: "Account not found" });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 🔹 UPDATE - Edit bank account by ID
app.put('/account/:id', async (req, res) => {
    try {
        const updatedAccount = await BankAccount.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedAccount) return res.status(404).json({ message: "Account not found" });
        res.json({ message: "Account Updated", updatedAccount });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//DELETE
app.delete('/account/:id', async (req, res) => {
    try {
        const deletedAccount = await BankAccount.findByIdAndDelete(req.params.id);
        if (!deletedAccount) return res.status(404).json({ message: "Account not found" });
        res.json({ message: "Account Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ACCOUNT BY ACCOUNT NUMBER
app.get('/accountNumber/:acc_no', async (req, res) => {
    try {
        const account = await BankAccount.findOne({ accountNumber: req.params.acc_no });
        if (!account) return res.status(404).json({ message: "Account not found" });
        res.json(account);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ACCOUNT FROM USERNAME 

app.get('/username/:username',async(req,res)=>{
  const list = await BankAccount.find({username:req.params.username})
  res.json(list)
})

// GET ALL ACCOUNT AND CARD 

app.get('/',async(req,res)=>{
  var acc = await BankAccount.find()
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

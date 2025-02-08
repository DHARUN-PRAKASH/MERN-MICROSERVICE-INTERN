const express = require('express');
const bodyParser = require('body-parser');
const Card = require('./cardSchema');
const mongoose = require('./db');
const Consul = require('consul');
const jwt = require("jsonwebtoken");
require('dotenv').config()
const bcrypt = require("bcryptjs");

const app = express();
app.use(bodyParser.json());


const consul = new Consul();
const serviceKey = "card";

// REGISTERING ACCOUNT SERVICE TO DISCOVERY SERVER
consul.agent.service.register({
    id: serviceKey,
    name: serviceKey,
    address: "localhost",
    port: 7000
}, (err) => {
    if (err) throw err;
    console.log('Card Service successfully registered');
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

// ADD NEW CARD

app.post('/',authenticateToken, async (req, res) => {
    try {
        const card = new Card(req.body);
        await card.save();
        res.json({ message: "Card Created", card });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET ALL CARDS
app.get('/',authenticateToken,async (req, res) => {
    try {
        const cards = await Card.find();
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//GET CARD BY ID
app.get('/:id',authenticateToken, async (req, res) => {
    try {
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).json({ message: "Card not found" });
        res.json(card);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// UPDATE CARD BY ID 

app.put('/:id',authenticateToken, async (req, res) => {
    try {
        const updatedCard = await Card.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedCard) return res.status(404).json({ message: "Card not found" });
        res.json({ message: "Card Updated", updatedCard });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE CARD BY ID

app.delete('/:id',authenticateToken, async (req, res) => {
    try {
        const deletedCard = await Card.findByIdAndDelete(req.params.id);
        if (!deletedCard) return res.status(404).json({ message: "Card not found" });
        res.json({ message: "Card Deleted" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET CARD BY ACCOUNT NUMBER 

app.get('/accountNumber/:accountNumber',authenticateToken,async(req,res)=>{
    const list = await Card.find({accountNumber:req.params.accountNumber})
    res.json(list)
  })

// Start Server
app.listen(7000, () => {
    console.log("Card Running on 7000");
});

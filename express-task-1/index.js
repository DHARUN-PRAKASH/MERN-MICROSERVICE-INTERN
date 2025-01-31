const express = require('express');
const bodyParser = require('body-parser');
const customer = require('./customerSchema');
const mongoose = require('./db');

const app = express();
app.use(bodyParser.json());

// POST CUSTOMER
app.post('/',async(req,res)=>{
  const obj = new customer({
      fullname:req.body.fullname,
      username:req.body.username,
      password:req.body.password,
      aadhaar:req.body.aadhaar,
      pan:req.body.pan,
      contact:req.body.contact,
      email:req.body.emailx
  })
  const result = await obj.save()
  res.json(result)
})

// READ CUSTOMER

app.get('/',async(req,res)=>{
  const experts = await customer.find()
  res.json(experts)
})

// READ THE CUTOMER BY ID 
app.get('/:id',async(req,res)=>{
  const fetched = await customer.findById(id=req.params.id)
  res.json(fetched)
})

// UPDATE CUSTOMER NY ID 

app.put('/',async(req,res)=>{
  const result = await customer.updateOne({_id:req.body._id},req.body,{upsert:true})
  res.json(result)
})

// DELETE CUSTOMER BY ID 

app.delete('/:id',async(req,res)=>{
  await customer.findOneAndDelete(id=req.params.id)
  res.json("Deleted ")
})

// GET CUSTOMER BY AADHAR

app.get('/aadhar/:aadharNumber',async(req,res)=>{
  const list = await customer.find({aadhaar:req.params.aadharNumber})
  res.json(list)
})


app.listen(3000, () => {
    console.log('Express Running !!!');
});

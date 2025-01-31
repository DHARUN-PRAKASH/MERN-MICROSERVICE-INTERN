const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./db');
const back_account = require('./accountSchema')

const app = express();
app.use(bodyParser.json());

// POST BACK ACCOUNT

app.post('/',async(req,res)=>{
  const obj = new back_account({
      accountNumber:req.body.accountNumber,
      accountBalance:req.body.accountBalance,
      customer:req.body.customer,
      accountStatus:req.body.accountStatus,
  })
  const result = await obj.save()
  res.json(result)
})

// READ back_account

app.get('/',async(req,res)=>{
  const experts = await back_account.find()
  res.json(experts)
})

// READ THE CUTOMER BY ID 
app.get('/:id',async(req,res)=>{
  const fetched = await back_account.findById(id=req.params.id)
  res.json(fetched)
})

// UPDATE back_account NY ID 

app.put('/',async(req,res)=>{
  const result = await back_account.updateOne({_id:req.body._id},req.body,{upsert:true})
  res.json(result)
})

// DELETE back_account BY ID 

app.delete('/:id',async(req,res)=>{
  await back_account.findOneAndDelete(id=req.params.id)
  res.json("Deleted ")
})

// GET back_account BY AADHAR

app.get('/accountNumber/:acc_no',async(req,res)=>{
  const list = await back_account.find({accountNumber:req.params.acc_no})
  res.json(list)
})


app.listen(4000, () => {
    console.log('Express Running !!!');
});

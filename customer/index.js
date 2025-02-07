const express = require('express');
const bodyParser = require('body-parser');
const customer = require('./customerSchema');
const mongoose = require('./db');
const Consul = require('consul')
const consul = new Consul
const axios = require('axios')

const app = express();
app.use(bodyParser.json());

const serviceKey = "customer"


// REGISTERING CUSTOMER TO DISCOVERY SERVER
consul.agent.service.register({
  id:serviceKey,
  name:serviceKey,
  address:"localhost",
  port:6000
},
(err)=>{
  if(err)
      throw err;
  console.log('Customer Service successfully registered')
})
// deregister from consul discovery server whenever ctrl+c/ interruption happens
process.on("SIGINT",async()=>{
  consul.agent.service.deregister(serviceKey,()=>{
      if(err)
          throw err
      console.log("Customer service deregistered")
  })
})

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

// app.get('/',async(req,res)=>{
//   const experts = await customer.find()
//   res.json(experts)
// })

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

// GET CUSTOMER BY USERNAME

app.get('/username/:username',async(req,res)=>{
  const list = await customer.find({username:req.params.username})
  res.json(list)
})

app.get('/',async(req,res)=>{
  var cust = await customer.find()
  const services = await consul.catalog.service.nodes('account')
  if(services.length==0)
      throw new Error("account service not registered in consul")
  const accServ = services[0]
  const updatedExperts = await Promise.all(
      cust.map(async(each)=>{
          let customer_account = []
          try{
              const received = await axios.get(`http://${accServ.Address}:${accServ.ServicePort}/username/${each.username}`)
              customer_account = received.data
          }
          catch(error){return res.json({message:"Error fetching account"})}
          // building new response json for each expert
          return {"Customer":each,"Account":customer_account}
      })
  )
  res.json(updatedExperts)
})

app.listen(6000, () => {
    console.log('Customer Running !!!');
});

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

// Database connection
mongoose.connect("mongodb+srv://dharunprakash:12345@cluster0.tttb0r3.mongodb.net/microservices?retryWrites=true&w=majority&appName=Cluster0");


// Bank Customer Schema
var Customer = new mongoose.Schema({
  fullname: { type: String },
  username: { type: String },
  password: { type: String },
  aadhaar: { type: Number },
  pan: { type: String },
  contact: { type: Number },
  email: { type: String }
});

const CustomerModel = mongoose.model('Customer', Customer);

const app = express();
app.use(bodyParser.json());

// Create a customer
app.post('/customers', async (req, res) => {
  try {
    const customer = new CustomerModel(req.body);
    await customer.save();
    res.status(201).send(customer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Get all customers
app.get('/customers', async (req, res) => {
  try {
    const customers = await CustomerModel.find({});
    res.status(200).send(customers);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get a customer by ID
app.get('/customers/:id', async (req, res) => {
  try {
    const customer = await CustomerModel.findById(req.params.id);
    if (!customer) {
      return res.status(404).send();
    }
    res.status(200).send(customer);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a customer by ID
app.put('/customers/:id', async (req, res) => {
  try {
    const customer = await CustomerModel.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) {
      return res.status(404).send();
    }
    res.status(200).send(customer);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a customer by ID
app.delete('/customers/:id', async (req, res) => {
  try {
    const customer = await CustomerModel.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).send();
    }
    res.status(200).send(customer);
  } catch (error) {
    res.status(500).send(error);
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

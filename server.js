const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB successfully!'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Create a Database Model for Subscribers
const SubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  date: { type: Date, default: Date.now }
});
const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

// Create a Database Model for Menu Items
const MenuItemSchema = new mongoose.Schema({
  id: Number,
  name: String,
  subtitle: String,
  description: String,
  price: Number,
  rating: Number,
  reviews: Number,
  image: String,
  badge: String,
  badgeColor: String,
  tags: [String],
  spice: Number
});
const MenuItem = mongoose.model('MenuItem', MenuItemSchema);

// Subscription Route
app.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  
  try {
    const newSubscriber = new Subscriber({ email });
    await newSubscriber.save();
    console.log(`New subscriber saved: ${email}`);
    res.status(200).json({ message: 'Successfully subscribed!' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email is already subscribed' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Menu Routes
app.get('/api/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.status(200).json(menuItems);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching menu' });
  }
});

app.post('/api/menu', async (req, res) => {
  try {
    const newItem = new MenuItem(req.body);
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Error adding menu item' });
  }
});

app.delete('/api/menu/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting menu item' });
  }
});

// Seed Route (Call this once to load initial data)
app.post('/api/seed-menu', async (req, res) => {
  try {
    const count = await MenuItem.countDocuments();
    if (count > 0) return res.status(400).json({ message: 'Menu already seeded!' });
    
    // We will send the items from the frontend to seed them
    await MenuItem.insertMany(req.body.items);
    res.status(200).json({ message: 'Menu seeded successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding menu' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
});

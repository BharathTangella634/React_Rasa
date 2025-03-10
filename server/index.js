const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://root:bharathMongoDB@cluster-1.n5rhi.mongodb.net/event_bot", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Define user schema and model
const userSchema = new mongoose.Schema({
  teckziteId: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  registered_events: [{ type: String }] // Array of event IDs
});
const User = mongoose.model('User', userSchema);

// Define event schema and model
const eventSchema = new mongoose.Schema({
  event_id: { type: String, required: true, unique: true },
  event_name: { type: String, required: true },
  event_time: { type: String, required: true },
  event_location: { type: String, required: true },
  rules: { type: String, required: true },
  guidelines: { type: String, required: true }
});
const Event = mongoose.model('Event', eventSchema);

// Login route
app.post('/login', async (req, res) => {
  const { teckziteId, password } = req.body;
  
  console.log(password);
  // Validate input
  if (!teckziteId || !password) {
    return res.status(400).json({ message: 'Teckzite ID and password are required' });
  }

  // Check if user exists
  const user = await User.findOne({ teckzite_id: teckziteId, password: password });
  console.log(user);
  if (!user) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user._id, teckzite_id: user.teckzite_id, name: user.name },
    "abcd",
    { expiresIn: '1h' }  // Token expires in 1 hour (you can adjust this as needed)
  );
  res.json({ message: 'Login successful', token });
});

// Get user details route
app.post("/get-user-details", async (req, res) => {
  try {
      const { teckzite_id } = req.body; // Expect teckzite_id from the frontend
      const user = await User.findOne({ teckzite_id: teckzite_id });

      if (!user) return res.status(404).json({ error: "User not found" });

      res.json(user); // Send user details to frontend
  } catch (error) {
      res.status(500).json({ error: "Server error" });
  }
});

// Get event details route
app.post("/get-event-details", async (req, res) => {
  try {
    const { event_ids } = req.body; // Expect an array of event IDs from the frontend

   

    
    // Fetch event details for the provided event IDs
    const events = await Event.find({ event_id: { $in: event_ids } });

    // Create a map of found events for quick lookup
    const eventMap = new Map();
    events.forEach(event => {
      eventMap.set(event.event_id, event);
    });

    // Construct the response with all requested event IDs
    const response = event_ids.map(event_id => {
      if (eventMap.has(event_id)) {
        return eventMap.get(event_id); // Return the event details if found
      } else {
        return { 
          event_id, 
          event_name: "Event not found", 
          event_time: "N/A", 
          event_location: "N/A", 
          rules: "N/A", 
          guidelines: "N/A" 
        }; // Return a placeholder for non-matching IDs
      }
    });

    console.log(response);

    res.json(response); // Send the response to the frontend
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

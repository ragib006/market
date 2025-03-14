const express = require("express");

const app = express();

const dotenv = require('dotenv');

const connectDB = require('./config/db.js')
const mongoose = require('mongoose')


const nodemailer = require("nodemailer");


dotenv.config()
app.use(express.json());


//mongoose.connect("mongodb+srv://ragibhasan006:01773672495@cluster0.urzdc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
 // .then(() => console.log("Connected to MongoDB"))
 // .catch(err => console.error("MongoDB connection error:", err));

 // mongoose.connect("mongodb+srv://ragibhasa006:01773672495@cluster0.d5mp5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
 // .then(() => console.log("Connected to MongoDB"))
 // .catch(err => console.error("MongoDB connection error:", err));
 mongoose.connect(process.env.MONGODB_URI)
 .then(() => console.log("Connected to MongoDB"))
 .catch((err) => console.error("MongoDB connection error:", err));
 
  

// Define User Schema
const User = mongoose.model("User", new mongoose.Schema({
  name: String,
  email: String,
  sendstatus: { type: Number, default: 0 }, // Default value 0
}));


const Content = mongoose.model("Content", new mongoose.Schema({
  description: { type: String, required: true, maxlength: 5000 } // Max length 5000 characters

}));



// Route to fetch all users
app.get("/getjob", async (req, res) => {
  try {
    const users = await Content.find(); // Fetch all users from the database

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found!" });
    }

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});




// Route to fetch all users
//app.get("/user", async (req, res) => {
 // try {
  // const users = await User.find(); // Fetch all users from the database

  //  if (users.length === 0) {
  //    return res.status(404).json({ message: "No users found!" });
  //  }

 //   res.status(200).json({ users });
 // } catch (error) {
 //   console.error("Error fetching users:", error);
 //   res.status(500).json({ message: "Internal server error" });
 // }
//});


// Route to fetch all users and categorize them based on sendstatus
app.get("/getuser", async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users from the database
    const userCount = await User.countDocuments(); // Count the total number of users

    // Count users where sendstatus = 1 (sent email)
    const sentEmailCount = await User.countDocuments({ sendstatus: 1 });

    // Count users where sendstatus = 0 (pending email)
    const pendingEmailCount = await User.countDocuments({ sendstatus: 0 });

    if (users.length === 0) {
      return res.status(404).json({ message: "No users found!" });
    }

    res.status(200).json({
      users,
      totalUsers: userCount, // Total number of users
      sentEmailCount, // Number of users who have sendstatus = 1 (sent email)
      pendingEmailCount, // Number of users who have sendstatus = 0 (pending email)
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


app.delete("/delete", async (req, res) => {
  try {
    // Delete all users from the User collection
    const result = await User.deleteMany({});

    res.status(200).json({
      message: `${result.deletedCount} user(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Route to add a new user
app.post("/adduser", async (req, res) => {
  try {
    // Assuming the user data is sent in the body of the request (req.body)
    const { name, email } = req.body;

    // Create a new user object
    const newUser = new User({
      name, 
      email
  
    });

    // Save the new user to the database
    await newUser.save();

    res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});









//const contents = ["Content 1", "Content 2", "Content 3"];

const contents = [
  "Hello! We have an exciting opportunity for you.",
  "Let's collaborate on something amazing!",
  "I would love to discuss working together.",
];


console.log(contents.join("\n\n")); 





 const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ✅ Function to Send Emails
const sendEmails = async () => {
  try {
    const user = await User.findOne({ sendstatus: 0 });
    if (!user) {
      console.log("🎉 No users with pending emails.");
      return;
    }

    const firstName = user.name.split(" ")[0];
    const content = contents[Math.floor(Math.random() * contents.length)];

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Dear ${firstName}, Let's Connect!`,
      text: content,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to: ${user.email}`);

    await User.updateOne({ _id: user._id }, { $set: { sendstatus: 1 } });
    console.log(`✅ Updated sendstatus for: ${user.email}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
  }
};

// ✅ Automatically Send Emails on Server Start


const startEmailJob = () => {
  sendEmails(); // Send email immediately on startup
  setInterval(sendEmails, 120000); // Send an email every 2 minutes (120,000 ms)
};

startEmailJob();

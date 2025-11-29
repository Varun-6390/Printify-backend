const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

const URL = process.env.MONGODB_URI;

// CORS FIX
const allowedOrigins = [
  "https://printify-frontend-mu.vercel.app",
  "https://printify-frontend-6g2uko344-varuns-projects-b59fc639.vercel.app",
  "http://localhost:5173"
];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) {
//         console.log("✅ Allowed Origin:", origin);
//         callback(null, true);
//       } else {
//         console.log("❌ BLOCKED ORIGIN:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      // Allow ALL Vercel deployments + localhost
      if (
        origin.includes("vercel.app") ||
        origin === "http://localhost:5173"
      ) {
        console.log("✅ Allowed Origin:", origin);
        callback(null, true);
      } else {
        console.log("❌ BLOCKED ORIGIN:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// Connect MongoDB
mongoose.connect(URL)
  .then(() => console.log("Database Connected"))
  .catch(() => console.log("Not Connected"));

// ROUTES
app.use('/api/user', require('./Routes/userRoute'));
app.use('/api/admin', require('./Routes/adminRoute'));
app.use('/api/order', require('./Routes/orderRoute'));
app.use('/api/department', require('./Routes/departmentRoute'));
app.use('/api/section', require('./Routes/sectionRoute'));
app.use('/api/settings', require('./Routes/settingsRoute'));

app.listen(PORT, () => {
  console.log("Server is running");
});

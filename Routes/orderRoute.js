const express = require('express');
const router = express.Router();
const aws = require("aws-sdk");        // AWS v2
const multer = require("multer");
const multerS3 = require("multer-s3"); // Works with aws-sdk v2
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");
const Order = require('../Models/Order');
const Settings = require("../Models/Settings");

// AWS CONFIG (v2)
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new aws.S3();

// MULTER-S3 STORAGE
const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, `uploads/${Date.now()}_${file.originalname}`);
    },
  }),
}).single("document");

// =======================
// ORDER CREATE API
// =======================
router.post("/", (req, res) => {
  upload(req, res, async (err) => {

    console.log("UPLOAD ERR:", err);
    console.log("FILE:", req.file);
    console.log("BODY:", req.body);

    if (err) {
      return res.status(400).json({ message: "Upload failed", error: err });
    }

    if (!req.file) {
      return res.status(400).json({ message: "File missing" });
    }

    try {
      const printOptions = JSON.parse(req.body.options || "{}");
      const userId = req.body.userId;

      let pageCount = 1;
      const fileURL = req.file.location;

      // COUNT PDF PAGES
      if (req.file.mimetype === "application/pdf") {
        const fileResponse = await axios.get(fileURL, { responseType: "arraybuffer" });
        const pdfDoc = await PDFDocument.load(fileResponse.data);
        pageCount = pdfDoc.getPageCount();
      }

      // PRICING SETTINGS
      const settings = await Settings.findOne();
      const copies = Number(printOptions.copies) || 1;

      let pricePerPage =
        printOptions.color === "bw"
          ? (printOptions.sides === "single" ? settings.bwSingle : settings.bwDouble)
          : (printOptions.sides === "single" ? settings.colorSingle : settings.colorDouble);

      const totalCost = pricePerPage * pageCount * copies;

      // SAVE ORDER
      const order = await Order.create({
        user: userId,
        fileURL,
        pageCount,
        printOptions: {
          ...printOptions,
          price: totalCost,
          status: "pending",
        },
      });

      res.status(201).json({ message: "Order created", order, totalCost });

    } catch (error) {
      console.log("CREATE ORDER ERROR:", error);
      res.status(500).json({ message: "Server error" });
    }
  });
});

// ===========================
// GET ALL ORDERS (Admin Page)
// ===========================
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort("-createdAt");
    res.json(orders);
  } catch (err) {
    console.error("GET ALL ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error fetching all orders" });
  }
});

// ============================================================
// GET USER ORDERS (User Dashboard)
// /api/order/order?user=USER_ID
// ============================================================
router.get("/order", async (req, res) => {
  try {
    const userId = req.query.user;
    if (!userId) return res.status(400).json({ message: "User ID missing" });

    const orders = await Order.find({ user: userId }).sort("-createdAt");
    res.json(orders);
  } catch (err) {
    console.error("GET USER ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error fetching user orders" });
  }
});

// ===========================
// GET PENDING ORDERS (Admin)
// ===========================
router.get("/pending", async (req, res) => {
  try {
    const orders = await Order.find({ "printOptions.status": "pending" }).sort("-createdAt");
    res.json(orders);
  } catch (err) {
    console.error("GET PENDING ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error fetching pending orders" });
  }
});

// ==============================
// GET COMPLETED ORDERS (Admin)
// ==============================
router.get("/complete", async (req, res) => {
  try {
    const orders = await Order.find({ "printOptions.status": "completed" })
      .populate("user")
      .sort("-createdAt");

    res.json(orders);
  } catch (err) {
    console.error("GET COMPLETED ORDERS ERROR:", err);
    res.status(500).json({ message: "Server error fetching completed orders" });
  }
});

// ===========================
// DEBUG – View all orders raw
// ===========================
router.get("/debug", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Debug route error" });
  }
});

// ============================================
// SINGLE ORDER BY ID (IMPORTANT: KEEP LAST!)
// ============================================
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user");
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    console.error("GET ORDER BY ID ERROR:", err);
    res.status(500).json({ message: "Server error fetching order by ID" });
  }
});

// ============================
// GET SINGLE ORDER DETAILS (Admin)
// /api/order/order/:id
// ============================
router.get("/order/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email mobile");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    console.error("GET ORDER BY ID ERROR:", err);
    res.status(500).json({ message: "Server error fetching order" });
  }
});



// ============================
// UPDATE ORDER STATUS (Admin)
// /api/order/status/:id
// ============================
router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { "printOptions.status": status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Status updated", order });

  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    res.status(500).json({ message: "Server error updating status" });
  }
});



// ============================
// DELETE ORDER
// ============================
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Order.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order deleted" });

  } catch (err) {
    res.status(500).json({ message: "Error deleting order" });
  }
});



// ============================
// MUST BE THE LAST ROUTE
// GET ORDER BY ID (simple fallback)
// ============================
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching order" });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const Order = require('../Models/Order');
const Settings = require("../Models/Settings");

// =====================
// MULTER STORAGE CONFIG
// =====================
const storage = multer.diskStorage({
  destination: './upload/',
  filename: function (req, file, cb) {
    cb(null, `doc-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50000000 },
  fileFilter: function (req, file, cb) {
    const filetypes = /pdf|doc|docx|jpg|jpeg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) return cb(null, true);
    cb("Error: Only pdf, doc, docx, jpg, jpeg allowed!");
  }
}).single('document');

// ORDER CREATE ROUTE (fixed)
router.post('/', (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err });
    if (!req.file) return res.status(400).json({ message: "No file selected!" });

    try {
      const printOptions = JSON.parse(req.body.options || "{}");
      const userId = req.body.userId;
      let pageCount = 1;

      // COUNT PDF PAGES IF PDF FILE
      if (req.file.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfDoc = await PDFDocument.load(dataBuffer);
        pageCount = pdfDoc.getPageCount(); // <--- update outer variable (no re-declaration)
      }

      // FETCH PRICING SETTINGS
      const settings = await Settings.findOne();
      if (!settings) return res.status(500).json({ message: "Pricing settings missing!" });

      // Ensure copies is a number
      const copies = Number(printOptions.copies) || 1;

      // Pricing Logic
      let pricePerPage = 0;
      if (printOptions.color === "bw") {
        pricePerPage = printOptions.sides === "single" ? settings.bwSingle : settings.bwDouble;
      } else {
        pricePerPage = printOptions.sides === "single" ? settings.colorSingle : settings.colorDouble;
      }

      const totalCost = pricePerPage * pageCount * copies;

      // SAVE ORDER
      const newOrder = new Order({
        user: userId,
        fileURL: req.file.path,
        pageCount,
        printOptions: {
          ...printOptions,
          price: totalCost,
          status: "pending"
        }
      });

      const savedOrder = await newOrder.save();

      res.status(201).json({
        message: "Order created successfully!",
        order: savedOrder,
        pageCount,
        totalCost
      });

    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Server error while creating the order." });
    }
  });
});


// =============================
//  REMAINING ROUTES (UNCHANGED)
// =============================
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching orders.' });
  }
});

router.get('/order', async (req, res) => {
  const user = req.query.user;
  try {
    const orders = await Order.find({ user: user }).sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/debug', async (req, res) => {
  const orders = await Order.find();
  res.json(orders);
});

router.get('/pending', async (req, res) => {
  try {
    const orders = await Order.find({ "printOptions.status": 'pending' });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pending orders.' });
  }
});

router.get('/complete', async (req, res) => {
  try {
    const orders = await Order.find({ "printOptions.status": 'completed' }).populate({
      path: "user",
      populate: [
        { path: "department" },
        { path: "section" }
      ],
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching completed orders.' });
  }
});

router.put('/pending/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { "printOptions.status": "completed" },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error updating order.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });
    res.json({ message: "Deleted Successfully" });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting order.' });
  }
});

router.put("/status/:id", async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { "printOptions.status": status },
      { new: true }
    );

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Status Updated", order });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/order/:id", async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("user", "name email mobile");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

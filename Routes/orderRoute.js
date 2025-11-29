const express = require('express');
const router = express.Router();
const multer = require("multer");
const { PDFDocument } = require("pdf-lib");
const axios = require("axios");  // for fetching file from S3
const Order = require('../Models/Order');
const Settings = require("../Models/Settings");
const { S3Client } = require("@aws-sdk/client-s3");
const multerS3 = require("multer-s3");
require("dotenv").config();

// AWS S3 CLIENT (v3)
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// MULTER-S3 STORAGE
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `uploads/${Date.now()}_${file.originalname}`);
    }
  })
}).single("document");


// ORDER CREATE
router.post('/', (req, res) => {
  upload(req, res, async (err) => {

  console.log("UPLOAD ERROR:", err);
  console.log("REQ.FILE:", req.file);
  console.log("REQ.BODY:", req.body);

  if (err) {
    return res.status(400).json({ message: "Upload failed", error: err.message || err });
  }

  if (!req.file) {
    return res.status(400).json({ message: "No file selected!", error: "req.file missing" });
  }

    try {
      const printOptions = JSON.parse(req.body.options || "{}");
      const userId = req.body.userId;
      let pageCount = 1;
      const fileURL = req.file.location;

      // PDF PAGE COUNT (download from S3)
      if (req.file.mimetype === "application/pdf") {
        const response = await axios.get(fileURL, { responseType: "arraybuffer" });
        const pdfDoc = await PDFDocument.load(response.data);
        pageCount = pdfDoc.getPageCount();
      }

      // FETCH SETTINGS
      const settings = await Settings.findOne();
      if (!settings) return res.status(500).json({ message: "Pricing settings missing!" });

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
        fileURL,
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


module.exports = router;
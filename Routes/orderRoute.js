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

module.exports = router;

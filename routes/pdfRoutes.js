const express = require("express");
const router = express.Router();
const {
  generateTeachingReportPDF,
  generateResearchReportPDF,
  generateServiceReportPDF,
  generateConsolidatedReportPDF
} = require("../controllers/pdfController");

const authenticate = require("../middleware/authenticate");

router.get("/pdf/teaching",authenticate, generateTeachingReportPDF);
router.get("/pdf/research", authenticate,generateResearchReportPDF);
router.get("/pdf/service", authenticate,generateServiceReportPDF);
router.get("/pdf/consolidated",authenticate, generateConsolidatedReportPDF);

module.exports = router;

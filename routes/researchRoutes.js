const express = require("express");
const router = express.Router();
const {
  upload
} = require("../config/cloudinary");
const authenticate = require("../middleware/authenticate");

const {
  calculateSciePaper,
  calculateScopusPaper,
  calculateAictePaper,
  calculateScopusBook,
  calculateIndexedBook,
  calculatePatentMarks,
  calculatehIndex,
  calculateIIndex,
  calculateCitation,
  calculateConsultancy,
  calculateForeignMarks,
  calculateSeedFund,
  calculateFundedProjectMarks,
  calculateResearchScholarMarks


} = require("../controllers/researchController");

router.post("/scie/:designation", upload.array("sciePaperFiles", 1), authenticate, calculateSciePaper);
router.post("/scopus/:designation", upload.array("scopusPaperFiles", 1), authenticate, calculateScopusPaper);
router.post("/aicte/:designation", upload.array("AicteFiles", 1), authenticate, calculateAictePaper);
router.post("/scopusBook/:designation", upload.array("ScopusFiles", 1), authenticate, calculateScopusBook);
router.post("/IndexedBook/:designation", upload.array("IndexFiles", 1), authenticate, calculateIndexedBook);
router.post("/Patent/:designation", upload.array("PatentFiles", 1), authenticate, calculatePatentMarks);
router.post("/hindex/:designation", upload.array("hindexFiles", 1), authenticate, calculatehIndex);
router.post("/Iindex/:designation", upload.array("IindexFiles", 1), authenticate, calculateIIndex);
router.post("/Citation/:designation", upload.array("citationFiles", 1), authenticate, calculateCitation);
router.post("/consultancy/:designation", upload.array("consultancyFiles", 1), authenticate, calculateConsultancy);
router.post("/Collabrative/:designation", upload.array("foreignFiles", 1), authenticate, calculateForeignMarks);
router.post("/SeedFund/:designation", upload.array("seedFundFiles", 1), authenticate, calculateSeedFund);
router.post("/Fund/:designation", upload.array("FundFiles", 1), authenticate, calculateFundedProjectMarks);
router.post("/researchScholar/:designation", upload.array("scholarFiles", 1), authenticate, calculateResearchScholarMarks);

module.exports = router;
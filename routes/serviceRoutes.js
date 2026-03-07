const express = require("express");
const router = express.Router();
const {upload} = require("../config/cloudinary");

const authenticate = require("../middleware/authenticate");

const {
  calculateActivitiesMarks,
  calculateBrandingMarks,
  calculateMembershipMarks,
  calculateCocurricularMarks,
  calculateAssistanceMarks,
  calculateTrainingMarks

} = require("../controllers/serviceController");

router.post("/activities/:designation", upload.array("activitiesFiles", 1), authenticate, calculateActivitiesMarks);
router.post("/branding/:designation", upload.array("brandingFiles", 1), authenticate, calculateBrandingMarks);
router.post("/membership/:designation", upload.array("membershipFiles", 1), authenticate, calculateMembershipMarks);
router.post("/cocurricular/:designation", upload.array("externalFiles", 1), authenticate, calculateCocurricularMarks);
router.post("/assistance/:designation", upload.array("administrationFiles", 1), authenticate, calculateAssistanceMarks);
router.post("/training/:designation", upload.array("trainingFiles", 1), authenticate, calculateTrainingMarks);

module.exports = router;
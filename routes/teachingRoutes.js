const express = require("express");
const router = express.Router();
const {upload} = require("../config/cloudinary");
const { generateTeachingReportPDF } = require('../controllers/pdfController');
const authenticate = require("../middleware/authenticate");


const {
  calculateTeachingMarks,
  calculatePassPercentageMarks,
  calculateStudentFeedbackMarks,
  calculateInnovativeApporachMarks,
  calculateGuestlectureMarks,
  calculateFdpfundingMarks,
  calculateHighlevelCompetionMarks,
  calculateFdpProgramMarks,
  calculateIndustryInvolvementMarks,
  calculateTutorWardMarks,
  getPointsByDesignation,
  calculateRoleMarks,
  deleteImage,
  getTeachingRecord,
  calculateStudentProjectMarks,
} = require("../controllers/teachingController");

router.get('/points/:designation', getPointsByDesignation);
router.post("/teaching/:designation", upload.array("Teachingfiles", 1), authenticate, calculateTeachingMarks);
router.post("/passPercentage/:designation",authenticate, calculatePassPercentageMarks);
router.post("/feedback/:designation",authenticate, calculateStudentFeedbackMarks);
router.post(
  "/innovativeApproach/:designation",
  authenticate,
  upload.array("Innovativefiles", 5),
  calculateInnovativeApporachMarks
);
router.post(
  "/guestLecture/:designation",
   upload.array("GuestLectureFiles", 1),authenticate,
  calculateGuestlectureMarks
);
router.post(
  "/fdpFunding/:designation",
   upload.array("FdpFunding", 1),authenticate,
  calculateFdpfundingMarks
);
router.post(
  "/highlevelCompetition/:designation",
   upload.array("HighlevelCompetitionFiles", 1),authenticate,
  calculateHighlevelCompetionMarks
);
router.post(
  "/fdpPrograms/:designation",
   upload.array("FdpprogramFiles", 1),authenticate,
  calculateFdpProgramMarks
);

router.post(
  "/industryInvolvement/:designation",
   upload.array("IndustryFiles", 1),authenticate,
  calculateIndustryInvolvementMarks
);
router.post(
  "/tutorwardMeeting/:designation",
   upload.array("valueAdditionFiles", 1),authenticate,
  calculateTutorWardMarks
);

router.post(
  "/academicRoles/:designation",
   upload.array("files", 1),authenticate,
  calculateRoleMarks
);

router.post(
  "/publications/:designation",
   upload.array("studentProjectFiles", 1),authenticate,
  calculateStudentProjectMarks
);

router.post(
  "/teachingrecord",
  getTeachingRecord
);


router.delete(
  "/deleteImage",
  deleteImage
);


router.post('/report_pdf', generateTeachingReportPDF);


module.exports = router;

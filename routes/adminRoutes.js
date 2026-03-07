
const express = require("express");
const router = express.Router();
const {postQuestions, getAnswers, getTeachingRecordById, getPdf, getMultiplePdfs } = require("../controllers/adminController");
const authenticate = require("../middleware/authenticate");

router.post("/question",postQuestions);
router.get("/getAns/:recordId",getAnswers);
router.get("/joinAnswer/:recordId",getTeachingRecordById);
router.get("/getPdf/:id",getPdf);
router.post("/multiplePdf", getMultiplePdfs);


module.exports = router;
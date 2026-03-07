
const express = require("express");
const router = express.Router();
const { getEmployeeStats, getEmployees, markFormSubmitted, getFilteredTeachingRecords , getFile, getEmployeeForms,approveByHOD, getchart, getpieChart, approveByAcademicDean,approveByResearchDean,approveByIqacDean} = require("../controllers/dashboardController");
const authenticate = require("../middleware/authenticate");

router.get("/total_employees",authenticate, getEmployeeStats);
router.get("/get_employees", authenticate,getEmployees);
router.put("/submit/:employeeId", markFormSubmitted);
router.get("/getForms", authenticate, getFilteredTeachingRecords);
router.get('/file/:filename', getFile);
router.get("/tableData", authenticate, getEmployeeForms);
router.put("/approvehod/:recordId",authenticate,approveByHOD);
router.put("/academicDean/:recordId",authenticate,approveByAcademicDean);
router.put("/researchDean/:recordId",authenticate,approveByResearchDean);
router.put("/serviceDean/:recordId",authenticate,approveByIqacDean);
router.get("/chartData",getchart);
router.get("/peiChart",getpieChart);


module.exports = router;
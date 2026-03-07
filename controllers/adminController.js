const AppraisalParameter = require("../models/appraisal");
const TeachingRecord = require("../models/TeachingRecord");
const generatePDF = require("../utils/pdfGenerator");
const JSZip = require("jszip");

const mongoose = require("mongoose");

const FIELD_MAP = {
  passPercentage: "passPercentage",
  feedback: "feedback",
  innovativeApproach: "innovativeApproach",
  visitingFaculty: "visitingFaculty",
  studentProject: "studentProject",
  fdpFunding: "fdpFunding",
  innovationProject: "innovationProject",
  fdp: "fdp",
  industry: "industry",
  tutorMeeting: "tutorMeeting",
  academicPosition: "academicPosition",
  sciePaper: "sciePaper",
  scopusPaper: "scopusPaper",
  aictePaper: "aictePaper",
  scopusBook: "scopusBook",
  indexBook: "indexBook",
  hIndex: "hIndex",
  iIndex: "iIndex",
  citation: "citation",
  consultancy: "consultancy",
  collabrative: "collabrative",
  seedFund: "seedFund",
  patent: "patent",
  fundedProject: "fundedProject",
  researchScholars: "researchScholars",
  activities: "activities",
  branding: "branding",
  membership: "membership",
  external: "external",
  administration: "administration",
  training: "training",
  teachingAssignment: "teachingAssignment"
};

exports.getFormDataForPdf = async (recordId) => {
  const record = await TeachingRecord.findById(recordId).populate("employee");
  if (!record || !record.employee) throw new Error("Record or employee not found");

  const parameters = await AppraisalParameter.find();

  const teachingKeys = [
    "teachingAssignment","passPercentage","feedback","innovativeApproach",
    "visitingFaculty","studentProject","fdpFunding","fdp","industry","tutorMeeting"
  ];
  const researchKeys = [
    "academicPosition","sciePaper","scopusPaper","aictePaper",
    "scopusBook","indexBook","hIndex","iIndex","citation",
    "consultancy","collabrative","seedFund","patent","fundedProject","researchScholars"
  ];
  const serviceKeys = ["activities","branding","membership","external","administration","training"];

  const mergedQuestions = parameters.map(param => {
    const fieldName = Object.keys(FIELD_MAP).find(k => FIELD_MAP[k] === param.key);
    const fieldData = fieldName ? record[fieldName] : null;
    if (!fieldData) return null;

    let category = "Other";
    if (teachingKeys.includes(param.key)) category = "Teaching";
    else if (researchKeys.includes(param.key)) category = "Research";
    else if (serviceKeys.includes(param.key)) category = "Service";

    return {
      question: param.label || param.key,
      marks: fieldData?.marks ?? 0,
      category
    };
  }).filter(Boolean);

  return {
    employeeName: record.employee?.fullName || "Unknown",
    email: record.employee?.email || "N/A",
    employee_id: record.employee?.employee_id || "N/A",
    department: record.employee?.department || "N/A",
    designation: record.employee?.designation || "N/A",
    teaching: mergedQuestions.filter(q => q.category === "Teaching"),
    research: mergedQuestions.filter(q => q.category === "Research"),
    service: mergedQuestions.filter(q => q.category === "Service")
  };
};

// GET Q and A
exports.getAnswers = async (req, res) => {
  try {
    const record = await TeachingRecord.findById(req.params.recordId).populate("employee");
    if (!record) {
      return res.status(404).json({ message: "Teaching record not found" });
    }

    const parameters = await AppraisalParameter.find();

    const merged = parameters.map(param => {
      // Match based on the key (since your TeachingRecord fields use keys)
      const fieldName = Object.keys(FIELD_MAP).find(
        k => FIELD_MAP[k] === param.key
      );

      const fieldData = fieldName ? record[fieldName] : null;

      // Collect uploaded file names if any
      const files = fieldData
        ? Object.keys(fieldData)
            .filter(k => k.toLowerCase().endsWith("files") && Array.isArray(fieldData[k]))
            .reduce((acc, k) => acc.concat(fieldData[k]), [])
        : [];
      return {
        question: param.label || param.key,
        description: param.description || "",
        functionalArea: param.functionalArea || "",
        inputType: param.inputType || "",
        userValue:
          fieldData?.value ??
          fieldData?.subjects ??
          fieldData?.input ??
          fieldData?.subjectName ??
          fieldData?.subjectCode ??
          null,
        marks: fieldData?.marks ?? 0,
        files
      };
    }).filter(Boolean);

    res.json({
      employee: record.employee,
      facultyName: record.facultyName,
      designation: record.designation,
      approvalStatus: record.approvalStatus,
      isSubmitted: record.isSubmitted,
      questions: merged
    });
  } catch (err) {
    console.error("Error merging data:", err);
    res.status(500).json({ message: "Error merging data", error: err.message });
  }
};






exports.postQuestions = async (req, res) => {
  try {
    const data = req.body;

    // Check if it's an array (bulk) or single object
    const questions = Array.isArray(data) ? data : [data];

    if (questions.length === 0) {
      return res.status(400).json({ message: "No questions provided" });
    }

    // Remove duplicates based on key
    const keys = questions.map(q => q.key);
    const existing = await AppraisalParameter.find({ key: { $in: keys } });
    const existingKeys = existing.map(e => e.key);

    const newQuestions = questions.filter(q => !existingKeys.includes(q.key));

    if (newQuestions.length === 0) {
      return res.status(409).json({ message: "All provided keys already exist" });
    }

    // Insert all new questions
    const inserted = await AppraisalParameter.insertMany(newQuestions);

    res.status(201).json({
      message: `${inserted.length} parameter(s) created successfully`,
      inserted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating parameters", error: err.message });
  }
};



exports.getTeachingRecordById = async (req, res) => {
  try {
    const record = await TeachingRecord.findById(req.params.recordId).populate("employee");
    if (!record) {
      return res.status(404).json({ message: "Teaching record not found" });
    }
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching teaching record", error: err.message });
  }
};




// exports.getPdf = async (req, res) => {
//   try {

//     const formData = await TeachingRecord.findById(req.params.id).populate("employee");

//     // 👉 Generate PDF
//     const pdfBuffer = await generatePDF(formData);

//     // 👉 Send PDF as downloadable file
//     let fileName = `${"report"}.pdf`;
//     fileName = fileName.replace(/[^a-z0-9_\-\.]/gi, "_");

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
//     res.send(pdfBuffer);

//   } catch (err) {
//     console.error("Error generating PDF:", err);
//     res.status(500).send("Error generating PDF");
//   }
// };

exports.getPdf = async (req, res) => {
  try {
    const record = await TeachingRecord.findById(req.params.id).populate("employee");
    if (!record) {
      return res.status(404).json({ message: "Teaching record not found" });
    }

    const parameters = await AppraisalParameter.find();

    const teachingKeys = [
      "teachingAssignment", "passPercentage", "feedback", "innovativeApproach",
      "visitingFaculty", "studentProject", "fdpFunding", "fdp", "industry", "tutorMeeting"
    ];
    const researchKeys = [
      "academicPosition", "sciePaper", "scopusPaper", "aictePaper",
      "scopusBook", "indexBook", "hIndex", "iIndex", "citation",
      "consultancy", "collabrative", "seedFund", "patent", "fundedProject", "researchScholars"
    ];
    const serviceKeys = [
      "activities", "branding", "membership", "external", "administration", "training"
    ];

    const mergedQuestions = parameters.map(param => {
      const fieldName = Object.keys(FIELD_MAP).find(k => FIELD_MAP[k] === param.key);
      const fieldData = fieldName ? record[fieldName] : null;
      if (!fieldData) return null;

      let category = "Other";
      if (teachingKeys.includes(param.key)) category = "Teaching";
      else if (researchKeys.includes(param.key)) category = "Research";
      else if (serviceKeys.includes(param.key)) category = "Service";

      return {
        question: param.label || param.key,
        
        marks: fieldData?.marks ?? 0,
        category
      };
    }).filter(Boolean);

    const teachingQuestions = mergedQuestions.filter(q => q.category === "Teaching");
    const researchQuestions = mergedQuestions.filter(q => q.category === "Research");
    const serviceQuestions = mergedQuestions.filter(q => q.category === "Service");

    const teachingTotal = teachingQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const researchTotal = researchQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const serviceTotal = serviceQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
    const overallTotal = teachingTotal + researchTotal + serviceTotal;

    const formData = {
      employeeName: record.employee.fullName,
      email: record.employee.email,
      employee_id : record.employee.employee_id,
      department: record.employee.department,
      designation: record.employee.designation,
      teaching: teachingQuestions,
      research: researchQuestions,
      service: serviceQuestions,
       totals: {
        teachingTotal,
        researchTotal,
        serviceTotal,
        overallTotal,
      },
    };

    console.log(formData);

    const pdfBuffer = await generatePDF(formData);

    let fileName = `${record.employee.fullName || "report"}.pdf`;
    fileName = fileName.replace(/[^a-z0-9_\-\.]/gi, "_");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error("Error generating PDF:", err);
    res.status(500).send("Error generating PDF");
  }
};



exports.getMultiplePdfs = async (req, res) => {
  try {
    const { ids } = req.body; 

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No IDs provided" });
    }

    const validIds = ids.filter(
      (id) => id && id.trim() !== "" && mongoose.Types.ObjectId.isValid(id)
    );

    if (validIds.length === 0) {
      return res.status(400).json({ message: "No valid record IDs provided" });
    }

    const parameters = await AppraisalParameter.find();
    const zip = new JSZip();

    for (const id of ids) {
      const record = await TeachingRecord.findById(id).populate("employee");
      if (!record) continue;

      const teachingKeys = [
        "teachingAssignment", "passPercentage", "feedback", "innovativeApproach",
        "visitingFaculty", "studentProject", "fdpFunding", "fdp", "industry", "tutorMeeting"
      ];
      const researchKeys = [
        "academicPosition", "sciePaper", "scopusPaper", "aictePaper",
        "scopusBook", "indexBook", "hIndex", "iIndex", "citation",
        "consultancy", "collabrative", "seedFund", "patent", "fundedProject", "researchScholars"
      ];
      const serviceKeys = [
        "activities", "branding", "membership", "external", "administration", "training"
      ];

      const mergedQuestions = parameters.map(param => {
        const fieldName = Object.keys(FIELD_MAP).find(k => FIELD_MAP[k] === param.key);
        const fieldData = fieldName ? record[fieldName] : null;
        if (!fieldData) return null;

        let category = "Other";
        if (teachingKeys.includes(param.key)) category = "Teaching";
        else if (researchKeys.includes(param.key)) category = "Research";
        else if (serviceKeys.includes(param.key)) category = "Service";

        return {
          question: param.label || param.key,
          marks: fieldData?.marks ?? 0,
          category
        };
      }).filter(Boolean);

      const formData = {
        employeeName: record.employee.fullName,
        email: record.employee.email,
        employee_id: record.employee.employee_id,
        department: record.employee.department,
        designation: record.employee.designation,
        teaching: mergedQuestions.filter(q => q.category === "Teaching"),
        research: mergedQuestions.filter(q => q.category === "Research"),
        service: mergedQuestions.filter(q => q.category === "Service")
      };

      const pdfBuffer = await generatePDF(formData);
      let fileName = `${record.employee.fullName || "report"}.pdf`;
      fileName = fileName.replace(/[^a-z0-9_\-\.]/gi, "_");

      zip.file(fileName, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="reports.zip"`);
    res.send(zipBuffer);

  } catch (err) {
    console.error("Error generating multiple PDFs:", err);
    res.status(500).json({ message: "Error generating PDFs" });
  }
};

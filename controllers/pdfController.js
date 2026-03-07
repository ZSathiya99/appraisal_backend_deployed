const { mergeFormPDFs } = require("../utils/pdfUtils");
const TeachingRecord = require("../models/TeachingRecord");


function formatLabel(key) {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase());
}



// === Full Fields by Category ===
const teachingFields = [
  "teachingAssignment",
  "passPercentage",
  "feedback",
  "innovativeApproach",
  "visitingFaculty",
  "studentProject",
  "fdpFunding",
  "innovationProject",
  "fdp",
  "industry",
  "tutorMeeting",
  "academicPosition",
];

const researchFields = [
  "sciePaper",
  "scopusPaper",
  "aictePaper",
  "scopusBook",
  "indexBook",
  "hIndex",
  "iIndex",
  "citation",
  "consultancy",
  "collabrative",
  "seedFund",
  "patent",
  "fundedProject",
  "researchScholars",
];

const serviceFields = [
  "activities",
  "branding",
  "membership",
  "external",
  "administration",
  "training",
];

// Helper to map fields to section objects
const mapToSections = (fields) => 
  fields.map((f) => ({
    key: f,
    label: formatLabel(f),
  }));

// === Teaching Form ===
exports.generateTeachingReportPDF = async (req, res) => {
  try {
    console.log("Entering..................")
    const employeeId = req.userId;

    const record = await TeachingRecord.findOne({ employee: employeeId }).populate("employee");
    if (!record) return res.status(404).json({ message: "Teaching record not found" });
    const sections = mapToSections(teachingFields);

    const fileKeys = teachingFields; // same list

    // Create pretty labels
    const labels = fileKeys.reduce((acc, key) => {
      acc[key] = formatLabel(key);
      return acc;
    }, {});

    const pdfBuffer = await mergeFormPDFs(
      record,
      "Faculty Members Performance Appraisal Form",
      sections,
      fileKeys,
      labels
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="teaching-report-${employeeId}.pdf"`);
    res.end(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message: "Error generating Teaching PDF", error: err.message });
  }
};


// === Research Form ===
exports.generateResearchReportPDF = async (req, res) => {
  try {
    const employeeId = req.userId;
    const record = await TeachingRecord.findOne({ employee: employeeId }).populate("employee");
    if (!record) return res.status(404).json({ message: "Research record not found" });

    const pdfBuffer = await mergeFormPDFs(
      record,
      "Faculty Members Performance Appraisal Form – Research",
      mapToSections(researchFields),
      researchFields
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Research-report-${employeeId}.pdf"`);
    res.end(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message: "Error generating Research PDF", error: err.message });
  }
};

// === Service Form ===
exports.generateServiceReportPDF = async (req, res) => {
  try {
    const employeeId = req.userId;
    const record = await TeachingRecord.findOne({ employee: employeeId }).populate("employee");
    if (!record) return res.status(404).json({ message: "Service record not found" });

    const pdfBuffer = await mergeFormPDFs(
      record,
      "Faculty Members Performance Appraisal Form – Service",
      mapToSections(serviceFields),
      serviceFields
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Service-report-${employeeId}.pdf"`);
    res.end(pdfBuffer);

  } catch (err) {
    res.status(500).json({ message: "Error generating Service PDF", error: err.message });
  }
};

// === Consolidated Form ===
exports.generateConsolidatedReportPDF = async (req, res) => {
  try {
    const { default: PDFMerger } = await import("pdf-merger-js");
    const employeeId = req.userId;

    const merger = new PDFMerger();

    const record = await TeachingRecord.findOne({ employee: employeeId }).populate("employee");
    if (!record)
      return res.status(404).json({ message: "Record not found" });

    const teachingPDF = await mergeFormPDFs(
      record,
      "Teaching Record",
      mapToSections(teachingFields),
      teachingFields
    );
    await merger.add(teachingPDF);  

    const researchPDF = await mergeFormPDFs(
      record,
      "Research Record",
      mapToSections(researchFields),
      researchFields
    );
    await merger.add(researchPDF); 

    const servicePDF = await mergeFormPDFs(
      record,
      "Service Record",
      mapToSections(serviceFields),
      serviceFields
    );
    await merger.add(servicePDF); 

    const consolidatedBuffer = await merger.saveAsBuffer();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition",
      `attachment; filename="Consolidated-report-${employeeId}.pdf"`
    );

    res.end(consolidatedBuffer); 

  } catch (err) {
    res.status(500).json({
      message: "Error generating consolidated PDF",
      error: err.message
    });
  }
};


const TeachingRecord = require("../models/TeachingRecord");
const AppraisalParameter = require("../models/appraisal");

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


const getFormDataForPdf = async (recordId) => {
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

  const teaching = mergedQuestions.filter((q) => q.category === "Teaching");
  const research = mergedQuestions.filter((q) => q.category === "Research");
  const service = mergedQuestions.filter((q) => q.category === "Service");

  const teachingTotal = teaching.reduce((sum, q) => sum + (q.marks || 0), 0);
  const researchTotal = research.reduce((sum, q) => sum + (q.marks || 0), 0);
  const serviceTotal = service.reduce((sum, q) => sum + (q.marks || 0), 0);

  const overallTotal = teachingTotal + researchTotal + serviceTotal;

  return {
    employeeName: record.employee?.fullName || "Unknown",
    email: record.employee?.email || "N/A",
    employee_id: record.employee?.employee_id || "N/A",
    department: record.employee?.department || "N/A",
    designation: record.employee?.designation || "N/A",
    teaching,
    research,
    service,
    teachingTotal,
    researchTotal,
    serviceTotal,
    overallTotal,

  };
};

module.exports = { getFormDataForPdf };

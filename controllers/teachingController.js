const teaching = require('../models/TeachingRecord');
const Subject = require('../models/Subject');
const pointsDistribution = require("../utils/prePoints");
const fs = require("fs");
const path = require("path");
const handleFiles = require("../utils/fileHandler");


exports.getPointsByDesignation = (req, res) => {
  const { designation } = req.params;
  console.log(designation)
  const points = pointsDistribution[designation];

  if (!points) {
    return res.status(404).json({ message: 'Designation not found' });
  }
  const formatted = Object.entries(points).map(([category, pointObj]) => ({
    category,
    points: pointObj 
  }));

  res.json(formatted);
};


// Q1: TEACHING ASSIGNMENT
exports.calculateTeachingMarks = async (req, res) => {
  try {
    const { teachingAssignment, facultyName, employeeId, designation: bodyDesignation, Teachingfiles: bodyFiles  } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;


    let parsedSubjects;
    try {
      parsedSubjects = Array.isArray(teachingAssignment)
        ? teachingAssignment
        : JSON.parse(teachingAssignment);
    } catch (e) {
      return res.status(400).json({ message: "Invalid JSON in teachingAssignment" });
    }

    const formattedSubjects = {};
    let teachingMarks = 0;

    for (const subj of parsedSubjects) {
      const { subjectCode, subjectName, credits } = subj;
      formattedSubjects[subjectCode] = subjectName;

      await Subject.updateOne(
        { subjectCode },
        { $set: { subjectName, credits: Number(credits) } },
        { upsert: true }
      );

      if (Number(credits) === 3 && teachingMarks < 3) {
        teachingMarks += 1;
      }
    }

  
    const maxTeaching = pointsDistribution[designation]?.teaching?.teachingAssignment ?? 0;
    const finalMarks = Math.min(teachingMarks, maxTeaching);

    let query = { facultyName, employee, designation };
    let record = await teaching.findOne(query);

   
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({ message: "Faculty record not found. HOD/Dean can only edit existing records." });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let currentFiles = handleFiles(record, "teachingAssignment", "teachingFiles",paramDesignation,null, req.files);
    
    record.teachingAssignment = {
      subjects: parsedSubjects,
      marks: finalMarks,
      teachingFiles: currentFiles
    };

    await record.save();

    return res.status(200).json({
      message: "Teaching marks calculated successfully",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });

  } catch (error) {
    console.error("Teaching mark calculation failed:", error.message);
    return res.status(500).json({ error: error.message });
  }
};



// Q2: PASS PERCENTAGE
exports.calculatePassPercentageMarks = async (req, res) => {
  try {
    const { passPercentage, facultyName, employeeId, designation: bodyDesignation } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    let marks = 0;
    if (passPercentage === "100%") marks = 3;
    else if (passPercentage === "90 to 99%") marks = 2;
    else if (passPercentage === "80 to 89%") marks = 1;

    const maxPass = pointsDistribution[designation]?.teaching?.passPercentage ?? 0;
    const finalMarks = Math.min(marks, maxPass);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({ message: "Faculty record not found. HOD/Dean can only edit existing records." });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    record.passPercentage = {
      value: passPercentage ?? null,
      marks: finalMarks
    };

    await record.save();

    return res.status(200).json({
      section: "Pass Percentage",
      finalMarks,
      employee,
      designation
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


//Q3: STUDENT FEEDBACK
exports.calculateStudentFeedbackMarks = async (req, res) => {
  try {
    const { feedback, facultyName, employeeId, designation: bodyDesignation } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;  
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation; 
    }

    if (!designation) return res.status(400).json({ message: 'Designation missing' });

    let marks = 0;
    if (feedback === "100 to 91") marks = 3;
    else if (feedback === "90 to 81") marks = 2;
    else if (feedback === "Less than or equal to 80") marks = 1;

    const maxmark = pointsDistribution[designation]?.teaching?.studentFeedback ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    console.log(employee);
    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({ message: "Faculty record not found. HOD/Dean can only edit existing records." });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    record.feedback = {
      value: feedback?? null,
      marks: finalMarks
    };

    await record.save();

    return res.status(200).json({
      section: "Student Feedback",
      finalMarks,
      employee,
      designation
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};



//Q4: Innovative Approach
exports.calculateInnovativeApporachMarks = async (req, res) => {
  
  try {
    console.log("Entering ")
    const { InnovativeApproach, facultyName, employeeId, designation: bodyDesignation , Innovativefiles: bodyFiles} = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;


    
    let marks = 0;
    if (InnovativeApproach === "Classroom Teaching") marks = 1;
    else if (InnovativeApproach === "Lab") marks = 2;
    else if (InnovativeApproach === "Both") marks = 3;

    const maxmark = pointsDistribution[designation]?.teaching?.innovativeApproach ?? 0;
    const finalMarks = Math.min(marks, maxmark);
    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({ message: "Faculty record not found. HOD/Dean can only edit existing records." });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    // let currentFiles = handleFiles(record, "innovativeApproach", "innovativeApproachFiles", paramDesignation,null, req.files);
    let currentFiles = [];
    // console.log("Entering file")
    // console.log("Body:", req.body);
    if (req.files && req.files.length > 0) {
      currentFiles = req.files.map(f => f.path);
    }
    // console.log(currentFiles)
    record.innovativeApproach = {
      value: InnovativeApproach?? null,
      marks: finalMarks,
      innovativeApproachFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Innovative Approach",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


//Q5: Guest lecture
exports.calculateGuestlectureMarks = async (req, res) => {
  try {
    const { GuestLecture, facultyName, employeeId, designation: bodyDesignation ,GuestLectureFiles: bodyFiles} = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;
    

    let marks = 0;
    if (GuestLecture === "National Experts") marks = 1;
    else if (GuestLecture === "International Experts") marks = 2;

    const maxmark = pointsDistribution[designation]?.teaching?.guest ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({ message: "Faculty record not found. HOD/Dean can only edit existing records." });
      }
      record = new teaching({ facultyName, designation, employee });
    }
    
    let currentFiles = handleFiles(record, "visitingFaculty", "visitingFacultyFiles", paramDesignation,null, req.files);

    record.visitingFaculty = {
      value: GuestLecture?? null,
      marks: finalMarks,
      visitingFacultyFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Guest Lectures",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


//Q6: FDP Funding
exports.calculateFdpfundingMarks = async (req, res) => {
  try {
    const { FdpFunding, facultyName, employeeId, designation: bodyDesignation,FdpFunding: bodyFiles } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;    

    let marks = 0;
    if (FdpFunding === "less than 1 lakh") marks = 1;
    else if (FdpFunding === "1-2 lakh") marks = 2;
    else if (FdpFunding === "greater than 2 lakh") marks = 3;

    const maxmark = pointsDistribution[designation]?.teaching?.fdpFunding ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let currentFiles = handleFiles(record, "fdpFunding", "fdpFundingFiles", paramDesignation,null, req.files);

    record.fdpFunding = {
      value: FdpFunding?? null,
      marks: finalMarks,
      fdpFundingFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "FDP Funding",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


//Q7: Highlevel Competion
exports.calculateHighlevelCompetionMarks = async (req, res) => {
  try {
    const { highlevelCompetition, facultyName, employeeId, designation: bodyDesignation,HighlevelCompetitionFiles: bodyFiles
 } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;



    let marks = 0;
    if (highlevelCompetition === "Participation") marks = 2;
    else if (highlevelCompetition === "Participation Greater than 1") marks = 3;
    else if (highlevelCompetition === "Participation & Prize") marks = 3;
    else if (highlevelCompetition === "Participation Greater than 1 & Prize") marks = 4;

    const maxmark = pointsDistribution[designation]?.teaching?.innovativeProjects ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let currentFiles = handleFiles(record, "innovationProject", "innovationProjectFiles", paramDesignation,null, req.files);

    record.innovationProject = {
      value: highlevelCompetition?? null,
      marks: finalMarks,
      innovationProjectFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "HighLevel Competition",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


//Q8: FdpProgram
exports.calculateFdpProgramMarks = async (req, res) => {
  try {
    const { facultyName, employeeId, designation: bodyDesignation, FdpprogramFiles: bodyFiles } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    let semesterDataRaw;
    try {
      semesterDataRaw = typeof req.body.semesterData === "string"
        ? JSON.parse(req.body.semesterData)
        : req.body.semesterData;
    } catch (e) {
      return res.status(400).json({ message: "Invalid JSON in semesterData" });
    }

    const isTrue = (val) => val === true || val === "true";

    const semesterWiseMarks = {};
    let totalMarks = 0;

    for (const semester in semesterDataRaw) {
      let marks = 0;
      if (isTrue(semesterDataRaw[semester].fdp)) marks += 4;
      if (isTrue(semesterDataRaw[semester].online)) marks += 1;

      semesterWiseMarks[semester] = marks;
      totalMarks += marks;
    }

    const maxmark = pointsDistribution[designation]?.teaching?.fdpProgramme ?? 0;
    const finalMarks = Math.min(totalMarks, maxmark);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    } 

    let currentFiles = handleFiles(record, "fdp", "fdpFiles", paramDesignation,null, req.files);

    record.fdp = {
      value: JSON.stringify(semesterDataRaw)?? null,
      marks: finalMarks,
      fdpFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "FDP Programme",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
      semesterWiseMarks,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//Q9: Industry Involvement
exports.calculateIndustryInvolvementMarks = async (req, res) => {
  try {
    const { industryInvolvement, facultyName, employeeId, designation: bodyDesignation ,IndustryFiles: bodyFiles} = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;


    const maxmark = pointsDistribution[designation]?.teaching?.industryInvolvement ?? 0;
    const isYes = industryInvolvement?.toLowerCase() === "yes";
    const marks = isYes ? maxmark : 0;
    const finalMarks = Math.min(marks, maxmark);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let currentFiles = handleFiles(record, "industry","industryFiles", paramDesignation,null, req.files);

    record.industry = {
      value: industryInvolvement?? null,
      marks: finalMarks,
      industryFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Industry Involvement",
      finalMarks,
      message: isYes ? "Eligible for full marks" : "No marks awarded",
      files: currentFiles,
      employee,
      designation
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


//Q10: TutorWard Meeting
exports.calculateTutorWardMarks = async (req, res) => {
  try {
    const { tutorWardMeetings, valueAdditionInStudentLife, facultyName, employeeId, designation: bodyDesignation, valueAdditionInStudentLife :  bodyFiles } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    const meetings = tutorWardMeetings?.toLowerCase() === "yes" ? 3 : 0;
    const valueAdd = valueAdditionInStudentLife?.toLowerCase() === "yes" ? 2 : 0;
    const totalMarks = meetings + valueAdd;

    const maxmark = pointsDistribution[designation]?.teaching?.tutorMeeting ?? 0;
    const finalMarks = Math.min(totalMarks, maxmark);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let currentFiles = handleFiles(record, "tutorMeeting", "tutorMeetingFiles",paramDesignation,null, req.files);

    record.tutorMeeting = {
      value: {
        tutorWardMeetings,
        valueAdditionInStudentLife
      }?? null,
      marks: finalMarks,
      tutorMeetingFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Tutor Ward",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


// Q11: Roles in Academic
exports.calculateRoleMarks = async (req, res) => {
  try {
    let { roles, facultyName, employeeId, designation: bodyDesignation ,files: bodyFiles} = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HoD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    
    if (typeof roles === "string") {
      try {
        roles = JSON.parse(roles);
      } catch {
        roles = roles.split(",").map(r => r.trim());
      }
    }
    if (!Array.isArray(roles)) roles = [];


   
    const academicRoles = ["Academic Coordinator", "Class Advisor"];
    const otherRoles = [
      "Course Coordinator",
      "Timetable Coordinator",
      "Exam Cell",
      "Lab Coordinator",
      "Project Coordinator",
    ];

    let marks = 0;
    let countedAcademic = false;

    roles.forEach((role) => {
      if (!countedAcademic && academicRoles.includes(role)) {
        marks += 2;
        countedAcademic = true;
      } else if (otherRoles.includes(role)) {
        marks += 1;
      }
    });

    const maxmark = pointsDistribution[designation]?.teaching?.academicRoles ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let currentFiles = handleFiles(record, "academicPosition", "academicPositionFiles",paramDesignation,null, req.files);
      
    record.academicPosition = {
      value: {
        roles: roles,
        status: roles.length > 0 ? "Yes" : "No"
      }?? null,
      marks: finalMarks,
      academicPositionFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Academic Roles",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};




exports.getTeachingRecord = async (req, res) => {
  try {
    const { facultyName, designation } = req.body;

    if (!facultyName) {
      return res.status(400).json({ message: "Faculty name is required" });
    }

    const filter = { facultyName };
    if (designation) filter.designation = designation;

    const record = await teaching.findOne(filter);

    if (!record) {
      return res.status(404).json({ message: "No record found" });
    }

    const recordObj = record.toObject();

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

    const sumMarks = (fields) => {
      let total = 0;
      for (const field of fields) {
        if (recordObj[field] && recordObj[field].marks !== undefined) {
          total += Number(recordObj[field].marks) || 0;
        }
      }
      return total;                                                                            
    };

    const teachingMarks = sumMarks(teachingFields);
    const researchMarks = sumMarks(researchFields);
    const serviceMarks = sumMarks(serviceFields);

    const totalMarks = teachingMarks + researchMarks + serviceMarks;

    return res.status(200).json({
      message: "total marks fetched successfully",
      record,
      teachingMarks,
      researchMarks,
      serviceMarks,
      totalMarks,
    });

  } catch (err) {
    console.error("Error fetching faculty record:", err.message);
    return res.status(500).json({ error: err.message });
  }
};




// exports.deleteImage = async (req, res) => {

//   console.log("req.params.filename:", req.params.filename);

//   let filename = req.params.filename;
//   if (!filename) {
//     console.error("Filename is missing in params.");
//     return res.status(400).json({ message: "Filename is required in URL" });
//   }
//   filename = decodeURIComponent(filename);

//   filename = filename.replace(/^uploads[\\/]/, "");
  
//   const filePath = path.join(__dirname, "../uploads", filename);

//   console.log("Resolved filePath:", filePath);

//   if (fs.existsSync(filePath)) {
//     fs.unlink(filePath, (err) => {
//       if (err) {
//         console.error("Error deleting file:", err);
//         return res.status(500).json({ message: "Failed to delete file" });
//       }
//       return res.status(200).json({ message: "File deleted successfully" });
//     });
//   } else {
//     return res.status(404).json({ message: "File not found" });
//   }
// };

exports.deleteImage = async (req, res) => {
  try {
    const { keyword } = req.body; // frontend sends { keyword: "teaching" }
    if (!keyword) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    const uploadDir = path.join(__dirname, "../uploads");

    // Read all files in uploads folder
    const files = fs.readdirSync(uploadDir);

    // Find matching files
    const matched = files.filter(f => f.toLowerCase().includes(keyword.toLowerCase()));

    if (matched.length === 0) {
      return res.status(404).json({ message: "No files found with keyword" });
    }

    // Delete them
    matched.forEach(f => {
      fs.unlinkSync(path.join(uploadDir, f));
    });

    return res.status(200).json({
      message: "Files deleted successfully",
      deleted: matched
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q12: Student Projects & Publications
exports.calculateStudentProjectMarks = async (req, res) => {
  try {
    const { 
      facultyName, 
      publications,          
      employeeId, 
      designation: bodyDesignation, 
      studentProjectFiles: bodyFiles 
    } = req.body;
    const { designation: paramDesignation } = req.params;

    // 1️⃣ Resolve designation
    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res.status(400).json({ message: "employeeId is required for HOD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    // 2️⃣ Resolve employee ID
    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    let publicationsData = publications;

    if (typeof publications === "string") {
      try {
        publicationsData = JSON.parse(publications);
      } catch (err) {
        console.error("Invalid publications JSON:", err);
        publicationsData = {};
      }
    }
    const isNoneSelected = publicationsData?.None === true || publicationsData?.None === "true";
    // 3️⃣ Normalize counts
    let studentCount = 0;
    let publicationCount = 0;

    if (!isNoneSelected) { // if None is not selected
      studentCount = Number(publicationsData?.projectGuidance) || 0;
      publicationCount = Number(publicationsData?.studentPublication) || 0;
    }
    // 4️⃣ Calculate marks
    const projectGuidanceMarks = Math.min(studentCount, 2) * 1;  // max 2 marks
    const publicationMarks = publicationCount * 2;
    const totalMarks = projectGuidanceMarks + publicationMarks;
    const maxAllowed = pointsDistribution[designation]?.teaching?.projectPublication ?? 0;
    const finalMarks = Math.min(totalMarks, maxAllowed);

    // 5️⃣ Find or create record
    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    // 6️⃣ Handle uploaded files
    let currentFiles = handleFiles(
      record,
      "studentProjectsAndPublications",
      "studentProjectFiles",
      paramDesignation,
      null,
      req.files
    );

    // 7️⃣ Save record
    record.studentProject = {
      value: JSON.stringify({ 
        projectGuidance: studentCount, 
        studentPublication: publicationCount 
      }),
      marks: finalMarks,
      studentProjectFiles: currentFiles
    };

    await record.save();

    // 8️⃣ Respond
    return res.status(200).json({
      section: "Student Projects & Publications",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });

  } catch (error) {
    console.error("Error in calculateStudentProjectMarks:", error);
    return res.status(500).json({ message: "Internal server error", error });
  }
};



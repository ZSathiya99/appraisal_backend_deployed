const teaching = require('../models/TeachingRecord');
const pointsDistribution = require("../utils/prePoints");
const cleanBody = require("../utils/cleanBody");
const handleFiles = require("../utils/fileHandler");


// Q1: Accreditation Activities
exports.calculateActivitiesMarks = async (req, res) => {
  try {
    const { facultyName, roles, employeeId, designation: bodyDesignation, activitiesFiles: bodyFiles } = req.body;
    const { designation: paramDesignation } = req.params;

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

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    let rolesArray = [];
    if (Array.isArray(roles)) rolesArray = roles;
    else if (typeof roles === "string") {
      try {
        rolesArray = JSON.parse(roles);
      } catch {
        rolesArray = roles.includes(",") ? roles.split(",").map(r => r.trim()) : [roles];
      }
    }



    const pointsMap = {
      InstitutionalCoordinator: 5,
      DepartmentCoordinator: 3,
      FileIncharge: 2,
    };

    let totalMarks = 0;
    rolesArray.forEach((role) => {
      if (pointsMap[role]) {
        totalMarks += pointsMap[role];
      }
    });

    // rolesArray = rolesArray.filter(r => r && r.toLowerCase() !== "none");
    
    const maxPass = pointsDistribution[designation]?.service?.activities ?? 0;
    const finalMarks = Math.min(totalMarks, maxPass);

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let currentFiles = handleFiles(
      record,
      "activities",
      "activitiesFiles",
      paramDesignation,
      null,
      req.files
    );

    record.activities = {
       value: {
        roles: rolesArray         
      },
      marks: finalMarks,
      activitiesFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Accreditation / Activities",
      roles: rolesArray,
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });

  } catch (error) {
    console.error("Error calculating accreditation activities marks:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};



// Q2: Branding
exports.calculateBrandingMarks = async (req, res) => {
  try {
    const { facultyName, branding, employeeId, designation: bodyDesignation, brandingFiles: bodyFiles } = req.body;
    const { designation: paramDesignation } = req.params;
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

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records."
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }
    let currentFiles = handleFiles(
      record,
      "branding",
      "brandingFiles",
      paramDesignation,
      null,
      req.files
    );
    let normalizedValue = record.branding?.value || null;
    if (typeof branding === "string") {
      const lower = branding.trim().toLowerCase();
      if (lower === "yes") normalizedValue = "Yes";
      else if (lower === "no") normalizedValue = "No";
    }

    const marks = normalizedValue === "Yes" ? 5 : 0;
    const maxmark = pointsDistribution[designation]?.service?.Branding ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    record.branding = {
      value: normalizedValue,
      marks: finalMarks,
      brandingFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Branding",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });

  } catch (err) {
    console.error("Error calculating branding marks:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Q3: Memebership
exports.calculateMembershipMarks = async (req, res) => {
  try {
    const {
      facultyName,
      membership,
      employeeId,
      designation: bodyDesignation,
      membershipFiles: bodyFiles,
    } = req.body;
    const { designation: paramDesignation } = req.params;

    let designation;
    if (paramDesignation === "HOD" || paramDesignation === "Dean") {
      designation = bodyDesignation;
      if (!employeeId) {
        return res
          .status(400)
          .json({ message: "employeeId is required for HOD/Dean" });
      }
    } else {
      designation = paramDesignation;
    }

    if (!designation) {
      return res.status(400).json({ message: "Designation missing" });
    }

    let employee =
      paramDesignation === "HOD" || paramDesignation === "Dean"
        ? employeeId
        : req.userId;

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message:
            "Faculty record not found. HOD/Dean can only edit existing records.",
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    // 🔹 File handling standardized
    let currentFiles = handleFiles(
      record,
      "membership",
      "membershipFiles",
      paramDesignation,
      null,
      req.files
    );

    // 🔹 Normalize membership value
    let normalizedValue = null;
    if (typeof membership === "string") {
      const lower = membership.toLowerCase();
      if (lower === "yes") normalizedValue = "Yes";
      else if (lower === "no") normalizedValue = "No";
    }

    // Marks calculation
    const marks = normalizedValue === "Yes" ? 4 : 1;
    const maxmark = pointsDistribution[designation]?.service?.Membership ?? 0;
    const finalMarks = Math.min(marks, maxmark);
    record.membership = {
      value: normalizedValue,
      marks: finalMarks,
      membershipFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Membership",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    console.error("Error calculating membership marks:", err);
    return res.status(500).json({ error: err.message });
  }
};



// Q4: Co-curricular
exports.calculateCocurricularMarks = async (req, res) => {
  try {
    const {
      facultyName,
      cocurricular,
      employeeId,
      designation: bodyDesignation,
    } = req.body;

    const { designation: paramDesignation } = req.params;

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

    let employee = paramDesignation === "HOD" || paramDesignation === "Dean"
      ? employeeId
      : req.userId;

    let record = await teaching.findOne({ facultyName, employee });
    if (!record) {
      if (paramDesignation === "HOD" || paramDesignation === "Dean") {
        return res.status(404).json({
          message: "Faculty record not found. HOD/Dean can only edit existing records.",
        });
      }
      record = new teaching({ facultyName, designation, employee });
    }

    let cocurricularData = cocurricular;
    if (!cocurricularData && req.body["cocurricular "]) {
      cocurricularData = req.body["cocurricular "];
    }
    if (typeof cocurricularData === "string") {
      try {
        cocurricularData = JSON.parse(cocurricularData);
      } catch {
        cocurricularData = [];
      }
    }

    let totalMarks = 0;
    if (Array.isArray(cocurricularData)) {
      cocurricularData.forEach((item) => {
        const role = item.role;
        const count = Number(item.count) || 0;

        let marksPer = 0;
        if (role === "ResourcePerson") marksPer = 2;
        else if (role === "Events") marksPer = 1;

        totalMarks += count * marksPer;
      });
    }

    const maxPass = pointsDistribution[designation]?.service?.External ?? 0;
    const finalMarks = Math.min(totalMarks, maxPass);

    record.external = {
      value: JSON.stringify(cocurricularData),
      marks: finalMarks,
    };

    await record.save();

    return res.status(200).json({
      section: "Co-curricular",
      finalMarks,
      employee,
      designation,
    });
  } catch (err) {
    console.error("Error calculating co-curricular marks:", err);
    return res.status(500).json({ error: err.message });
  }
};




//Q5: Assistance
exports.calculateAssistanceMarks = async (req, res) => {
  try {
    const { facultyName, assistance, employeeId, designation: bodyDesignation, administrationFiles: bodyFiles } = cleanBody(req.body);
    const { designation: paramDesignation } = req.params;

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

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;


    const isYes = typeof assistance === "string" && assistance.trim().toLowerCase() === "yes";
    const marks = isYes ? 5 : 0;

    const maxmark = pointsDistribution[designation]?.service?.Administration ?? 0;
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

    let currentFiles = handleFiles(
      record,
      "administration",
      "administrationFiles",
      paramDesignation,
      null,
      req.files
    );


    record.administration = {
      value: assistance ?? "Not Provided",
      marks: finalMarks,
      administrationFiles: currentFiles
    };

    await record.save();

    return res.status(200).json({
      section: "Administration/Assistance",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });

  } catch (err) {
    console.error("Error calculating assistance marks:", err);
    return res.status(500).json({ error: err.message });
  }
};




//Q6: Training
exports.calculateTrainingMarks = async (req, res) => {
  try {
    const { facultyName, training, employeeId, designation: bodyDesignation, trainingFiles: bodyFiles } = cleanBody(req.body);
    const { designation: paramDesignation } = req.params;

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

    let employee = (paramDesignation === "HOD" || paramDesignation === "Dean")
      ? employeeId
      : req.userId;

    let marks = 0;
    if (training === "3 days & above") marks = 5;
    else if (training === "2 days") marks = 3;
    else if (training === "1 day") marks = 1;

    const maxmark = pointsDistribution[designation]?.service?.Training ?? 0;
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

    let currentFiles = handleFiles(
      record,
      "training",          
      "trainingFiles",     
      paramDesignation,
      null,
      req.files
    );

    record.training = {
      value: training,
      marks: finalMarks,
      trainingFiles: currentFiles
    };

    await record.save();

    return res.status(200).json({
      section: "Training / Workshop",
      finalMarks,
      files: currentFiles,
      employee,
      designation
    });

  } catch (err) {
    console.error("Error calculating training marks:", err);
    return res.status(500).json({ error: err.message });
  }
};

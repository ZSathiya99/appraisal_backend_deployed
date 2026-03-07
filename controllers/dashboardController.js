const Employee = require("../models/Employee");
const TeachingRecord = require("../models/TeachingRecord");
const generatePDF = require("../utils/pdfGenerator");
const path = require("path");
const { sendMailWithPdf } = require("../utils/mailer");
const fs = require("fs");
const {getFormDataForPdf} = require("../utils/pdfhelper");

exports.getEmployeeStats = async (req, res) => {
  try {
    const loggedInEmployee = await Employee.findById(req.userId);
    if (!loggedInEmployee) {
      return res.status(404).json({ message: "User not found" });
    }

    const designation = (loggedInEmployee.designation || "").toLowerCase(); // lowercase
    console.log("-----",designation);
    const email = (loggedInEmployee.email || "").toLowerCase();

    let employeeFilter = {};
    let approvalFilter = {};

    if(designation.toLowerCase().includes("hod")) {
      


      employeeFilter = {
        department: loggedInEmployee.department,
        designation: { $nin: ["hod", "dean"] },
      };
      approvalFilter = { approvalStatus: "Pending with HOD" };
    } else if (designation.toLowerCase().includes("dean")) {
      let deanType = "General Dean";

      if (email.includes("iqac")) {
        deanType = "IQAC Dean";
        approvalFilter = { approvalStatus: "Pending with iqac Dean" };
      } else if (email.includes("academics")) {
        deanType = "Academic Dean";
        approvalFilter = { approvalStatus: "Pending with Academic Dean" };
      } else if (email.includes("research")) {
        deanType = "Research Dean";
        approvalFilter = { approvalStatus: "Pending with Research Dean" };
      } else {
        approvalFilter = { approvalStatus: "Pending with Dean" };
      }

      employeeFilter = { designation: { $nin: ["hod", "dean"] } };
    } else if (designation === "hr") {
      employeeFilter = {}; 
      approvalFilter = {}; 
    } else {
      return res.status(403).json({
        message: "Access denied. Only HOD, Dean, or HR can view this data.",
      });
    }

    const employees = await Employee.find(employeeFilter).select(
      "fullName email department designation formStatus status phone_number employee_id"
    );

    const employeeIds = employees.map((emp) => emp._id);

    const forms = await TeachingRecord.find({
      employee: { $in: employeeIds },
      ...approvalFilter,
    })
      .populate(
        "employee",
        "fullName email department designation formStatus status phone_number employee_id"
      )
      .sort({ createdAt: -1 });

    let mergedData = employees.map((emp) => {
      const form = forms.find(
        (f) => f.employee && f.employee._id.toString() === emp._id.toString()
      );

      return {
        id: emp._id,
        fullName: emp.fullName,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        formStatus: emp.formStatus || (form ? "Submitted" : "Not Submitted"),
        status: emp.status,
        employeeId: emp.employee_id,
        phone_number: emp.phone_number,
        formId: form ? form._id : "",
        approvalStatus: form ? form.approvalStatus : "No Form",
        isSubmitted: form ? form.isSubmitted : false,
        createdAt: form ? form.createdAt : null,
      };
    });

    if (designation !== "hr") {
      mergedData = mergedData.filter((emp) => emp.formId);
    }

    const professorCount = mergedData.filter(
      (emp) => emp.designation.toLowerCase() === "professor"
    ).length;
    const associateProfessorCount = mergedData.filter(
      (emp) => emp.designation.toLowerCase() === "associate professor"
    ).length;
    const assistantProfessorCount = mergedData.filter(
      (emp) => emp.designation.toLowerCase() === "assistant professor"
    ).length;

    const totalEmployees =
      professorCount + associateProfessorCount + assistantProfessorCount;

    const submittedForms = mergedData.filter(
      (emp) => emp.formStatus === "Submitted"
    ).length;

    const formSubmissionPercentage =
      totalEmployees > 0
        ? ((submittedForms / totalEmployees) * 100).toFixed(2)
        : 0;

    if (designation === "hr") {
      return res.json({
        department: "All Departments",
        totalEmployees,
        professorCount,
        associateProfessorCount,
        assistantProfessorCount,
        submittedForms,
        formSubmissionPercentage: `${formSubmissionPercentage}%`,
      });
    }

    res.json({
      department: loggedInEmployee.department,
      totalEmployees,
      professorCount,
      associateProfessorCount,
      assistantProfessorCount,
      submittedForms,
      formSubmissionPercentage: `${formSubmissionPercentage}%`,
      employees: mergedData,
    });
  } catch (err) {
    console.error("Error fetching employee stats from forms:", err);
    res.status(500).json({
      message: "Error fetching employee stats from forms",
      error: err.message,
    });
  }
};



exports.getEmployees = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const employee = req.userId;
    const userEmail = req.user.email;


    const loggedInEmployee = await Employee.findOne({ email: userEmail });

    if (!loggedInEmployee) {
      return res
        .status(404)
        .json({ message: "User not found in Employee records" });
    }

    const designation = loggedInEmployee.designation;
    let filter = { designation: { $ne: "HOD" } };

    if (designation === "HOD") {
      filter.department = loggedInEmployee.department;
    } else if (designation === "Dean") {
    } else {
      return res
        .status(403)
        .json({
          message: "Access denied. Only HOD or Dean can view this data.",
        });
    }

    const employees = await Employee.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalEmployees = await Employee.countDocuments();

    res.json({
      totalEmployees,
      currentPage: page,
      totalPages: Math.ceil(totalEmployees / limit),
      pageSize: employees.length,
      employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching employees" });
  }
};

exports.markFormSubmitted = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      employeeId,
      { formStatus: "Submitted" },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    await TeachingRecord.updateMany(
      { employee: employeeId, approvalStatus: { $in: ["Pending", null] } },
      { approvalStatus: "Pending with HOD" }
    );

    res.json({
      message: "Form marked as submitted successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    console.error("Error updating submission status:", error);
    res.status(500).json({ message: "Error marking form as submitted" });
  }
};

// HOD Approval
exports.approveByHOD = async (req, res) => {
  try {
    const { recordId } = req.params;

    const formRecord = await TeachingRecord.findByIdAndUpdate(
      recordId,
      { approvalStatus: "Pending with Academic Dean" },
      { new: true }
    ).populate("employee");

    if (!formRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!formRecord.employee || !formRecord.employee.email) {
      return res.status(400).json({ message: "Employee email not found!" });
    }

    // const formData = await getFormDataForPdf(recordId);
    // console.log(formData)
    // const pdfUint8Array = await generatePDF(formData);

    // const pdfBuffer = Buffer.from(pdfUint8Array);

    // const generatedDir = path.join(__dirname, "..", "generated");
    // if (!fs.existsSync(generatedDir)) {
    //   fs.mkdirSync(generatedDir, { recursive: true });
    // }

    // const employeeName =
    //   formRecord.employee?.fullName ||
    //   formRecord.employee?.employeeName ||
    //   formRecord.employee?.name ||
    //   "unknown";

    // const pdfFilePath = path.join(generatedDir, `Appraisal_${employeeName}_HOD.pdf`);

    // fs.writeFileSync(pdfFilePath, pdfBuffer);

    // await sendMailWithPdf({
    //   to: formRecord.employee.email,
    //   subject: "Your Teaching Record Updated by HOD",
    //   pdfPath: pdfBuffer, 
    //   body: `Hello ${formData.employeeName}, your teaching record has been approved by HOD.`,
    // });

    res.json({
      message: "Form approved by HOD and sent to Academic Dean",
    });
  } catch (err) {
    console.error("Error approving record:", err);
    res.status(500).json({ message: "Error approving record" });
  }
};

// Academic Dean Approval
exports.approveByAcademicDean  = async (req, res) => {
  try {
    const { recordId } = req.params;

    const formRecord = await TeachingRecord.findByIdAndUpdate(
      recordId,
      { approvalStatus: "Pending with Research Dean" },
      { new: true }
    ).populate("employee");
    if (!formRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!formRecord.employee || !formRecord.employee.email) {
      return res.status(400).json({ message: "Employee email not found!" });
    }

    // const formData = await getFormDataForPdf(recordId);
    // const pdfUint8Array = await generatePDF(formData);

    // const pdfBuffer = Buffer.from(pdfUint8Array);

    // const generatedDir = path.join(__dirname, "..", "generated");
    // if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

    // const employeeName =
    //   formRecord.employee?.fullName ||
    //   formRecord.employee?.employeeName ||
    //   formRecord.employee?.name ||
    //   "unknown";


    // const pdfFilePath = path.join(generatedDir, `Appraisal_${employeeName}_Approved.pdf`);
    // fs.writeFileSync(pdfFilePath, pdfBuffer);

    
    // await sendMailWithPdf({
    //   to: formRecord.employee.email,
    //   subject: "Your Teaching Record Approved by Dean",
    //   pdfPath: pdfBuffer,
    // });

    res.json({
      message: "Form approved by Academic Dean ",
    });
  } catch (err) {
    console.error("Error approving record:", err);
    res.status(500).json({ message: "Error approving record" });
  }
};

// Research Dean Approval
exports.approveByResearchDean  = async (req, res) => {
  try {
    const { recordId } = req.params;

    const formRecord = await TeachingRecord.findByIdAndUpdate(
      recordId,
      { approvalStatus: "Pending with iqac Dean" },
      { new: true }
    ).populate("employee");
    if (!formRecord) {
      return res.status(404).json({ message: "Record not found" });
    }

    if (!formRecord.employee || !formRecord.employee.email) {
      return res.status(400).json({ message: "Employee email not found!" });
    }

    // const formData = await getFormDataForPdf(recordId);
    // const pdfUint8Array = await generatePDF(formData);

    // const pdfBuffer = Buffer.from(pdfUint8Array);

    // const generatedDir = path.join(__dirname, "..", "generated");
    // if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

    // const employeeName =
    //   formRecord.employee?.fullName ||
    //   formRecord.employee?.employeeName ||
    //   formRecord.employee?.name ||
    //   "unknown";


    // const pdfFilePath = path.join(generatedDir, `Appraisal_${employeeName}_Approved.pdf`);
    // fs.writeFileSync(pdfFilePath, pdfBuffer);

    // await sendMailWithPdf({
    //   to: formRecord.employee.email,
    //   subject: "Your Teaching Record Approved by Dean",
    //   pdfPath: pdfBuffer,
    // });

    res.json({
      message: "Form approved by Dean and email sent successfully",
    });
  } catch (err) {
    console.error("Error approving record:", err);
    res.status(500).json({ message: "Error approving record" });
  }
};

// IQAC Dean Approval
exports.approveByIqacDean = async (req, res) => {
  try {
    const { recordId } = req.params;

    const formRecord = await TeachingRecord.findByIdAndUpdate(
      recordId,
      { approvalStatus: "Approved",isSubmitted: "Yes" },
      { new: true }
    ).populate("employee");


    if (!formRecord) {
      return res.status(404).json({ message: "Record not found" });
    }


    const formData = await getFormDataForPdf(recordId);
    const pdfUint8Array = await generatePDF(formData);

    const pdfBuffer = Buffer.from(pdfUint8Array);

    const generatedDir = path.join(__dirname, "..", "generated");
    if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

    const employeeName =
      formRecord.employee?.fullName ||
      formRecord.employee?.employeeName ||
      formRecord.employee?.name ||
      "unknown";


    const pdfFilePath = path.join(generatedDir, `Appraisal_${employeeName}_Approved.pdf`);
    fs.writeFileSync(pdfFilePath, pdfBuffer);

    await sendMailWithPdf({
      to: formRecord.employee.email,
      subject: "Your Teaching Record Approved by Dean",
      pdfPath: pdfBuffer,
    });

    res.json({
      message: "Form approved by Dean and email sent successfully",
      record: formData,
    });
  } catch (err) {
    console.error("❌ Error approving record:", err);
    res.status(500).json({ message: "Error approving record" });
  }
};


// get the form based on the login
exports.getFilteredTeachingRecords = async (req, res) => {
  try {
    const loggedInEmployee = await Employee.findById(req.userId);
    if (!loggedInEmployee) {
      return res
        .status(404)
        .json({ message: "User not found in Employee records" });
    }

    const designation = loggedInEmployee.designation;
    let filter = { designation: { $ne: "HOD" } };

    if (designation === "HOD") {
      filter = {
        approvalStatus: "Pending with HOD",
        "employee.department": loggedInEmployee.department,
      };
    } else if (designation === "Dean") {
      filter = { approvalStatus: "Pending with Dean" };
    } else {
      return res
        .status(403)
        .json({
          message: "Access denied. Only HOD or Dean can view this data.",
        });
    }

    const filteredEmployees = await Employee.find(filter).select("_id");
    const employeeIds = filteredEmployees.map((e) => e._id);

    const records = await TeachingRecord.find({
      employee: { $in: employeeIds },
    })
      .populate("employee")
      .sort({ createdAt: -1 })
      .lean();

    const verified = records.filter((r) => r.approvalStatus === "Approved");
    const notVerified = records.filter((r) => r.approvalStatus !== "Approved");

    res.status(200).json({
      verified,
      notVerified,
    });
  } catch (err) {
    console.error("Error fetching filtered teaching records:", err);
    res
      .status(500)
      .json({
        message: "Error fetching filtered teaching records",
        error: err.message,
      });
  }
};

exports.getFile = async (req, res) => {
  const filename = req.params.filename;
  const uploadFolder = path.join(__dirname, "..", "uploads"); 
  const filePath = path.join(uploadFolder, filename);

  res.sendFile(filePath, (err) => {
    if (err) {
      return res.status(404).send("File not found");
    }
  });
};



exports.getEmployeeForms = async (req, res) => {
  try {
    // Get logged-in employee
    const loggedInEmployee = await Employee.findById(req.userId);

    if (!loggedInEmployee) {
      return res.status(404).json({ message: "User not found" });
    }

    const designation = loggedInEmployee.designation?.toLowerCase();
    const email = loggedInEmployee.email?.toLowerCase();

    console.log(`👤 Logged in as: ${designation}`);

    let employeeFilter = {};
    let approvalFilter = {};
    let approvalKeyword = "";

    // Staff whose forms will be shown
    const allowedDesignations = [
      "Professor",
      "Assistant Professor",
      "Associate Professor",
    ];

    // ---------------- HOD ----------------
    if (designation.toLowerCase().includes("hod")) {
      employeeFilter = {
        department: loggedInEmployee.department,
        designation: { $in: allowedDesignations },
      };

      approvalFilter = { approvalStatus: "Pending with HOD" };
      approvalKeyword = "Pending with HOD";
    }

    // ---------------- DEAN ----------------
    else if (designation.toLowerCase().includes("dean")) {
      employeeFilter = {
        designation: { $in: allowedDesignations },
      };

      if (email.includes("academic")) {
        approvalFilter = { approvalStatus: "Pending with Academic Dean" };
        approvalKeyword = "Pending with Academic Dean";
      } else if (email.includes("research")) {
        approvalFilter = { approvalStatus: "Pending with Research Dean" };
        approvalKeyword = "Pending with Research Dean";
      } else if (email.includes("iqac")) {
        approvalFilter = { approvalStatus: "Pending with iqac Dean" };
        approvalKeyword = "Pending with iqac Dean"
      } else {
        return res.status(400).json({
          message:
            "Dean email must contain academic / research / iqac.",
        });
      }
    }

    // ---------------- HR ----------------
    else if (designation.includes("hr")) {
      employeeFilter = {
        designation: { $in: allowedDesignations },
      };

      approvalFilter = {}; // HR sees all
      approvalKeyword = "";
    }

    // ---------------- UNAUTHORIZED ----------------
    else {
      return res.status(403).json({
        message: "Access denied. Only HOD, Dean, or HR can access.",
      });
    }

    // Get employees
    const employees = await Employee.find(employeeFilter);

    // Get forms
    const forms = await TeachingRecord.find({
      employee: { $in: employees.map((emp) => emp._id) },
      ...approvalFilter,
    })
      .populate(
        "employee",
        "fullName email department designation formStatus status phone_number employee_id approvalStatus"
      )
      .sort({ createdAt: -1 });

    // Combine employee + form
    let response = employees.map((emp) => {
      const form = forms.find(
        (f) =>
          f.employee &&
          f.employee._id.toString() === emp._id.toString()
      );

      const approvalStatus = form?.approvalStatus || "Pending";

      return {
        id: emp._id,
        fullName: emp.fullName,
        email: emp.email,
        department: emp.department,
        designation: emp.designation,
        formStatus: emp.formStatus,
        status: emp.status,
        employeeId: emp.employee_id,
        phone_number: emp.phone_number,
        approvalStatus,
        formId: form ? form._id : "",
        isSubmitted:
          form &&
          (form.isSubmitted === true || form.isSubmitted === "Yes"),
        createdAt: form ? form.createdAt : null,
        hasForm: !!form,
      };
    });

    // Filter based on approval keyword
    if (approvalKeyword) {
      response = response.filter(
        (emp) =>
          emp.approvalStatus &&
          emp.approvalStatus.trim().toLowerCase() ===
            approvalKeyword.trim().toLowerCase()
      );
    }

    console.log("Final Response:", response);

    res.json(response);
  } catch (err) {
    console.error("Error fetching employee forms:", err);

    res.status(500).json({
      message: "Error fetching employee forms",
      error: err.message,
    });
  }
};





exports.getchart =  async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$department",
          submitted: {
            $sum: { $cond: [{ $eq: ["$formStatus", "Submitted"] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $eq: ["$formStatus", "Pending"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          submitted: 1,
          pending: 1
        }
      }
    ];

    const data = await Employee.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching chart data", error: err.message });
  }
};


exports.getpieChart = async (req, res) => {
  try {
    const pipeline = [
      {
        $match: {
          designation: { 
            $in: ["Associate Professor", "Assistant Professor", "Professor"] 
          }
        }
      },
      {
        $group: {
          _id: {
            department: "$department",
            designation: "$designation"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.department",
          designations: {
            $push: {
              designation: "$_id.designation",
              count: "$count"
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          designations: 1
        }
      }
    ];

    const data = await Employee.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
};



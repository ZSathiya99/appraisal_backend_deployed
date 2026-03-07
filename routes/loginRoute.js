const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");
const authMiddleware = require("../middleware/authenticate");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "appraisal_backend";

//login Employee
router.post("/employee-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const employee = await Employee.findOne({ email: email.trim() });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!employee.password) {
      return res.status(400).json({ message: "Password not set for this employee" });
    }

    try {
      isMatch = await bcrypt.compare(password, employee.password);
    } catch (err) {
      console.warn("⚠️ Bcrypt compare failed, checking plain text...");
    }

    if (!isMatch) {
      isMatch = password === employee.password;
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign({ id: employee._id, email: employee.email, designation: employee.designation, department: employee.department,
      facultyName : employee.fullName
     }, JWT_SECRET, {
      expiresIn: "2d",
    });

res.status(200).json({
  message: "Login successful",
  token,
  // employee: {
  //   id: employee._id,
  //   email: employee.email,
  //   fullName: employee.fullName,
  //   department: employee.department,
  //   designation: employee.designation,
  //   phone: employee.phone,
  //   address: employee.address,
  //   joiningDate: employee.joiningDate,
  //   salary: employee.salary,
  //   managerEmail: employee.managerEmail,
  //   createdAt: employee.createdAt,
  //   updatedAt: employee.updatedAt,
  // },
});

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const formatDate = (date) => {
  if (!date) return null;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0"); // months are 0-based
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};


//Fetch employee details
router.get("/employee/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id); 

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    const employeeData = employee.toObject();
    
    if (employeeData.joiningDate) {
      employeeData.joiningDate = formatDate(employeeData.joiningDate);
    }

    res.status(200).json(employeeData);
  } catch (err) {
    console.error("Fetch employee by ID error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});





module.exports = router;

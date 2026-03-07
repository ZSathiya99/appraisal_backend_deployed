  const express = require("express");
  const multer = require("multer");
  const XLSX = require("xlsx");
  const fs = require("fs");
  const path = require("path");
  const bcrypt = require("bcrypt");
  const Employee = require("../models/Employee");
  const moment = require("moment");

  const router = express.Router();
  const upload = multer({ dest: "uploads/" });

  router.post("/upload-employees", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const workbook = XLSX.readFile(req.file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const employees = XLSX.utils.sheet_to_json(sheet);

      let created = 0;
      let skipped = [];

      for (const emp of employees) {
        const existing = await Employee.findOne({ email: emp.email });

        if (existing) {
          skipped.push(`${emp.email} (already exists)`);
          continue;
        }

        if (!emp.password) {
          skipped.push(`${emp.email} (missing password)`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(emp.password, 10);

        // 🧠 Step 1: Inspect what Excel gives
        console.log("Raw joiningDate from Excel:", emp.joiningDate);

        // 🧩 Step 2: Convert joiningDate
        let joiningDate = null;

        try {
          if (emp.joiningDate) {
            if (typeof emp.joiningDate === "number") {
              // Excel numeric date (serial)
              const parsed = XLSX.SSF.parse_date_code(emp.joiningDate);
              joiningDate = new Date(parsed.y, parsed.m - 1, parsed.d);
            } else if (typeof emp.joiningDate === "string") {
              // Text date (DD-MM-YYYY or similar)
              const parsed = moment(emp.joiningDate, ["DD-MM-YYYY", "D-M-YYYY", "YYYY-MM-DD"], true);
              if (parsed.isValid()) {
                joiningDate = parsed.toDate();
              } else {
                console.log(`⚠️ Invalid date format for ${emp.email}: ${emp.joiningDate}`);
              }
            }
          }
        } catch (e) {
          console.error("Date parsing error for:", emp.joiningDate, e);
        }

        console.log("Final converted date:", joiningDate);

        // 🧩 Step 3: Create record (only if date is valid or null)
        await Employee.create({
          employee_id: emp.employee_id,
          email: emp.email.trim(),
          password: hashedPassword,
          fullName: emp.fullName || emp.name,
          department: emp.department,
          designation: emp.designation,
          joiningDate: joiningDate || null, // ✅ ensures no invalid string gets sent
          phone_number: emp.phoneNumber,
        });

        created++;
      }

      fs.unlinkSync(path.resolve(req.file.path)); // Clean up

      res.json({
        message: `✅ Upload completed. Created ${created} employee(s).`,
        skipped: skipped.length > 0 ? skipped : undefined,
      });
    } catch (err) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  module.exports = router;

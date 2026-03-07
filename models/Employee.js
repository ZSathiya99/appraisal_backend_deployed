const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  employee_id : String,
  fullName: String,
  department: String,
  designation: String,
  phone_number: String,
  joiningDate: Date,
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  formStatus: {
    type: String,
    enum: ['Pending', 'Submitted'],
    default: 'Pending' 
  },
});

module.exports = mongoose.model("Employee", employeeSchema);
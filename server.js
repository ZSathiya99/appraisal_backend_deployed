const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const loginRoute = require("./routes/loginRoute");
const uploadEmployeesRoute = require("./routes/uploadEmployees");
const teachingRoutes = require("./routes/teachingRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const researchRoutes = require("./routes/researchRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const dashboadRoutes = require("./routes/dashboadRoutes");
const pdfRoutes = require("./routes/pdfRoutes");
const adminRoutes = require("./routes/adminRoutes");

dotenv.config();
require("dotenv").config();
const app = express();
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://13.51.48.11",
      "https://13.51.48.11:80",
      "http://51.21.244.127",
      "http://51.20.120.152",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use("/api", loginRoute);
app.use("/api", uploadEmployeesRoute);
app.use("/api", teachingRoutes);
app.use("/api", subjectRoutes);
app.use("/api", researchRoutes);
app.use("/api", serviceRoutes);
app.use("/api", dashboadRoutes);
app.use("/api", pdfRoutes);
app.use("/api", adminRoutes);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5003, () => {
      console.log("Server running on port 5003");
    });
  })
  .catch((err) => console.error("DB error", err));

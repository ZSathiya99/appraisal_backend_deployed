const nodemailer = require("nodemailer");
const path = require("path");


const sendMailWithPdf = async ({ to, subject, pdfPath }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let attachments = [];

    if (Buffer.isBuffer(pdfPath)) {
      // 🧠 It's a PDF buffer
      attachments.push({
        filename: "AppraisalReport.pdf",
        content: pdfPath,
        contentType: "application/pdf",
      });
    } else if (typeof pdfPath === "string") {
      // 🧠 It's a path
      attachments.push({
        filename: pdfPath.split("/").pop(),
        path: pdfPath,
      });
    } else {
      throw new Error("Invalid PDF path provided");
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: "Please find the attached approved report.",
      attachments,
    });

    console.log("✅ Email sent successfully");
  } catch (err) {
    console.error("❌ Error sending email:", err);
    throw err;
  }
};



module.exports = { sendMailWithPdf };

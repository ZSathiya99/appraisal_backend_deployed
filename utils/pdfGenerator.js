const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "..", "images", "clg-logo.png");
const logoBase64 = fs.readFileSync(logoPath, { encoding: "base64" });

async function generatePDF(formData) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Define table headers (assuming all sections have same structure)
  const sectionHeader = ["Question/Activity", "Marks"];

  // Function to generate table HTML for any section
  // Function to generate table HTML for any section
  const generateSectionTable = (sectionData) => {
    const sectionHeader = ["Question/Activity", "Marks"];
    const headerHtml = sectionHeader.map((item) => `<th>${item}</th>`).join("");

    let rowsHtml = "";
    if (sectionData && sectionData.length > 0) {
      rowsHtml = sectionData
        .map((item) => {
          return `<tr>
                <td>${item.question || item.activity}</td>
                <td>${item.marks}</td>
              </tr>`;
        })
        .join("");
    } else {
      rowsHtml = `<tr><td colspan="${sectionHeader.length}">No data available</td></tr>`;
    }

    return `
  <table>
    <thead class="table-header">
      <tr>${headerHtml}</tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
`;
  };

  const htmlContent = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px 40px; }
          h1, h2 { color: #2c3e50; }
          .section { margin-bottom: 40px; margin-top:60px }
          .section-1 {margin-top:80px; margin-bottom: 20px; }
          .label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          td, th { border: 1px solid #ccc; padding: 8px; text-align: left; }
          .title { color: #2c3e50; font-weight: bold; width: fit-content; margin: auto; }
          .table-header { background: teal; color: white; }
          .page-break { page-break-before: always; }
          .logo {width : 200px; margin:auto; margin-bottom:12px;}
          .header {text-align : center}
          .bold {font-weight : bold}
          
        </style>
      </head>
      <body>

         <div class="header">
        <img src="data:image/png;base64,${logoBase64}" class="logo" />
        <h1 class="title">Faculty Appraisal Form</h1>
      </div>

        <div class="section">
          <p><span class="label">Name:</span> ${formData.employeeName}</p>
          <p><span class="label">Employee ID:</span> ${formData.employee_id}</p>
          <p><span class="label">Department:</span> ${formData.department}</p>
          <p><span class="label">Designation:</span> ${formData.designation}</p>
          <p><span class="label">Email:</span> ${formData.email}</p>
        </div>

        <h2 class="section-1">Total Marks</h2>
        <table>
          <thead class="table-header">
            <tr>
              <td>Title</td>
              <td>Marks</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Teaching</td>
              <td>${formData.teachingTotal}</td>
            </tr>
            <tr>
              <td>Research</td>
              <td>${formData.researchTotal}</td>
            </tr>
            <tr>
              <td>Service</td>
              <td>${formData.serviceTotal}</td>
            </tr>
              <td class="bold">Total</td>
              <td class="bold">${formData.overallTotal}</td>
            </tr>
          </tbody>
  </table>

     <div class="page-break"></div>

       

        <div class="section">
          <h2>Teaching</h2>
          ${generateSectionTable(formData.teaching)}
        </div>
        <div class="page-break"></div>

        <div class="section">
          <h2>Research</h2>
          ${generateSectionTable(formData.research)}
        </div>

        <div class="page-break"></div>
        <div class="section">
          <h2>Service</h2>
          ${generateSectionTable(formData.service)}
        </div>
      </body>
    </html>
  `;

  await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = generatePDF;

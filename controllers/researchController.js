const teaching = require("../models/TeachingRecord");
const pointsDistribution = require("../utils/prePoints");
const handleFiles = require("../utils/fileHandler");

// Q1: SCIE
exports.calculateSciePaper = async (req, res) => {
  try {
    const {
      facultyName,
      scie,
      employeeId,
      designation: bodyDesignation,
      sciePaperFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "sciePaper",
      "sciePaperFiles",
      paramDesignation,
      null,
      req.files
    );

    let papers = scie;
    if (typeof scie === "string") {
      try {
        papers = JSON.parse(scie);
      } catch {
        return res.status(400).json({ error: "Invalid SCIE data format" });
      }
    }

    if (!Array.isArray(papers)){
      return res.status(400).json({ error: "SCIE must be an array" });
    }
    let parsedValue;
    try {
      parsedValue = Array.isArray(req.body.scie)
        ? req.body.scie
        : JSON.parse(req.body.scie);
    } catch (err) {
      return res.status(400).json({ message: "Invalid JSON in value field" });
    }

    let valueObj = null;
    if (Array.isArray(parsedValue) && parsedValue.length > 0) {
      valueObj = {
        status: "yes",
        data: parsedValue,
      };
    } else if (Array.isArray(parsedValue) && parsedValue.length === 0) {
      valueObj = {
        status: "No",
        data: [],
      };
    } else {
      valueObj = {
        status: null,
        data: null,
      };
    }

    let totalMarks = 0;
    if(valueObj.status === 'yes'){
      papers.forEach((paper) => {
        if (paper.typeOfAuthor === "Firstauthor") totalMarks += 4;
        else if (paper.typeOfAuthor === "secondauthor") totalMarks += 2;
        else if (paper.typeOfAuthor === "thirdauthor") totalMarks += 1;
      });
    }

    const maxmark = pointsDistribution[designation]?.research?.scie ?? 0;
    const finalMarks = Math.min(totalMarks, maxmark);

    

    
    record.sciePaper = {
      value: valueObj,
      marks: finalMarks,
      sciePaperFiles: currentFiles,
    };
    await record.save();

    return res.status(200).json({
      section: "SCIE",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q2: Scopus
exports.calculateScopusPaper = async (req, res) => {
  console.log("scopus paper : ", req.body)
  try {
    const {
      facultyName,
      scopus,
      employeeId,
      designation: bodyDesignation,
      scopusPaperFiles: bodyFiles,
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

    let papers = scopus;
    if (typeof scopus === "string") {
      try {
        papers = JSON.parse(scopus);
      } catch {
        return res.status(400).json({ error: "Invalid scopus data format" });
      }
    }

    if (!Array.isArray(papers) ) {
      return res
        .status(400)
        .json({ error: "scopus must be a  array" });
    }

    let valueObj = null;
    if (Array.isArray(papers) && papers.length > 0) {
      valueObj = {
        status: "yes",
        data: papers,
      };
    } else if (Array.isArray(papers) && papers.length === 0) {
      valueObj = {
        status: "No",
        data: [],
      };
    } else {
      valueObj = {
        status: null,
        data: null,
      };
    }


    let totalMarks = 0;
    if(valueObj.status === 'yes'){
      papers.forEach((paper) => {
        if (paper.typeOfAuthor === "Firstauthor") totalMarks += 3;
        else if (paper.typeOfAuthor === "secondauthor") totalMarks += 1.5;
        else if (paper.typeOfAuthor === "thirdauthor") totalMarks += 0.75;
      });
    }

    const maxmark = pointsDistribution[designation]?.research?.scopus ?? 0;
    const finalMarks = Math.min(totalMarks, maxmark);

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
    let currentFiles = handleFiles(
      record,
      "scopusPaper",
      "scopusPaperFiles",
      paramDesignation,
      null,
      req.files
    );

    
    record.scopusPaper = {
      value: valueObj,
      marks: finalMarks,
      scopusPaperFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Scopus",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q3: Aicte
exports.calculateAictePaper = async (req, res) => {
  try {
    const {
      facultyName,
      aicte,
      employeeId,
      designation: bodyDesignation,
      AicteFiles: bodyFiles,
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

    let papers = aicte;
    if (typeof aicte === "string") {
      try {
        papers = JSON.parse(aicte);
      } catch {
        return res.status(400).json({ error: "Invalid aicte data format" });
      }
    }

    if (!Array.isArray(papers) ) {
      return res.status(400).json({ error: "aicte must be a non-empty array" });
    }

    let valueObj = null;
    if (Array.isArray(papers) ) {
      valueObj = {
        status: "yes",
        data: papers,
      };
    } else if (Array.isArray(papers)) {
      valueObj = {
        status: "No",
        data: [],
      };
    } else {
      valueObj = {  
        status: null,
        data: null,
      };
    }

    let totalMarks = 0;
    if(valueObj.status === 'yes'){
      papers.forEach((paper) => {
        if (paper.typeOfAuthor === "Firstauthor") totalMarks += 1;
        else if (paper.typeOfAuthor === "secondauthor") totalMarks += 0.5;
        else if (paper.typeOfAuthor === "thirdauthor") totalMarks += 0.75;
      });
    }

    const maxmark = pointsDistribution[designation]?.research?.aicte ?? 0;
    const finalMarks = Math.min(totalMarks, maxmark);

    let currentFiles = handleFiles(
      record,
      "aictePaper",
      "aictePaperFiles",
      paramDesignation,
      null,
      req.files
    );

    

    record.aictePaper = {
      value: valueObj,
      marks: finalMarks,
      aictePaperFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Aicte",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q4: BookScopus
exports.calculateScopusBook = async (req, res) => {
  try {
    const {
      facultyName,
      numBook,
      employeeId,
      designation: bodyDesignation,
      scopusBookFiles: bodyFiles,
    } = req.body;
    const { designation: paramDesignation } = req.params;

    // Determine designation
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

    const employee =
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
      record = new teaching({
        facultyName,
        designation,
        employee,
        scopusBook: { scopusBookFiles: [] },
      });
    }

    let currentFiles = handleFiles(
      record,
      "scopusBook",
      "scopusBookFiles",
      paramDesignation,
      null,
      req.files
    );

    const bookCount = Number(numBook) || 0;
    const marksPerBook = 2;
    const totalMarks = bookCount * marksPerBook;
    const maxMark = pointsDistribution[designation]?.research?.book_scopus ?? 0;
    const finalMarks = Math.min(totalMarks, maxMark);

    record.scopusBook = {
      value: numBook ?? null,
      marks: finalMarks,
      scopusBookFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "ScopusBook",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    console.error("Error in calculateScopusBook:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Q5: IndexedBook
exports.calculateIndexedBook = async (req, res) => {
  try {
    const {
      facultyName,
      numPaper,
      employeeId,
      designation: bodyDesignation,
      IndexFiles: bodyFiles,
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

    const paperCount = Number(numPaper) || 0;
    const marksPerPaper = 1;
    const totalMarks = paperCount * marksPerPaper;

    const maxmark = pointsDistribution[designation]?.research?.indexbook ?? 0;
    const finalMarks = Math.min(totalMarks, maxmark);

    let currentFiles = handleFiles(
      record,
      "indexBook",
      "indexBookFiles",
      paramDesignation,
      null,
      req.files
    );

    record.indexBook = {
      value: numPaper,
      marks: finalMarks,
      indexBookFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "IndexBook",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q6: Patent
exports.calculatePatentMarks = async (req, res) => {
  try {
    const {
      facultyName,
      patentType,
      numPatent,
      employeeId,
      designation: bodyDesignation,
      PatentFiles: bodyFiles,
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

    const patentCount = Number(numPatent) || 0;
    let marksPerPatent = 0;

    if (patentType === "Published") marksPerPatent = 1;
    else if (patentType === "Utilitygranted") marksPerPatent = 3;
    else if (patentType === "Designothers") marksPerPatent = 2;

    const totalMarks = patentCount * marksPerPatent;
    const maxmark = pointsDistribution[designation]?.research?.patent ?? 0;
    const finalMarks = Math.min(totalMarks, maxmark);

    let currentFiles = handleFiles(
      record,
      "patent",
      "patentFiles",
      paramDesignation,
      null,
      req.files
    );

    record.patent = {
      value: patentType,
      marks: finalMarks,
      patentFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Patent",
      type: patentType,
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q7: hindex
exports.calculatehIndex = async (req, res) => {
  try {
    const {
      facultyName,
      hindex,
      employeeId,
      designation: bodyDesignation,
      hindexFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "hIndex",
      "hIndexFiles",
      paramDesignation,
      null,
      req.files
    );

    let marks = 0;
    const num = Number(hindex);
    if (
      (typeof hindex === "string" && hindex.toLowerCase().includes("5")) ||
      num >= 5
    )
      marks = 3;
    else if ((typeof hindex === "string" && hindex.includes("3")) || num === 3)
      marks = 2;
    else if ((typeof hindex === "string" && hindex.includes("2")) || num === 2)
      marks = 1;

    const maxmark = pointsDistribution[designation]?.research?.hindex ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    record.hIndex = {
      value: hindex,
      marks: finalMarks,
      hIndexFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "HIndex",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q8: 10index
exports.calculateIIndex = async (req, res) => {
  try {
    const {
      facultyName,
      Iindex,
      employeeId,
      designation: bodyDesignation,
      IindexFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "iIndex",
      "iIndexFiles",
      paramDesignation,
      null,
      req.files
    );

    let marks = 0;
    if (Iindex === "2 and above" || Number(Iindex) >= 2) marks = 2;
    else if (Number(Iindex) === 1) marks = 1;

    const maxmark = pointsDistribution[designation]?.research?.i10index ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    record.iIndex = {
      value: Iindex,
      marks: finalMarks,
      iIndexFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "IIndex",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q9: Citation
exports.calculateCitation = async (req, res) => {
  try {
    const {
      facultyName,
      citation,
      employeeId,
      designation: bodyDesignation,
      citationFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "citation",
      "citationFiles",
      paramDesignation,
      null,
      req.files
    );

    let marks = 0;
    if (citation === "100 and above" || Number(citation) >= 100) marks = 3;
    else if (citation === "50" || Number(citation) >= 50) marks = 2;
    else if (citation === "25" || Number(citation) >= 25) marks = 1;

    const maxmark = pointsDistribution[designation]?.research?.citation ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    record.citation = {
      value: citation,
      marks: finalMarks,
      citationFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Citation",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q10: Consultancy
exports.calculateConsultancy = async (req, res) => {
  try {
    const {
      facultyName,
      consultancy,
      employeeId,
      designation: bodyDesignation,
      consultancyFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "consultancy",
      "consultancyFiles",
      paramDesignation,
      null,
      req.files
    );

    let marks = 0;
    if (consultancy === "upto one lakh") marks = 2;
    else if (consultancy === "two lakh") marks = 3;
    else if (consultancy === "greater than five") marks = 4;

    const maxmark = pointsDistribution[designation]?.research?.consultancy ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    record.consultancy = {
      value: consultancy,
      marks: finalMarks,
      consultancyFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Consultancy",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

//Q11: foreign
exports.calculateForeignMarks = async (req, res) => {
  try {
    const {
      foreignWork,
      facultyName,
      employeeId,
      designation: bodyDesignation,
      foreignFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "collabrative",
      "collabrativeFiles",
      paramDesignation,
      null,
      req.files
    );

    const isYes = foreignWork?.toLowerCase() === "yes";
    const marks = isYes ? 2 : 0;
    const maxmark =
      pointsDistribution[designation]?.research?.collabrative ?? 0;
    const finalMarks = Math.min(marks, maxmark);

    record.collabrative = {
      value: foreignWork,
      marks: finalMarks,
      collabrativeFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Foreign/Collaborative Work",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q12: SeedFund
exports.calculateSeedFund = async (req, res) => {
  try {
    const {
      facultyName,
      seedFund,
      employeeId,
      designation: bodyDesignation,
      seedFundFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "seedFund",
      "seedFundFiles",
      paramDesignation,
      null,
      req.files
    );

    let marks = 0;
    if (seedFund === "upto one lakh") marks = 1;
    else if (seedFund === "greater than two lakh") marks = 2;
    else if (seedFund === "Research Publications") marks = 1;

    const maxPass = pointsDistribution[designation]?.research?.seedfund ?? 0;
    const finalMarks = Math.min(marks, maxPass);

    record.seedFund = {
      value: seedFund,
      marks: finalMarks,
      seedFundFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "SeedFund",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Q13: Funded
exports.calculateFundedProjectMarks = async (req, res) => {
  try {
    const {
      facultyName,
      PI,
      CoPI,
      None,
      employeeId,
      designation: bodyDesignation,
      FundFiles: bodyFiles,
    } = req.body;
    const { designation: paramDesignation } = req.params;
    let totalMarks = 0;
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

    let currentFiles = handleFiles(
      record,
      "fundedProject",
      "fundedProjectFiles",
      paramDesignation,
      null,
      req.files
    );

    // 🟢 directly use PI / CoPI values from body
    const piCount = Number(PI) || 0;
    const copiCount = Number(CoPI) || 0;

    let selectedRoles = [];
    let counts = {};

    if (None) {
      selectedRoles.push("None");
      totalMarks = 0;
    }
    else {
      const piCount = Number(PI) || 0;
      const copiCount = Number(CoPI) || 0;
    }
    if (piCount > 0) {
      selectedRoles.push("PI");
      counts["PI"] = piCount;
    }
    if (copiCount > 0) {
      selectedRoles.push("Co-PI");
      counts["CoPI"] = copiCount;
    }

    const piMarks = 5;
    const copiMarks = 2;

    totalMarks = piCount * piMarks + copiCount * copiMarks;

    const maxPass =
      pointsDistribution[designation]?.research?.fund ?? totalMarks;
    const finalMarks = Math.min(totalMarks, maxPass);

    record.fundedProject = {
      value: JSON.stringify({
        selected: selectedRoles,
        count: counts,
      }),
      marks: finalMarks,
      fundedProjectFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "FundedProject",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (error) {
    console.error("Error calculating Funded Project marks:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};


// Q14: Research Scholars
exports.calculateResearchScholarMarks = async (req, res) => {
  try {
    const {
      facultyName,
      guidingCount,
      newlyRegisteredCount,
      completedCount,
      employeeId,
      designation: bodyDesignation,
      scholarFiles: bodyFiles,
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

    let currentFiles = handleFiles(
      record,
      "researchScholars",
      "researchScholarsFiles",
      paramDesignation,
      null,
      req.files
    );

    let marks = 0;
    if (Number(guidingCount) > 5) marks += 3;

    if (Number(newlyRegisteredCount) > 0) {
      marks += Math.min(Number(newlyRegisteredCount) * 1, 2); // max 2 points
    }

    if (Number(completedCount) > 0) {
      marks += Number(completedCount) * 3;
    }

    const maxPass =
      pointsDistribution[designation]?.research?.researchScholars ?? marks;
    const finalMarks = Math.min(marks, maxPass);

    record.researchScholars = {
      value: "ResearchScholars",
      marks: finalMarks,
      researchScholarsFiles: currentFiles,
    };

    await record.save();

    return res.status(200).json({
      section: "Research Scholars",
      finalMarks,
      files: currentFiles,
      employee,
      designation,
    });
  } catch (error) {
    console.error("Error calculating Research Scholar marks:", error);
    return res
      .status(500)
      .json({
        message: "Error calculating Research Scholar marks",
        error: error.message,
      });
  }
};

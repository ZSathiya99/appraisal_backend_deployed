const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = file.originalname.split('.').pop().toLowerCase();
    const allowedFormats = ['jpg', 'jpeg', 'png', 'pdf', 'docx'];

    if (!allowedFormats.includes(ext)) {
      throw new Error('Unsupported file format');
    }

    // ✅ Use "raw" for PDF and DOCX, otherwise "image"
    const resourceType = ['pdf', 'docx'].includes(ext) ? 'raw' : 'image';

    return {
      folder: "appraisal_uploads",
      resource_type: resourceType,
      public_id: file.fieldname,   // ✅ Use the form field name instead of original file name
      use_filename: false,         // we’re manually setting public_id
      unique_filename: false,      // keep the name clean (no random suffix)
      overwrite: true,             // replace if same field name uploaded again
      format: ext,
    };
  },
});

const upload = multer({ storage });

module.exports = { cloudinary, upload };

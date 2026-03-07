function handleFiles(record, field, fileField, designation, bodyFiles, uploadedFiles) {
  let currentFiles = record?.[field]?.[fileField] || [];

  currentFiles = currentFiles.filter(f => typeof f === "string" && f.startsWith("uploads/"));

  if (uploadedFiles && uploadedFiles.length > 0) {
    const newFiles = uploadedFiles.map(f => f.path);
    currentFiles = [...currentFiles, ...newFiles];
  }

  if (designation === "HOD" || designation === "Dean") {
    currentFiles = uploadedFiles ? uploadedFiles.map(f => f.path) : currentFiles;
  }

  return currentFiles;
}

module.exports = handleFiles;

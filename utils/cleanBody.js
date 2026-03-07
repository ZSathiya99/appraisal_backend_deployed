function cleanBody(body) {
  const cleaned = {};
  for (let key in body) {
    if (Object.hasOwn(body, key)) {
      cleaned[key.trim()] = body[key]; 
    }
  }
  return cleaned;
}

module.exports = cleanBody;
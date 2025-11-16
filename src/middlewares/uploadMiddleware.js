const uploadFields = upload.fields([
    { name: "profilePicture", maxCount: 1 },
    { name: "identificationDocument", maxCount: 1 },
    { name: "professionalCertificates", maxCount: 10 }, // Adjust maxCount as needed
  ]);
  
  export default uploadFields;
  
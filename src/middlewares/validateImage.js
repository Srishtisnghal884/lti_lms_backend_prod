const imageUploadValidator = (req,res,next) =>{
  if(!req.file && !req.files){
    return res.status(400).json({
      status:"fail",
      message:"Please upload a file named logo"
    })
  }
  const file = req.file;
  const allowedTypes = ['image/jpeg','image/jpg','image/png','image/webp']

  if(!allowedTypes.includes(file.mimetype)){
    return res.status(400).json({
      status: "fail",
      message : "Only JPG, PNG, and WEBP images are allowed."
    })
  }

  if (file.size > 4 * 1024 * 1024) {
    return res.status(400).json({
      status: "fail",
      message: "Image size cannot exceed 2 MB.",
    });
  }

  next(); // validation OK - move forward
}

module.exports = {
  imageUploadValidator
}
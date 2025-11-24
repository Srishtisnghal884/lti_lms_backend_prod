// config/multer.js
const multer =  require("multer");
const { CloudinaryStorage } =  require("multer-storage-cloudinary");
const cloudinary =  require("./cloudinary.js");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "logos",
    allowed_formats: ["jpg", "jpeg", "png", "svg", "webp"],
    public_id: (req, file) => "logo-" + Date.now(),
  },
});

const upload = multer({ storage });

module.exports = upload;

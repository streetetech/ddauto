const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const { default: mongoose } = require("mongoose");
// const sharp = require("sharp");
require("dotenv").config();
const cacheService = require("express-api-cache");
const cache = cacheService.cache;
const User = require("../model/user.model");

let gfs = new mongoose.mongo.GridFSBucket(mongoose.connection, {
  bucketName: "uploads",
  chunkSizeBytes: 1024,
});

const storage = new GridFsStorage({
  db: mongoose.connection,
  file: (req, file) => {
    const fn = async (req) => {
      const { filename } = await GridFsStorage.generateBytes();
      const id = new mongoose.Types.ObjectId();
      return {
        id,
        filename: `${id}-${filename}${path.extname(file.originalname)}`,
        bucketName: "uploads",
        metadata: {
          likes: [],
          comments: [],
          likedBy: [],
        },
      };
    };
    return fn(req);
  },
});

//Images
const upload = multer({storage});

router.post("/posts", upload.single("post"), async (req, res) => {
  // const user = await User.findById(req.user._id);
  // user.posts = req.file.filename
  // await user.save();
  res.send(req.file)
});

router.post("/upload", upload.array("post"),(req, res) => {
res.send(req.files)
  // const files = Array.isArray(req.files.file) ? req.files.file : [req.files.file];

  // // Create an array to store the uploaded files' IDs
  // const uploadedIds = [];

  // files.forEach((file) => {
  //   // Create a write stream to the GridFS collection
  //   const writeStream = gfs.createWriteStream({
  //     filename: file.filename,
  //   });

  //   // Pipe the file to the write stream
  //   file.pipe(writeStream);

  //   // Handle write stream events
  //   writeStream.on("close", (uploadedFile) => {
  //     uploadedIds.push(uploadedFile._id);
  //     if (uploadedIds.length === files.length) {
  //       res.status(200).json({ fileIds: uploadedIds });
  //     }
  //   });
  //   writeStream.on("error", (err) => {
  //     res.status(500).json({ error: err.message });
  //   });
  // });
});
module.exports = router;

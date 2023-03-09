const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const { default: mongoose } = require("mongoose");
require("dotenv").config();

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
            specifications: req.body,
            make: req.body,
            model: req.body
        }
      }
    };
    return fn(req);
  },
});

//Images
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const maxFileSize = 5 * 1_000_000;
    if (file.size > maxFileSize) {
      return cb("File is too big");
    }
    cb(null, true);
  },
});

router.post("/posts", upload.array("photos"), async (req, res) => {
  res.send(req.files);
});

router.get("/assets/:filename", (req, res) => {
  const { filename } = req.params;
  gfs.find({ filename }).toArray((error, result) => {
    if (error) return res.status(500).send(error.message);
    // Does file exist?
    const [file] = result;
    if (!file) {
      return res.status(404).send("That image was not found");
    }
    const stream = gfs.openDownloadStreamByName(filename);
    stream.pipe(res);
  });
});

router.get("/alls", (req, res) => {
  gfs.find().toArray((error, result) => {
    if (error) return res.status(500).send(error.message);
    // Does file exist?
    if (!result) {
      return res.status(404).send("That image was not found");
    }
    // Send file through stream
    const urls = result.map((file) => {
      return {
        url: `https://flybybackend-production.up.railway.app/api/post/assets/${file.filename}`,
      }
    })
    res.send({urls});
  });
});


module.exports = router;
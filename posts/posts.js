const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const { GridFsStorage } = require("multer-gridfs-storage");
const { default: mongoose } = require("mongoose");
require("dotenv").config();
const { v4: uuidv4 } = require('uuid'); 

let gfs = new mongoose.mongo.GridFSBucket(mongoose.connection, {
  bucketName: "uploads",
  chunkSizeBytes: 1024,
});


let groupId = null; // Declare a variable to store the groupId

const storage = new GridFsStorage({
  db: mongoose.connection,
  file: (req, file) => {
    const fn = async (req) => {
      const { filename } = await GridFsStorage.generateBytes();
      const id = new mongoose.Types.ObjectId();
      if(!groupId){
        groupId = uuidv4();
      }
        return {
        id,
        filename: `${id}-${filename}${path.extname(file.originalname)}`,
        bucketName: "uploads",
        metadata: {
          groupId,
          brand: req.body.brand
        },
      };
    };
    return fn(req);
  },
});

groupId = null;


//Images
const upload = multer({storage});

router.post("/upload", upload.array("post"),(req, res) => {
  // const groupId = uuid()
  // const files = req.files.map((file) => {
  //   return {
  //     ...file,
  //     metadata: {
  //       groupId: groupId, // add unique id to metadata
  //       ...file.metadata
  //     }
  //   };
  // });

  res.send(req.files)
});

router.get("/alls", async (req, res) => {
  try {
    const files = await gfs.find().toArray();
    // Does file exist?
    if (!files || files.length === 0) {
      return res.status(404).send("No files found");
    }

    const groups = {};
    files.forEach((file) => {
      if (file.metadata && file.metadata.groupId) {
        const groupId = file.metadata.groupId;
        if (!groups[groupId]) {
          groups[groupId] = {
            url: `https://flybybackend-production.up.railway.app/api/shorti/assets/${file.filename}`,
            metadata: file.metadata,
          };
        }
      }
    });

    const urls = [];
    for (const groupId in groups) {
      urls.push({ groupId, file: groups[groupId] });
    }

    res.send({ urls: urls });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});




module.exports = router;

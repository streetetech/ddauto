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
  res.send(req.files)
});

router.get("/alls", async (req, res) => {
  try {
    const files = await gfs.find().toArray();
    // Does file exist?
    if (!files || files.length === 0) {
      return res.status(404).send("No files found");
    }
    // const groups = {};
    // files.forEach((file) => {
    //   if (file.metadata && file.metadata.groupId) {
    //     const groupId = file.metadata.groupId;
    //     const name = file.filename;
    //     if (!groups[groupId]) {
    //       groups[groupId] = {
    //         url: `https://ddautoja-backend-production.up.railway.app/api/shorti/assets/${file.filename}`,
    //         metadata: file.metadata,
    //       };
    //     }
    //   }
    // });
    // const urls = [];
    // for (const groupId in groups) {
    //   urls.push({ groupId, files: groups[groupId]
    //    });
    // }
    // res.send({ urls: urls });
    
    const groups = {};
    files.forEach((file) => {
      if (file.metadata && file.metadata.groupId) {
        const groupId = file.metadata.groupId;
        const name = file.filename;
        if (!groups[groupId]) {
          groups[groupId] = `https://ddautoja-backend-production.up.railway.app/api/post/assets/${file.filename}`;
        }
      }
    });
    
    const urls = Object.entries(groups).map(([groupId, url]) => ({
      groupId,
      url,
    }));
    
    res.send({ urls })  
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});

router.get("/assets/:filename", (req, res) => {
  const { filename } = req.params;
  gfs.find({ filename }, (error, file) => { // Update gfs.find() to gfs.findOne()
    if (error) return res.status(500).send(error.message);
    // Does file exist?
    if (!file) { // Update result to file
      return res.status(404).send("That image was not found");
    }

    res.set("Cache-Control", "public, max-age=600");

    const stream = gfs.openDownloadStreamByName(filename);
    stream.pipe(res);
  });
});

router.get("/all/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId; // Get the groupId from the URL params
    const files = await gfs.find({ "metadata.groupId": groupId }).toArray();
    // Do files exist for the groupId?
    if (!files || files.length === 0) {
      return res.status(404).send("No files found for the given groupId");
    }

    const urls = files.map((file) => {
      return {
        groupId: file.metadata.groupId,
        file: {
          url: `https://ddautoja-backend-production.up.railway.app/api/post/assets/${file.filename}`,
          metadata: file.metadata,
        },
      };
    });

    res.send({ urls: urls });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
});



module.exports = router;

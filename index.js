const AWS = require("aws-sdk");
const zlib = require("zlib");
require("dotenv").config();
const format = require("./formatAndPlace");

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.KEYID,
  secretAccessKey: process.env.SECRET,
  region: "us-east-1",
});

//makes a list of all files in a bucket, gets each file, then makes a txt file for each file in "./converting";
function getBucketLogs() {
  const listParams = {
    Bucket: "tailswaglogs",
    MaxKeys: 4, //temp small num for tests, change later to grab all files
  };
  const keys = [];

  //listObjects to get keys
  s3.listObjects(listParams, (err, data) => {
    if (err) console.log("IM AN ERROR", err);
    if (data) {
      let d = data; //data = array of objects
      d.Contents.forEach((element) => {
        keys.push(element.Key);
      });
      keys.forEach((key) => {
        let getParams = {
          Bucket: "tailswaglogs",
          Key: key,
        };
        getKeyObject(getParams);
      });
    }
  });

  function getKeyObject(getParams) {
    s3.getObject(getParams, (err, data) => {
      if (err) console.log("IM AN ERROR", err);
      if (data) {
        try {
          let str = data.ETag.substr(1, data.ETag.length - 2); //make a new file name
          //unzip the Buffer data
          zlib.unzip(data.Body, async function (err, result) {
            if (err) {
              //TODO: add logic to retry unzip rather than return
              console.error(err);
              return;
            }
            if (result) {
              //format buffer here, write as JSON
              //convertCondense one at a time
              let formattedJson = await format.formatSingleFile(result);
              await format.placeFormattedJson(formattedJson, str);
            }
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
  }
}

//TODO: check if bucketCount = fileWriteCount, get missed files

getBucketLogs();

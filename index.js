const AWS = require("aws-sdk");
const fs = require("fs");
const p = require("path");
const zlib = require("zlib");
require("dotenv").config();
const format = require("./formats");

const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: process.env.KEYID,
  secretAccessKey: process.env.SECRET,
  region: "us-east-1",
});

//makes a list of all files in a bucket, gets each file, then makes a txt file for each file in "./converting";
function getBucketLogs() {
  function getKeyObject(getParams) {
    s3.getObject(getParams, (err, data) => {
      if (err) console.log("IM AN ERROR", err);
      if (data) {
        try {
          let str = data.ETag.substr(1, data.ETag.length - 2); //make a new file name
          //unzip the Buffer data
          zlib.unzip(data.Body, function (err, result) {
            if (err) {
              //TODO: add logic to retry unzip rather than return
              console.error(err);
              return;
            }
            if (result) {
              fs.writeFile(`./converting/${str}.txt`, result);
            }
          });
        } catch (error) {
          console.error(error);
        }
      }
    });
  }

  return new Promise((res, rej) => {
    const listParams = {
      Bucket: "tailswaglogs",
      MaxKeys: 2, //temp small num for tests, change later to grab all files
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
    res();
  });
}

//pass folder to convert("./converting"), if folder has files attempts to convert them to json with formatter
function runConvertAndCondenseLogs() {
  //checks if file is of extension .txt, converts and writes a JSON to file
  function makeSingleFile(folder, file) {
    if (p.extname(folder + "/" + file) === ".txt") {
      format.formatSingleFile(folder, file);
    }
  }

  return new Promise((res, rej) => {
    //https://nodejs.org/api/fs.html#fs_fs_readdir_path_options_callback
    //https://nodejs.org/api/path.html#path_path_extname_path
    fs.readdir(process.env.CONVERTPATH, (err, files) => {
      if (err) console.error(err);
      if (files) {
        files.forEach((file) => {
          makeSingleFile(process.env.CONVERTPATH, file);
        });
      }
    });
    res();
  });
}

//TODO: check if bucketCount = fileWriteCount, get missed files

async function run() {
  await getBucketLogs();
  await runConvertAndCondenseLogs("./converting");
}
run();

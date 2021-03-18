const fs = require("fs");
const rl = require("readline");
const stream = require("stream");
const p = require("path");
// Cloudfront
//https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#BasicDistributionFileFormat
// Fields: date time x-edge-location sc-bytes c-ip cs-method cs(Host) cs-uri-stem sc-status cs(Referer) cs(User-Agent) cs-uri-query cs(Cookie) x-edge-result-type x-edge-request-id x-host-header cs-protocol cs-bytes time-taken x-forwarded-for ssl-protocol ssl-cipher x-edge-response-result-type cs-protocol-version fle-status fle-encrypted-fields c-port time-to-first-byte x-edge-detailed-result-type sc-content-type sc-content-len sc-range-start sc-range-end
//no data is logged as -
//TODO- convert url encoded values
var header = [
  "date",
  "time",
  "x-edge-location",
  "sc-bytes",
  "c-ip",
  "cs-method",
  "cs(Host)",
  "cs-uri-stem",
  "sc-status",
  "cs(Referer)",
  "cs(User-Agent)",
  "cs-uri-query",
  "cs(Cookie)",
  "x-edge-result-type",
  "x-edge-request-id",
  "x-host-header",
  "cs-protocol",
  "cs-bytes",
  "time-taken",
  "x-forwarded-for",
  "ssl-protocol",
  "ssl-cipher",
  "x-edge-response-result-type",
  "cs-protocol-version",
  "fle-status",
  "fle-encrypted-fields",
  "c-port",
  "time-to-first-byte",
  "x-edge-detailed-result-type",
  "sc-content-type",
  "sc-content-len",
  "sc-range-start",
  "sc-range-end",
];

//https://stackoverflow.com/questions/54468349/node-js-how-to-store-readline-answer-in-a-variable
//takes Buffer, makes an array of lines(str), parse the strings, return usable JSON
async function formatSingleFile(data) {
  let lineArray = [];
  let objects = [];

  await processLines(data);

  return makeJson(objects);

  async function processLines(buff) {
    const buffStream = new stream.PassThrough();
    buffStream.end(buff);
    const readLine = rl.createInterface({
      input: buffStream,
    });
    readLine.on("line", function (line) {
      lineArray.push(line);
    });
    readLine.on("close", function () {
      lineArray.forEach((line) => {
        let parsed = parseString(line);
        parsed !== null && objects.push(parsed);
      });
    });
  }
  //takes a string, filters bad strings, parses useful strings into object
  function parseString(str) {
    // Skip commented lines.
    if (str[0] === "#") return null;
    // Skip blank lines.
    if (str === "") return null;

    var obj = {};
    //string is split with tabs
    var vals = str.split("\t");
    var fields = header.length;

    //has enough things?
    if (vals.length >= fields) {
      header.forEach(function (key, index) {
        obj[key] = vals[index];
      });

      return obj;
    } else {
      console.log("Skipping row. Values don't match expected length.");
    }

    return null;
  }
  //takes array of objects, transforms into json object
  function makeJson(objects) {
    let newJSON = {};
    objects.forEach((obj) => {
      let id = obj["c-ip"];
      if (!newJSON.hasOwnProperty(id)) {
        newJSON[id] = [];
      }
      newJSON[id].push(obj);
    });

    return newJSON;
  }
}

//takes json, uses date key to place in proper folder
async function placeFormattedJson(json, filename) {
  let keys = Object.keys(json);
  //get first date in a json- all dates in a single file are the same
  let date = json[keys[0]][0].date;
  //date.parse -> format
  let year, day, month; //example date: '2021-05-21'
  year = date.substr(0, 4);
  month = date.substr(5, 2);
  day = date.substr(8, 2);
  const filepath = p.join(
    __dirname + "/" + year + "/" + month + "/" + day + "/" + filename
  );

  //make path if  doesnt exist
  await checkFolderPath(year, month, day);
  //write json to file
  fs.writeFileSync(`${filepath}.json`, JSON.stringify(json));

  async function checkFolderPath(year, month, day) {
    const filepath = p.join(__dirname + "/" + year + "/" + month + "/" + day);
    if (fs.existsSync(filepath) == false) {
      fs.mkdirSync(filepath, { recursive: true }, (err) => {
        throw err;
      });
    }
  }
}

module.exports = { formatSingleFile, placeFormattedJson };

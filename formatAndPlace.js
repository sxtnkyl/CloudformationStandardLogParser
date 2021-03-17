const fs = require("fs");
const rl = require("readline");
const stream = require("stream");
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

//takes Buffer, makes an array of lines(str), parse the strings, return usable JSON
function formatSingleFile(data) {
  let lineArray = [];
  let objects = [];
  const buffStream = new stream.PassThrough();
  buffStream.end(data);

  const readLine = rl.createInterface({
    // input: fs.createReadStream(`./converting/${str}.txt`),
    input: buffStream,
  });

  // const start = async () => {
  //   for await (const line of readLine) {
  //     lineArray.push(line);
  //   }
  // };
  // start();

  readLine.on("line", function (line) {
    lineArray.push(line);
  });
  readLine.on("close", function () {
    lineArray.forEach((line) => {
      let parsed = parseString(line);
      parsed !== null && objects.push(parsed);
    });
  });
  console.log(lineArray, objects);

  return makeJson(objects);

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
    console.log("newJson: ", newJSON);
    return newJSON;
  }
  function bufferToStream(data) {
    const readable = new Readable();
    readable._read = () => {};
    readable.push(data);
    readable.push(null);
    return readable;
  }
}

//takes json, uses date key to place in proper folder
function placeFormattedJson(json, filename) {
  console.log("while placing", json);
  let first = Object.keys(json);
  let date = json[first[0]].date;
  let year, day, month; //example date: '2021-05-21'
  year = date.substr(0, 4);
  month = date.substr(5, 2);
  day = date.substr(8, 2);

  //make path if  doesnt exist
  checkFolderPath(year, month, day);
  //write json to file
  fs.writeFileSync(
    `./${year}/${month}/${day}/${filename}.json`,
    JSON.stringify(newJSON)
  );

  function checkFolderPath(year, month, day) {
    let filePath = `${year}/${month}/${day}`;
    if (fs.existsSync(filePath) == false) {
      fs.mkdirSync(filePath, { recursive: true }, (err) => {
        throw err;
      });
    }
  }
}

module.exports = { formatSingleFile, placeFormattedJson };

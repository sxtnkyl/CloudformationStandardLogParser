const fs = require("fs");
const rl = require("readline");
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

//folder in which files are located; single file name in folder; make an array of lines(str), parse the strings, return usable JSON
function formatSingleFile(folder, fileName) {
  let path = folder + "/" + fileName;
  let lineArray = [];

  // given a formatSingleFile array, filter out bad strings, parse useful strings
  //returns single object
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
  //takes file name and an array of objects, makes JSON by key: c-ip, value: obj, writes JSON to file
  function sortIntoFolder(fileName, objects) {
    let newJSON = {};
    let date = objects[0].date;
    let year, day, month; //example date: '2021-05-21'
    year = date.substr(0, 4);
    month = date.substr(5, 2);
    day = date.substr(8, 2);

    //make path if  doesnt exist
    function checkFolderPath(year, month, day) {
      let filePath = `${year}/${month}/${day}`;
      if (fs.existsSync(filePath) == false) {
        fs.mkdirSync(filePath, { recursive: true }, (err) => {
          throw err;
        });
      }
    }

    objects.forEach((obj) => {
      let id = obj["c-ip"];
      if (!newJSON.hasOwnProperty(id)) {
        newJSON[id] = [];
      }
      newJSON[id].push(obj);
    });

    checkFolderPath(year, month, day);
    fs.writeFileSync(
      `./${year}/${month}/${day}/${fileName.substr(
        0,
        fileName.length - 4
      )}.json`,
      JSON.stringify(newJSON)
    );
  }

  const readLine = rl.createInterface({
    input: fs.createReadStream(path),
  });

  readLine.on("line", function (line) {
    lineArray.push(line);
  });

  readLine.on("close", function () {
    let objects = [];

    lineArray.forEach((line) => {
      let parsed = parseString(line);
      parsed !== null && objects.push(parsed);
    });
    sortIntoFolder(fileName, objects);
  });
}

// formatSingleFile("converting", "testLong.txt");

module.exports = { formatSingleFile };

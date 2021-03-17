const fs = require("fs");
const p = require("path");
//code to execute once files are loaded into a folder
//output goal: create 2 conglomerate JSON for a single day: people by c-ip(visitorsByCip.JSON) and bots by CS user agent(botVisits.JSON)
//input params: year/month/day

function checkArgs() {
  //handle missing args
  if (process.argv.length < 5) {
    console.log("missing args");
    process.exit(1);
  }
  //handle input formatting
  if (process.argv[2].length !== 4) {
    console.log("year format needs exactly 4 chars");
    process.exit(1);
  }
  if (process.argv[3].length !== 2) {
    console.log("month format needs exactly 2 chars");
    process.exit(1);
  }
  if (process.argv[4].length != 2) {
    console.log("day format needs exactly 2 chars");
    process.exit(1);
  }
}

const year = process.argv[2];
const month = process.argv[3];
const day = process.argv[4];
const filepath = p.join(__dirname + "/" + year + "/" + month + "/" + day);
const peoplePath = `${filepath}/visitorsByCip.json`;
const botPath = `${filepath}/botVisits.json`;
const filesNames = [];
const peopleJSON = {};
const botsJSON = {};

//does folder have files? make list of json filenames
fs.readdir(filepath, (err, files) => {
  if (err) console.log(err);
  if (files.length == 0) {
    console.log("no files are in this folder");
    process.exit(1);
  } else {
    function filterJsonFiles() {
      files.filter((file) => {
        if (p.extname(file).toLowerCase() === ".json") {
          //dont include compiled files
          if (file == "visitorsByCip.json" || file == "botVisits.json") {
            return;
          } else filesNames.push(file);
        }
      });
    }
    //go through file list, sort each key/value pair into either people or bot obj, write to file
    function filterFolder() {
      filesNames.forEach((file) => {
        const currentFile = `${filepath}/${file}`;
        function filterFile(file) {
          const currentJson = JSON.parse(fs.readFileSync(file));
          for (let key in currentJson) {
            //bot detector, has string 'bot' somewhere in cs(User-Agent) key
            let hasBot = currentJson[key][0]["cs(User-Agent)"]
              .toLowerCase()
              .includes("bot");
            if (hasBot) {
              !botsJSON.hasOwnProperty(key)
                ? (botsJSON[key] = currentJson[key])
                : (botsJSON[key] = botsJSON[key].concat(currentJson[key]));
            }
            if (!hasBot) {
              !peopleJSON.hasOwnProperty(key)
                ? (peopleJSON[key] = currentJson[key])
                : (peopleJSON[key] = peopleJSON[key].concat(currentJson[key]));
            }
          }
        }
        filterFile(currentFile);
      });

      fs.writeFileSync(peoplePath, JSON.stringify(peopleJSON));
      fs.writeFileSync(botPath, JSON.stringify(botsJSON));
    }
    filterJsonFiles();
    filterFolder();
  }
});

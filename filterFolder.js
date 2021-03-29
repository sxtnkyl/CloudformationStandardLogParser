const fs = require("fs");
const p = require("path");
//best to execute at end of month once all files are loaded into a folder
//output goal: create 2 conglomerate JSON for a single month (bots and people {day: {cip: [{}, {}...]}})
//inputs = month and year

function checkArgs() {
  //handle missing args
  if (process.argv.length < 4) {
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
}
checkArgs();

const year = process.argv[2];
const month = process.argv[3];
const monthPath = p.join(__dirname + "/" + year + "/" + month);
const peoplePathMonth = `${monthPath}/visitorsByMonth${month}.json`;
const botPathMonth = `${monthPath}/botVisitsByMonth${month}.json`;
const allMonthFiles = [];
const monthBotObj = {};
const monthPeopleObj = {};

//get all files for month
function recursivelyListDir(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = p.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory
      ? recursivelyListDir(dirPath, callback)
      : callback(p.join(dir, f));
  });
}

function makeMonthObjects() {
  allMonthFiles.forEach((file) => {
    const currentJson = JSON.parse(fs.readFileSync(file));

    //key is a unique c-ip > is arr of objects
    for (let key in currentJson) {
      let date = currentJson[key][0]["date"];
      let day = date.substr(8, 2);
      let obj = currentJson[key];
      //hasbot is string with 'bot' somewhere in cs(User-Agent) key
      let hasBot = currentJson[key][0]["cs(User-Agent)"]
        .toLowerCase()
        .includes("bot");
      if (hasBot) {
        if (!monthBotObj.hasOwnProperty(day)) {
          monthBotObj[day] = {};
          monthBotObj[day][key] = obj;
        } else {
          if (!monthBotObj[day].hasOwnProperty(key)) {
            monthBotObj[day][key] = [].concat(obj);
          } else monthBotObj[day][key].concat(obj);
        }
      }
      if (!hasBot) {
        if (!monthPeopleObj.hasOwnProperty(day)) {
          monthPeopleObj[day] = {};
          monthPeopleObj[day][key] = obj;
        } else {
          if (!monthPeopleObj[day].hasOwnProperty(key)) {
            monthPeopleObj[day][key] = [].concat(obj);
          } else monthPeopleObj[day][key].concat(obj);
        }
      }
    }
  });

  fs.writeFileSync(peoplePathMonth, JSON.stringify(monthPeopleObj));
  fs.writeFileSync(botPathMonth, JSON.stringify(monthBotObj));
}

recursivelyListDir(monthPath, function (filePath) {
  //exclude our compiled files if already made
  if (
    filePath.includes("visitors") == false ||
    filePath.includes("botVisits") == false
  )
    allMonthFiles.push(filePath);
});
makeMonthObjects();

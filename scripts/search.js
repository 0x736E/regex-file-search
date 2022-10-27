const PATTERNS = require('../config/patterns.js');
const { WalkerRegexRanger, WalkerRegexRangerException } = require('../lib/index.js');
const processArgv = require("process.argv")(process.argv.slice(2));
const flourite = require('flourite');
const fs = require('fs');
const path = require('path');

const config = processArgv({
  inputDir: './data/',
  perfMode: true,         // enable this to run faster by excluding some metadata
  summaryOnly: false
});

if ( config.help ) {

  let msg = `usage: search [options]
  --help                    : this message
  --inputDir='filePath'     : specify a path to search for matches
  --outputFile='filePath'   : specify a path to output results in a file
  --perfMode                : disable performance mode
  --summaryOnly             : do not include match data, only a summary
  `;

  console.log(msg);
  process.exit(0);
}

let nuckChorris = new WalkerRegexRanger(config.inputDir, PATTERNS);
nuckChorris.calcLineColmn = !config.perfMode;
nuckChorris.trackPerfStats = !config.perfMode;
nuckChorris.summaryOnly = config.summaryOnly;

let numPatterns = Object.keys(PATTERNS).length;
nuckChorris.findingFileHandler = function ( filepath, findingsInFile, data ) {

  if ( !config.perfMode ) {
    let langDetect = flourite(data);
    findingsInFile.linesOfCode = langDetect.linesOfCode;
    findingsInFile.language = langDetect.language;
  }

  return findingsInFile;
}

nuckChorris.search().then((data) => {

  let out = JSON.stringify(data, null, 2);

  if( config.outputFile ) {

    let filePath = path.resolve(config.outputFile);
    fs.writeFileSync(filePath, out, {flag: 'w'});

  }

}).catch((err) => {

  console.log(err);
});

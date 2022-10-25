const PATTERNS = require('../config/patterns.js');
const { WalkerRegexRanger, WalkerRegexRangerException } = require('../lib/index.js');
const processArgv = require("process.argv")(process.argv.slice(2));
const flourite = require('flourite');

const config = processArgv({
  inputDir: './data/',
  perfMode: true,         // enable this to run faster by excluding some metadata
});

if ( config.help ) {

  let msg = `usage: search [options]
  --help                : this message
  --inputDir='filePath' : specify a path to search for matches
  --perfMode            : disable performance mode
  `;

  console.log(msg);
  process.exit(0);
}

let nuckChorris = new WalkerRegexRanger(config.inputDir, PATTERNS);
nuckChorris.calcLineColmn = !config.perfMode;
nuckChorris.trackPerfStats = !config.perfMode;

nuckChorris.findingFileHandler = function ( filepath, findingsInFile, data ) {

  if ( findingsInFile.findings.length < 1 ) {
    return null;
  }

  if ( !config.perfMode ) {
    let langDetect = flourite(data);
    findingsInFile.linesOfCode = langDetect.linesOfCode;
    findingsInFile.language = langDetect.language;
  }

  console.log(findingsInFile);

  return findingsInFile;
}

nuckChorris.search().then(() => {

  // console.log('>> Done');

}).catch((err) => {

  console.log(err);
});

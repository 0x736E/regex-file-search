const { WalkerRegexRanger, WalkerRegexRangerException } = require('../lib/index.js');
const processArgv = require("process.argv")(process.argv.slice(2));
const flourite = require('flourite');
const fs = require('fs');
const path = require('path');

const config = processArgv({
  perfMode: true,         // enable this to run faster by excluding some metadata
  summaryOnly: false,
});

if( !config.patterns ) {
  console.log("Error: patterns argument is not optional\n");
  config.help = true;
}

if( !config.inputDir ) {
  console.log("Error: inputDir argument is not optional\n");
  config.help = true;
}

if ( config.help ) {

  let msg = `usage: search [options]
  --help                    : this message
  --patterns                : (required) specify a file to load patterns from (javascript)
  --inputDir='filePath'     : (required) specify a path to search for matches
  --outputFile='filePath'   : specify a path to output results in a file
  --perfMode                : disable performance mode
  --summaryOnly             : do not include match data, only a summary
  --quiet                   : do not print output
  `;

  console.log(msg);
  process.exit(0);
}

let nuckChorris = new WalkerRegexRanger(config.inputDir, config.patterns);
nuckChorris.calcLineColmn = !config.perfMode;
nuckChorris.trackPerfStats = !config.perfMode;
nuckChorris.summaryOnly = config.summaryOnly;

let numPatterns = Object.keys(config.patterns).length;
nuckChorris.findingFileHandler = function ( filepath, findingsInFile, data ) {

  if ( !config.perfMode ) {
    let langDetect = flourite(data);
    findingsInFile.linesOfCode = langDetect.linesOfCode;
    findingsInFile.language = langDetect.language;
  }

  return findingsInFile;
}

nuckChorris.search().then((data) => {

  if(!config.quiet) {
    console.log(data);
  }

  if( config.outputFile ) {

    let out = JSON.stringify(data, null, 2);
    let filePath = path.resolve(config.outputFile);
    fs.writeFileSync(filePath, out, {flag: 'w'});

  }

}).catch((err) => {

  console.log(err);
});

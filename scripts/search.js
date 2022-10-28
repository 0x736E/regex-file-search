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
config.patterns = require(path.resolve(config.patterns));

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

let outputFilePath;
let fileStream;
if ( config.outputFile ) {
  outputFilePath = path.resolve(config.outputFile);
  fileStream = fs.createWriteStream(outputFilePath, { flags:'w' });
  fileStream.write("[\n");
}

nuckChorris.findingFileHandler = function ( filepath, findingsInFile, data ) {

  // console.log('findingsInFile', findingsInFile);

  if ( !config.perfMode ) {
    let langDetect = flourite(data);
    findingsInFile.linesOfCode = langDetect.linesOfCode;
    findingsInFile.language = langDetect.language;
  }

  if(fileStream) {
    fileStream.write(JSON.stringify(findingsInFile, null, 2) + ", \n");
  }

  return findingsInFile;
}

nuckChorris.search().then((data) => {

  if(!data) {
    return;
  }

  if(fileStream) {
    fileStream.write("]");
    fileStream.end();
  }

  if(!config.quiet) {
    console.log(data);
  }

  // if( config.outputFile && data.length > 0 ) {
  //
  //   try {
  //     let filePath = path.resolve(config.outputFile);
  //     fs.writeFileSync(filePath, JSON.stringify(data, null, 2) , {flag: 'w'});
  //   } catch ( e ) {
  //     console.log(e);
  //   }
  //
  // }

}).catch((err) => {

  console.log(err);
});

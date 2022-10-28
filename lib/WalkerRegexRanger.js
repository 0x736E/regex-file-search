const WalkerRegexRangerException = require('./WalkerRegexRangerException.js');
const Walk = require("@root/walk");
const { path, dirname } = require("path");
const fs = require('fs');
const { isText, isBinary, getEncoding } = require('istextorbinary');
const lineColumn = require("line-column");

class WalkerRegexRanger {

  stopOnError = false;
  maxFileSizeBytes = 1000000 // 1Mb, keep this size reasonable

  // track stats for performance monitoring
  trackPerfStats = false;

  searchPath = null;
  searchPatterns = null;
  #searchPatternKeys = null;

  calcLineColmn = true;
  summaryOnly = false;

  constructor (filePath, patterns) {
    this.searchPath = filePath;
    this.searchPatterns = patterns;
    this.#searchPatternKeys = Object.keys(patterns);
  }

  async search ( filePath, pattern_ids ) {

    if ( !filePath ) {
      filePath = this.searchPath;
    }

    if ( !pattern_ids ) {
      pattern_ids = this.#searchPatternKeys;
    }

    let self = this;

    let out = [];
    return Walk.walk(filePath, async function (err, pathname, dirent) {

      if (err) {
        // throw an error to stop walking
        // (or return to ignore and keep going)
        // console.warn("fs stat error for %s: %s", pathname, err.message);
        return Promise.reject(err);
      }

      if(dirent.isFile()) {
        // console.log(pathname);

        return self.findPatternMatches( pathname )
          .then( (findingsInFile) => {
            //
            // if ( findingsInFile.findings.length > 0 ) {
            //   console.log(JSON.stringify(findingsInFile) + ",\n\n");
            // }
            if(findingsInFile) {
              out.push(findingsInFile);
            }

            return Promise.resolve(findingsInFile);

          }).catch( (err) => {

            if ( err instanceof WalkerRegexRangerException.ExcessiveFileSize ) {
              // do nothing
              return;
            } else if ( err instanceof WalkerRegexRangerException.InvalidFileType ) {
              // do nothing
              return;
            }

            // TODO;
            console.log(err);
          })

      }

      return Promise.resolve();
    }).then( () => {

      //console.log('>>>', out);
      return Promise.resolve(out);

    });

  }

  // Overload this method to manipulate findings object
  // e.g. by additional context (file type)
  findingFileHandler( filepath, result, data) {
    return result;
  }
  findingHandler( filepath, findings, data) {
    return findings;
  }
  findingMatchHandler( filepath, match, data) {
    return match;
  }

  async findPatternMatches ( filepath, patterns, pattern_ids ) {

    if ( patterns ) {
      if ( !pattern_ids ) {
        pattern_ids = Object.keys(patterns);
      }
    } else {
      patterns = this.searchPatterns;
      pattern_ids = this.#searchPatternKeys;
    }

    let self = this;
    let stats = {};

    let fileStats = fs.statSync(filepath);
    if ( fileStats.size > self.maxFileSizeBytes ) {
      throw new WalkerRegexRangerException.ExcessiveFileSize(null, filepath, fileStats.size);
    }
    let buffer = fs.readFileSync(filepath);

    // do not process binary files
    if(!isText(filepath, buffer)) {
      throw new WalkerRegexRangerException.InvalidFileType('binary');
    }

    let data = buffer.toString();
    buffer = null;                  // free resources

    let findingsInFile = {
      filePath: filepath,
      findings: []
    };
    let result = null;

    if ( self.trackPerfStats ) {
      stats.fileStartTime = performance.now();
    }

    let output;
    let patternCount = 0;
    let totalMatchCount = 0;
    for ( let id of pattern_ids ) {

      let matches = data.matchAll( patterns[id] );
      let position = null;
      let result = null;

      output = {
        filepath: filepath,
        pattern: id,
        count: 0
      };

      if ( !this.summaryOnly ) {
        output.matches = [];
      }

      for (let match of matches) {

        output.count++;

        if ( this.summaryOnly ) {
          // don't do any processing
          continue;
        }

        result = {
          match: match[0],
          location: {
            index: match['index']
          }
        };

        if (this.calcLineColmn) {
          position = lineColumn(data).fromIndex(match['index']);
          result.location.line = position.line;
          result.location.col = position.col;
        }


        // allow for a custom handler to add additional context
        result = this.findingMatchHandler( filepath, result, data );
        if(result) {
          output.matches.push(result);
        }

      }

      if(output.count > 0) {

        patternCount++;
        totalMatchCount += output.count;

        // allow for a custom handler to add additional context
        // if ( this.summaryOnly ) {
        //   output = this.findingHandler( filepath, output, data );
        //   output.matches = 123;
        // } else {
        //   output = this.findingHandler( filepath, output, data );
        // }

        output = this.findingHandler( filepath, output, data );
        findingsInFile.findings.push(output);

      }

      // free resources
      result = null;
      output = null;

    }

    if ( self.trackPerfStats ) {
      stats.timeFileFinished = (performance.now()) - stats.fileStartTime;
      findingsInFile.stats = {
        time: stats.timeFileFinished,
        fileSize: fileStats.size
      }
    }

    findingsInFile.patternCount = patternCount;
    findingsInFile.matchCount = totalMatchCount;

    if(totalMatchCount > 0) {
      // allow for a custom handler to add additional context
      findingsInFile = this.findingFileHandler( filepath, findingsInFile, data );
    }

    return (totalMatchCount > 0 ? findingsInFile : null);
  }
}

module.exports = WalkerRegexRanger;


class ExcessiveFileSize extends Error {
  constructor(message, filePath, fileSize) {
    super(message);
    this.name = "File size too big";
    this.path = filePath;
    this.size = fileSize;
  }
}

class InvalidFileType extends Error {
  constructor(message) {
    super(message);
    this.name = "Invalid file type";
  }
}

class MaxTimeElapsed extends Error {
  constructor(message) {
    super(message);
    this.name = "Max time elapsed";
  }
}

class WalkerRegexRangerException {
  static ExcessiveFileSize = ExcessiveFileSize;
  static InvalidFileType = InvalidFileType;
  static MaxTimeElapsed = MaxTimeElapsed;
}

module.exports = WalkerRegexRangerException;

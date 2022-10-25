# regex-file-search

Search in files for RegEx matches, producing findings as output per file.

## Add configuration

Add a  file to ./config/collection.json

tested against [OWASP-VWAD](https://github.com/OWASP/OWASP-VWAD.git)

## Install dependencies

```console
npm install
```

## Search files

There are a number of configuration options:

```console
npm run search -- --help

usage: search [options]
--help                : this message
--inputDir='filePath' : specify a path to search for matches
--perfMode            : disable performance mode
```

### Example usage
```console
npm run search -- --inputDir='./data/'
```
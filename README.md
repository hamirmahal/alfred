alfred
======
[![Build Status](https://travis-ci.com/amilajack/alfred.svg?token=stGf151gAJ11ZUi8LyvG&branch=master)](https://travis-ci.com/amilajack/alfred)

Alfred is an infrastructure framework that defines a standard workflow for JavaScript projects

## Installation
```bash
# NPM
npm install --global alfred
# Yarn
yarn global add alfred
```

## Usage
```bash
# Creating a new project
alfred new my-lib --lib
alfred new my-app
cd my-app

# Standard scripts
alfred start
alfred build
alfred format
alfred search
alfred test
alfred doc
alfred migrate

# Learning skills
alfred learn alfred-skill-build-parcel
# Build using the new subcommand
alfred build

# Upgrading from ES5 to ESNext
alfred migrate .
alfred migrate . --transforms imports lebab
```

## Config Manipulator Function Example
The following is an example of a Config Manipulator Function (CMF) for babel
```js
// index.js
export default {
  name: 'babel',
  interface: ['alfred-interface-transpile'],
  description: 'Transpile JS from ESNext to the latest ES version',
  configs: [{
    name: 'babelrc',
    path: '.babelrc.js',
    hidden: true
  }],
  webpack: (configs: Array<CmfNode>) => {},
  eslint: (configs: Array<CmfNode>) => {}
};
```

## Schema Example
```js
// index.js
export default {
  subcommand: 'transpile',
  flags: {
    // Flag name and argument types
    'environment': ['production', 'development', 'test']
  }
};
```

## Alfred Config
```json
{
  "targets": {
    "node": 10
  }
}
```

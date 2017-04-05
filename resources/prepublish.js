/**
 *  Copyright (c) Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the license found in the
 *  LICENSE file in the root directory of this source tree.
 */

'use strict';

// NOTE: Because prepublish is also invoked on "npm install", we can't
// rely on babel-node being available. This means two things:
//
// (1) We must stick to a vanilla subset of ES6 features; and:
// (2) We start off with a check to bail out when not invoked as part of
//     "npm publish".

var fs = require('fs');
var path = require('path');

var config = require(path.join(process.cwd(), 'package.json'));
if (config.scripts.prepublish.indexOf('node ') !== 0) {
  // Guard against somebody helpfully trying to make the package.json scripts
  // consistent by using "babel-node" instead of "node" (which would break
  // the initial "npm install").
  console.error('invoke prepublish.js with `node`, not `babel-node`');
  process.exit(1);
}

// Bail unless we're running during `npm publish`.
var argv = JSON.parse(process.env.npm_config_argv).original;
var isPublishing = argv[0].indexOf('pu') === 0;
if (!isPublishing) {
  process.exit(0);
}

// Complain loudly if the user has run hoistDependencies locally.
fs.readdirSync('packages').forEach(function(pkg) {
  var json = require(path.join(process.cwd(), 'packages', pkg, 'package.json'));
  if (json.main && json.main.match(/\bsrc\b/)) {
    var message = 'The package.json file for ' +
      json.name +
      ' has "main" ' +
      'set to "' +
      json.main +
      '" in "src" but it should refer to "dist". ' +
      'This is an error and likely due to running hoistDependencies.js and ' +
      'committing or keeping the result. Please revert those changes and ' +
      'try again.';
    throw new Error(message);
  }
});

// Otherwise, perform a build.
var execFileSync = require('child_process').execFileSync;
process.stdout.write(execFileSync('npm', ['run', 'build']));

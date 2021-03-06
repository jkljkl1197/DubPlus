var babelify    = require("babelify");
var browserify  = require('browserify');
var fs = require('fs');

// our own custom module
var gitInfo = require(process.cwd() + '/tasks/repoInfo.js');
var pkg = require(process.cwd() + '/package.json');

// only want to pass a few things from package
delete pkg.main;
delete pkg.scripts;
delete pkg.repository;
delete pkg.bugs;
delete pkg.devDependencies;

/******************************************************************
 * Setup browserify with options
 */
var options = {
  entries: ['./src/js/dubplus.js'],
  cache : {},
  packageCache : {},
  insertGlobalVars: { 
    // so that we can point to the proper branch during testing or production
    CURRENT_BRANCH: function () { return "'" + gitInfo.branch + "'"; },
    // so that we can point to the proper repo during testing or production
    CURRENT_REPO: function () { return "'" + gitInfo.user + "'"; },
    // so that we can insert it as a cache busting query string for CSS
    TIME_STAMP : function() { return  "'" +  Date.now() + "'";},
    // pass our pkg info
    PKGINFO : function() { return  "'" +  JSON.stringify(pkg) + "'"; }
  }
};

var b = browserify(options);
b.on('log', function (msg) { console.log(msg); });
b.on('error', function(err) { console.error(err); });
b.on('bundle', function () { 
  console.log("Browserify: bundling JS files");
});

function bundle() {
  b.transform(babelify, {presets: ["es2015"]})
    .bundle()
    .pipe(fs.createWriteStream('./dubplus.js', 'utf8'));
}

function makeMin() {
  b.transform(babelify, {presets: ["es2015", "babili"]})
    .bundle()
    .pipe(fs.createWriteStream('./dubplus.min.js', 'utf8'));
}

function watching(){
  var watchify    = require('watchify');

  // watch our JS with watchify plugin for browserify  
  b.plugin(watchify, {
    // no options to pass as this time
  });

  b.on('update', function(ids){
    console.log(ids);
    bundle();
  });

  // start browserify in order for watchify plugin to begin watching
  bundle();
}

module.exports = {
  watch : watching,
  bundle : bundle,
  minify : makeMin
};
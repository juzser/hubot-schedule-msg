var Fs = require('fs');
var Path = require('path');

module.exports = function(robot) {
  var scriptsPath;
  scriptsPath = Path.resolve(__dirname, 'scripts');
  return Fs.exists(scriptsPath, function(exists) {
    var file, i, len, ref, results;
    if (exists) {
      ref = Fs.readdirSync(scriptsPath);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        results.push(robot.loadFile(scriptsPath, file));
      }
      return results;
    }
  });
};

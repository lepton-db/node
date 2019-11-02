const { run, testSuite } = require('waverunner');

run(testSuite(
  require('./create.test'),
  // require('./any-other.test'),
));



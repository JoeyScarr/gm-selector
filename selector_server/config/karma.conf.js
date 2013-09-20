module.exports = function(config) {
	config.set({
		basePath: '../',
		
		frameworks: ['jasmine'],
		
		files: [
			'client/js/lib/*.js',
			'client/js/*.js',
			'test/lib/angular-mocks.js',
			'test/unit/**/*.js',
			'test/data/**/*.js'
		],
		
		reporters: ['progress', 'junit'],
		
		junitReporter: {
			// will be resolved to basePath (in the same way as files/exclude patterns)
			outputFile: 'test_out/unit-test-results.xml'
		},
		
		// enable / disable watching file and executing tests whenever any file changes
		// CLI --auto-watch --no-auto-watch
		autoWatch: true,
		
		browsers: ['Chrome'],
		
		plugins: [
			'karma-jasmine',
			'karma-chrome-launcher',
			'karma-junit-reporter'
		],
		
		// If browser does not capture in given timeout [ms], kill it
		// CLI --capture-timeout 5000
		captureTimeout: 20000,

		// Auto run tests on start (when browsers are captured) and exit
		// CLI --single-run --no-single-run
		singleRun: false,
		
		port: 9876,
	});
};

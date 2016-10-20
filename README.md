#GCIM Ground Motion Selector

A web app for selecting ground motions for use in seismic response analysis.

Based on the algorithm described in:

Bradley, B.A. (2012). _A ground motion selection algorithm based on the generalized conditional intensity measure approach_. Soil Dynamics and Earthquake Engineering 40, 48-61.

##Developing:
All of the code is client-side, so the application can be served by any standard server such as Apache.

The frontend is written in Javascript and [AngularJS](http://angularjs.org/).

##Testing:
The tests are written in [Jasmine](https://jasmine.github.io/) and run on [Karma](http://karma-runner.github.io/).

You will need to install [Node.js](http://nodejs.org/) and run the following commands:

	npm install karma --save-dev
	npm install karma-jasmine --save-dev
	npm install karma-junit-reporter --save-dev
	npm install karma-chrome-launcher --save-dev

If you're not a Chrome user, download `karma-firefox-launcher` (or similar) instead. Make sure to update the list of browsers and plug-ins in `selector_server/config/karma.conf.js`.

If Karma complains about not being able to find Chrome, update the Chrome path in your `node_modules/karma-chrome-launcher/index.js`.

Tests can be run by executing `test.bat` in the root directory.

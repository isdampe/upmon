const fs = require('fs');
const printf = require('util').format;
const exec = require('child_process').exec;
const request = require('request');

(function(){

	var config;
	var validMethods = ['http','port','icmp'];

	var ensureOnline = function(callback) {

		console.log("Making sure we are online first.");
		request('http://www.google.com', function(err,res,status){
			if ( err ) {
				console.error("Doesnt look like we are online. Quitting early.");
				console.error(err);
				process.exit(1);
			}

			console.log("We are online. Run our checks.");
			callback();

		});

	};

	var notify = function(address, type) {

		var date = new Date();
		var message = printf("The connectivity check on %s failed at %s, using method %s.", address, date, type);
		var subject = printf("%s is down!", address);

		console.log(message);

		fs.writeFileSync('/tmp/upmon.msg', message, {encoding: "utf8"});

		var cmd = printf('mail -s "%s" %s < /tmp/upmon.msg', subject, config.alertEmail);
		exec(cmd,function(err,out,serr){
			if ( err ) {
				console.error(err);
				return;
			}
		});

		try {
			fs.unlinkSync('/tmp/upmon.msg');
		} catch(e) {
		}
	
	};

	var checkByHttp = function(site) {

		request(site.address,function(err,res,body){
			if ( err ) {
				notify(site.address,site.type);
				return false;
			}

			console.log("Checked " + site.address + " by method " + site.type + ", all is good.");
			return true;

		});
	
	};

	var checkByPort = function(site) {
	
	};

	var checkByIcmp = function(site) {
	
	};

	var checkConnectivity = function(site) {

		if  ( validMethods.indexOf(site.type) === -1 ) {
			console.error("Invalid method requested, not found. Skipping check on " + site.address);
			return;
		}

		switch( site.type ) {
			case "http":
				checkByHttp(site);
			break;
			case "port":
				checkByPort(site);	
			break;
			case "icmp":
				checkByIcmp(site);
			break;
		}

	};
	
	var main = function() {

		try {
			config = JSON.parse(fs.readFileSync('config.json', { encoding: "utf8" }));
		} catch(e) {
			console.error("Error reading config.json - File does not exist, or it's not valid JSON");
			process.exit(1);
		}

		if (! config.hasOwnProperty('sites') || config.sites.length < 1 ) {
			console.error("You need to specify at least one site to monitor");
			process.exit(1);
		}

		var max = config.sites.length, i = 0;
		for ( i; i<max; i++ ) {
		
			let site = config.sites[i];
			checkConnectivity(site);

		}
		
	};

	ensureOnline(main);

})();


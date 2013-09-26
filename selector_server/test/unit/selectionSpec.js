'use strict';

/* jasmine specs for the selection module go here */

describe('Selection module', function(){
	beforeEach(module('selection'));
	beforeEach(module('util'));
	beforeEach(module('NGAdatabase'));
	beforeEach(module('OpenSHAresults'));
	beforeEach(inject(function(database, NGAdatabase) {
		spyOn(database, 'fetchDatabase').andCallFake(function(name, callback) {
			// Clone the database before converting it, since it will be converted in-place.
			callback(JSON.parse(JSON.stringify(NGAdatabase)));
		});
	}));
	
	describe('getScaleFactorIndex', function() {
		it('should return correct scale factors', inject(function(gmSelector) {
			expect(gmSelector.getScaleFactorIndex('PGA')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('PGV')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('SA')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('IA')).toEqual(2);
			expect(gmSelector.getScaleFactorIndex('Ds595')).toEqual(0);
			expect(gmSelector.getScaleFactorIndex('Ds575')).toEqual(0);
			expect(gmSelector.getScaleFactorIndex('CAV')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('ASI')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('SI')).toEqual(1);
			expect(gmSelector.getScaleFactorIndex('DSI')).toEqual(1);
		}));
	});
	
	describe('computeMediansAndSigmas', function() {
		it('should correctly compute medians and log-normal sigmas', inject(function(gmSelector) {
			var GCIMdata = {
				numIMi: 1,
				IMi: [{
					GCIMvalues: [[9.070062153905189,0.001716620855235779],
											 [9.860385832319661,0.0030495030420688058],
											 [10.719574696668243,0.005288578275452673],
											 [11.653629343875036,0.008941538106576255],
											 [12.669073235399491,0.01471818124402747],
											 [13.772998257257507,0.023556784831618997],
											 [14.973114249934053,0.03662102136214896],
											 [16.277802854105634,0.05525012267903772],
											 [17.696176048232353,0.08084904784582145],
											 [19.23813978684769,0.11471630665146731],
											 [20.914463183997402,0.1578240761712077],
											 [22.736853725006444,0.2105844827331741],
											 [24.71803903185488,0.2726510825818919],
											 [26.87185575321406,0.34280860350566317],
											 [29.213346199953648,0.4189929079488557],
											 [31.758863401023998,0.49845692786617285],
											 [34.52618531342712,0.5780643800878117],
											 [37.53463898392143,0.6546581483179719],
											 [40.80523552960881,0.7254329774484706],
											 [44.360816880111926,0.7882390673672093],
											 [48.22621530619281,0.8417636634776398],
											 [52.428426848964705,0.8855677692688387],
											 [56.99679986093107,0.9199915959089676],
											 [61.963239975627495,0.9459659505331691],
											 [67.3624329373794,0.9647813377932306],
											 [73.23208684742403,0.9778637601723001],
											 [79.61319551825112,0.986592994167724],
											 [86.55032477543313,0.9921811291766516],
											 [94.09192370648745,0.9956122450429135],
											 [102.290663030538,0.9976322112969761],
											 [111.2038029519599,0.9987720579608386]]
				}]
			};
			gmSelector.computeMediansAndSigmas(GCIMdata);
			expect(GCIMdata.IMi[0].median).toEqual(31.812503822984365);
			expect(GCIMdata.IMi[0].sigma).toEqual(0.41461506705481144);
		}));
	});
	
	describe('scaleGroundMotions', function() {
		it('should correctly scale ground motions', inject(function(gmSelector) {
			var database = [{
				"DatabaseName": "NGAdatabase",
				"GMID": 12,
				"EQID": 12,
				"Mw": 7.36,
				"mech": 2,
				"Ztor": 0,
				"Rjb": 114.62,
				"Rrup": 117.75,
				"Vs30": 316.5,
				"freqMin": 0.25,
				"IM": {
					"PGA": 0.0537,
					"PGV": 7.59,
					"SA (0.01s)": 0.05379,
					"SA (0.02s)": 0.054018,
					"SA (0.03s)": 0.054534,
					"SA (0.04s)": 0.056028,
					"SA (0.05s)": 0.05718,
					"SA (0.075s)": 0.062887,
					"SA (0.1s)": 0.066343,
					"SA (0.15s)": 0.09634,
					"SA (0.2s)": 0.119245,
					"SA (0.25s)": 0.132843,
					"SA (0.3s)": 0.135557,
					"SA (0.4s)": 0.132666,
					"SA (0.5s)": 0.142378,
					"SA (0.75s)": 0.1088,
					"SA (1.0s)": 0.115335,
					"SA (1.5s)": 0.077779,
					"SA (2.0s)": 0.036093,
					"SA (3.0s)": 0.035645,
					"SA (4.0s)": 0.026136,
					"SA (5.0s)": 0.01294,
					"SA (7.5s)": 0.003535,
					"SA (10.0s)": 0.001858,
					"IA": 0.098085,
					"Ds595": 30.6,
					"Ds575": 17.627,
					"CAV": 0.42985,
					"ASI": 0.049632,
					"SI": 32.015,
					"DSI": 24.176
				}
			}];
			
			var scaledIM = {
				"PGA": 0.5715106,
				"PGV": 80.77775519553072,
				"SA (0.01s)": 0.5724684389944134,
				"SA (0.02s)": 0.5748949644469273,
				"SA (0.03s)": 0.5803865746815642,
				"SA (0.04s)": 0.5962867019888268,
				"SA (0.05s)": 0.6085470411173184,
				"SA (0.075s)": 0.669284676018622,
				"SA (0.1s)": 0.7060656934040968,
				"SA (0.15s)": 1.0253134302420857,
				"SA (0.2s)": 1.269083454320298,
				"SA (0.25s)": 1.4138022837206703,
				"SA (0.3s)": 1.4426864507299815,
				"SA (0.4s)": 1.411918533698324,
				"SA (0.5s)": 1.5152800038510241,
				"SA (0.75s)": 1.1579209176908751,
				"SA (1.0s)": 1.227470671340782,
				"SA (1.5s)": 0.8277751016275605,
				"SA (2.0s)": 0.38412536472625697,
				"SA (3.0s)": 0.37935745506517693,
				"SA (4.0s)": 0.2781564439776536,
				"SA (5.0s)": 0.1377159620856611,
				"SA (7.5s)": 0.037621787169459964,
				"SA (10.0s)": 0.01977405390689013,
				"IA": 11.109706983245019,
				"Ds595": 30.6,
				"Ds575": 17.627,
				"CAV": 4.574745463873371,
				"ASI": 0.528216277452514,
				"SI": 340.72461562383614,
				"DSI": 257.2968392104283
			};
			
			gmSelector.scaleGroundMotions(database,0.5715106,"PGA");
			expect(database[0].scaledIM).toEqual(scaledIM);
		}));
	});
	
	describe('loadDatabase', function() {
		it('should convert the database into the correct named-column format', inject(function(database, NGAdatabase) {
			var testCallback = function(data) {
				expect(data.length).toEqual(NGAdatabase.length);
				expect(data[0]).toEqual({"DatabaseName":"NGAdatabase","GMID":12,"EQID":12,"Mw":7.36,"mech":2,"Ztor":0,"Rjb":114.62,"Rrup":117.75,"Vs30":316.5,"freqMin":0.25,"IM":{"PGA":0.0537,"PGV":7.59,"SA (0.01s)":0.05379,"SA (0.02s)":0.054018,"SA (0.03s)":0.054534,"SA (0.04s)":0.056028,"SA (0.05s)":0.05718,"SA (0.075s)":0.062887,"SA (0.1s)":0.066343,"SA (0.15s)":0.09634,"SA (0.2s)":0.119245,"SA (0.25s)":0.132843,"SA (0.3s)":0.135557,"SA (0.4s)":0.132666,"SA (0.5s)":0.142378,"SA (0.75s)":0.1088,"SA (1.0s)":0.115335,"SA (1.5s)":0.077779,"SA (2.0s)":0.036093,"SA (3.0s)":0.035645,"SA (4.0s)":0.026136,"SA (5.0s)":0.01294,"SA (7.5s)":0.003535,"SA (10.0s)":0.001858,"IA":0.098085,"Ds595":30.6,"Ds575":17.627,"CAV":0.42985,"ASI":0.049632,"SI":32.015,"DSI":24.176}});
			};
			database.loadDatabase('NGAdatabase', testCallback);
			expect(database.fetchDatabase.calls.length).toEqual(1);
			expect(database.fetchDatabase.mostRecentCall.args[0]).toEqual('NGAdatabase');
		}));
	});
	
	describe('selectBestFittingGroundMotions', function() {
		it('should return the best fitting ground motions for the given sample of simulated motions', inject(function(gmSelector, database, OpenSHAresults) {
			var sampleIndices = [23,91,30,7,41,20,98,90,24,54,84,14,49,50,26,29,93,38,25,1,87,86,28,96,67,94,52,48,71,68];
			database.loadDatabase('NGAdatabase', function(data) {
				gmSelector.scaleGroundMotions(data, 0.5715106, 'PGA');
				var result = gmSelector.selectBestFittingGroundMotions(data, OpenSHAresults, sampleIndices);
				expect(result.length).toEqual(sampleIndices.length);
				expect(result[0].index).toEqual(153);
				expect(result[0].residual).toBeCloseTo(0.492705, 6);
				expect(result[1].index).toEqual(410);
				expect(result[1].residual).toBeCloseTo(0.756737, 6);
				expect(result[29].index).toEqual(428);
				expect(result[29].residual).toBeCloseTo(0.626665, 6);
			});
		}));
	});
	
	describe('selectGroundMotions', function() {
		it('should return the correct output', inject(function(gmSelector, database, OpenSHAresults, util) {
			database.loadDatabase('NGAdatabase', function(data) {
				spyOn(util, 'sample').andCallFake(function(name, callback) {
					return [23,91,30,7,41,20,98,90,24,54,84,14,49,50,26,29,93,38,25,1,87,86,28,96,67,94,52,48,71,68];
				});
				var output = gmSelector.selectGroundMotions(OpenSHAresults, data, function(){});
				// Expect one call to util.sample
				expect(util.sample.calls.length).toEqual(1);
				// Make sure the global residual, R is correct
				expect(output.R).toBeCloseTo(0.035666, 6);
				// Make sure the Kolmogorov-Smirnov critical value is correct
				expect(output.ksCriticalValue).toBeCloseTo(0.217615, 6);
				// Make sure the KS statistics are correct for each IM
				expect(output.IMi[0].ksDiff).toBeCloseTo(0.146925, 6);
				expect(output.IMi[1].ksDiff).toBeCloseTo(0.177292, 6);
				expect(output.IMi[2].ksDiff).toBeCloseTo(0.088426, 6);
				expect(output.IMi[3].ksDiff).toBeCloseTo(0.224296, 6);
				expect(output.IMi[4].ksDiff).toBeCloseTo(0.154380, 6);
				expect(output.IMi[5].ksDiff).toBeCloseTo(0.219265, 6);
				expect(output.IMi[6].ksDiff).toBeCloseTo(0.080936, 6);
				expect(output.IMi[7].ksDiff).toBeCloseTo(0.278676, 6);
				expect(output.IMi[8].ksDiff).toBeCloseTo(0.169969, 6);
				expect(output.IMi[9].ksDiff).toBeCloseTo(0.174985, 6);
				expect(output.IMi[10].ksDiff).toBeCloseTo(0.082285, 6);
				expect(output.IMi[11].ksDiff).toBeCloseTo(0.277502, 6);
				// Make sure the correct GMIDs with correct scale factors are selected
				var gm = output.selectedGroundMotions;
				expect(gm[0].GMID).toEqual(210);
				expect(gm[1].GMID).toEqual(541);
				expect(gm[2].GMID).toEqual(1912);
				expect(gm[3].GMID).toEqual(879);
				expect(gm[4].GMID).toEqual(683);
				expect(gm[5].GMID).toEqual(810);
				expect(gm[6].GMID).toEqual(407);
				expect(gm[7].GMID).toEqual(686);
				expect(gm[8].GMID).toEqual(2495);
				expect(gm[9].GMID).toEqual(720);
				expect(gm[10].GMID).toEqual(305);
				expect(gm[11].GMID).toEqual(1073);
				expect(gm[12].GMID).toEqual(1641);
				expect(gm[13].GMID).toEqual(1087);
				expect(gm[14].GMID).toEqual(585);
				expect(gm[15].GMID).toEqual(407);
				expect(gm[16].GMID).toEqual(983);
				expect(gm[17].GMID).toEqual(410);
				expect(gm[18].GMID).toEqual(700);
				expect(gm[19].GMID).toEqual(148);
				expect(gm[20].GMID).toEqual(2382);
				expect(gm[21].GMID).toEqual(514);
				expect(gm[22].GMID).toEqual(585);
				expect(gm[23].GMID).toEqual(496);
				expect(gm[24].GMID).toEqual(108);
				expect(gm[25].GMID).toEqual(2391);
				expect(gm[26].GMID).toEqual(514);
				expect(gm[27].GMID).toEqual(763);
				expect(gm[28].GMID).toEqual(265);
				expect(gm[29].GMID).toEqual(560);
				expect(gm[0].scaleFactor).toBeCloseTo(8.888190, 6);
				expect(gm[1].scaleFactor).toBeCloseTo(6.763439, 6);
				expect(gm[2].scaleFactor).toBeCloseTo(24.423530, 6);
				expect(gm[3].scaleFactor).toBeCloseTo(0.792224, 6);
				expect(gm[4].scaleFactor).toBeCloseTo(2.179674, 6);
				expect(gm[5].scaleFactor).toBeCloseTo(1.251118, 6);
				expect(gm[6].scaleFactor).toBeCloseTo(0.789270, 6);
				expect(gm[7].scaleFactor).toBeCloseTo(10.316076, 6);
				expect(gm[8].scaleFactor).toBeCloseTo(1.710086, 6);
				expect(gm[9].scaleFactor).toBeCloseTo(2.691995, 6);
				expect(gm[10].scaleFactor).toBeCloseTo(6.952684, 6);
				expect(gm[11].scaleFactor).toBeCloseTo(5.867665, 6);
				expect(gm[12].scaleFactor).toBeCloseTo(1.744538, 6);
				expect(gm[13].scaleFactor).toBeCloseTo(0.343973, 6);
				expect(gm[14].scaleFactor).toBeCloseTo(0.450115, 6);
				expect(gm[15].scaleFactor).toBeCloseTo(0.789270, 6);
				expect(gm[16].scaleFactor).toBeCloseTo(0.747170, 6);
				expect(gm[17].scaleFactor).toBeCloseTo(1.883687, 6);
				expect(gm[18].scaleFactor).toBeCloseTo(0.959071, 6);
				expect(gm[19].scaleFactor).toBeCloseTo(2.170568, 6);
				expect(gm[20].scaleFactor).toBeCloseTo(3.767374, 6);
				expect(gm[21].scaleFactor).toBeCloseTo(2.576693, 6);
				expect(gm[22].scaleFactor).toBeCloseTo(0.450115, 6);
				expect(gm[23].scaleFactor).toBeCloseTo(1.484829, 6);
				expect(gm[24].scaleFactor).toBeCloseTo(16.613680, 6);
				expect(gm[25].scaleFactor).toBeCloseTo(1.727662, 6);
				expect(gm[26].scaleFactor).toBeCloseTo(2.576693, 6);
				expect(gm[27].scaleFactor).toBeCloseTo(1.710597, 6);
				expect(gm[28].scaleFactor).toBeCloseTo(0.998795, 6);
				expect(gm[29].scaleFactor).toBeCloseTo(13.048187, 6);
			});
		}));
	});
});

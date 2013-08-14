'use strict';

/* jasmine specs for the selection module go here */

describe('Selection module', function(){
	beforeEach(module('selection'));
	
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
});

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
});

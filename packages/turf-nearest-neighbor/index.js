import { featureEach } from '@turf/meta';
import { featureCollection } from '@turf/helpers';
import bbox from '@turf/bbox';
import bboxPolygon from '@turf/bbox-polygon';
import centroid from '@turf/centroid';
import area from '@turf/area';
import nearestPoint from '@turf/nearestPoint';
import distance from '@turf/distance';

/**
 * Takes a set of points (or calculates the centroids of a set of polygons or lines) and calculates the expected mean distance, the observed mean distance, the nearest neighbor statistic, and the z-score suggesting whether the points are clustered, randomly distributed, or dispersed.
 *
 * @name nearestNeighbor
 * @param {FeatureCollection} dataset GeoJSON FeatureCollection whose centroids it turns into points for analysis
 * @param {Object} [options={}] Optional parameters
 * @param {Feature<Polygon>|Array<number>} [options.studyArea=turf.bbox(dataset)] 
 * @returns {Feature<Polygon>} studyArea polygon with report properties
 * @example
 * var points = turf.randomPoint(50, {bbox: [-50, -30, -40, -40]});
 * var nearestNeighbor = turf.nearestNeighbor(points);
 *
 * //addToMap
 * var addToMap = [points, nearestNeighbor];
 */

function nearestNeighbor(dataset, options){
    // Optional params
    options = options || {};
    var studyArea = options.studyArea || bboxPolygon(bbox(dataset));
    var features, n, observedMeanDistance, analysis;

    if (Array.isArray(studyArea) && studyArea.length === 4) {
        studyArea = bboxPolygon(studyArea);
    }
    features = [];
    featureEach(dataset, function(feature){
        features.push(centroid(feature));
    });
    n = features.length;
    observedMeanDistance = features.map(function(feature){
        var theOtherFeatures = featureCollection(features.filter(function(f){
            return f !== feature;
        }));
        return distance(feature, nearestPoint(feature, theOtherFeatures));
    }).reduce(function (sum, value){
        return sum + value;
    }, 0) / n;
    // This assumes that studyArea is a single feature, not a multipolygon, etc.
    studyArea.properties.nearestNeighborAnalysis = calculateNearestNeighborStatistics(n, observedMeanDistance, area(studyArea) * 0.000001);

    return studyArea;
/**
 * Calculate nearest neighbor statistics.
 *
 * @private
 * @param {number} n number of features
 * @param {number} area calculated area of study area
 * @param {number} observedMeanDistance the observed mean distance
 * @returns {object} an oject with the nearest neighbor statistics as parameters
 */
    function calculateNearestNeighborStatistics(n, observedMeanDistance, theArea) {
        var popDensity = n / theArea;
        var expectedMeanDistance = 1 / (2 * Math.sqrt(popDensity));
        var variance = 0.26136 / (Math.sqrt(n * popDensity));
        return {
            observedMeanDistance: observedMeanDistance,
            expectedMeanDistance: expectedMeanDistance,
            nearestNeighborIndex: observedMeanDistance / expectedMeanDistance,
            numberOfPoints: n,
            zScore: (observedMeanDistance - expectedMeanDistance) / variance
        };
    }
}

export default circle;

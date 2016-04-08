// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

var panoDict = {},
    streetPointDict = {},
    streetPoints = null,
    currentStreetPoint = null,
    trees = [],
    currentTree = null,
    currentRayHeading = null,
    viewUpdaters = [];

function initSite() {
    var exports = {
            getState: getState,
            setCurrentPano: setCurrentPano,
            setCurrentStreetPoint: setCurrentStreetPoint,
            setCurrentTree: setCurrentTree,
            updateCurrentRayHeading: updateCurrentRayHeading,
            fireRay: fireRay
        };

    var location = {lat: 44.94406, lng: -93.2256788}; // South Minneapolis
    //var location = {lat: 65.8381615, lng: 24.1310685}; // Haparanda, Norway
    //var location = {lat: -0.0205497, lng: -51.1695488}; // Santana, Brazil
    //var location = {lat: 40.0546062, lng: -75.1959133}; // Northwest Philly

    init(location);

    function init(location) {
        new google.maps.StreetViewService().getPanoramaByLocation(location, 50, function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                var panos = _.map(data.links, 'pano');
                panoDict[data.location.pano] = data;
                fetchPanoDataForBlock(panos);
            }
        });

        viewUpdaters = [
            initMap(location, exports),
            initStreetView(exports)
        ];
    }

    function fetchPanoDataForBlock(panos) {
        var deferreds = _.map(panos, fetchPanoData);
        $.when.apply(null, deferreds).done(function() {
            var newPanos = [];
            _.each(arguments, function (data) {
                panoDict[data.location.pano] = data;
                if (data.links.length <= 2) {  // mid-block
                    _.each(data.links, function (link) {
                        if (! panoDict[link.pano]) {
                            newPanos.push(link.pano);
                        }
                    });
                }
            });
            newPanos = _.uniq(newPanos);
            if (newPanos.length > 0) {
                fetchPanoDataForBlock(newPanos);
            } else {
                initStreetPoints();
            }
        });
    }

    function fetchPanoData(pano) {
        var deferred = $.Deferred();
        new google.maps.StreetViewService().getPanorama({pano: pano}, function (data, status) {
            if (status == google.maps.StreetViewStatus.OK) {
                deferred.resolve(data);
            } else {
                deferred.reject(status);
            }
        });
        return deferred;
    }

    function initStreetPoints() {
        _.map(panoDict, function (data, pano) {
            streetPointDict[pano] = new StreetPoint(data);
        });
        _.map(streetPointDict, function (streetPoint) {
            streetPoint.setNeighbors(streetPointDict);
        });
        streetPoints = _.map(streetPointDict, _.identity);
        var startPoint = _.minBy(streetPoints, 'lat');
        setCurrentStreetPoint(startPoint);
    }

    function setCurrentPano(pano) {
        if (pano != currentStreetPoint.pano) {
            setCurrentStreetPoint(streetPointDict[pano]);
        }
    }

    function setCurrentStreetPoint(streetPoint) {
        currentStreetPoint = streetPoint;
        updateViews();
    }

    function setCurrentTree(tree) {
        if (tree) {
            new google.maps.StreetViewService().getPanoramaByLocation(tree.latLng, 50, function (data, status) {
                if (status == google.maps.StreetViewStatus.OK) {
                    currentTree = tree;
                    setCurrentPano(data.location.pano);
                    updateViews();
                }
            });
        } else {
            currentTree = null;
            updateViews();
        }
    }

    function updateCurrentRayHeading(heading) {
        currentRayHeading = heading;
        updateViews();
    }

    function fireRay(heading) {
        var newRay = makeRay(currentStreetPoint, heading),
            intersection = false;
        _.find(currentStreetPoint.nearNeighbors(), function (neighbor) {
            intersection = neighbor.popIntersectingRay(newRay);
            return intersection;
        });
        if (intersection) {
            trees.push({
                latLng: intersection
            });
        } else {
            currentStreetPoint.addRay(heading);
        }
        updateViews();
    }

    function makeRay(streetPoint, heading) {
        return {
            streetPoint: streetPoint,
            heading: heading
        }
    }

    function updateViews() {
        var state = getState();
        _.each(viewUpdaters, function (update) {
            update(state);
        });
    }

    function getState() {
        return {
            streetPoints: streetPoints,
            currentStreetPoint: currentStreetPoint,
            trees: trees,
            currentTree: currentTree,
            currentRayHeading: currentRayHeading
        };
    }

}
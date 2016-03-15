// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

function initMap(center, controller) {

    var map = null,
        oldMetrics = null,
        streetPointMarkers = [],
        treeMarkers = [],
        currentRay = null,
        unmetRays = [];

    var DEGREES_TO_RADIANS = Math.PI / 180;

    init();
    return update;

    function init() {
        map = new google.maps.Map(document.getElementById('map'), {
            center: center,
            zoom: 19
        });
    }

    function update(state) {
        var metrics = getStateMetrics(state);
        if (!oldMetrics || metrics.currentPano !== oldMetrics.currentPano) {
            updateStreetPointMarkers(state);
        }
        if (!oldMetrics || metrics.treeCount !== oldMetrics.treeCount
            || metrics.currentTree !== oldMetrics.currentTree) {
            updateTreeMarkers(state);
        }
        if (!oldMetrics || metrics.currentRayHeading !== oldMetrics.currentRayHeading
            || metrics.currentPano !== oldMetrics.currentPano) {
            updateCurrentRay(state);
        }
        if (!oldMetrics || metrics.unmetRayCount !== oldMetrics.unmetRayCount) {
            updateUnmetRays(state);
        }
        oldMetrics = metrics;
    }
    
    function getStateMetrics(state) {
        return {
            currentRayHeading: state.currentRayHeading,
            unmetRayCount: _.flatMap(state.streetPoints, 'rayHeadings').length,
            currentPano: state.currentStreetPoint.pano,
            treeCount: state.trees.length,
            currentTree: currentTree
        }
    }

    function updateCurrentRay(state) {
        if (currentRay) {
            currentRay.setMap(null);
        }
        if (state.currentRayHeading) {
            currentRay = addRay(state.currentStreetPoint, state.currentRayHeading, true);
        }
    }

    function updateUnmetRays(state) {
        var newRays = _.flatMap(state.streetPoints, function (streetPoint) {
            return _.map(streetPoint.rayHeadings, function (heading) {
                return addRay(streetPoint, heading);
            });
        });
        removeFromMap(unmetRays);
        unmetRays = newRays;
    }

    function addRay(streetPoint, heading, isCurrent) {
        return new google.maps.Polyline({
            path: [
                streetPoint.latLng,
                getOffsetPoint(streetPoint.latLng, 90 - heading, 1)
            ],
            strokeColor: isCurrent ? 'Red' : 'Orange',
            strokeOpacity: 1.0,
            strokeWeight: 1,
            map: map
        });
    }

    function getOffsetPoint(p, heading, length) {
        heading = heading * DEGREES_TO_RADIANS;
        return {
            lat: p.lat + length * Math.sin(heading),
            lng: p.lng + length * Math.cos(heading)
        }
    }

    function updateStreetPointMarkers(state) {
        var newMarkers = _.map(state.streetPoints, function (streetPoint) {
            var isCurrent = (streetPoint === state.currentStreetPoint),
                marker = addMarker(streetPoint.latLng, {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: isCurrent ? 'Cyan' : 'Blue',
                    fillOpacity: 0.8,
                    strokeWeight: 0,
                    scale: 5
                });
            marker.addListener('click', function() {
                controller.setCurrentStreetPoint(streetPoint);
            });
            return marker;
        });
        removeFromMap(streetPointMarkers);
        streetPointMarkers = newMarkers;
    }

    function updateTreeMarkers(state) {
        var newMarkers = _.map(state.trees, function (tree) {
            var isCurrent = (tree === state.currentTree),
                marker = addMarker(tree, {
                    path: google.maps.SymbolPath.CIRCLE,
                    fillColor: isCurrent ? 'Lime' : 'Green',
                    fillOpacity: 0.8,
                    strokeWeight: 0,
                    scale: 10
                });
            marker.addListener('click', function() {
                controller.setCurrentTree(tree);
            });
            return marker;
        });
        removeFromMap(treeMarkers);
        treeMarkers = newMarkers;
    }

    function addMarker(latLng, icon) {
        return new google.maps.Marker({
            position: latLng,
            icon: icon,
            map: map
        });
    }

    function removeFromMap(items) {
        _.each(items, function (item) {
            item.setMap(null);
        });
    }

    function onTreeClick(e) {

    }

}
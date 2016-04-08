// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

function initStreetViewMeasure(controller, panorama, $panorama, $overlayContainer) {

    var oldPitchAndZoom,
        ZOOM_FOR_MEASURING = 3,
        DEGREES_TO_RADIANS = Math.PI / 180,
        FEET_TO_METERS =  .0254 * 12,  // m/ft = m/in * in/ft
        METERS_TO_INCHES = 12 / FEET_TO_METERS;

    return {
        name: 'measure',
        enable: enableMode,
        disable: disableMode,
        onClick: onClick
    };

    function enableMode() {
        panorama.setOptions({linksControl: false});
        oldPitchAndZoom = getCurrentPitchAndZoom();
        setPitchAndZoom(getPitchAndZoomForMeasurement());
        showWidget();
    }

    function disableMode() {
        setPitchAndZoom(oldPitchAndZoom);
        $overlayContainer.empty();
    }

    function onClick(currentModeName) {
        if (currentModeName === 'inspect') {
            return true;
        } else {
            alert("Please click a tree on the map.");
            return false;  // don't enable mode
        }
    }

    function getCurrentPitchAndZoom() {
        return { pitch: panorama.getPov().pitch, zoom: panorama.getZoom() };
    }

    function getPitchAndZoomForMeasurement() {
        var dist = getMetersFromCameraToTree(),
            breastHeight = 4.5 * FEET_TO_METERS,
            cameraHeight = 2.5,
            deltaHeight = cameraHeight - breastHeight,
            pitch = Math.atan2(deltaHeight, dist) / DEGREES_TO_RADIANS;
        return {pitch: -pitch, zoom: ZOOM_FOR_MEASURING};
    }

    function getMetersFromCameraToTree() {
        var state = controller.getState(),
            p1 = new google.maps.LatLng(state.currentTree.latLng),
            p2 = new google.maps.LatLng(state.currentStreetPoint.latLng),
            dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        return dist;
    }

    function setPitchAndZoom(pitchAndZoom) {
        var pov = panorama.getPov();
        pov.pitch = pitchAndZoom.pitch;
        panorama.setPov(pov);
        panorama.setZoom(pitchAndZoom.zoom);
    }

    function showWidget() {
        $overlayContainer.append($(
            '<div class="widget">' +
                '<div class="axis"></div>' +
                '<div class="edge-left"></div>' +
                '<div class="edge-right"></div>' +
            '</div>'));
        var tree = controller.getState().currentTree,
            $edgeLeft = $('.edge-left'),
            $edgeRight = $('.edge-right');
        initEdgePosition($edgeLeft, tree.leftHandlePosition);
        initEdgePosition($edgeRight, tree.rightHandlePosition);
        handleEdgeDrag($edgeLeft);
        handleEdgeDrag($edgeRight);

        function initEdgePosition($edge, position) {
            $edge.css('left', position ? position : "");
        }

        function handleEdgeDrag($edge) {
            $edge.on('mousedown', function (eDown) {
                var prevPageX = eDown.pageX;
                $overlayContainer.on('mousemove', function (eMove) {
                    var delta = eMove.pageX - prevPageX;
                    if (delta != 0) {
                        $edge.css('left', $edge[0].offsetLeft + delta + 'px');
                        prevPageX = eMove.pageX;
                        setDiameter(tree, $edgeLeft, $edgeRight);
                    }
                });
                eDown.preventDefault();
            });
        }

        window.addEventListener('mouseup', function () {
            // Called even outside of windowI
            $overlayContainer.off('mousemove');
        });
    }

    function setDiameter(tree, $edgeLeft, $edgeRight) {
        var viewWidth = $panorama.width(),
            zoom = panorama.getZoom(),
            focalLength = streetViewMath.getFocalLength(viewWidth, zoom),
            rightPosition = $edgeRight.offset().left,
            leftPosition = $edgeLeft.offset().left + $edgeRight.width(),
            pixels =  rightPosition - leftPosition,
            dist = getMetersFromCameraToTree(),
            diameterMeters = pixels * dist / focalLength;
        tree.diameter = diameterMeters * METERS_TO_INCHES;

        tree.leftHandlePosition = $edgeLeft.css('left');
        tree.rightHandlePosition = $edgeRight.css('left');

        //window.console.log(
        //    ' dist=' + dist +
        //    ' w=' + viewWidth +
        //    ' zoom=' + zoom +
        //    ' focalLength=' + focalLength +
        //    ' px=' + pixels +
        //    ' m=' + diameterMeters +
        //    ' in=' + tree.diameter +
        //    ''
        //);
    }

}
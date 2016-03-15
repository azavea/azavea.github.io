// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

function initStreetView(location, controller) {

    var panorama = null,
        oldMetrics = null,
        DEGREES_TO_RADIANS = Math.PI / 180;

    var dom = {
        panorama: '#street-view'
    };

    return update;

    function update(state) {
        var metrics = getStateMetrics(state);
        if (panorama === null) {
            panorama = new google.maps.StreetViewPanorama(document.getElementById('street-view'), {
                clickToGo: false
            });
            panorama.setPano(state.currentStreetPoint.pano);
            panorama.addListener('pano_changed', onPanoChanged);
            showHorizontalPosition();
            handleClickNotDrag();
        } else {
            panorama.setPano(state.currentStreetPoint.pano);
        }
        if (!oldMetrics || metrics.currentPano !== oldMetrics.currentPano) {
            panorama.setPano(state.currentStreetPoint.pano);
        }
        if (metrics.currentTree && (!oldMetrics || metrics.currentTree !== oldMetrics.currentTree)) {
            var cameraPos = new google.maps.LatLng(state.currentStreetPoint.latLng),
                pos = new google.maps.LatLng(state.currentTree),
                heading = google.maps.geometry.spherical.computeHeading(cameraPos, pos);
            setHeading(heading);
        }
        oldMetrics = metrics;
    }

    function getStateMetrics(state) {
        return {
            currentPano: state.currentStreetPoint.pano,
            currentTree: state.currentTree
        }
    }

    function showHorizontalPosition() {
        var $panorama = $(dom.panorama),
            $vHairTop = $('<div class="crosshair-y"></div>'),
            $vHairBottom = $('<div class="crosshair-y"></div>'),
            $vHairs = $vHairTop.add($vHairBottom);
        $panorama.append($vHairs);
        $panorama.on('mouseenter', function () {
            var onMove = $panorama.on('mousemove', function (e) {
                if (e.offsetX > 0) {
                    $vHairs.show().css('left', e.offsetX);
                    $vHairTop.css('height', e.offsetY - 2);
                    $vHairBottom.css('top', e.offsetY + 2);
                    controller.updateCurrentRayHeading(getHeading(panorama, e));
                }
            });

            $panorama.on('mouseleave', function () {
                $vHairs.hide();
                $panorama.off('mousemove', onMove);
                controller.updateCurrentRayHeading(null);
            });
        });
    }

    function onPanoChanged() {
        controller.setCurrentPano(panorama.getPano())
    }

    function onPanoramaClick(e) {
        if (e.target.nodeName === 'svg') {
            var heading = getHeading(panorama, e);
            controller.fireRay(heading);
            e.stopPropagation();
        }
    }

    function setHeading(heading) {
        var pov = panorama.getPov();
        pov.heading = heading;
        panorama.setPov(pov);
    }

    function getHeading(panorama, e) {
        var $panorama = $(dom.panorama),
            viewWidth = $panorama.width(),
            cameraHeading = panorama.getPov().heading,
            zoom = panorama.getZoom(),
            fov = getFov(zoom),
            focalLength = (viewWidth / 2) / Math.tan(fov * DEGREES_TO_RADIANS / 2),

            x = e.offsetX - viewWidth / 2,
            heading = Math.atan2(x, focalLength) / DEGREES_TO_RADIANS,
            result = cameraHeading + heading;

        window.console.log(
            ' w=' + viewWidth +
            ' zoom=' + zoom +
            ' fov=' + fov +
            ' h0=' + cameraHeading +
            ' x=' + x +
            ' h=' + heading +
            ' h1=' + result +
            ''
        );
        return result;
    }

    function handleClickNotDrag(e) {
        var $panorama = $(dom.panorama);
        $panorama.on('mousedown', function (e1) {
            //console.log('mouse DOWN' + ' ' + e1.pageX + ' ' + e1.pageY);
            $panorama.on('mouseup mousemove', function handler(e2) {
                //console.log(e2.type + ' ' + e2.pageX + ' ' + e2.pageY);
                $panorama.off('mouseup mousemove', handler);
                if (e2.type === 'mouseup' || (e1.pageX === e2.pageX && e1.pageY === e2.pageY)) {
                    onPanoramaClick(e2);
                }
            });
        });
    }

    /**
     * https://github.com/marmat/google-maps-api-addons/blob/master/panomarker/src/panomarker.js
     *
     * According to the documentation (goo.gl/WT4B57), the field-of-view angle
     * should precisely follow the curve of the form 180/2^zoom. Unfortunately, this
     * is not the case in practice in the 3D environment. From experiments, the
     * following FOVs seem to be more correct:
     *
     *        Zoom | best FOV | documented FOV
     *       ------+----------+----------------
     *          0  | 126.5    | 180
     *          1  | 90       | 90
     *          2  | 53       | 45
     *          3  | 28       | 22.5
     *          4  | 14.25    | 11.25
     *          5  | 7.25     | not specified
     *
     * Because of this, we are doing a linear interpolation for zoom values <= 2 and
     * then switch over to an inverse exponential. In practice, the produced
     * values are good enough to result in stable marker positioning, even for
     * intermediate zoom values.
     *
     * @return {number} The (horizontal) field of view angle for the given zoom.
     */
    function getFov(zoom) {
        return zoom <= 2 ?
        126.5 - zoom * 36.75 :  // linear descent
        195.93 / Math.pow(1.92, zoom); // parameters determined experimentally
    }
}
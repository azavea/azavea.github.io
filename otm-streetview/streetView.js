// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

function initStreetView(controller) {

    var panorama = null,
        oldMetrics = null,
        modes = {},
        currentMode = null;

    var dom = {
        panorama: '#street-view',
        modeButton: '.modeButton'
    };

    return update;

    function update(state) {
        var metrics = getStateMetrics(state);
        if (panorama === null) {
            onFirstPano(state.currentStreetPoint.pano);
        } else {
            panorama.setPano(state.currentStreetPoint.pano);
        }
        if (!oldMetrics || metrics.currentPano !== oldMetrics.currentPano) {
            panorama.setPano(state.currentStreetPoint.pano);
        }
        if (metrics.currentTree && (!oldMetrics || metrics.currentTree !== oldMetrics.currentTree)) {
            var cameraPos = new google.maps.LatLng(state.currentStreetPoint.latLng),
                pos = new google.maps.LatLng(state.currentTree.latLng),
                heading = google.maps.geometry.spherical.computeHeading(cameraPos, pos);
            setHeading(heading);
            enableMode('inspect');
        }
        oldMetrics = metrics;
    }

    function onFirstPano(pano) {
        var $panorama = $(dom.panorama),
            $overlayContainer = $('<div id="overlay-container";"></div>');
        panorama = new google.maps.StreetViewPanorama($panorama[0], {
            clickToGo: false
        });
        panorama.setPano(pano);
        panorama.addListener('pano_changed', onPanoChanged);
        $panorama.append($overlayContainer);
        initModes($panorama, $overlayContainer);
    }

    function initModes($panorama, $overlayContainer) {
        initMode(initStreetViewLocate);
        initMode(initStreetViewInspect);
        initMode(initStreetViewMeasure);
        enableMode('locate');

        function initMode(initStreetViewMode) {
            var mode = initStreetViewMode(controller, panorama, $panorama, $overlayContainer);
            modes[mode.name] = mode;
            modeButton(mode.name).on('click', function () {
                onModeButtonClick(mode);
            });
        }
    }

    function onModeButtonClick(mode) {
        var shouldEnableMode = true;
        if (mode.onClick) {
            shouldEnableMode = mode.onClick(currentMode.name);
        }
        if (shouldEnableMode && currentMode !== mode) {
            enableMode(mode.name);
        }
    }

    function enableMode(name) {
        var mode = modes[name];
        if (currentMode) {
            currentMode.disable();
        }
        currentMode = mode;
        mode.enable();
        $(dom.modeButton).removeClass('active');
        modeButton(name).addClass('active');
    }

    function modeButton(name) {
        return $(dom.modeButton).filter('[name=' + name + ']');
    }

    function getStateMetrics(state) {
        return {
            currentPano: state.currentStreetPoint.pano,
            currentTree: state.currentTree
        }
    }

    function onPanoChanged() {
        controller.setCurrentPano(panorama.getPano())
    }

    function setHeading(heading) {
        var pov = panorama.getPov();
        pov.heading = heading;
        pov.pitch = 10;
        panorama.setPov(pov);
        panorama.setZoom(1);
    }
}
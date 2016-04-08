// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

function initStreetViewLocate(controller, panorama, $panorama, $overlayContainer) {

    return {
        name: 'locate',
        enable: enableMode,
        disable: disableMode,
        onClick: onClick
    };

    function enableMode() {
        panorama.setOptions({linksControl: true});
        showHorizontalPosition();
        handleClickNotDrag();
    }

    function disableMode() {
        $panorama.off();
        $overlayContainer.empty();
    }

    function onClick() {
        controller.setCurrentTree(null);
        return true;  // do enable mode
    }

    function showHorizontalPosition() {
        var $vHairTop = $('<div class="hair-locate"></div>'),
            $vHairBottom = $('<div class="hair-locate"></div>'),
            $vHairs = $vHairTop.add($vHairBottom);
        $overlayContainer.append($vHairs);
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

    function onPanoramaClick(e) {
        if (e.target.nodeName === 'svg' || e.target.nodeName === 'CANVAS') {
            var heading = getHeading(panorama, e);
            controller.fireRay(heading);
            e.stopPropagation();
        }
    }

    function getHeading(panorama, e) {
        var viewWidth = $panorama.width(),
            zoom = panorama.getZoom(),
            x = e.offsetX - viewWidth / 2,
            heading = streetViewMath.getHeading(x, viewWidth, zoom),
            cameraHeading = panorama.getPov().heading,
            result = cameraHeading + heading;

        //window.console.log(
        //    ' w=' + viewWidth +
        //    ' zoom=' + zoom +
        //    ' h0=' + cameraHeading +
        //    ' x=' + x +
        //    ' h=' + heading +
        //    ' h1=' + result +
        //    ''
        //);
        return result;
    }

    function handleClickNotDrag(e) {
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
}
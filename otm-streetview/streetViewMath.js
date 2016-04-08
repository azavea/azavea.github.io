// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

"use strict";

var streetViewMath = (function () {

    var DEGREES_TO_RADIANS = Math.PI / 180;

    return {
        getHeading: getHeading,
        getFocalLength: getFocalLength
    };

    function getHeading(x, viewWidth, zoom) {
        var focalLength = getFocalLength(viewWidth, zoom),
            heading = Math.atan2(x, focalLength) / DEGREES_TO_RADIANS;
        return heading;
    }

    function getFocalLength(viewWidth, zoom) {
        var fov = getFov(zoom),
            focalLength = (viewWidth / 2) / Math.tan(fov * DEGREES_TO_RADIANS / 2);
        return focalLength;
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

})();

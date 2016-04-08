// License:  GNU Affero General Public License v3 (AGPL-3.0)
// https://tldrlegal.com/license/gnu-affero-general-public-license-v3-(agpl-3.0)

function StreetPoint(data /* StreetViewPanoramaData */) {
    this.pano = data.location.pano;
    this.lat = data.location.latLng.lat();
    this.lng = data.location.latLng.lng();
    this.latLng = { lat: this.lat, lng: this.lng };
    this.neighbors = null;
    this.rayHeadings = [];

    this.setNeighbors = function (streetPointDict) {
        this.neighbors = _.filter(_.map(data.links, function (link) {
            return streetPointDict[link.pano];
        }));
    };

    this.nearNeighbors = function () {
        var tooMany = this.neighbors.concat(_.flatMap(this.neighbors, 'neighbors')),
            four = _.without(_.uniq(tooMany), this);
        return four;
    };

    this.addRay = function (heading) {
        this.rayHeadings.push(heading);
    };

    this.popIntersectingRay = function (newRay) {
        var self = this,
            latLng = false;
        _.find(this.rayHeadings, function(heading) {
            var intersection = self._getIntersection(newRay, heading);
            if (intersection) {
                self.rayHeadings = _.without(self.rayHeadings, heading);
                latLng = intersection
            }
            return intersection;
        });
        return latLng;
    };

    var DEGREES_TO_RADIANS = Math.PI / 180;

    this.getOffsetPoint = function (heading) {
        var p = latLngToWebMercator(this.latLng),
            p2 = getOffsetPoint(p, heading),
            result = webMercatorToLatLng(p2);
        return result;
    };

    this._getIntersection = function (newRay, myRayHeading) {
        var p1 = latLngToWebMercator(this.latLng),
            h1 = myRayHeading,
            p2 = latLngToWebMercator(newRay.streetPoint),
            h2 = newRay.heading,
            v1 = makeLine(p1, h1),
            v2 = makeLine(p2, h2),
            p = getVectorIntersection(v1, v2),
            result = webMercatorToLatLng(p);

        return result;

        function makeLine(p, h) {
            var p2 = getOffsetPoint(p, h);
            return { x1: p.x, y1: p.y, x2: p2.x, y2: p2.y };
        }
    };

    function getOffsetPoint(p, h) {
        var length = 100000;
        h = h * DEGREES_TO_RADIANS;
        return {
            x: p.x + length * Math.sin(h),
            y: p.y + length * Math.cos(h)
        }
    }

    function latLngToWebMercator(latLng) {
        var originShift = (2.0 * Math.PI * (6378137.0 / 2.0)) / 180.0;
        return {
            x: originShift * latLng.lng,
            y: originShift * (Math.log(Math.tan((90.0 + latLng.lat) * (Math.PI / 360.0)))) / (Math.PI / 180.0)
        };
    }

    function webMercatorToLatLng(p) {
        var originShift =  (2.0 * Math.PI * 6378137.0 / 2.0) / 180.0;
        var d2r = Math.PI / 180.0;
        var r2d = 180.0 / Math.PI;

        var lat = r2d * ((2.0 * Math.atan(Math.exp(d2r * p.y / originShift))) - Math.PI / 2.0);
        return {lat: lat, lng: p.x / originShift};
    }

    function getVectorIntersection(v1, v2) {
        // http://paulbourke.net/geometry/pointlineplane/
        var denominator =
            (v2.y2 - v2.y1) * (v1.x2 - v1.x1) -
            (v2.x2 - v2.x1) * (v1.y2 - v1.y1);

        if (denominator == 0)
            return false;  // Lines are parallel or coincident

        var aNumerator =
                (v2.x2 - v2.x1) * (v1.y1 - v2.y1) -
                (v2.y2 - v2.y1) * (v1.x1 - v2.x1),
            bNumerator =
                (v1.x2 - v1.x1) * (v1.y1 - v2.y1) -
                (v1.y2 - v1.y1) * (v1.x1 - v2.x1),
            ua = aNumerator / denominator,
            ub = bNumerator / denominator;

        if (ua < 0 || ub < 0) {
            return false;  // Vectors do not intersect
        }
        return {
            x: v1.x1 + (ua * (v1.x2 - v1.x1)),
            y: v1.y1 + (ua * (v1.y2 - v1.y1))
        }
    }

}

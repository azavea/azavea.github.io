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
                latLng = {lat: intersection.y, lng: intersection.x}
            }
            return intersection;
        });
        return latLng;
    };

    var DEGREES_TO_RADIANS = Math.PI / 180;

    this._getIntersection = function (newRay, myRayHeading) {
        var p1 = this,
            h1 = myRayHeading,
            p2 = newRay.streetPoint,
            h2 = newRay.heading,
            v1 = makeLine(p1, h1),
            v2 = makeLine(p2, h2);

        return getVectorIntersection(v1, v2);

        function makeLine(p, h) {
            h = h * DEGREES_TO_RADIANS;
            return {
                x1: p.lng,
                y1: p.lat,
                x2: p.lng + Math.sin(h),
                y2: p.lat + Math.cos(h)
            }
        }
    };

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

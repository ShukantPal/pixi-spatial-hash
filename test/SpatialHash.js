/* eslint-disable func-names */

const { Graphics } = require('@pixi/graphics');
const { SpatialHash } = require('../');
const { Rectangle } = require('@pixi/math');
const expect = require('chai').expect;

describe('SpatialHash', function ()
{
    it('should find all the intersecting display-objects in the spatial hash', function ()
    {
        const hash2D = new SpatialHash(100);

        const container0 = new Graphics().drawRect(51, 51, 48, 48);
        const container1 = new Graphics().drawRect(100, 110, 99, 99);
        const container2 = new Graphics().drawRect(200, -10, 99, 99);
        const container3 = new Graphics().drawRect(-100, 0, 99, 99);

        hash2D.put(container0)
            .put(container1)
            .put(container2)
            .put(container3);

        expect(hash2D.buckets.size).to.equal(6);

        const containers = hash2D.search(new Rectangle(-50, -50, 100, 100));

        expect(containers.has(container0)).to.equal(false);
        expect(containers.has(container1)).to.equal(false);
        expect(containers.has(container2)).to.equal(false);
        expect(containers.has(container3)).to.equal(true);
    });
});

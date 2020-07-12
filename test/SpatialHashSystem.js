/* eslint-disable func-names */

const { Container } = require('@pixi/display');
const { Renderer } = require('@pixi/core');
const { SpatialHashSystem } = require('../');
const { Graphics } = require('@pixi/graphics');
const { expect } = require('chai');
const { Rectangle } = require('@pixi/math');

describe('SpatialHashSystem', function ()
{
    it('should safely install & update the spatial hash', function ()
    {
        const renderer = new Renderer();
        const stage = new Container();

        stage.addChild(new Graphics().drawRect(0, 0, 99, 99));
        stage.addChild(new Graphics().drawRect(100, 100, 100, 100));

        SpatialHashSystem.SCENE_CELL_SIZE = 100;
        renderer.addSystem(SpatialHashSystem, 'spatialHash');

        renderer.spatialHash.updateBeforeRender = false;
        renderer.spatialHash.addTarget(stage);
        renderer.spatialHash.update();

        expect(renderer.spatialHash.search(new Rectangle(50, 50, 49, 49)).size).to.equal(2);
    });
});

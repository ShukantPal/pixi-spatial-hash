/*!
 * pixi-spatial-hash - v1.1.0
 * Compiled Sun, 12 Jul 2020 16:15:34 UTC
 *
 * pixi-spatial-hash is licensed under the MIT License.
 * http://www.opensource.org/licenses/mit-license
 */
import { Rectangle } from '@pixi/math';
import { DisplayObject } from '@pixi/display';
import { System } from '@pixi/core';

const tempRect = new Rectangle();
/**
 * 2D spatial hashing implementation that provides a mechanism to quickly searching objects intersecting
 * a rectangle.
 *
 * The spatial hash divides the world space into square "cell" or "buckets". Each display-object added is
 * tracked by which cells they intersect with.
 *
 * @memberof PIXI
 * @public
 * @see http://www.cs.ucf.edu/~jmesit/publications/scsc%202005.pdf
 */
class SpatialHash {
    /**
     * @param cellSize - the size of the 2D cells in the hash
     */
    constructor(cellSize = 256) {
        this.cellSize = cellSize;
        this.buckets = new Map();
        this.reset();
    }
    /**
     * Puts the display-object into the hash.
     *
     * @param object
     * @param bounds - the bounds of the object. This is automatically calculated using {@code getBounds}.
     */
    put(object, bounds = object.getBounds()) {
        this.hashBounds(bounds, (hash) => {
            let bucket = this.buckets.get(hash);
            if (!bucket) {
                bucket = new Set();
                this.buckets.set(hash, bucket);
            }
            bucket.add(object);
        });
        return this;
    }
    /**
     * Removes the display-object from the hash.
     *
     * @param object
     */
    remove(object) {
        this.buckets.forEach((bucket) => {
            bucket.delete(object);
        });
    }
    /**
     * Updates this spatial hash to account for any changes in the display-object's bounds. This is equivalent
     * to removing & then adding the object again.
     *
     * @param object
     * @param bounds
     */
    update(object, bounds = object.getBounds()) {
        this.remove(object);
        this.put(object, bounds);
    }
    /**
     * Searches for all the display-objects that intersect with the given rectangle bounds.
     *
     * @param bounds
     */
    search(bounds) {
        const searchResult = new Set();
        this.hashBounds(bounds, (hash) => {
            const bucket = this.buckets.get(hash);
            if (bucket) {
                bucket.forEach((object) => {
                    const objectBounds = object.getBounds(false, tempRect);
                    const intersects = objectBounds.right >= bounds.left
                        && objectBounds.left <= bounds.right
                        && objectBounds.bottom >= bounds.top
                        && objectBounds.top <= bounds.bottom;
                    if (intersects) {
                        searchResult.add(object);
                    }
                });
            }
        });
        return searchResult;
    }
    /**
     * Reset and clear the spatial hash.
     */
    reset() {
        this.buckets.forEach((value, key) => {
            this.buckets.set(key, new Set());
        });
    }
    hashPoint(x, y) {
        return `${Math.floor(x / this.cellSize)}|${Math.floor(y / this.cellSize)}`;
    }
    hashBounds(bounds, callback) {
        const { cellSize } = this;
        const sizeInv = 1 / cellSize;
        const minX = Math.floor(bounds.left * sizeInv) * cellSize;
        const minY = Math.floor(bounds.top * sizeInv) * cellSize;
        const maxX = Math.floor(bounds.right * sizeInv) * cellSize;
        const maxY = Math.floor(bounds.bottom * sizeInv) * cellSize;
        for (let y = maxY; y >= minY; y -= cellSize) {
            for (let x = maxX; x >= minX; x -= cellSize) {
                callback(this.hashPoint(x, y));
            }
        }
    }
}

const tempRect$1 = new Rectangle();
/**
 * System plugin to the renderer for providing spatial hashing on the whole scene graph.
 *
 * ```js
 * import { SpatialHashSystem } from "pixi-spatial-hash";
 *
 * renderer.addSystem(SpatialHashSystem, "spatialHash");
 * renderer.spatialHash.addTarget(stage);
 * ```
 *
 * This system provides a shared spatial hash for the whole scene graph. It is designed to be updated on
 * each tick. By default, it will update itself before each render (on the {@code prerender} event). This
 * may cause redundant updates if you render multiple times each tick; in that case, you can custom set a
 * ticker using {@link SpatialHashSystem#setTicker}.
 *
 * ```js
 * renderer.spatialHash.setTicker(Ticker.shared);
 * ```
 *
 * You must register the "stage" as a hash-target in order to add it to the hash.
 *
 * @memberof PIXI.system
 * @public
 */
class SpatialHashSystem extends System {
    constructor(renderer) {
        super(renderer);
        /**
         * Updates the spatial-hash for the whole scene graph.
         *
         * If {@code updateBeforeRender} is enabled, this will be invoked on each render call.
         *
         * @override
         */
        this.update = () => {
            const hashTargets = this.hashTargets;
            this.hash2D.reset();
            hashTargets.forEach((target) => {
                // TODO: PixiJS should guarantee this before the "prerender" event
                if (!this.skipBoundsUpdate) {
                    // Updates the bounds of the target
                    target.getBounds(false, tempRect$1);
                }
                this.updateRecursive(target);
            });
        };
        /**
         * The spatial-hash object used by this system.
         */
        this.hash2D = new SpatialHash(SpatialHashSystem.SCENE_CELL_SIZE);
        /**
         * The display-object which are updated in the spatial hash on each frame, including all their direct and
         * indirect children.
         */
        this.hashTargets = new Set();
        /**
         * Whether to update the spatial hash on the prerender event. You should turn this off if invoke {@code render}
         * multiple times on each tick.
         */
        this.updateBeforeRender = true;
        /**
         * The ticker on which the spatial hash is being updated.
         */
        this.updateTicker = null;
        /**
         * Whether the bounds should be recalculated whenever {@code update} is invoked.
         *
         * You should turn it off if you can guarantee the bounds are correct when calling {@code update}. This
         * can be done by adding a high-priority bounds-updating callback on the ticker before the spatial-hash
         * update callback.
         */
        this.skipBoundsUpdate = false;
    }
    /**
     * Adds the display-object to the hash-targets list. It will be updated in the spatial-hash on each tick.
     *
     * @param displayObject
     */
    addTarget(displayObject) {
        this.hashTargets.add(displayObject);
        return this;
    }
    /**
     * Removes the display-object from the hash-targets list.
     *
     * @param displayObject
     */
    removeTarget(displayObject) {
        this.hashTargets.delete(displayObject);
        return this;
    }
    /**
     * Searches for display-objects in the hash that intersect with the given rectangle bounds or
     * that of the display-object passed.
     *
     * @param objectOrBounds - display-object or a rectangle
     */
    search(objectOrBounds) {
        const bounds = objectOrBounds;
        if (objectOrBounds instanceof DisplayObject || objectOrBounds.getBounds) {
            objectOrBounds = objectOrBounds.getBounds();
        }
        return this.hash2D.search(bounds);
    }
    /**
     * Prerender event handler. This will invoke {@code update} if {@code updateBeforeRender} is enabled.
     */
    prerender() {
        if (this.updateBeforeRender) {
            this.update();
        }
    }
    /**
     * Sets the ticker on which the spatial hash is updated.
     *
     * If a ticker was already set, then the update callback is safely removed. If you want to turn off updating
     * on each tick, then you can pass null as the ticker.
     *
     * {@code updateBeforeRender} is automatically disable when setting the ticker to a non-null value.
     */
    setTicker(ticker) {
        if (this.updateTicker) {
            this.updateTicker.remove(this.update);
        }
        this.updateTicker = ticker;
        if (this.updateTicker) {
            this.updateBeforeRender = false;
            this.updateTicker.add(this.update);
        }
        return this;
    }
    /**
     * Puts the display-object and its subtree into the spatial hash.
     *
     * @param displayObject
     */
    updateRecursive(displayObject) {
        this.hash2D.put(displayObject, displayObject.getBounds(true, tempRect$1));
        const children = displayObject.children;
        if (!children || !children.length) {
            return;
        }
        for (let i = 0, j = children.length; i < j; i++) {
            this.updateRecursive(children[i]);
        }
    }
}
/**
 * The 2D hashing cell size for the spatial-hash system. This must be set before the renderer is
 * created (or the spatial-hash system is added to the renderer).
 */
SpatialHashSystem.SCENE_CELL_SIZE = 256;

export { SpatialHash, SpatialHashSystem };
//# sourceMappingURL=pixi-spatial-hash.mjs.map

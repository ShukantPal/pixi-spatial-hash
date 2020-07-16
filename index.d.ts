import { DisplayObject } from '@pixi/display';
import { Rectangle } from '@pixi/math';
import { Renderer } from '@pixi/core';
import { System } from '@pixi/core';
import { Ticker } from '@pixi/ticker';

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
export declare class SpatialHash<Node extends {
    getBounds(skipUpdate?: boolean, rect?: boolean): Rectangle;
}> {
    cellSize: number;
    buckets: Map<string, Set<Node>>;
    /**
     * @param cellSize - the size of the 2D cells in the hash
     */
    constructor(cellSize?: number);
    /**
     * Puts the display-object into the hash.
     *
     * @param object
     * @param bounds - the bounds of the object. This is automatically calculated using {@code getBounds}.
     */
    put(object: Node, bounds?: any): this;
    /**
     * Removes the display-object from the hash.
     *
     * @param object
     */
    remove(object: Node): void;
    /**
     * Updates this spatial hash to account for any changes in the display-object's bounds. This is equivalent
     * to removing & then adding the object again.
     *
     * @param object
     * @param bounds
     */
    update(object: Node, bounds?: any): void;
    /**
     * Searches for all the display-objects that intersect with the given rectangle bounds.
     *
     * @param bounds
     */
    search(bounds: Rectangle): Set<Node>;
    /**
     * Reset and clear the spatial hash.
     */
    reset(): void;
    private hashPoint;
    private hashBounds;
}

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
export declare class SpatialHashSystem extends System {
    hash2D: SpatialHash<DisplayObject>;
    hashTargets: Set<DisplayObject>;
    updateBeforeRender: boolean;
    updateTicker: Ticker;
    skipBoundsUpdate: boolean;
    constructor(renderer: Renderer);
    /**
     * Adds the display-object to the hash-targets list. It will be updated in the spatial-hash on each tick.
     *
     * @param displayObject
     */
    addTarget(displayObject: DisplayObject): this;
    /**
     * Removes the display-object from the hash-targets list.
     *
     * @param displayObject
     */
    removeTarget(displayObject: DisplayObject): this;
    /**
     * Searches for display-objects in the hash that intersect with the given rectangle bounds or
     * that of the display-object passed.
     *
     * @param objectOrBounds - display-object or a rectangle
     */
    search(objectOrBounds: Rectangle | DisplayObject): Set<DisplayObject>;
    /**
     * Prerender event handler. This will invoke {@code update} if {@code updateBeforeRender} is enabled.
     */
    prerender(): void;
    /**
     * Sets the ticker on which the spatial hash is updated.
     *
     * If a ticker was already set, then the update callback is safely removed. If you want to turn off updating
     * on each tick, then you can pass null as the ticker.
     *
     * {@code updateBeforeRender} is automatically disable when setting the ticker to a non-null value.
     */
    setTicker(ticker: Ticker): this;
    /**
     * Updates the spatial-hash for the whole scene graph.
     *
     * If {@code updateBeforeRender} is enabled, this will be invoked on each render call.
     *
     * @override
     */
    update: () => void;
    /**
     * Puts the display-object and its subtree into the spatial hash.
     *
     * @param displayObject
     */
    protected updateRecursive(displayObject: DisplayObject): void;
    /**
     * The 2D hashing cell size for the spatial-hash system. This must be set before the renderer is
     * created (or the spatial-hash system is added to the renderer).
     */
    static SCENE_CELL_SIZE: number;
}

export { }

import { DisplayObject } from '@pixi/display';
import { SpatialHash } from './SpatialHash';
import { Renderer, System } from '@pixi/core';
import { Rectangle } from '@pixi/math';
import { Ticker } from '@pixi/ticker';

const tempRect = new Rectangle();

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
export class SpatialHashSystem extends System
{
    public hash2D: SpatialHash<DisplayObject>;
    public hashTargets: Set<DisplayObject>;

    public updateBeforeRender: boolean;
    public updateTicker: Ticker;
    public skipBoundsUpdate: boolean;

    constructor(renderer: Renderer)
    {
        super(renderer);

        /**
         * The spatial-hash object used by this system.
         */
        this.hash2D = new SpatialHash<DisplayObject>(SpatialHashSystem.SCENE_CELL_SIZE);

        /**
         * The display-object which are updated in the spatial hash on each frame, including all their direct and
         * indirect children.
         */
        this.hashTargets = new Set<DisplayObject>();

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
    addTarget(displayObject: DisplayObject): this
    {
        this.hashTargets.add(displayObject);

        return this;
    }

    /**
     * Removes the display-object from the hash-targets list.
     *
     * @param displayObject
     */
    removeTarget(displayObject: DisplayObject): this
    {
        this.hashTargets.delete(displayObject);

        return this;
    }

    /**
     * Searches for display-objects in the hash that intersect with the given rectangle bounds or
     * that of the display-object passed.
     *
     * @param objectOrBounds - display-object or a rectangle
     */
    search(objectOrBounds: Rectangle | DisplayObject): Set<DisplayObject>
    {
        const bounds = objectOrBounds;

        if (objectOrBounds instanceof DisplayObject || objectOrBounds.getBounds)
        {
            objectOrBounds = objectOrBounds.getBounds();
        }

        return this.hash2D.search(bounds);
    }

    /**
     * Prerender event handler. This will invoke {@code update} if {@code updateBeforeRender} is enabled.
     */
    prerender(): void
    {
        if (this.updateBeforeRender)
        {
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
    setTicker(ticker: Ticker): this
    {
        if (this.updateTicker)
        {
            this.updateTicker.remove(this.update);
        }

        this.updateTicker = ticker;

        if (this.updateTicker)
        {
            this.updateBeforeRender = false;
            this.updateTicker.add(this.update);
        }

        return this;
    }

    /**
     * Updates the spatial-hash for the whole scene graph.
     *
     * If {@code updateBeforeRender} is enabled, this will be invoked on each render call.
     *
     * @override
     */
    update = (): void =>
    {
        const hashTargets = this.hashTargets;

        this.hash2D.reset();

        hashTargets.forEach((target) =>
        {
            // TODO: PixiJS should guarantee this before the "prerender" event
            if (!this.skipBoundsUpdate)
            {
                // Updates the bounds of the target
                target.getBounds(false, tempRect);
            }

            this.updateRecursive(target);
        });
    };

    /**
     * Puts the display-object and its subtree into the spatial hash.
     *
     * @param displayObject
     */
    protected updateRecursive(displayObject: DisplayObject): void
    {
        this.hash2D.put(displayObject, displayObject.getBounds(true, tempRect));

        const children: Array<DisplayObject> = (displayObject as any).children;

        if (!children || !children.length)
        {
            return;
        }

        for (let i = 0, j = children.length; i < j; i++)
        {
            this.updateRecursive(children[i]);
        }
    }

    /**
     * The 2D hashing cell size for the spatial-hash system. This must be set before the renderer is
     * created (or the spatial-hash system is added to the renderer).
     */
    static SCENE_CELL_SIZE = 256;
}

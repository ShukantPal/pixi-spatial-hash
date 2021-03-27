import { Rectangle } from '@pixi/math';

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
export class SpatialHash<Node extends { getBounds(skipUpdate?: boolean, rect?: Rectangle): Rectangle }>
{
    cellSize: number;
    buckets: Map<string, Set<Node>>;

    /**
     * @param cellSize - the size of the 2D cells in the hash
     */
    constructor(cellSize = 256)
    {
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
    put(object: Node, bounds = object.getBounds()): this
    {
        this.hashBounds(bounds, (hash) =>
        {
            let bucket = this.buckets.get(hash);

            if (!bucket)
            {
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
    remove(object: Node): void
    {
        this.buckets.forEach((bucket) =>
        {
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
    update(object: Node, bounds = object.getBounds()): void
    {
        this.remove(object);
        this.put(object, bounds);
    }

    /**
     * Searches for all the display-objects that intersect with the given rectangle bounds.
     *
     * @param bounds
     */
    search(bounds: Rectangle): Set<Node>
    {
        const searchResult = new Set<Node>();

        this.hashBounds(bounds, (hash) =>
        {
            const bucket = this.buckets.get(hash);

            if (bucket)
            {
                bucket.forEach((object) =>
                {
                    const objectBounds = object.getBounds(false, tempRect);
                    const intersects = objectBounds.right >= bounds.left
                        && objectBounds.left <= bounds.right
                        && objectBounds.bottom >= bounds.top
                        && objectBounds.top <= bounds.bottom;

                    if (intersects)
                    {
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
    reset(): void
    {
        this.buckets.forEach((value, key) =>
        {
            this.buckets.set(key, new Set());
        });
    }

    private hashPoint(x: number, y: number): string
    {
        return `${Math.floor(x / this.cellSize)}|${Math.floor(y / this.cellSize)}`;
    }

    private hashBounds(bounds: Rectangle, callback: Function): void
    {
        const { cellSize } = this;
        const sizeInv = 1 / cellSize;

        const minX = Math.floor(bounds.left * sizeInv) * cellSize;
        const minY = Math.floor(bounds.top * sizeInv) * cellSize;
        const maxX = Math.floor(bounds.right * sizeInv) * cellSize;
        const maxY = Math.floor(bounds.bottom * sizeInv) * cellSize;

        for (let y = maxY; y >= minY; y -= cellSize)
        {
            for (let x = maxX; x >= minX; x -= cellSize)
            {
                callback(this.hashPoint(x, y));
            }
        }
    }
}

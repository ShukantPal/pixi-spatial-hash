import * as PIXI from "pixi.js";

/**
 * @class
 * @see http://www.cs.ucf.edu/~jmesit/publications/scsc%202005.pdf
 */
export class SpatialHash<Node> {
  cellSize: number;
  buckets: Map<string, Set<Node>>;

  constructor(cellSize: number) {
    this.cellSize = cellSize
    this.buckets = new Map()
    this.reset()
  }

  hashPoint(x: number, y: number) {
    return `${Math.floor(x / this.cellSize)}|${Math.floor(y / this.cellSize)}`
  }

  hashBounds(bounds: PIXI.Rectangle, callback: Function) {
    const { cellSize } = this
    const sizeInv = 1 / cellSize

    // x | 0 is faster than Math.floor(x)
    const minX = (bounds.left * sizeInv | 0) * cellSize
    const minY = (bounds.top * sizeInv | 0) * cellSize
    const maxX = (bounds.right * sizeInv | 0) * cellSize
    const maxY = (bounds.bottom * sizeInv | 0) * cellSize

    for (let y = maxY; y >= minY; y -= cellSize) {
      for (let x = maxX; x >= minX; x -= cellSize) {
        callback(this.hashPoint(x, y))
      }
    }
  }

  put(object: Node, bounds = object.getBounds()) {
    this.hashBounds(bounds, (hash) => {
      let bucket = this.buckets.get(hash)

      if (!bucket) {
        bucket = new Set()
        this.buckets.set(hash, bucket)
      }

      bucket.add(object)
    })
  }

  remove(object: Node) {
    this.buckets.forEach((bucket) => {
      bucket.delete(object)
    })
  }

  update(object: Node, bounds = object.getBounds()) {
    this.remove(object)
    this.put(object, bounds)
  }

  search(bounds: PIXI.Rectangle) {
    const searchResult = new Set()

    this.hashBounds(bounds, (hash) => {
      const bucket = this.buckets.get(hash)

      if (bucket) {
        for (const object of bucket) {
          searchResult.add(object)
        }
      }
    })

    return searchResult
  }

  reset() {
    this.buckets.forEach((value, key) => {
      this.buckets.set(key, new Set())
    })
  }
}

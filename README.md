# pixi-spatial-hash

This package provides an 2D spatial hash implementation. You can use the spatial-hash as standalone or as a system on
your renderer.

## Standalone usage

If you do not need to hash your entire scene graph, then using a standalone object that is infrequently updated is
ideal. This is especially true if you do not render on each tick.

```ts
import { SpatialHash } from 'pixi-spatial-hash';

const spatialHash = new SpatialHash(25);
const particleContainer = new Container();

// HINT: Setup your particle container with particles!!!

function updateSpatialHash() {
    spatialHash.reset();

    for (let i = 0; i < particleContainer.children.length; i++)
    {
        spatialHash.add(particleContainer.children[i];)
    }
}

function checkCollision() {
    updateSpatialHash();

    for (let i = 0; i < particleContainer.children.length - 1; i++)
    {
        const particle = particleContainer.children[i];
        const collidedParticles = spatialHash.search(particle.getBounds());// Set<Particle>

        if (collidedParticles.size > 0)
        {
            alert('Particles have collided!');
        }
    }
}
```

## Spatial-hash system usage

If you need a spatial hash over the whole scene graph updated each tick, then the spatial-hash system is the ideal
method:

```ts
import { SpatialHashSystem } from 'pixi-spatial-hash';
import { Application } from 'pixi.js';

const app = new Application();

document.body.appendChild(app.view);

app.renderer.addSystem(SpatialHashSystem, "spatialHash");   // Install the SpatialHashSystem
app.renderer.spatialHash.addTarget(app.stage);              // Register app.stage as a hashed-target

// Optional: Use a Ticker to update the spatial hash each frame instead. By default, the spatial hash is
// updated on each render call.
app.renderer.spatialHash.setTicker(app.ticker);

// Optional-2: Update the spatial-hash right now! You can then search for any display-objects intersecting with a display-object
// or rectangle bounds.
app.renderer.spatialHash.update();
app.renderer.search(displayObject);
```
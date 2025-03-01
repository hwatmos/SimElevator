export let axY, halfX, halfY, maxX, maxY  = null, container;

async function engine_start() {
  const app = new PIXI.Application();
  await app.init({
    autoResize: true,
    resolution: devicePixelRatio,
    backgroundColor: 0x3d3b49
  });
  document.querySelector('#frame').appendChild(app.canvas);

  window.addEventListener('resize', resize);

  return app;
}

function resize() {
  // Get the parent
  const parent = app.canvas.parentNode;
  // Resize the renderer
  app.renderer.resize(parent.clientWidth, parent.clientHeight);
  // Update screen size vars
  maxX = app.screen.width;
  maxY = app.screen.height;
  halfX = maxX/2.;
  halfY = maxY/2.;
}

export {engine_start, resize};
export let axY, halfX, halfY, maxX, maxY, isPhone = null, container;

async function engine_start() {
  maxX = 390;
  maxY = 250;
  halfX = maxX/2.;
  halfY = maxY/2.;
  isPhone =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); // Assuming screen width less than or equal to 768px is a phone
  isLandscape = window.innerHeight <= window.innerWidth;

  const app = new PIXI.Application();
  await app.init({
    autoResize: true,
    backgroundColor: 0x3d3b49,
    width: maxX,
    height: maxY
  });
  document.querySelector('#frame').appendChild(app.canvas);

  window.addEventListener('resize', resize);

  return app;
}

function resize() {
  isPhone =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); // Assuming screen width less than or equal to 768px is a phone
  const scale = Math.min(1,window.innerWidth / maxX, window.innerHeight / maxY);

  app.stage.scale.set(scale);
  // Get the parent
  const parent = app.canvas.parentNode;
  // Resize the renderer
  app.renderer.resize(document.documentElement.clientWidth, document.documentElement.clientHeight);
}

export {engine_start, resize};
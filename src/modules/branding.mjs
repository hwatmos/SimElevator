
function branding1(app, container) {
    const style = new PIXI.TextStyle({
        fontFamily: 'Courier New',
        fontSize: 24,
        fill: '#33ff00',
        lineJoin: 'round',
    });

    const richText = new PIXI.Text({text: 'My name is Kamil.\nAnd this is my homepage.', style});
    richText.x = 10;
    richText.y = 410;
    richText.interactive = true;
    richText.on('pointerdown', (event) => { console.log('clicked!'); });

    app.stage.addChild(richText);
    return;
}

export {branding1};
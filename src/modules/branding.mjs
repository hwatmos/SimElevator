// colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];

function branding1() {
    const style = new PIXI.TextStyle({
        fontFamily: 'Courier New',
        fontSize: 24,
        fill: '#33ff00',
        lineJoin: 'round',
    });

    const richText = new PIXI.Text({ text: 'My name is Kamil.\nAnd this is my homepage.', style });
    richText.x = 10;
    richText.y = 410;
    richText.interactive = true;
    richText.on('pointerdown', (event) => { console.log('clicked!'); });

    app.stage.addChild(richText);
    return;
}

export { branding1 };
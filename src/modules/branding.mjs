// colorPalette = [0xafc9ff, 0xc7d8ff, 0xfff4f3, 0xffe5cf, 0xffd9b2, 0xffffff, 0xffa651];

function branding1() {
    const brandContainer = new PIXI.Container();
    const headerStyle = new PIXI.TextStyle({
        fontFamily: 'Courier New',
        fontSize: 24,
        fill: '#33ff00',
    });

    const headerText = new PIXI.Text({ 
        text: 'My name is Kamil.\nAnd this is my homepage.', 
        style: headerStyle });
    headerText.x = 10;
    headerText.y = 410;

    brandContainer.addChild(headerText);
    
    const welcomeStyle = new PIXI.TextStyle({
        fontFamily: 'Courier New',
        fontSize: 13,
        fill: '#33ff00',
    });

    const welcomeString = 'It is not mobile-friendly (yet) so I advise using your PC to view it.\n\n' +
        'Above, is a simulation of an elevator I used to ride as a kid.\n'+
        'The little people are randomly generated.  Each one enters the game with a destination\n' +
        'in mind.  You can interact with the elevator by pressing the buttons on the console.\n' +
        'But remember, don\'t be a rascal, don\'t press them all at once ;).\n\n' +
        'Writing simulations is my hobby.  There is something fascinating about creating simulated\n' +
        'worlds.  And one doesn\'t even need AI to give simulations a little spark of life.\n' +
        'Check out my GitHub at https://github.com/hwatmos/'
    const welcomeText = new PIXI.Text({
        text: welcomeString, 
        style: welcomeStyle});
    welcomeText.x = 10;
    welcomeText.y = 470;
    
    brandContainer.addChild(welcomeText)

    app.stage.addChild(brandContainer);
    return;
}

export { branding1 };
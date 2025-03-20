import { floorZeroY, floorHeight, floorZeroX, eleWidth, } from "./params.mjs";
import { randPoisson } from "./support.mjs";
import { talk_alone, talk_with_company, talk_on_the_elevator } from "./talk_naive_dict.mjs";

class NaiveTalk {
    constructor(floor_or_elev = -1, elapsed, poisson_lambda = 1000) {
        // -1 indicates that this is elevator talk, otherwise indicates the floor on which the talk takes place
        // -1/elevator talk is not yet implemented
        // poisson_lambda is the average time between talks
        this.next_chat_time = 0;
        this.poisson_lambda = poisson_lambda;
        this.floor_or_elev = floor_or_elev;
        this.container = new PIXI.Container();
        this.talk_alone = talk_alone;
        this.talk_with_company = talk_with_company;
        this.talk_on_the_elevator = talk_on_the_elevator;
        const style_sprite_status_text = new PIXI.TextStyle({
            fontFamily: 'Courier New',
            fontSize: 9,
            fill: '#fff',
            lineJoin: 'round',
        });
        this.statusText = new PIXI.Text({text:"test",style: style_sprite_status_text});
        this.statusText.x = 25;//floorZeroX + eleWidth + 3;
        this.statusText.y = floorZeroY - floorHeight*this.floor_or_elev;
        this.container.addChild(this.statusText);
        app.stage.addChild(this.statusText);
        this.statusText.text = '';

        this.calculate_next_chat_time();
    }

    calculate_next_chat_time() {
        this.next_chat_time += randPoisson(this.poisson_lambda);

    }

    update(elapsed) {
        if (this.statusText.text == '') {
            if (elapsed >= this.next_chat_time) {
                this.statusText.text = this.generate_chat_text();
                this.next_chat_time = elapsed + 400;
                //this.statusText.visble = true;
                app.renderer.render(app.stage);
                console.log('chat ' + this.statusText.text);
            } 
        } else {
            if (elapsed >= this.next_chat_time) {
                //this.statusText.visble = false;
                this.statusText.text = '';
                this.calculate_next_chat_time();
            }
        }
    }

    generate_chat_text() {
        let cur_dict;
        let chat;
        if (this.floor_or_elev>=0) {
            if (window.spritesByFloor[this.floor_or_elev].length>1) {
                cur_dict = talk_with_company;
            } else if (window.spritesByFloor[this.floor_or_elev].length==1) {
                cur_dict = talk_alone;
            }
        } else {
            cur_dict = talk_on_the_elevator;
        }
        let max_i = cur_dict.length;
        chat = cur_dict[Math.floor(Math.random() * (max_i ))];
        return chat;
    }

}

export { NaiveTalk };
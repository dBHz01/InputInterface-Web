export default class Layout { // QWERTY layout
    posFirstLine;
    posSecondLine;
    posThirdLine;
    firstLineKeyWidth;
    firstLineKeyHeight;
    secondLineKeyWidth;
    secondLineKeyHeight;
    thirdLineKeyWidth;
    thirdLineKeyHeight;
    posx;
    posy;
    keyboardWidth;
    keyboardHeight;
    candidates;
    target;
    constructor(para) {
        this.posFirstLine = new Map();
        this.posSecondLine = new Map();
        this.posThirdLine = new Map();
        this.candidates = para.candidates;
        this.target = para.target;
        this.posx = para.posx;
        this.posy = para.posy;
        this.keyboardWidth = para.keyboardWidth;
        this.keyboardHeight = para.keyboardHeight;
        this.firstLineKeyWidth = (para.p_pos.x - para.q_pos.x) / 9;
        this.firstLineKeyHeight = 0.3;
        let line = 'qwertyuiop';
        for (let i = 0; i < line.length; i++) {
            this.posFirstLine.set(line[i], { x: para.q_pos.x + (i) * this.firstLineKeyWidth, y: 1 - para.q_pos.y });
        }
        this.secondLineKeyWidth = (para.l_pos.x - para.a_pos.x) / 8;
        this.secondLineKeyHeight = 0.4;
        line = 'asdfghjkl';
        for (let i = 0; i < line.length; i++) {
            this.posSecondLine.set(line[i], { x: para.a_pos.x + (i) * this.secondLineKeyWidth, y: 1 - para.a_pos.y });
        }
        this.thirdLineKeyWidth = (para.m_pos.x - para.z_pos.x) / 6;
        this.thirdLineKeyHeight = 0.3;
        line = 'zxcvbnm';
        for (let i = 0; i < line.length; i++) {
            this.posThirdLine.set(line[i], { x: para.z_pos.x + (i) * this.thirdLineKeyWidth, y: 1 - para.z_pos.y });
        }
    }
    render(context) {
        context.textAlign = 'center';
        context.font = 'normal bold 30px Arial,sans-serif';
        this.posFirstLine.forEach((value, key) => {
            context.strokeRect(this.posx + (value.x - this.firstLineKeyWidth / 2) * this.keyboardWidth, this.posy + (value.y - this.firstLineKeyHeight / 2) * this.keyboardHeight, this.firstLineKeyWidth * this.keyboardWidth, this.firstLineKeyHeight * this.keyboardHeight);
            context.fillText(key.toUpperCase(), this.posx + value.x * this.keyboardWidth, this.posy + value.y * this.keyboardHeight + 9);
        })
        this.posSecondLine.forEach((value, key) => {
            context.strokeRect(this.posx + (value.x - this.secondLineKeyWidth / 2) * this.keyboardWidth, this.posy + (value.y - this.secondLineKeyHeight / 2) * this.keyboardHeight, this.secondLineKeyWidth * this.keyboardWidth, this.secondLineKeyHeight * this.keyboardHeight);
            context.fillText(key.toUpperCase(), this.posx + value.x * this.keyboardWidth, this.posy + value.y * this.keyboardHeight + 9);
        })
        this.posThirdLine.forEach((value, key) => {
            context.strokeRect(this.posx + (value.x - this.thirdLineKeyWidth / 2) * this.keyboardWidth, this.posy + (value.y - this.thirdLineKeyHeight / 2) * this.keyboardHeight, this.thirdLineKeyWidth * this.keyboardWidth, this.thirdLineKeyHeight * this.keyboardHeight);
            context.fillText(key.toUpperCase(), this.posx + value.x * this.keyboardWidth, this.posy + value.y * this.keyboardHeight + 9);
        })
        context.moveTo(this.posx + 0.5 * this.keyboardWidth, 0);
        context.lineTo(this.posx + 0.5 * this.keyboardWidth, this.keyboardHeight);
        context.stroke();
        context.moveTo(0, this.posy - 0.5 * this.keyboardHeight);
        context.lineTo(this.keyboardWidth, this.posy - 0.5 * this.keyboardHeight);
        context.stroke();
        context.moveTo(0, this.posy);
        context.lineTo(this.posx + this.posFirstLine.get("q").x * this.keyboardWidth - 0.5 * this.firstLineKeyWidth * this.keyboardWidth, this.posy);
        context.stroke();
        context.moveTo(this.posx + this.posFirstLine.get("p").x * this.keyboardWidth + 0.5 * this.firstLineKeyWidth * this.keyboardWidth, this.posy);
        context.lineTo(this.keyboardWidth, this.posy);
        context.stroke();
        for (let i = 0; i < 4; i++) {
            if (this.candidates[i] == this.target && this.candidates[i] != "") {
                context.fillStyle = "#70ad47";
                context.fillRect(this.posx + (0.25 - 0.25 * Math.pow(-1, Math.floor((i + 1) / 2))) * this.keyboardWidth, this.posy - (0.75 + 0.25 * Math.pow(-1, Math.floor(i / 2))) * this.keyboardHeight, this.keyboardWidth / 2, this.keyboardHeight / 2);
            }
            context.fillStyle = "black";
            context.fillText(this.candidates[i], this.posx + (0.5 - 0.25 * Math.pow(-1, Math.floor((i + 1) / 2))) * this.keyboardWidth, this.posy - (0.5 + 0.25 * Math.pow(-1, Math.floor(i / 2))) * this.keyboardHeight + 8);
        }
        // console.log(this.posx + (this.posFirstLine.get('q').x - this.firstLineKeyWidth / 2) * this.keyboardWidth)
        // console.log(this.posy + (this.posFirstLine.get('q').y - this.firstLineKeyHeight / 2) * this.keyboardHeight)
    }
    getCenter(char) {
        if (char in this.posFirstLine) {
            return this.posFirstLine.get(char);
        } else if (char in this.posSecondLine) {
            return this.posSecondLine.get(char);
        } else {
            return this.posThirdLine.get(char);
        }
    }
}
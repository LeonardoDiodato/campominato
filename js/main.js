/* Dimensioni
Beginner 9 x 9 10 mines
Medium 16 x 16 40 mines
Expert 30 x 16 99 mines
 */
let canvas = document.getElementById("myCanvas");
let ctx = canvas.getContext("2d");
const square_size = 32;
const img_size = 32;
//const top_left_X = canvas_size - (grid_width * square_size);
//const top_left_Y = canvas_size - (grid_height * square_size);
const images = {};
const images_names = ["1", "2", "3", "4", "5", "6", "7", "8", "block", "exploded", "flag", "hold", "maybe", "mina", "vuoto", "sbagliato"];
let mousedown = false;
let click_queue = [];
const current = document.getElementById('current');
const tot = document.getElementById('tot');
const ratio = document.getElementById('ratio');
/**
 * Load images into images obj
 */
images_names.forEach((v, idx, arr) => {
    const img = new Image(); // Create new img element
    img.addEventListener(
        "load",
        () => {
            images[v] = img;
            if(Object.keys(images).length === 16){
                b.draw();
            }
        },
        false,
    );
    img.src = "imgs/"+v+".png"; // Set source path
});

function updateRatio(val){
    current.innerHTML = val;
    let found = parseInt(val);
    let tot_ = parseInt(tot.innerHTML);
    let ratio_ = Math.round((found / tot_) * 1000) / 10;
    ratio.innerHTML = ratio_+" %";
}

canvas.addEventListener("contextmenu", function(event) {
    event.preventDefault();
    let top = 0,
        left = 0,
        traverser = canvas;
    while (traverser && traverser.tagName !== 'BODY') {
        top += traverser.offsetTop;
        left += traverser.offsetLeft;
        traverser = traverser.offsetParent;
    }
    left += window.scrollX;
    top -= window.scrollY;

    let x = event.clientX - left;
    let y = (event.clientY - top);

    let cell_X = Math.floor(x / square_size);
    let cell_Y = Math.floor(y / square_size);
//    b.layout[cell_X][cell_Y].rightClick();
    b.rightClick(cell_X,cell_Y);
    render();
});
canvas.addEventListener("mousedown", function(event) {
    if(event.button === 2){return;}
    mousedown = true;
    let top = 0,
        left = 0,
        traverser = canvas;
    while (traverser && traverser.tagName !== 'BODY') {
        top += traverser.offsetTop;
        left += traverser.offsetLeft;
        traverser = traverser.offsetParent;
    }
    left += window.scrollX;
    top -= window.scrollY;

    let x = event.clientX - left;
    let y = (event.clientY - top);

    let cell_X = Math.floor(x / square_size);
    let cell_Y = Math.floor(y / square_size);
    b.mousedown(cell_X, cell_Y);
    render();
});
canvas.addEventListener("mousemove", function(event) {
    if(!mousedown){return}
    let top = 0,
        left = 0,
        traverser = canvas;
    while (traverser && traverser.tagName !== 'BODY') {
        top += traverser.offsetTop;
        left += traverser.offsetLeft;
        traverser = traverser.offsetParent;
    }
    left += window.scrollX;
    top -= window.scrollY;

    let x = event.clientX - left;
    let y = (event.clientY - top);

    let cell_X = Math.floor(x / square_size);
    let cell_Y = Math.floor(y / square_size);
    b.mousedown(cell_X, cell_Y);
});
canvas.addEventListener("mouseup", function(event) {
    if(event.button === 2){return;}
    mousedown = false;
    let top = 0,
        left = 0,
        traverser = canvas;
    while (traverser && traverser.tagName !== 'BODY') {
        top += traverser.offsetTop;
        left += traverser.offsetLeft;
        traverser = traverser.offsetParent;
    }
    left += window.scrollX;
    top -= window.scrollY;

    let x = event.clientX - left;
    let y = (event.clientY - top);

    let cell_X = Math.floor(x / square_size);
    let cell_Y = Math.floor(y / square_size);
//    console.log("mouseup on "+cell_X+" - "+cell_Y);
    b.mouseup(cell_X, cell_Y);
    if(typeof S !== "undefined"){
        S.setValue(cell_X, cell_Y, b.layout[cell_X][cell_Y].getValue(), true);
    }
});

class Tile {
    constructor(mine = false) {
        this.mine = mine;
        this.status = false;
        this.hover = false;
        this.exploded = false;
        this.flag = false;
        this.maybe = false;
        this.value = 0;
        this.explored = false;
        this.valuto = false;
        this.ratio = [];
        this.combined_ratio = 0;
        this.touches = [];
        this.missing_value = 0;
    }
    setValue(v){
        this.value = v;
    }
    getValue(){
        if(!this.status){
            return "block";
        }
        if(this.mine){
            return -1;
        }
        return this.value;
    }

    img(){
        if(this.flag){
            if(!this.status) {
                return images["flag"];
            }else{
                if(!this.mine){
                    return images["sbagliato"];
                }else{
                    return images["flag"];
                }
            }
        }
        if(!this.status){
            if(!this.hover) {
                if(this.maybe){
                    return images["maybe"];
                }
                return images["block"];
            }else{
                return images["hold"];
            }
        }else{
            if(this.mine){
                if(this.exploded){
                    return images["exploded"];
                }else{
                    return images["mina"];
                }
            }else{
                if(this.value === 0){
                    return images["vuoto"];
                }else{
                    return images["" + this.value];
                }
            }
        }

    }
    click(){
        if(this.status === true || this.flag === true){return false;}
        this.status = true;

        if(this.mine){
            this.exploded = true;
            b.youLost();
        }else {
            if (this.value === 0) {
                return true;
            }
        }
        return false;
    }

    rightClick(){
        if(!this.status){
            if(!this.flag && !this.maybe){
                this.flag = true;
                return 1;
            }
            if(this.maybe){
                this.maybe = false;
                return 0;
            }
            if(this.flag){
                this.flag = false;
                this.maybe = true;
                return -1;
            }
        }
    }

    addRatio(obj){
        if(this.ratio.length > 0){
            for(let i = 0; i < this.ratio.length; i++){
                if(this.ratio[i].from[0] === obj.from[0] && this.ratio[i].from[1] === obj.from[1]){
                    this.ratio.splice(i,1);
                }
            }
        }
        this.ratio.push(obj);
    }
}

class Board {
    layout= [];
    x = 0;
    y = 0;
    hover = [];
    found = 0;
    constructor(level = "expert"){
        switch (level){
            case "beginner":
                this.x = 9;
                this.y = 9;
                this.mines = 10;
                break;
            case "intermediate":
                this.x = 16;
                this.y = 16;
                this.mines = 40;
                break;
            default:
            case "expert":
                this.x = 30;
                this.y = 16;
                this.mines = 99;
                break;
        }
        canvas.style.width = (this.x * square_size) + "px";
        canvas.style.height = (this.y * square_size) + "px";
        canvas.setAttribute("width",(this.x * square_size) + "px");
        canvas.setAttribute("height",(this.y * square_size) + "px");
        ctx = canvas.getContext("2d");
        ctx.fillStyle = "red";
        for(let i = 0; i < this.x; i++){
            this.layout[i] = [];
            for(let j = 0; j < this.y; j++){
                this.layout[i][j] = new Tile();
            }
        }
        for(let i = 0; i < this.mines; i++){
            let x = Math.floor(Math.random() * this.x);
            let y = Math.floor(Math.random() * this.y);
            if(this.layout[x][y].mine){
                i--;
            }else{
                this.layout[x][y].mine = true;
            }
        }
        this.setTilesValues();
        current.innerHTML = "0";
        tot.innerHTML = this.mines;
        updateRatio(0);
    }

    setTilesValues(){
        for(let i = 0; i < this.x; i++){
            for(let j = 0; j < this.y; j++){
                if(this.layout[i][j].mine){continue;}
                let neighbours = 0;
                for(let k = 0; k < 9; k++) {
                    let ii = i - 1 + Math.floor(k/3);
                    let jj = j - 1 + (k % 3);
                    if(i === ii && j === jj){continue;}
                    if (this.getMine(ii, jj)) {
                        neighbours++
                    }
                }
                this.layout[i][j].setValue(neighbours);
            }
        }
    }

    getMine(i, j){
        if(i < 0 || i >= this.x || j < 0 || j >= this.y){return 0}
        return this.layout[i][j].mine;
    }

    draw(){
        for(let i = 0; i < this.x; i++){
            for(let j = 0; j < this.y; j++){
                let img = this.layout[i][j].img();
                ctx.drawImage(img, img_size*i, img_size*j);
/*
                if(this.layout[i][j].explored){
                    ctx.fillStyle = "red";
                    ctx.beginPath();
                    ctx.rect((i*img_size) + 10,(j*img_size) + 10,5,5);
                    ctx.fill();
                }
*/
                if(this.layout[i][j].valuto){
                    ctx.fillStyle = "blue";
                    ctx.beginPath();
                    ctx.rect(i*img_size,j*img_size,10,10);
                    ctx.fill();
                    this.layout[i][j].valuto = false;
                }
/*
                if(!this.layout[i][j].flag && !this.layout[i][j].status) {
                    if (this.layout[i][j].ratio.length > 0) {
                        let val = 0;
                        if(this.layout[i][j].combined_ratio !== 0) {
                            ctx.fillStyle = "red";
                            val = this.layout[i][j].combined_ratio;
                        }else{
                            ctx.fillStyle = "green";
                            val = this.layout[i][j].ratio[0].value;
                        }
                        ctx.font = "10px Arial";
                        ctx.fillText(this.layout[i][j].ratio.length+":"+val, ((i * img_size) ), ((j * img_size) + 20));
                    }
                }


                if(i === 0 || j === 0){
                    ctx.font = "10px Arial";
                    ctx.fillText(i+"_"+j, ((i * img_size) ), ((j * img_size) + 20));
                }
*/
            }
        }
    }

    mousedown(x, y){
        if(this.hover.length > 0) {
            this.layout[this.hover[0]][this.hover[1]].hover = false;
        }
        this.hover = [x, y];
        this.layout[x][y].hover = true;
    }
    mouseup(x, y){
        if(this.hover.length > 0) {
            this.layout[this.hover[0]][this.hover[1]].hover = false;
        }
        this.hover = [];
        if(this.layout[x][y].click()){
            for(let k = 0; k < 9; k++) {
                let ii = x - 1 + Math.floor(k/3);
                let jj = y - 1 + (k % 3);
                if(ii < 0 || ii >= this.x || jj < 0 || jj >= this.y){continue;}
                if(x === ii && y === jj){continue;}
                click_queue.push([ii, jj]);
            }
            workClickQueue();
        }
        this.checkWin();
        this.draw();
    }

    youLost(){
        for(let i = 0; i < this.x; i++){
            for(let j = 0; j < this.y; j++){
                if(this.layout[i][j].flag || this.layout[i][j].mine) {
                    this.layout[i][j].status = true;
                }
            }
        }
    }

    checkWin(){
        let remaining = 0;
        for(let i = 0; i < this.x; i++){
            for(let j = 0; j < this.y; j++){
                if(this.layout[i][j].status === false){
                    remaining++;
                }
            }
        }
        if(remaining === this.mines){
            for(let i = 0; i < this.x; i++){
                for(let j = 0; j < this.y; j++){
                    if(this.layout[i][j].status === false){
                        this.layout[i][j].flag = true;
                    }
                }
            }
        }
    }

    getValue(x,y){
        return this.layout[x][y].getValue();
    }

    rightClick(x,y){
        this.found += this.layout[x][y].rightClick();
        updateRatio(this.found);
    }
}

function workClickQueue(){
    if(click_queue.length > 0){
        const coords = click_queue.shift();
        const x = coords[0];
        const y = coords[1];
        if(b.layout[x][y].click()){
            for(let k = 0; k < 9; k++) {
                let ii = x - 1 + Math.floor(k/3);
                let jj = y - 1 + (k % 3);
                if(ii < 0 || ii >= b.x || jj < 0 || jj >= b.y){continue;}
                if(x === ii && y === jj){continue;}
                click_queue.push([ii, jj]);
            }
        }
        if(click_queue.length > 0) {
            return workClickQueue();
        }
    }
}

let b = new Board();

function render(timeStamp) {
    b.draw();
    if(mousedown){
        return requestAnimationFrame(render);
    }
}

function setLevel(){
    let level = document.getElementById("level").value;
    b = new Board(level);
    b.draw();
}
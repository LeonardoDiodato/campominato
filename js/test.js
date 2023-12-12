let S ={}
let queue = [];
let cycle_start = [];
let back_queue = [];

function start(){
    S = new Solver(b.x, b.y);
    tryAgain();
}

function tryAgain(){
    let loc = pickRandom();
    if(b.layout[loc[0]][loc[1]].explored){
        setTimeout(tryAgain, 10);
        return;
    }
    b.mouseup(loc[0], loc[1]);
    let val = b.layout[loc[0]][loc[1]].getValue();
//    log("click: "+loc[0]+" "+loc[1]+": "+val);
    S.setValue(loc[0],loc[1], val);
}

function log(input){
    let obj = document.getElementById('log');
    obj.innerHTML += input+"<br>";
    obj.scrollTop = obj.scrollHeight;
}

function pickRandom(){
    let x = Math.floor(Math.random() * b.x);
    let y = Math.floor(Math.random() * b.y);
    return [x, y];
}


class Solver {
    x = 0;
    y = 0;
    layout = [];

    constructor(x, y) {
        this.x = x;
        this.y = y;
        for(let i = 0; i < x; i++){
            this.layout[i] = [];
            for(let j = 0; j < y; j++){
                this.layout[i][j] = "na";
            }
        }
    }

    workQueue(){
        if(back_queue.length > 0) {
            for(let i= 0; i < back_queue.length; i++){
                queue.push(back_queue[i]);
            }
            back_queue = [];
        }
        if(queue.length > 0){
            let first = queue.splice(0,1)[0];
            let x = first[0];
            let y = first[1];
            b.layout[x][y].valuto = true;
            log("valuto "+x+" "+y+": "+S.layout[x][y]);
            ctx.beginPath();
            ctx.fillStyle = "blue";
            ctx.rect(x*img_size,y*img_size,10,10);
            ctx.fill();
            ctx.fillStyle = "red";

            if(S.layout[x][y] === (S.countBOMB(x, y))){
                S.clickAround(x,y);
                cycle_start = [];
            }else {
                if (S.layout[x][y] === (S.countNA(x, y) + S.countBOMB(x, y))) {
                    S.markSolved(x, y);
                    cycle_start = [];
                } else {
                    if(cycle_start.length === 0){
                        cycle_start.push([x, y]);
                    }else{
                        if(cycle_start[0][0] === x && cycle_start[0][1] === y){
                            log("STOP");
                            b.draw();
                            queue.push([x, y]);
                            for(let i= 0; i < queue.length; i++){
                                back_queue.push(queue[i]);
                            }
                            queue = [];
                            cycle_start = [];
                            tryAgain();
                            return;
                        }
                    }
                    queue.push([x, y]);
                }
            }
            b.draw();
            setTimeout(S.workQueue, 200);
        }
    }

    countNA(x,y){
        let count = 0;
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "na"){
                    count++;
                }
            }
        }
        return count;
    }
    countBOMB(x,y){
        let count = 0;
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "BOMB"){
                    count++;
                }
            }
        }
        return count;
    }
    markSolved(x,y){
        log("mark Solved "+x+" "+y);
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "na"){
                    this.layout[ii][jj] = "BOMB";
//                    b.layout[ii][jj].rightClick();
                    b.rightClick(ii, jj);
                }
            }
        }
        b.layout[x][y].explored = true;
    }
    clickAround(x,y){
        log("click Around "+x+" "+y);
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "na"){
                    b.mouseup(ii, jj);
                    S.layout[ii][jj] = b.layout[ii][jj].getValue();
                    queue.push([ii, jj]);
                }
            }
        }
        b.layout[x][y].explored = true;
    }

    setValue(x,y,val, exploring = false){
        log("value: "+x+" "+y+": "+val);
        if(this.layout[x][y] === "BOMB"){
            setTimeout(tryAgain, 10);
            return;
        }
        if(this.layout[x][y] !== "na"){
            if(!exploring){
                setTimeout(tryAgain, 1000);
            }
            return;
        }
//        log("value: "+x+" "+y+": "+val);
        this.layout[x][y] = val;
        if(val === -1){
            log("lost");
            const queryString = window.location.toString();
            if(queryString.indexOf('?start=true') !== -1) {
                setTimeout(() => {
                    location.href = location.href
                }, 1000)
            }else {
                setTimeout(() => {
                    location.href = location.href + "?start=true"
                }, 1000)
            }
            return;
        }
        if(val === 0){
            this.explore(x, y);
        }else {
            queue.push([x, y]);
            if(!exploring) {
//                setTimeout(tryAgain, 1000);
                setTimeout(S.workQueue, 1000);
                return;
            }
        }
        if(!exploring) {
            b.draw();
            this.workQueue();
        }
    }

    explore(x, y){
        b.layout[x][y].explored = true;
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                let val = b.getValue(ii, jj);
                if (val !== "block") {
                    this.setValue(ii, jj, val, true);
                }
            }
        }

    }
}

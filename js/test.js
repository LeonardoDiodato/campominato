//let S ={}
let queue = [];
let cycle_start = [];
let back_queue = [];
let did_exploration = false;
let guessTick = 0;
let workQueueTime = 1000;
let SOLO = false;
const queryString = window.location.toString();


function start(){
    tryAgain();
}

function tryAgain(){
    let loc = pickRandom();
    if(b.layout[loc[0]][loc[1]].explored){
        return setTimeout(tryAgain, 10);
    }
    b.mouseup(loc[0], loc[1]);
    let val = b.layout[loc[0]][loc[1]].getValue();
    if(lost(val)){
        return;
    }
    if(S.layout[loc[0]][loc[1]] === "BOMB"){
        return setTimeout(tryAgain, 10);
    }

    S.setValue(loc[0],loc[1], val);
}


function pickRandom(){
    let x = Math.floor(Math.random() * b.x);
    let y = Math.floor(Math.random() * b.y);
    return [x, y];
}

function lost(val){
    if(val === -1){
        queue = [];
        back_queue = [];
        let time = 1000;
        if(did_exploration){
            time = 10000;
        }
        clearInterval(S.timer);
        return;
        if(queryString.indexOf('?start=true') !== -1) {
            setTimeout(() => {
                location.href = location.href
            }, time);
        }else {
            setTimeout(() => {
                location.href = location.href + "?start=true"
            }, time);
        }
        return true;
    }
    return false;
}

class Solver {
    x = 0;
    y = 0;
    layout = [];
    guessMode = true;
    timer = null;

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

    safeEnqueue(x, y){
        let found = false;
        for(let i = 0; i < queue.length; i++){
            if(queue[i][0] === x && queue[i][1] === y){
                found  = true;
            }
        }
        if(!found){
            queue.unshift([x, y]);
        }
    }
    safePush(x, y){
        let found = false;
        for(let i = 0; i < queue.length; i++){
            if(queue[i][0] === x && queue[i][1] === y){
                found  = true;
            }
        }
        if(!found){
            queue.push([x, y]);
        }
    }

    workQueue(){
        if(back_queue.length > 0) {
            for(let i= 0; i < back_queue.length; i++){
                queue.push(back_queue[i]);
            }
            back_queue = [];
        }
        SOLO = queue.length === 1;
        if(queue.length > 0){
            let first = queue.shift();
            let x = first[0];
            let y = first[1];
            if(typeof b.layout[x][y].touches === "undefined"){
                b.layout[x][y].touches = [];
            }
            b.layout[x][y].valuto = true;
            console.log("valuto "+x+" "+y+": "+S.layout[x][y]);
            if(S.layout[x][y] === -1){
                console.log(queue);
                console.trace();
                return;
            }
/*
            ctx.beginPath();
            ctx.fillStyle = "blue";
            ctx.rect(x*img_size,y*img_size,10,10);
            ctx.fill();
            ctx.fillStyle = "red";
 */
            if(S.layout[x][y] < (S.countBOMB(x, y))){
                //in questa situazione ci sono più bandierine di quelle che dovrebbero esserci
                S.cleanAround(x,y);
                //TODO: requeue around numbers
//                queue.unshift([x, y]);
                S.safeEnqueue(x, y);
                b.draw();
                return;
            }

            if(S.layout[x][y] === (S.countBOMB(x, y))){
                S.clickAround(x,y);
                cycle_start = [];
            }else {
                if (S.layout[x][y] === (S.countNA(x, y) + S.countBOMB(x, y))) {
                    S.markSolved(x, y);
                    cycle_start = [];
                } else {
                    S.computeStats(x,y);
                    let missing_value = b.layout[x][y].missing_value;

                    console.log(b.layout[x][y].votanti);

                    for (let j = 0; j < b.layout[x][y].votanti.length; j++){
                        console.log("valuto votante "+j);
                        console.log(typeof b.layout[x][y].votanti[j].x);
                        console.log(b.layout[x][y].votanti[j].x);
                        console.log(typeof x);
                        console.log(x);
                        console.log(typeof b.layout[x][y].votanti[j].y);
                        console.log(b.layout[x][y].votanti[j].y);
                        console.log(typeof y);
                        console.log(y);
                        if(b.layout[x][y].votanti[j].x !== x || b.layout[x][y].votanti[j].y !== y){
                            console.log("valuto BENE votante "+j);
                            let nx = b.layout[x][y].votanti[j].x;
                            let ny = b.layout[x][y].votanti[j].y;
                            let common_points = [];
                            let punti_primo = S.countNA(x, y);
                            let punti_secondo = S.countNA(nx, ny);
                            console.log("punti primo "+punti_primo);
                            console.log("punti secondo "+punti_secondo);

                            for (let k = 0; k < b.layout[x][y].touches.length; k++) {
                                for (let l = 0; l < b.layout[nx][ny].touches.length; l++) {
                                    if (b.layout[nx][ny].touches[l][0] === b.layout[x][y].touches[k][0] && b.layout[nx][ny].touches[l][1] === b.layout[x][y].touches[k][1]) {
                                        common_points.push([b.layout[nx][ny].touches[l][0], b.layout[nx][ny].touches[l][1]]);
                                    }
                                }
                            }
                            if(b.layout[x][y].votanti[j].missing === missing_value){
//                                console.log("hanno lo stesso valore mancante "+missing_value);
/*
                                if(missing_value === 1){
                                    console.log(missing_value);
                                    console.log(j);
                                    clearInterval(S.timer);
                                    return;
                                }
 */
                                if(common_points.length === missing_value) {
                                    if(common_points.length === punti_primo) {
                                        console.log("i punti del primo sono tutti in comune");
                                        let blocks = S.getNA(nx, ny);
                                        let remaining = S.diffNA(blocks, common_points);
                                        for (let k = 0; k < remaining.length; j++) {
                                            S.cliccaPosizione(remaining[k][0], remaining[k][1]);
                                        }
                                        b.draw();
                                        return;
                                    }
                                    if (common_points.length === punti_secondo) {
                                        console.log("i punti del secondo sono tutti in comune");
                                        let blocks = S.getNA(x, y);
                                        let remaining = S.diffNA(blocks, common_points);
                                        for (let k = 0; k < remaining.length; j++) {
                                            S.cliccaPosizione(remaining[k][0], remaining[k][1]);
                                        }
                                        b.draw();
                                        return;
                                    }
                                }
                            }
                            console.log('');
                            console.log(b.layout[x][y].votanti[j]);
                            console.log(b.layout[x][y].votanti[j].value === 100);
                            if(b.layout[x][y].votanti[j].value === 100) {
                                console.log(x + ' ' + y + ' e ' + b.layout[x][y].votanti[j].x + ' ' + b.layout[x][y].votanti[j].y);
                                console.log(b.layout[x][y].votanti[j].value);
                                console.log(b.layout[x][y].missing_value);
                                console.log(b.layout[nx][ny].missing_value);

                                if (common_points.length === punti_primo) {
                                    console.log("i punti del primo sono tutti in comune");
                                    if (b.layout[x][y].missing_value === b.layout[nx][ny].missing_value) {
                                        console.log("hanno lo stesso valore mancante");
                                        if (b.layout[nx][ny].missing_value === 1) {
                                            console.log("manca 1 ad entrambi, possiamo rimuovere tutti quelli non in comune");
                                            let blocks = S.getNA(nx, ny);
                                            let remaining = S.diffNA(blocks, common_points);
                                            for (let k = 0; k < remaining.length; j++) {
                                                S.cliccaPosizione(remaining[k][0], remaining[k][1]);
                                            }
                                            b.draw();
                                        }

                                    }
                                    if (b.layout[x][y].missing_value < b.layout[nx][ny].missing_value) {
                                        S.safePush(x,y);
//                                        queue.push([x, y]);
                                        return;
                                        //se le mine mancanti del primo sono meno di quelle del secondo
                                        let diff = b.layout[nx][ny].missing_value - b.layout[x][y].missing_value;
                                        let blocks = S.getNA(nx, ny);
                                        let remaining = S.diffNA(blocks, common_points);
                                        if (remaining.length === diff) {
                                            for (let j = 0; j < remaining.length; j++) {
                                                S.layout[remaining[j][0]][remaining[j][1]] = "BOMB";
                                                b.rightClick(remaining[j][0], remaining[j][1]);
                                            }
                                            b.draw();
                                            console.log("AET");
                                            return;
                                        }
                                    }
                                }
                                if (common_points.length === punti_secondo) {
                                    console.log("i punti del secondo sono tutti in comune");
                                    if (b.layout[x][y].missing_value === b.layout[nx][ny].missing_value) {
                                        console.log("hanno lo stesso valore mancante");
                                        if (b.layout[nx][ny].missing_value === 1) {
                                            console.log("manca 1 ad entrambi, possiamo rimuovere tutti quelli non in comune");
                                            let blocks = S.getNA(x, y);
                                            let remaining = S.diffNA(blocks, common_points);
                                            for (let k = 0; k < remaining.length; j++) {
                                                S.cliccaPosizione(remaining[k][0], remaining[k][1]);
                                            }
                                            b.draw();
                                        }

                                    }
                                }
                            }

                        }
                    }

                    if(S.guessMode) {
                        let did_something = false;

                        if (b.layout[x][y].lowest < 50) {
                            cycle_start = [];
                            b.mouseup(b.layout[x][y].lowest_x, b.layout[x][y].lowest_y);
                            let val = b.layout[b.layout[x][y].lowest_x][b.layout[x][y].lowest_y].getValue();
                            console.log("GUESS click: " + b.layout[x][y].lowest + " " + b.layout[x][y].lowest_x + " " + b.layout[x][y].lowest_y + ": " + val);
                            S.setValue(b.layout[x][y].lowest_x, b.layout[x][y].lowest_y, val, true);
                            if (lost(val)) {
                                return;
                            }
//                            queue.unshift([b.layout[x][y].lowest_x, b.layout[x][y].lowest_y]);
                            S.safeEnqueue(b.layout[x][y].lowest_x, b.layout[x][y].lowest_y);
                            S.safePush(x,y);
//                            queue.push([x, y]);
                            b.draw();
                            S.guessMode = false;
                            console.log("GUESSING disabled");
                            did_something = true;
                        }
                        if (b.layout[x][y].highest > 50 || (b.layout[x][y].highest === 50 && b.layout[x][y].lowest === 50)) {
                            cycle_start = [];

                            S.layout[b.layout[x][y].highest_x][b.layout[x][y].highest_y] = "BOMB";
                            b.rightClick(b.layout[x][y].highest_x, b.layout[x][y].highest_y);
                            console.log("GUESS BOMB: " + b.layout[x][y].highest + " " + b.layout[x][y].highest_x + " " + b.layout[x][y].highest_y);
//                            queue.push([x, y]);
                            S.safePush(x,y);
                            b.draw();
                            S.guessMode = false;
                            console.log("GUESSING disabled");
                            did_something = true;
                        }

                        if(!did_something){
                            S.safePush(x,y);
//                            queue.push([x, y]);
                            return;
                        }

                    }

                    if(cycle_start.length === 0){
                        cycle_start.push([x, y]);
                    }else{
                        if(cycle_start[0][0] === x && cycle_start[0][1] === y){
                            console.log("STOP");
                            b.draw();
//                            queue.unshift([x, y]);
                            S.safeEnqueue(x, y);

                            for(let i= 0; i < queue.length; i++){
                                back_queue.push(queue[i]);
                            }
                            queue = [];
                            cycle_start = [];
                            S.guessMode = true;
                            console.log("GUESSING ENABLED");
                            b.draw();
                            return;
                        }
                    }
                    S.safePush(x,y);
//                    queue.push([x, y]);
                }
            }
            b.draw();
            if(queue.length === 1) {
                console.log("solo uno")
            }
        }else{
            console.log("work queue empty");
            if(current.innerHTML === tot.innerHTML){
                const queryString = window.location.toString();
                if(queryString.indexOf('?start=true') !== -1) {
                    setTimeout(() => {
                        location.href = location.href
                    }, 10000)
                }else {
                    setTimeout(() => {
                        location.href = location.href + "?start=true"
                    }, 10000)
                }
            }
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
    getNA(x,y){
        let NAs = [];
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "na"){
                    NAs.push([ii, jj]);
                }
            }
        }
        return NAs;
    }
    /**
     * differenza tra due liste, rimuove dalla prima quelli della seconda
     * */
    diffNA(list1, list2){
        let ret = [];
        for(let i = 0; i < list1.length; i++) {
            ret.push(list1[i]);
        }
        for(let i = 0; i < list2.length; i++) {
            for(let j = 0; j < ret.length; j++) {
                if(ret[j][0] === list2[i][0] && ret[j][1] === list2[i][1]){
                    ret.splice(j, 1);
                }
            }
        }
        return ret;
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
//        console.log("mark Solved "+x+" "+y);
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
    cliccaPosizione(x, y){
        b.mouseup(x, y);
        let val = b.layout[x][y].getValue();
        S.layout[x][y] = b.layout[x][y].getValue();
        if(lost(val)){
            return;
        }
    }

    clickAround(x,y){
//        console.log("click Around "+x+" "+y);
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "na"){
                    S.cliccaPosizione(ii, jj);
//                    queue.unshift([ii, jj]);
                    S.safeEnqueue(ii, jj);
                }
            }
        }
        b.layout[x][y].explored = true;
    }
    cleanAround(x,y){
//        console.log("CLEAN Around "+x+" "+y);
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "BOMB"){
                    b.rightClick(ii, jj);
                    b.rightClick(ii, jj);
                    this.layout[ii][jj] = "na"
                }
            }
        }
    }
    computeStats(x,y){
//        console.log("COMPUTE "+x+" "+y);
        let availables = 0;
        let found = 0;
        let val = parseInt(S.layout[x][y]);
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < S.x && jj >= 0 && jj < S.y) {
                if(this.layout[ii][jj] === "na"){
                    availables++;
                }
                if(this.layout[ii][jj] === "BOMB"){
                    found++;
                }
            }
        }
        let missing = val - found;
        let ratio = Math.round((missing / availables) * 1000) / 10;
/*
        console.log('');

        console.trace();
        console.log(val);
        console.log(found);
        console.log(missing);
        console.log(ratio);
        console.log('');
*/
        let ratio_obj = {from:[x,y], value: ratio}
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "na"){
                    b.layout[ii][jj].addRatio(ratio_obj);
                }
            }
        }

        b.layout[x][y].lowest = 999;
        b.layout[x][y].lowest_x = b.layout[x][y].lowest;
        b.layout[x][y].lowest_y = b.layout[x][y].lowest;
        b.layout[x][y].highest = 0;
        b.layout[x][y].highest_x = b.layout[x][y].highest;
        b.layout[x][y].highest_y = b.layout[x][y].highest;
        b.layout[x][y].votanti = [];
        let missing_value = S.layout[x][y];
        //calcolo probabilità e vicini
        for(let k = 0; k < 9; k++) {
            let p = 100;
            let ii = x - 1 + Math.floor(k / 3);
            let jj = y - 1 + (k % 3);
            if (x === ii && y === jj) {
                continue;
            }
            if (ii >= 0 && ii < S.x && jj >= 0 && jj < S.y) {
                if(S.layout[ii][jj] === "na") {
                    let good = true;

                    console.log("calcolo probabilità per: " + ii + " " + jj);

                    //calcoliamo la probabilità congiunta
                    if (b.layout[ii][jj].ratio.length > 1) {
                        let num_voti = b.layout[ii][jj].ratio.length;
                        let sum = 0;
                        for (let i = 0; i < b.layout[ii][jj].ratio.length; i++) {
                            let r = b.layout[ii][jj].ratio[i].value
                            let chi = b.layout[ii][jj].ratio[i].from[0]+"_"+b.layout[ii][jj].ratio[i].from[1];
                            let f = false;
                            for (let j = 0; j < b.layout[x][y].votanti.length; j++){
                                if(b.layout[x][y].votanti[j].chi === chi){
                                    f = true;
                                    b.layout[x][y].votanti[j].value += r;
                                }
                            }
                            if(!f){
                                b.layout[x][y].votanti.push({chi:chi, value:r, x:b.layout[ii][jj].ratio[i].from[0], y:b.layout[ii][jj].ratio[i].from[1], missing:b.layout[b.layout[ii][jj].ratio[i].from[0]][b.layout[ii][jj].ratio[i].from[1]].missing_value});
                            }
//                                        console.log(chi);
                            if(r >= 50){
                                good = false;
                            }
                            sum += r;
                        }
                        p = sum / num_voti;
                        b.layout[ii][jj].combined_ratio = p;
                    } else {
                        //                                   console.log("singolo input");
                        p = b.layout[ii][jj].ratio[0].value;
                    }
//                                console.log(p);
                    if (good && p < b.layout[x][y].lowest) {
                        b.layout[x][y].lowest = p;
                        b.layout[x][y].lowest_x = ii;
                        b.layout[x][y].lowest_y = jj;
                    }
                    if(p > b.layout[x][y].highest){
                        b.layout[x][y].highest = p;
                        b.layout[x][y].highest_x = ii;
                        b.layout[x][y].highest_y = jj;
                    }

                    let r = false;
                    for(let i = 0; i < b.layout[x][y].touches.length; i++){
                        if(b.layout[x][y].touches[i][0] === ii && b.layout[x][y].touches[i][1] === jj){
                            r = true;
                        }
                    }
                    if(!r) {
                        b.layout[x][y].touches.push([ii, jj]);
                    }

                }else{
                    if(S.layout[ii][jj] === "BOMB"){
                        missing_value--;
                    }
                }
            }
        }
        b.layout[x][y].missing_value = missing_value;

    }

    setValue(x,y,val, exploring = false){
//        console.log("value: "+x+" "+y+": "+val);
/*
        if(this.layout[x][y] === "BOMB"){
            console.trace();
            return;
            setTimeout(tryAgain, 10);
            return;
        }
 */
        if(this.layout[x][y] !== "na"){
            if(!exploring){
                return setTimeout(tryAgain, 1000);
            }
            return;
        }
//        console.log("value: "+x+" "+y+": "+val);
        this.layout[x][y] = val;
        if(lost(val)){
            return;
        }
        if(val === 0){
            this.explore(x, y);
        }else {
            S.safePush(x,y);
//            queue.push([x, y]);
        }
        if(!exploring) {
            b.draw();
            S.timer = setInterval(S.workQueue, workQueueTime);
        }
    }

    explore(x, y){
        cycle_start = [];
        S.guessMode = false;
        did_exploration = true;
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

let S = null;

if(typeof b !== "undefined"){
    S = new Solver(b.x, b.y);
}else{
    setTimeout(() => {
        S = new Solver(b.x, b.y);
    }, 1000)
}

let S ={}
let queue = [];
let cycle_start = [];
let back_queue = [];
let did_exploration = false;
let guessTick = 0;

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
    log("click: "+loc[0]+" "+loc[1]+": "+val);
    if(lost(val)){
        return;
    }
    if(S.layout[loc[0]][loc[1]] === "BOMB"){
        setTimeout(tryAgain, 10);
        return;
    }

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

function lost(val){
    if(val === -1){
        queue = [];
        back_queue = [];
        let time = 1000;
        if(did_exploration){
            time = 10000;
        }
        log("lost");
        const queryString = window.location.toString();
        if(queryString.indexOf('?start=true') !== -1) {
            setTimeout(() => {
                location.href = location.href
            }, time)
        }else {
            setTimeout(() => {
                location.href = location.href + "?start=true"
            }, time)
        }
        return true;
    }
    return false;
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
            let first = queue.shift();
            let x = first[0];
            let y = first[1];
            b.layout[x][y].valuto = true;
//            log("valuto "+x+" "+y+": "+S.layout[x][y]);
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
                queue.unshift([x, y]);
                b.draw();
                setTimeout(S.workQueue, 200);
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
                    let lowest = 999;
                    let lowest_x = lowest;
                    let lowest_y = lowest;

                    for(let k = 0; k < 9; k++) {
                        let p = 100;
                        let ii = x - 1 + Math.floor(k / 3);
                        let jj = y - 1 + (k % 3);
                        if (x === ii && y === jj) {
                            continue;
                        }
                        if (ii >= 0 && ii < S.x && jj >= 0 && jj < S.y) {
                            if(S.layout[ii][jj] === "na") {

                                log("calcolo probabilità per: " + ii + " " + jj);
                                ctx.fillStyle = "red";
                                ctx.beginPath();
                                ctx.rect((ii * img_size) + 10, (jj * img_size) + 10, 5, 5);
                                ctx.fill();


                                //calcoliamo la probabilità congiunta
                                if (b.layout[ii][jj].ratio.length > 1) {
                                    let num_voti = b.layout[ii][jj].ratio.length;
                                    let sum = 0;
                                    let prod = 0;
                                    for (let i = 0; i < b.layout[ii][jj].ratio.length; i++) {
                                        let r = b.layout[ii][jj].ratio[i].value / 100;
                                        sum += r;
                                        if (prod === 0) {
                                            prod = r;
                                        } else {
                                            prod *= r;
                                        }
                                    }
                                    //                            console.log(ii);
                                    //                            console.log(jj);
                                    let c = sum - prod;
                                    c *= 100;
                                    c = Math.round(c);
                                    b.layout[ii][jj].combined_ratio = c;
                                    p = c;
                                } else {
                                    log("singolo input");
                                    p = b.layout[ii][jj].ratio[0].value;
                                }
                                if (p < lowest) {
                                    lowest = p;
                                    lowest_x = ii;
                                    lowest_y = jj;
                                }
                            }
                        }
                    }

                    if(lowest < 50){
                        b.mouseup(lowest_x, lowest_y);
                        let val = b.layout[lowest_x][lowest_y].getValue();
                        log("click: "+lowest_x+" "+lowest_y+": "+val);
                        if(lost(val)){
                            return;
                        }
                        queue.unshift([lowest_x, lowest_y]);
                        queue.push([x, y]);
                        b.draw();
                        setTimeout(S.workQueue, 1000);
                        return;
                    }

                    if(cycle_start.length === 0){
                        cycle_start.push([x, y]);
                    }else{
                        if(cycle_start[0][0] === x && cycle_start[0][1] === y){
                            log("STOP");
                            b.draw();
                            queue.unshift([x, y]);
                            for(let i= 0; i < queue.length; i++){
                                back_queue.push(queue[i]);
                            }
                            queue = [];
                            cycle_start = [];
                            if(!did_exploration){
                                tryAgain();
                            }else{
                                S.goGuess();
                            }
                            return;
                        }
                    }
                    queue.push([x, y]);
                }
            }
            b.draw();
            setTimeout(S.workQueue, 1000);
        }else{
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
//        log("mark Solved "+x+" "+y);
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
//        log("click Around "+x+" "+y);
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
                if(this.layout[ii][jj] === "na"){
                    b.mouseup(ii, jj);
                    let val = b.layout[ii][jj].getValue();
                    S.layout[ii][jj] = b.layout[ii][jj].getValue();
                    if(lost(val)){
                        return;
                    }

                    queue.unshift([ii, jj]);
                }
            }
        }
        b.layout[x][y].explored = true;
    }
    cleanAround(x,y){
        log("CLEAN Around "+x+" "+y);
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
//        log("COMPUTE "+x+" "+y);
        let availables = 0;
        let found = 0;
        let val = parseInt(this.layout[x][y]);
        for(let k = 0; k < 9; k++) {
            let ii = x - 1 + Math.floor(k/3);
            let jj = y - 1 + (k % 3);
            if(x === ii && y === jj){continue;}
            if(ii >= 0 && ii < this.x && jj >= 0 && jj < this.y) {
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
    }

    goGuess(){
        return;
        guessTick++;
        if(guessTick > 50){
            log("maxGuess limit");
            guessTick = 0;
            setTimeout(tryAgain, 10);
            return;
        }
        if(back_queue.length > 0) {
            for(let i= 0; i < back_queue.length; i++){
                b.layout[back_queue[i][0]][back_queue[i][1]].touches = [];
                queue.push(back_queue[i]);
            }
            back_queue = [];
        }
        if(queue.length > 0){
//            let first = queue.splice(0,1)[0];
            let first = queue.shift();
            let x = first[0];
            let y = first[1];
            if(S.countNA(x, y) === 8){//in questo caso è un numero isolato nel nulla
                queue.push([x, y]);
                S.goGuess();
                return;
            }
//            log("Computing Probs for: "+x+" "+y+" - "+S.layout[x][y]);
            if(cycle_start.length === 0) {
                cycle_start.push([x, y]);
            }else{
                if(cycle_start[0][0] === x && cycle_start[0][1] === y) {
                    log("done Computed Probs - "+guessTick);
                    b.draw();
                    queue.unshift([x, y]);
                    for(let i= 0; i < queue.length; i++){
                        back_queue.push(queue[i]);
                    }
                    queue = [];
                    cycle_start = [];

                    b.draw();
                    setTimeout(S.workQueue, 2000);
//                    console.log("AET");
                    return;
                }
            }
            b.layout[x][y].valuto = true;
//            log("valuto "+x+" "+y+": "+S.layout[x][y]);
            ctx.beginPath();
            ctx.fillStyle = "blue";
            ctx.rect(x*img_size,y*img_size,10,10);
            ctx.fill();
            ctx.fillStyle = "red";

            let count = 0;
            let neighbour_numbers = [];
            let missing_value = S.layout[x][y];
            for(let k = 0; k < 9; k++) {
                let ii = x - 1 + Math.floor(k/3);
                let jj = y - 1 + (k % 3);
                if(x === ii && y === jj){continue;}
                if(ii >= 0 && ii < S.x && jj >= 0 && jj < S.y) {
                    if(S.layout[ii][jj] === "na"){
/*
                        log("calcolo probabilità per: "+ii+" "+jj);
                        //calcoliamo la probabilità congiunta
                        if(b.layout[ii][jj].ratio.length > 1){
                            let num_voti = b.layout[ii][jj].ratio.length;
                            let sum = 0;
                            let prod = 0;
                            for(let i = 0; i < b.layout[ii][jj].ratio.length; i++){
                                let r = b.layout[ii][jj].ratio[i].value / 100;
                                sum += r;
                                if(prod === 0){
                                    prod = r;
                                }else{
                                    prod *= r;
                                }
                            }
//                            console.log(ii);
//                            console.log(jj);
                            let c = sum - prod;
                            c *= 100;
                            c = Math.round(c);
                            b.layout[ii][jj].combined_ratio = c;
                        }else{
                            log("singolo input");
                        }
*/
//                        console.log(ii+" "+jj+": "+S.layout[ii][jj]);
//                        console.log(jj);
//                        console.log(b.layout[ii][jj].ratio)
                        let p = false;
                        for(let i = 0; i < b.layout[x][y].touches.length; i++){
                            if(b.layout[x][y].touches[i][0] === ii && b.layout[x][y].touches[i][1] === jj){
                                p = true;
                            }
                        }
                        if(!p) {
                            b.layout[x][y].touches.push([ii, jj]);
                        }
                        count++;
                    }else{
//                        console.log(ii+" "+jj+": "+S.layout[ii][jj]);
                        if(S.layout[ii][jj] === "BOMB"){
                            missing_value--;
                        }else {
                            if(S.layout[ii][jj] !== 0){
                                neighbour_numbers.push([ii, jj]);
                            }
                        }
                    }
                }
            }
            b.layout[x][y].missing_value = missing_value;
            if(neighbour_numbers.length > 0){
                for(let i = 0; i < neighbour_numbers.length;i++) {
                    let nx = neighbour_numbers[i][0];
                    let ny = neighbour_numbers[i][1];
                    if (b.layout[nx][ny].touches.length > 0) {
                        let common_points = [];
                        for(let j = 0; j < b.layout[x][y].touches.length; j++){
                            for(let k = 0; k < b.layout[nx][ny].touches.length; k++){
                                if(b.layout[nx][ny].touches[k][0] === b.layout[x][y].touches[j][0] && b.layout[nx][ny].touches[k][1] === b.layout[x][y].touches[j][1]){
                                    common_points.push([b.layout[nx][ny].touches[k][0], b.layout[nx][ny].touches[k][1]]);
                                }
                            }
                        }
                        if(common_points.length > 0) {

                            console.log("");
                            console.log("questi hanno qualcosa in comune");
                            console.log(x + " " + y + " " + S.layout[x][y] + " " + b.layout[x][y].missing_value);
                            console.log(nx + " " + ny + " " + S.layout[nx][ny] + " " + b.layout[nx][ny].missing_value);
                            console.log(b.layout[x][y].touches);
                            console.log(b.layout[nx][ny].touches);
                            console.log(common_points)
                            console.log("");

                            //se ci sono punti in comune

                            let punti_primo = S.countNA(x, y);
                            let punti_secondo = S.countNA(nx, ny);
                            if(common_points.length === punti_primo){
                                // se tutti i punti del primo sono in comune
                                console.log("primo: "+x+" "+y);
                                console.log("secondo: "+nx+" "+ny);

                                if(b.layout[x][y].missing_value < b.layout[nx][ny].missing_value){
                                    //se le mine mancanti del primo sono meno di quelle del secondo

                                    let diff = b.layout[nx][ny].missing_value - b.layout[x][y].missing_value;
                                    let blocks = S.getNA(nx, ny);
                                    let remaining = S.diffNA(blocks, common_points);
                                    console.log(blocks);
                                    console.log(remaining);
                                    console.log(diff);
                                    if(remaining.length === diff){
                                        for(let j = 0; j < remaining.length;j++){
                                            S.layout[remaining[j][0]][remaining[j][1]] = "BOMB";
                                            b.rightClick(remaining[j][0], remaining[j][1]);
                                        }
                                    }
//                                    queue.push([x, y]);

                                }
                                if(b.layout[x][y].missing_value === b.layout[nx][ny].missing_value){ //se le mine mancanti del primo uguali a quelle del secondo
                                    //rimuovi i punti del secondo non in comune
                                    let blocks = S.getNA(nx, ny);
                                    let remaining = S.diffNA(blocks, common_points);
                                    for(let j = 0; j < remaining.length;j++){
                                        b.mouseup(remaining[j][0], remaining[j][1]);
                                        let val = b.layout[remaining[j][0]][remaining[j][1]].getValue();
                                        S.layout[remaining[j][0]][remaining[j][1]] = val;
                                        queue.unshift([remaining[j][0], remaining[j][1]]);
                                        if(lost(val)){
                                            return;
                                        }
                                    }
//                                    queue.push([x, y]);

                                }
                                if(b.layout[x][y].missing_value > b.layout[nx][ny].missing_value){ //se le mine mancanti del primo sono più di quelle del secondo
//                                    console.log("caso impossibile");
//                                    return;
                                }
                            }
                            if(common_points.length === punti_secondo){
                                // se tutti i punti del secondo sono in comune
                                console.log("primo: "+x+" "+y);
                                console.log("secondo: "+nx+" "+ny);

                                if(b.layout[x][y].missing_value > b.layout[nx][ny].missing_value){
                                    //se le mine mancanti del primo sono meno di quelle del secondo

                                    let diff = b.layout[nx][ny].missing_value - b.layout[x][y].missing_value;
                                    let blocks = S.getNA(nx, ny);
                                    let remaining = S.diffNA(blocks, common_points);
                                    console.log(blocks);
                                    console.log(remaining);
                                    console.log(diff);
                                    if(remaining.length === diff){
                                        for(let j = 0; j < remaining.length;j++){
                                            S.layout[remaining[j][0]][remaining[j][1]] = "BOMB";
                                            b.rightClick(remaining[j][0], remaining[j][1]);
                                        }
                                    }
//                                    queue.push([x, y]);

                                }
                                if(b.layout[x][y].missing_value === b.layout[nx][ny].missing_value){
                                    //se le mine mancanti del primo uguali a quelle del secondo
                                    //rimuovi i punti del primo non in comune
                                    let blocks = S.getNA(x, y);
                                    let remaining = S.diffNA(blocks, common_points);
                                    for(let j = 0; j < remaining.length;j++){
                                        b.mouseup(remaining[j][0], remaining[j][1]);
                                        let val = b.layout[remaining[j][0]][remaining[j][1]].getValue();
                                        S.layout[remaining[j][0]][remaining[j][1]] = val;
                                        queue.unshift([remaining[j][0], remaining[j][1]]);
                                        if(lost(val)){
                                            return;
                                        }
                                    }
//                                    queue.push([x, y]);

                                }
                                if(b.layout[x][y].missing_value < b.layout[nx][ny].missing_value){ //se le mine mancanti del primo sono più di quelle del secondo
//                                    console.log("caso impossibile");
//                                    return;
                                }
                            }
                            if(common_points.length !== punti_primo && common_points.length !== punti_secondo) {
                                // se hanno solo alcuni punti in comune
                                if (b.layout[x][y].missing_value > b.layout[nx][ny].missing_value) {
                                    //se il valore del primo è superiore del secondo
                                    let diff = b.layout[x][y].missing_value - b.layout[nx][ny].missing_value;
                                    let blocks = S.getNA(x, y);
                                    let remaining = S.diffNA(blocks, common_points);
                                    console.log(blocks);
                                    console.log(remaining);
                                    console.log(diff);
                                    if(remaining.length === diff){
                                        for(let j = 0; j < remaining.length;j++){
                                            S.layout[remaining[j][0]][remaining[j][1]] = "BOMB";
                                            b.rightClick(remaining[j][0], remaining[j][1]);
                                        }
                                    }
//                                    queue.push([x, y]);

                                }
                                if (b.layout[x][y].missing_value < b.layout[nx][ny].missing_value) {
                                    //se il valore del primo è inferiore del secondo
                                    let diff = b.layout[nx][ny].missing_value - b.layout[x][y].missing_value;
                                    let blocks = S.getNA(nx, ny);
                                    let remaining = S.diffNA(blocks, common_points);
                                    console.log(blocks);
                                    console.log(remaining);
                                    console.log(diff);
                                    if(remaining.length === diff){
                                        for(let j = 0; j < remaining.length;j++){
                                            S.layout[remaining[j][0]][remaining[j][1]] = "BOMB";
                                            b.rightClick(remaining[j][0], remaining[j][1]);
                                        }
                                    }
//                                    queue.push([x, y]);

                                }
                                if (b.layout[x][y].missing_value === b.layout[nx][ny].missing_value) {
                                    console.log("caso indeterminato");
                                }
                            }
                        }
                    }
                }
            }
            queue.push([x, y]);
            b.draw();
            setTimeout(S.goGuess, 20);
        }

    }

    setValue(x,y,val, exploring = false){
        log("value: "+x+" "+y+": "+val);
        if(this.layout[x][y] === "BOMB"){
            console.trace();
            return;
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
        if(lost(val)){
            return;
        }
        if(val === 0){
            this.explore(x, y);
        }else {
            queue.unshift([x, y]);
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

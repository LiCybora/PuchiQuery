// Formatter
// Default formatter
let idleFormatter = (value) => value;

let generalLvDependent = (value, row, func) => { return Array.isArray(value) ? eval(value)[func(row)] : value };

let lvLimitFormatter = (value, row) => Math.min(value, parseInt(row["rarity"]) * 10);

let cardScoreFormatter = (value) => `${value}<br/><text class="blinking">${parseInt(value*1.2)}🞁</text>`;

let CTFormatter = (value) => value ? value + '秒' : '-';

let rangeFormatter = function(value) {
    return value.valueOf() === '-' || !value ? '-' :
        `<div class="bmp" id="${value}" onclick="showRange(this)">${hex2binMap(value)}</div>`;
};


let scoreFormatter = function(value) {
    return `${value}<br/><text class="blinking">${parseInt(value*1.1)}🞁</text><br/><text class="blinking">${parseInt(value * 1.2)}⏫&#xFE0E;</text>`;
};

let passiveFormatter = function(params) {
    params = JSON.parse(params);
    // update passive skill effect
    let v1 = params["value1"], v2 = params["value2"];
    let effectAmount, postStr;
    // TODO: This is not safe!
    if (v1 < 1000) {
        postStr = "個";
    } else {
        v1 = (v1 - 1000) / 10;
        postStr = "%";
    }
    if (v1 === v2 || v2 === 10000) {
        effectAmount = `${v1}`;
    } else {
        effectAmount = `${v1}~${v2}`;
    }
    return `${effectAmount + postStr} / ${(params["rate"] / 10)}%`;
};

let passiveEffectFormatter = (params) => passiveFormatter(params).split(' / ')[0];
let passiveRateFormatter = (params) => passiveFormatter(params).split(' / ')[1];

let logoFormatter = (value) => {
    let html = '';
    if (value.constructor === Array) {
        value.forEach((elem) => {
            html += cropImgByID(elem, "mini");
        });
    } else {
        html = cropImgByID(value, "mini")
    }
    return `<div class="flexer">${html}</div>`;
};

let paramsFormatter = (params) => {
    if (params.valueOf() === "-") {return "-";}
    params = JSON.parse(params);
    let text = [];
    if ("text" in params) {
        text.push(params["text"].replace('minus', '-').replace('plus', '+'));
    }
    if ("skillRandomMin" in params) {
        let curText = '';
        if (params["skillRandomMin"] === params["skillRandomMax"]) {
            curText = `${params["skillRandomMin"]}個`;
        } else {
            curText = `${params["skillRandomMin"]}~${params["skillRandomMax"]}個`;
        }
        if ("pickupType" in params && params["skillType"] === 0) {
            // random exclude center
            if (params["pickupType"] === 6 &&
                (!("skillTarget" in params) || params["skillTarget"] !== 3)) {
                curText += "(センター以外)";
            }
        }
        if ("forceBombType" in params && !('makeBombType' in params)) {
            // random bomb generate
            if ("makeWideBomb" in params && params["makeWideBomb"]) {
                curText += "大きな";
            }
            curText += bombName[params["forceBombType"]] + "ボム";
        }
        text.push(curText);
    }
    if ("skillTime" in params) {
        text.push(`${params["skillTime"]}秒`);
    }
    if ("lotteryRate" in params) {
        text.push(`${params["lotteryRate"]}%`);
    }
    if ("enableCount" in params) {
        text.push(`-${params["enableCount"]}個`);
    }
    if ("num" in params) {
        text.push(`${params["num"] + 1}種類`);
    }

    if ("makeBombType" in params) {
        if (params["makeBombType"]) {
            text.push("消去数>=11時に" + bombName[params["makeBombType"]] + "ボム出現確定");
        }
    }
    if ("forceBombNum" in params) {
        let bomb = `${ params["forceBombNum"]}個`;
        if ("forceBombType" in params) {
            bomb += bombName[params["forceBombType"]] + "ボム";
        }
        text.push(bomb);
    }
    return text.join(' / ');
};

let paramsFormatterGraphical = (params) => {
    let rst = paramsFormatter(params).split(' / ');
    let imgHolder = `<img class="logo" src="${generalImg}HOLDER.png">`;
    for (let i = bombName.length - 1; i > -1; --i) {
        rst.forEach((elem, idx, array)=> {
        let img = imgHolder.replace('HOLDER', bombName[i] + "ボム");
            if (elem.includes(`${bombName[i]}ボム`)) {
                if (elem.includes("大きな")) {
                    elem = elem.replace("大きな", '');
                    img = img.replace("logo", "logo-lg");
                }
                array[idx] = elem.replace(`${bombName[i]}ボム`, img);
            }
        });
    }
    return rst.join(' / ');
};
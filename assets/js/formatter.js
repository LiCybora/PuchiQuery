// Formatter
// Default formatter
let idleFormatter = (value) => value;

let generalLvDependent = (value, row, func) => { return Array.isArray(value) ? eval(value)[func(row)] : value };

let CTFormatter = (value) => value ? loadLocaleQuan(value + '秒') : '-';

let rangeFormatter = function(value) {
    return value.valueOf() === '-' || !value ? '-' :
        `<div class="bmp" data-bmp="${value}" onclick="showRange(this)">${hex2binMap(value)}</div>`;
};

let scoreFormatter = function(value) {
    let up = makeLogo("up", inTextlogo),
        Dup = makeLogo("Dup", inTextlogo);
    return `${value}<br/><span class="blinking">${parseInt(value*1.1)}${up}</span><br/><span class="blinking">${parseInt(value*1.2)}${Dup}</span>`;
};

let passiveFormatter = function(param, row) {
    let params = param, type = 0;
    if (Number.isInteger(param)) {
        params = JSON.parse(PLvDependent(row["rate"], row));
        // update passive skill effect
        let v1 = params["value1"], v2 = params["value2"];
        type = param;
        let effectAmount, postStr;
        if (type === 12 || type === 2 || type === 3) {
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
        let effect = loadLocaleQuan(effectAmount + postStr);
        // FIXME: unsafe hardcoded for English 個 ambiguous between puchi and bomb
        if (type === 12) {
            effect = effect.replace(' puchi', ' bomb(s)');
        }
        return `${effect}`;
    } else {
        return `${(JSON.parse(params)["rate"] / 10)}%`;
    }

};

let passiveEffectFormatter = (params, row) => passiveFormatter(params, row);
let passiveRateFormatter = (params, row) => passiveFormatter(params, row);

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

let paramsFormatter = (params, img = false) => {
    //not translate bomb name as it will shown as image
    let imgFunc = img === true ? ((v)=>v) : loadLocaleGeneral;
    let imgFuncQuan = img === true ? ((v)=>v) : loadLocaleQuan;
    if (params.valueOf() === "-") {return "-";}
    params = JSON.parse(params);
    let text = [];
    if ("text" in params) {
        let curText = params["text"].replace('minus', '-').replace('plus', '+');
        // clear exclude center
        if (params["skillType"] === 0 &&
            (!("skillTarget" in params) || params["skillTarget"] === 0)) {
            curText += ` (${loadLocaleGeneral("センター以外", "words")}`;
        }
        text.push(curText);

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
                (!("skillTarget" in params) || params["skillTarget"] === 0)) {
                curText += ` (${loadLocaleGeneral("センター以外", "words")}`;
            }
        }
        if ("forceBombType" in params && (!('makeBombType' in params)) || params["skillType"] === 2) {
            // random bomb generate
            curText = imgFuncQuan(curText);
            if ("makeWideBomb" in params && params["makeWideBomb"]) {
                curText += imgFunc("大きな", "words");
            }
            curText += imgFunc(bombName[params["forceBombType" in params ? "forceBombType" : 'makeBombType']] + "ボム",
            "words");
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
            let curText = loadLocaleGeneral("消去数>=11時に...出現確定", "words");
            if (curText.indexOf('...') === -1) curText += '...';
            text.push(curText.replace('...', imgFunc(bombName[params["makeBombType"]] + "ボム", "words")));
        }
    }
    if ("forceBombNum" in params) {
        let bomb = imgFuncQuan(`${ params["forceBombNum"]}個`);
        if ("forceBombType" in params) {
            bomb += imgFunc(bombName[params["forceBombType"]] + "ボム", "words");
        }
        text.push(bomb);
    }

    if (("toHighScore" in params && params["toHighScore"]) || ("toCausingAttr" in params && params["toCausingAttr"])) {
        if (!("skillValue" in params) || params["skillValue"] === 0) {
            text.push(loadLocaleGeneral("No penalty in charging skill gauge", "words"));
        }
    }

    text.forEach((e, i, a) => {
        let special = e.split(' (');
        let quan = '';
        try {
            quan = loadLocaleQuan(special[0]);
        } catch (notImportant) {
            quan = special[0];
        }
        a[i] = quan + (special.length > 1 ? ` (${special[1]})` : '');
        // hardcoded for 個 in English describe bomb and puchi
        a[i].includes(' bomb') ? a[i] = a[i].replace("puchi", "") : a[i];
    });

    return text.join(' / ');
};

let paramsFormatterGraphical = (params) => {
    let rst = paramsFormatter(params, true).split(' / ');
    for (let i = bombName.length - 1; i > -1; --i) {
        rst.forEach((elem, idx, array)=> {
        let img = makeLogo(bombName[i] + "ボム", inTextlogo);
            if (elem.includes(`${bombName[i]}ボム`)) {
                if (elem.includes("大きな")) {
                    elem = elem.replace("大きな", '');
                    img = img.replace(/logo/g, "logo-lg");
                }
                if (isNaN(parseInt(elem[0]))) {
                    array[idx] = elem.replace(`${bombName[i]}ボム`, img);
                } else {
                    array[idx] = elem.replace(`${bombName[i]}ボム`, '');
                    array[idx] = img + 'x' + array[idx].slice(0, array[idx].length-1);
                }
            }
        });
    }
    return rst.join(' / ');
};


let translateFormatter = (value) => {
    try {
        return loadLocale(value);
    } catch (notImportant) {
        return value;
    }
};

let rangeSorter = (A, B, RA, RB) => {
    let ha = hamming(A), hb = hamming(B);
    if (ha > hb) {
        return 1;
    } else if (hb > ha) {
        return -1;
    }
    let shapeSort = regexSorter(A, B);
    if (shapeSort) {
        return shapeSort;
    }
    if ("activeSkill" in RA) {
        return regexSorter(ALvDependent(RA["activeSkill"]), ALvDependent(RB["activeSkill"]));
    } else if ("SS" in RA) {
        return regexSorter(evolveDependent(RA["SS"]), evolveDependent(RB["SS"]));
    }
};

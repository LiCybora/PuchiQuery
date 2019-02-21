// Formatter
// Default formatter
const TARGET_TEXT = ["センター", "サポート1", "サポート2"];

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
        if (type === 14 || type === 12 || type === 2 || type === 3) {
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
        // BI Kotori
        if ("skillValue" in params) {
            // FIXME: hardcoded for now, maybe the params 'type' somehow useful?
            let curText = loadLocaleGeneral("High score ", "words") + loadLocaleGeneral("puchi ... towards skill gauge", "words");
            if (curText.indexOf('...') === -1) curText += '...';
            effect += ` (${curText.replace('...', params["skillValue"] / 10 + '%')})`;
        }
        if (type === 2) {
            effect += ` (${loadLocaleGeneral("...以外", "words").replace('...', loadLocaleGeneral("センター", "words"))})`;
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

let specialTarget = (params, curText) => {
    if (params["pickupType"] !== 8 &&
        (params["skillType"] === 0 || params["skillType"] === 1 || params["skillType"] === 9)) {
        let postText;
        postText = loadLocaleGeneral((params["pickupType"] === 9 ? "...のみ" :
            params["skillType"] === 1 ? "...は変化しない" : "...以外"), "words");
        if (!("skillTargetMulti" in params)) {
            // Handle target exception
            if (!("skillTarget" in params)) {
                params["skillTarget"] = 0;
            }
            if (params["skillTarget"] >= 0 && params["skillTarget"] < TARGET_TEXT.length) {
                curText += ` (${postText.replace('...',
                    loadLocaleGeneral(TARGET_TEXT[params["skillTarget"]], "words"))}`;
            }
        } else {
            // Handle multiple target
            let targetText = [];
            for (let targetIndex of params["skillTargetMulti"]) {
                if (targetIndex >= 0 && targetIndex < TARGET_TEXT.length) {
                    targetText.push(loadLocaleGeneral(TARGET_TEXT[targetIndex], "words"));
                }
            }
            if (targetText.length > 1) {
                curText += ` (${postText.replace('...', targetText.join(', '))}`;
            }
        }
    } else if (params["skillType"] === 1) {

    }
    return curText;
};

// Note:
// Ref: https://www.reddit.com/r/Puchiguru/comments/8thzps/parameters_in_the_skill_effect_data/
// afterWait, effectWait, pickupWait: Time freeze duration when/during/after skill activated, not important here
// skillType: 0-clear, 1-spawn Puchi, 2-spawn bomb, 3-drop bomb, 4-time freeze, 5-reorganize, 6-disappear,
//            7-bomb creation need-, 8-clear traced, 9-freeze and link, 10-explode click, 13-center to majority
//            14-clear majority 15-majority to center 16-autoClear
// allCombo: false-combo count as # of chain, true-combo count as # of clear Puchi. Default: false
// causingRange: explosive range, currently 130 for explosive click, 150 for explosive Puchi, unused for non-explosive
// chainDivide: false-all clear chains are independent, true-all clear counted as 1 chain. Default: false
// enableCount: # of Puchi reduced for chain creation, unused for other still
// enterFever: whether skill activation enter showtime. Default: false
// forceBombNum, forceBombType: Forced bomb spawned, 0-random, 1-normal, 2-gold, 3-time, 4-score. Default: 0, 0
// makeBomb, makeBombType: whether unlink clear make bomb, same as above except 0 as auto type (depends on # of clear)
//                          Default: false, 0
// makeWideBomb: whether it is wide bomb. Default: false
// skillTarget: 0-center, 1/2-support1/2, 3-all, -1:not sure (maybe random among center & support? e.g.:HSN Riko)
// pickupType: 6-random, 8-unconnected, 9-whole type of Puchi, 10-given area
// toCompatible: whether chain bonus should not apply (true for no chain bonus). Chain bonus always full count
//              Default: false
// skillValue: when spawned puchi clear,  (skillValue / 10)% counted towards skill gauge. Default value: 1000
//              not sure how it take effect when toCompatible unset (e.g.: Borara Nico).
let paramsFormatter = (params, img = false) => {
    //not translate bomb name as it will shown as image
    let imgFunc = img === true ? ((v)=>v) : loadLocaleGeneral;
    let imgFuncQuan = img === true ? ((v)=>v) : loadLocaleQuan;
    if (params.valueOf() === "-") {return "-";}
    params = JSON.parse(params);
    let text = [];
    if ("text" in params) {
        let curText = params["text"].replace('minus', '-').replace('plus', '+');
        text.push(specialTarget(params, curText));
    }
    if ("skillRandomMin" in params) {
        let curText = '';
        if (params["skillRandomMin"] === params["skillRandomMax"]) {
            curText = `${params["skillRandomMin"]}個`;
        } else {
            curText = `${params["skillRandomMin"]}~${params["skillRandomMax"]}個`;
        }
        curText = specialTarget(params, curText);
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
        let spawned = "toCausingAttr" in params ? "Explosive " : "High score ";
        // if (!("toCompatible" in params)) {
        //     text.push(loadLocaleGeneral(spawned, "words") + loadLocaleGeneral("puchi full towards skill gauge", "words"));
        // } else
        if ("skillValue" in params) {
            let curText = loadLocaleGeneral(spawned, "words") + loadLocaleGeneral("puchi ... towards skill gauge", "words");
            if (curText.indexOf('...') === -1) curText += '...';
            text.push(curText.replace('...', `~${params["skillValue"] / (!("toCompatible" in params) ? 2 : 10)}%`));
        } else {
            text.push(loadLocaleGeneral(spawned, "words") + loadLocaleGeneral("puchi full towards skill gauge", "words"));
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

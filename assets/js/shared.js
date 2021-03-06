// constant
const bombName = ['ランダムな種類の', '通常', 'ゴールド', 'タイム', 'スコア'];
const memberImg = "https://res.cloudinary.com/puchiquery/image/upload/.../v1541309002/puchi/puzzlecharafaces";
const generalImg = "https://res.cloudinary.com/puchiquery/image/upload/.../v1541309002/puchi/";
const enumSize = [
    "SS-", "SS", "SS+", "S-", "S", "S+", "M-", "M", "M+", "L-", "L", "L+", "LL-", "LL", "LL+"
];
const noSort = ["costume", "name", "unit", "group", "category", "class"];
const nameDict = {};
const uniform = {
    '1': '10001',
    '2': '20001',
    '4': '40002',
    '9': '90002',
};
const fieldList = [];
const fieldTitle = {
    ID: "Image",
    level: "Lv",
    cardName: "Card Name",
    minRarity: "Min rarity",
    maxRarity: "Max rarity",
    activeSkill: "Active Skill",
    "S.Lv": "Skill<br/>Lv",
    skillLevel: "Skill<br/>Lv",
    SpecialSkillType: "SS Type",
    SpecialSkill: "SS",
    binaryMap: "Range",
    scoreGrowthRate: "Score",
    cost: "Puchi<br/>Need",
    "next exp.": "Next<br/>Exp.",
    "total exp.": "Total<br/>Exp.",
    passiveSkill: "Passive<br/>Skill",
    "effect value": "Active<br/>Effect",
    skillType: "Skill Type",
    name: "Char",
    match: "Char",
    SSEffect: "SS Effect",
    "total candy": "Total<br/>Candy",
    "total ticket": "Total<br/>Ticket",
    "score/lv": "Score/Lv"
};

let filterOption = {};
let stickyHeaderOffsetY = 0;
let filter_string = {};
let filterable;
let LvData;
const inTextlogo = 't_logo';
const UIlogo = 't_logo-lg';

// general function
let updateTableHeader = (tid) => {
    let $rt = $(tid);
    const rtData = $rt.bootstrapTable("getData", false);
    let rtField = {};
    for (let each in rtData[0]) {
        rtField[each] = loadHeaderLocale(fillTitle(each));
    }
    $rt.bootstrapTable("changeTitle", rtField);
};

let refreshLocale = (lang, filterable)=> {
    setLocale(lang);
    // update filter
    // let debugStr = '';
    for (const field of filterable) {
        filterOption[field].forEach(function(value) {
            let $label = $(`label[for="${field+value}"]`);
            if ($label.text()) {
                $label.text(loadLocale(value).replace('<br/>', ' '));
                // debugStr += `${JSON.stringify($label.text())}: "",\n`
            }

        });
        $(`div[id="${fillTitle(field).replace('<br/>', ' ')}"]`).text(loadHeaderLocale(fillTitle(field)).replace('<br/>', ' '));
    }
    // console.log(debugStr);
    // update tables
    updateTableHeader('#table');
    changeTableLocale(lang);
    for (let i = 0; i < LvData.length / 10; ++i) {
        updateTableHeader(`#LvTable${i}`);
    }
    try {
        updateTableHeader(`#rarityTable`);
    } catch (e) {
        // nothing, just in case Puchi page has no this table.
    }
    $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh table
    // update text
    $('#intro').html(`${locale["msg"]["text"]}<br/>${locale["msg"]["features"]}<br/>`);
    // update UIs
    $( ".UI" ).each( function () {
        let UI = $(this);
        UI.text(loadLocaleGeneral(UI.data('v'), "UI"));
    });
    // update page title
    let $localHead = $('#localeHead');
    $localHead.text(`${loadLocaleGeneral('title', 'msg')} - ${loadLocaleGeneral($localHead.data('v'), "UI")}`);
    $(document).prop('title', $localHead.text());
};

let rotateArrow = (self)=> {
    let hidden = self.parentElement.nextSibling.className;
    if (hidden !== 'collapsing') {
        self.getElementsByClassName("righter")[0].innerHTML =
            `<span class="glyphicon glyphicon-chevron-${hidden === 'collapse' ? 'down' : 'right'}"></span>`;
    }
};

let capitalize = function(word) {
    return word.charAt(0).toUpperCase()+word.substr(1);
};

let fillTitle = (field) => field in fieldTitle ? fieldTitle[field] : capitalize(field);

let makeLogo = (imgName, option=inTextlogo) => {
    return `<img src="${generalImg.replace('...', option)}${imgName}.png" class="logo">`;
};

let makeLvInput = (maxLv, df = "", extra="") =>
    `<input type="number" ${df?"value='" + df + "'" : ""} min="1" max="${maxLv}" class="editor ${extra}">`;

let cropImgByID = function(ID, iconClass="") {
    const type = iconClass.valueOf() === "mini" ? inTextlogo : UIlogo;
    let img = `<img src="${memberImg.replace('...', type)}${uniform[ID.slice(0, 1)] + ID}.png">`;
    return `<div class="${iconClass}">${img}</div>`;
};

let loadLocaleQuan = (value) => {
    if (value !== '-' && value) {
        let numeric = value.match(/[+-]?[0-9]*[.]?[0-9]+/g);
        let numPos = value.indexOf(numeric[0]);
        let endPos = numPos + numeric[0].length - 1;
        let leftOver;
        if (numeric.length >= 2) {
            // handle a~b
            endPos = value.indexOf(numeric[1]) + numeric[1].length - 1;
            numeric = numeric[0] + '~' + numeric[1];
            leftOver = value.replace(numeric, '').replace('~', '');
        } else {
            numeric = numeric[0];
            leftOver = value.replace(numeric, '');
        }
        leftOver = numPos === 0 ? leftOver :
            [leftOver.slice(0, numPos), '...', leftOver.slice(endPos)].join('');
        if (leftOver in locale["quantity"] && locale["quantity"][leftOver]) {
            let quanWord = locale["quantity"][leftOver].split('...');
            let rst = quanWord.length === 2 ? quanWord[0] + numeric + quanWord[1] : numeric + quanWord;
            if (rst.indexOf("MISC") !== -1) {
                let functor = eval(locale["quantity"]["misc"]);
                rst = rst.replace("MISC", functor(parseInt(numeric.slice(numeric.length - 1)[0])));
            }
            return rst;
        }
    }
    return value.replace('\n', '<br/>');
};

let loadLocale = (value) => (
    value in locale["data"] && locale["data"][value] ? locale["data"][value] : value.replace('\n', '<br/>')
);

let loadHeaderLocale = (value) => {
    let rst = loadLocaleGeneral(value, "header");
    if (rst === value) {
        rst = loadLocaleGeneral(value.replace('<br/>', ' '), "header");
    }
    return rst === value.replace('<br/>', ' ') ? value : rst;
};

let save = () => {
    //Saving string to file using html clicking trick
    if (confirm(locale["msg"]["warning"])) {
        let obj = $table.bootstrapTable('getData', false);
        const fileName = location.pathname.split("/").slice(-1)[0].replace(".html", "") + "Level.txt";
        let blob = new Blob([JSON.stringify(obj)], {type: `Content-Disposition: attachment; filename=${fileName}; charset=utf-8`});
        saveAs(blob, fileName);
    }

    // let url = URL.createObjectURL(blob);
    // let elem = document.createElement("a");
    // elem.href = url;
    // elem.download = location.pathname.split("/").slice(-1)[0].replace(".html", "") + "Level.txt";
    // document.body.appendChild(elem);
    // elem.click();
    // document.body.removeChild(elem);
};

let handleFiles = (files) => {
    let reader = new FileReader();
    const curPage = location.pathname.split("/").slice(-1)[0].replace(".html", "");
    reader.onload = ((reader) => {
        return () => {
            try {
                let contents = reader.result;
                let saved = eval(contents);
                let data = $table.bootstrapTable('getData', false);
                const dataType = 'rarity' in saved[0] ? 'card' : 'S.Lv' in saved[0] ? 'puchi' : 'illegal';
                if ((curPage === 'puchi' && dataType === 'card') ||
                    (curPage === 'card' && dataType === 'puchi')) {
                    let alertMsg = locale["msg"]["mistake"];
                    alertMsg = alertMsg.replace('HOLDER1', dataType).replace('HOLDER2', curPage);
                    alert(alertMsg);
                    return;
                } else if (dataType === 'illegal') throw -1;
                for (const each of saved) {
                    let row = data.find(entry => JSON.stringify(entry.ID) === JSON.stringify(each.ID));
                    row["lv"] = each["lv"];
                    if (dataType === 'puchi') {
                        row["S.Lv"] = each["S.Lv"];
                    } else {
                        row["rarity"] = each["rarity"];
                    }
                }
                $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh table
            } catch (e) {
                alert(locale["msg"]["error"]);
            }
        }
    })(reader);
    reader.readAsText(files[0]);

};

let load = () => {
    if (confirm(locale["msg"]["warning"])) {
        let elem = document.createElement("INPUT");
        elem.setAttribute("type", "file");
        elem.setAttribute("accept", ".txt");
        elem.setAttribute("onchange", "handleFiles(this.files)");
        elem.click();
    }
};

// Without santizer, sth cannot pass through HTML name.
let sanitize = function(obj) {
    return encodeURI(JSON.stringify(obj));
};

let hex2binMap = function(hex) {
    let bin = '<table class="bmpt">';
    for (let i = 0, l = hex.length, step = 4; i < l; i+=step) {
        bin += '<tr>';
        let cur = parseInt(hex.slice(i, i+step), 16).toString(2).padStart(16, '0');
        cur.split('').forEach((c) => {
            bin += `<td class="${c === '0' ? "white" : "red"}"></td>`;
        });
        bin += '<tr/>'
    }
    return bin + '</table>';
};

let hex2binMapv2 = function(hex) {
    let bin = [];
    for (let i = 0, l = hex.length, step = 4; i < l; i+=step) {
        let cur = parseInt(hex.slice(i, i+step), 16).toString(2).padStart(16, '0');
        bin.push(cur);
    }
    let newBin = [];
    bin.forEach((row, y, arr)=> {
        let newStr = [];
        let oldStr = row.split('');
        oldStr.forEach((value, x, ent)=> {
            // assume puchi sized in 2x2.
            // assume penalty for the upper case due to gravity, 0.5 for upper layer, + 0.05 for each layer.
            // assume reward for middle layer, from upper until 1.2 for each layer (1.3 for middlest 2)
            // assume no reward for bottom
            let w = 0;
            let curVal = 0;

            // left top
            if (y !== 0 && x !== 0) {
                curVal += Math.max(parseInt(arr[y-1][x-1]), parseInt(arr[y-1][x]), parseInt(arr[y][x-1]), parseInt(arr[y][x]));
                ++w;
            }
            // left bottom
            if (y !== arr.length - 1 && x !== 0) {
                curVal += Math.max(parseInt(arr[y + 1][x - 1]), parseInt(arr[y + 1][x]), parseInt(arr[y][x - 1]), parseInt(arr[y][x]));
                ++w;
            }
            // right top
            if (y !== 0 && x !== arr.length - 1) {
                curVal += Math.max(parseInt(arr[y - 1][x + 1]), parseInt(arr[y - 1][x]), parseInt(arr[y][x + 1]), parseInt(arr[y][x]));
                ++w;
            }
            // right bottom
            if (y !== arr.length - 1 && x !== arr.length - 1) {
                curVal += Math.max(parseInt(arr[y + 1][x + 1]), parseInt(arr[y + 1][x]), parseInt(arr[y][x + 1]), parseInt(arr[y][x]));
                ++w;
            }
            curVal /= w;
            newStr.push(curVal);
        });
        newBin.push(newStr);
    });
    let expRate = 0;
    let maxRate = 0;
    let tab = '<table class="bmpt">';
    newBin.forEach((each, y) => {
        tab += '<tr>';
        each.forEach((c, x) => {
            tab += `<td ${c === 1 && bin[y][x] === '1' ? "class='red'" : `style="background-color: rgb(${Math.round((1-c)*255)}, ${Math.round((1-c)*255)}, ${255})"`}></td>`;
            let penalty = (0.5 + 0.1 * (y <= 8 ? y : y <= 9 ? 8 : y < 13 ? 7 : 5));
            expRate += c * penalty;
            maxRate += Math.ceil(c) * penalty;
        });
        tab += '<tr/>'
    });
    return [tab + '</table>', expRate / 256, maxRate / 256];
};

// Sorting
let numericSort = (A, B) => { return A > B ? 1 : A < B ? -1 : 0 };

let rangeSort = function (thisA, thisB) {
    let regexA = thisA.match(/[SML]+[+-]?/),
        regexB = thisB.match(/[SML]+[+-]?/);
    if (regexA == null || regexB == null) {
        return thisA.localeCompare(thisB);
    }
    let sizeA = enumSize.indexOf(regexA[0]),
        sizeB = enumSize.indexOf(regexB[0]),
        rst = numericSort(sizeA, sizeB);
    return rst ? rst : thisA.localeCompare(thisB);
};

let arraySort = (A, B, sorter) => {
    for (let i = 0; i < Math.min(A.length, B.length); ++i) {
        let rst = sorter(A[i], B[i]);
        if (rst) return rst;
    }
    return numericSort(A.length, B.length);
};

let regexSort = function (thisA, thisB) {
    let regexA = thisA.match(/[+-]?[0-9]*[.]?[0-9]+/g);
    let regexB = thisB.match(/[+-]?[0-9]*[.]?[0-9]+/g);
    if (regexA == null || regexB == null) {
        return rangeSort(thisA, thisB);
    }
    regexA = regexA.map(Number);
    regexB = regexB.map(Number);

    let quantity = rangeSort(thisA.replace(/[+-]?[0-9]*[.]?[0-9]+/g, '').replace('~', ''),
        thisB.replace(/[+-]?[0-9]*[.]?[0-9]+/g, '').replace('~', ''));

    return quantity ? quantity : arraySort(regexA, regexB, numericSort);
};

let regexSorter = function(a, b) {
    let toArray = (val) =>
        Array.isArray(val) ? val : ((typeof val === 'number') ? val.toString().split(' / ') : val.split(' / '));
    let A = toArray(a);
    let B = toArray(b);
    return arraySort(A, B, regexSort);
};

// Filter
let remove = function(array, element) {
    const index = array.indexOf(element);
    if (index !== -1) {
        array.splice(index, 1);
    }
};

let delFilter = function(field, value) {
    try {
        remove(filter_string[field], value);
        if (filter_string[field].length === 0) {
            delete filter_string[field];
        }
    } catch (notImportant) {
        // Do nothing if nothing to delete
    }
};

let addFilter = function(field, value) {
    if (!(field in filter_string)) {
        filter_string[field] = [];
    }
    if (!(filter_string[field].includes(value))) {
        filter_string[field].push(value);
    }
};

let changeAll = function(self, flag) {
    const field = self.name;
    filterOption[field].forEach(function(value) {
        let $target = $(`input[id="${field+value}"]`);
        if (flag === -1 || $target.prop('checked') !== flag) {
            $target.trigger('click');
        }
    });
};

let filterEvent = function(self) {
    let field = self.name;
    let value = self.value;
    let enabled = self.checked;
    let func = enabled ? addFilter : delFilter;
    func(field, value);
};

let resetFilter = function() {
    filterable.forEach(function (field) {
        changeAll({name: field}, true);
    });
};

let filterApply = function() {
    $table.bootstrapTable('filterBy', filter_string);
};

let filterGenerator = function(filterableList, data) {
    filterable = filterableList;
    filterOption = {};
    filterableList.forEach(function(field) {
        // Render filter option
        if (field.valueOf() === "rarity") {
            // FIXME: Rarity hardcoded
            filterOption[field] = _.union(filterOption["maxRarity"], filterOption["minRarity"]);
            (filterOption["minRarity"]).forEach((elem) => {
                if (parseInt(elem) < 3) return;
                if (!filterOption["maxRarity"].includes(elem)) {
                    remove(filterOption[field], elem);
                }
                filterOption[field].push(elem + '+');
            });
        } else {
            filterOption[field] = [];
            data.forEach(function(row) {
                let putSlot = (slot)=> { if (!filterOption[field].includes(slot)) filterOption[field].push(slot) };
                if (Array.isArray(row[field])) {
                    row[field].forEach((item) => putSlot(item));
                } else {
                    putSlot(row[field]);
                }
                // FIXME: hardcoded
                if (field.valueOf() === "name") {
                    if (!(row[field] in nameDict)) {
                        nameDict[row[field]] = row["ID"].slice(row["ID"].length - 3, row["ID"].length);
                    }
                }
            });
        }
        if (!noSort.includes(field)) {
            filterOption[field].sort();
        }
        // These two just extract possible value, no need to spawn filter in this moment.
        if (field.valueOf() === "minRarity" || field.valueOf() === "maxRarity") return;
        // Spawn catalog dropdown
        let titleName = fillTitle(field).replace('<br/>',' ');
        let fieldName = `<div class="lefter" id="${titleName}">${loadHeaderLocale(titleName)}</div>`;
        let menuSym = `<div class="righter"><span class="glyphicon glyphicon-chevron-right"></span></div>`;
        let collapse = `<div class="collapse" id="${field}"><div id="${field}Container" class="autoBr"></div></div>`;
        let btnAttr = `data-toggle="collapse" data-target="#${field}" aria-expanded="false" aria-controls="${field}"`;
        let btn = `<button class="btn btn-info btn-block" ${btnAttr} onclick="rotateArrow(this)">${fieldName}${menuSym}</button>`;
        let catalog = `<div class="filterBox"><p>${btn}${collapse}</p></div>`;
        $('#filterContent').append(catalog);
        // Spawn checkbox
        filterOption[field].forEach(function(value) {
            let pict = '';
            switch (field.valueOf()) {
                case "match": case "name":
                    pict = cropImgByID(field.valueOf() === "name" ? nameDict[value] : value);
                    break;
                case "unit": case "group":
                    pict = `<img src="${generalImg.replace('...', UIlogo)}${value}.png" class="icon">`;
                    break;
                case "rarity":
                    let evolved = !(value.valueOf().includes('+'));
                    pict = (evolved ? maxRarityFormatter : forceEvolvableFormatter)(value.split('+')[0]);
                    break;
            }
            let checkbox =
                `<input name="${field}" value="${value}" type="checkbox" onclick="filterEvent(this)" id="${field+value}"/>`;
            let checkboxObj = pict ? `<div class="imgButton">${checkbox}<label for="${field + value}">${pict}</label></div>`
                : `<div>${checkbox}<label for="${field + value}">${loadLocale(value).replace('<br/>', ' ')}</label></div>`;
            $('#' + field + 'Container').append(checkboxObj);
            $(`input[id="${field + value}"]`).trigger('click');
        });
        // Make buttons
        let makeBtn = function(btnClass, func, name, flag, logo) {
            let disp = `<span class="glyphicon glyphicon-${logo}"></span> <span class="UI" data-v="${name}">${loadLocaleGeneral(name, "UI")}</span>`;
            return `<button type="button" class="btn ${btnClass}" name="${field}"` +
                ` onclick="${func}(this,${flag})">${disp}</button>`;
        };
        let formBtn = `<p>${makeBtn('btn-success', "changeAll", 'Select All', true, "check")} `;
        formBtn += `${makeBtn('btn-danger', "changeAll", 'Deselect All', false, "unchecked")} `;
        formBtn += `${makeBtn('btn-warning', "changeAll", 'Toggle All', -1, "edit")}</p>`;
        $('#' + field).append(formBtn);
    });
    // function register
    let $collapseAll = $('#collapseAll');
    // button for collapse/expand filter catalog
    $collapseAll.on('click', function() {
        $('.filterBox .collapse').collapse('hide');
        $('.filterBox .btn .righter').html(`<span class="glyphicon glyphicon-chevron-right"></span>`);
    });
    $('#expandAll').on('click', function() {
        $('.filterBox .collapse').collapse('show');
        $('.filterBox .btn .righter').html(`<span class="glyphicon glyphicon-chevron-down"></span>`);
    });
    // Unknown bug for fail first time, so force click it twice.
    $collapseAll.trigger('click');
    setTimeout(function () {
        $collapseAll.trigger('click');
    }, 500);
};

let setAllLv = function(field, LvMax) {
    let setLv = -1;
    let discard = true;
    BootstrapDialog.show({
        title: loadLocaleGeneral('Set All' + (field === 'lv' ? ' ' : ' Skill ') + 'Lv', 'UI'),
        message: `${loadHeaderLocale(fillTitle(field).replace('<br/>', ' '))}: ${makeLvInput(LvMax, 1)}`,
        cssClass: 'centerModal',
        autodestroy: false,
        onhide: function(dialogRef){
            setLv = parseInt(dialogRef.getModalBody().find('input').val());
            if(!discard && (isNaN(setLv) || setLv > LvMax || setLv < 1)) {
                alert('Please input valid level from 1 to ' + LvMax);
                discard = true;
                return false;
            } else if (!discard) {
                $table.bootstrapTable('getData', false).forEach(function(record) {
                    record[field] = setLv;
                });
                $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh
            }
        },
        buttons: [{
            label: loadLocaleGeneral('Apply', "UI"),
            cssClass: 'btn-success',
            action: function(dialog) {
                discard = false;
                dialog.close();
            }
        },{
            label: loadLocaleGeneral('Close', "UI"),
            cssClass: 'btn-danger',
            action: function(dialog){
                setLv = -1;
                dialog.close();
            }
        }]
    });
};

let hamming = (hex) => {
    let set = 0;
    try {
        for (let i = 0, l = hex.length, step = 8; i < l; i+=step) {
            let cur = parseInt(hex.slice(i, i+step), 16);
            cur = cur - ((cur >>> 1) & 0x55555555);
            cur = (cur & 0x33333333) + ((cur >>> 2) & 0x33333333);
            set += (((cur + (cur >>> 4)) & 0x0F0F0F0F) * 0x01010101) >>> 24;
        }
        return isNaN(set) ? 0 : set / (hex.length * 4);
    } catch (e) {
        return 0;
    }
};

let showRange = (self) => {
    let data = self.getAttribute("data-bmp");
    let shown = hex2binMapv2(data);
    let msg = '';
    msg += `${loadLocaleGeneral('Absolute Range', 'words')}: ${hamming(data) * 100}%<br/>`;
    msg += `${loadLocaleGeneral('Estimated Range', 'words')}: ${(shown[1]*100).toFixed(2)}~${(shown[2]*100).toFixed(2)}%<br/>`;
    msg += `${loadLocaleGeneral('Estimated # of Puchi', 'words')}: ${Math.round(45*shown[1])}~${Math.ceil(45*shown[2])}<br/>`;
    msg += `(${loadLocaleGeneral('Estimation just for reference', 'words')})`;
    msg += shown[0];
    msg += `<svg width="1em" height="1em"><rect width="1em" height="1em" style="fill:rgb(255,0,0);"></rect></svg>: ${loadLocaleGeneral('Real', 'words')}, `;
    msg += `<svg width="1em" height="1em"><rect width="1em" height="1em" style="fill:rgb(0,0,255);"></rect></svg>: ${loadLocaleGeneral('Marginal', 'words')}`;
    msg += `<br/><a href="range.html">More Info</a> (English Only)`;

    BootstrapDialog.show({
        size: BootstrapDialog.SIZE_LARGE,
        title: `${loadHeaderLocale('Range')} (Beta)`,
        message: msg,
        cssClass: 'ranger',
        buttons: [{
            label: loadLocaleGeneral('Close', 'UI'),
            cssClass: 'btn-primary',
            action: function(dialog){
                dialog.close();
            }
        }]
    });
};

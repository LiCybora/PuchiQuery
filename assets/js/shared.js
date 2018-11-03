// constant
const bombName = ['ランダムな種類の', '通常', 'ゴールド', 'タイム', 'スコア'];
const memberImg = "assets/img/puzzlecharafaces";
const generalImg = "assets/img/";
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
const fieldTitle = {
    level: "Lv",
    skillLevel: "S.Lv",
    ID: "Image",
    SpecialSkillType: "SSType",
    SpecialSkill: "SS",
    binaryMap: "Range",
    scoreGrowthRate: "Score",
    "next exp.": "Next",
    "total exp.": "Total",
    passiveSkill: "P.Skill",
    "effect value": "A.Effect",
};

let filterOption = {};
let stickyHeaderOffsetY = 0;
let filter_string = {};
let filterable;
let LvData;
let $table = $('#table');

// general function
let refreshLocale = (lang, filterable)=> {
    setLocale(lang);
    $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh table
    // update filter
    for (const field of filterable) {
        filterOption[field].forEach(function(value) {
            let $label = $(`label[for="${field+value}"]`);
            if ($label.text()) {
                // console.log(JSON.stringify($label.text()));
                $label.text(loadLocale(value));
            }
        });
    }
    $('#intro').html(locale["msg"]["text"]);
};


let capitalize = function(word) {
    return word.charAt(0).toUpperCase()+word.substr(1);
};

let fillTitle = (field) => field in fieldTitle ? fieldTitle[field] : capitalize(field);

let makeLogo = (imgName, extra="") => `<img src="${generalImg}${imgName}.png" class="logo ${extra}">`;

let makeLvInput = (maxLv, df = "", extra="") =>
    `<input type="number" ${df?"value='" + df + "'" : ""} min="1" max="${maxLv}" class="editor ${extra}">`;

let cropImgByID = function(ID, iconClass="") {
    let img = `<div class="crop-container"><img src="${memberImg}${uniform[ID.slice(0, 1)] + ID}.png"></div>`;
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

let loadHeaderLocale = (value) => (
    value in locale["header"] && locale["header"][value] ? locale["header"][value] : value
);

let loadLocaleGeneral = (value, area) => (
    value in locale[area] && locale[area][value] ? locale[area][value] : value
);

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
            bin += `<td class="${c === '0' ? "white" : "dark"}"></td>`;
        });
        bin += '<tr/>'
    }
    return bin + '</table>';
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
    } catch {
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
        let fieldName = `<div class="lefter">${capitalize(field)}</div>`;
        let menuSym = `<div class="righter"><span class="glyphicon glyphicon-chevron-down"></span></div>`;
        let collapse = `<div class="collapse" id="${field}"><div id="${field}Container" class="autoBr"></div></div>`;
        let btnAttr = `data-toggle="collapse" data-target="#${field}" aria-expanded="false" aria-controls="${field}"`;
        let btn = `<button class="btn btn-info btn-block" ${btnAttr}>${fieldName}${menuSym}</button>`;
        let catalog = `<div id="filterBox"><p>${btn}${collapse}</p></div>`;
        $('#filterContent').append(catalog);
        // Spawn checkbox
        filterOption[field].forEach(function(value) {
            let pict = '';
            switch (field.valueOf()) {
                case "match": case "name":
                    pict = cropImgByID(field.valueOf() === "name" ? nameDict[value] : value);
                    break;
                case "unit": case "group":
                    pict = `<img src="${generalImg}${value}.png" class="icon">`;
                    break;
                case "rarity":
                    let evolved = !(value.valueOf().includes('+'));
                    pict = (evolved ? maxRarityFormatter : forceEvolvableFormatter)(value.split('+')[0]);
                    break;
            }
            let checkbox =
                `<input name="${field}" value="${value}" type="checkbox" onclick="filterEvent(this)" id="${field+value}"/>`;
            let checkboxObj = pict ? `<div class="imgButton">${checkbox}<label for="${field + value}">${pict}</label></div>`
                : `<div>${checkbox}<label for="${field + value}">${loadLocale(value)}</label></div>`;
            $('#' + field + 'Container').append(checkboxObj);
            $(`input[id="${field + value}"]`).trigger('click');
        });
        // Make buttons
        let makeBtn = function(btnClass, func, name, flag, logo) {
            let disp = `<span class="glyphicon glyphicon-${logo}"></span> ${name}`;
            return `<button type="button" class="btn ${btnClass}" name="${field}"` +
                ` onclick="${func}(this,${flag})">${disp}</button>`;
        };
        let formBtn = `<p>${makeBtn('btn-success', "changeAll", 'Checked All', true, "check")} `;
        formBtn += `${makeBtn('btn-danger', "changeAll", 'Unchecked All', false, "unchecked")} `;
        formBtn += `${makeBtn('btn-warning', "changeAll", 'Toggle All', -1, "edit")}</p>`;
        $('#' + field).append(formBtn);
    });
    // function register
    let $collapseAll = $('#collapseAll');
    // button for collapse/expand filter catalog
    $collapseAll.on('click', function() {
        $('#filterBox .collapse').collapse('hide');
    });
    $('#expandAll').on('click', function() {
        $('#filterBox .collapse').collapse('show');
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
        title: 'Set All' + (field === 'lv' ? ' ' : ' Skill ') + 'Level',
        message: `Level: ${makeLvInput(LvMax, 1)}`,
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
            label: 'Submit',
            cssClass: 'btn-success',
            action: function(dialog) {
                discard = false;
                dialog.close();
            }
        },{
            label: 'Close',
            cssClass: 'btn-danger',
            action: function(dialog){
                setLv = -1;
                dialog.close();
            }
        }]
    });
};

let showRange = (self) => {
    BootstrapDialog.show({
        size: BootstrapDialog.SIZE_LARGE,
        title: 'Range',
        message: hex2binMap(self.getAttribute("data-bmp")),
        cssClass: 'centerModal',
        buttons: [{
            label: 'Close',
            cssClass: 'btn-primary',
            action: function(dialog){
                dialog.close();
            }
        }]
    });
};
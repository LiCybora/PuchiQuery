const cardFilterable = [
    'minRarity', 'maxRarity', 'rarity', 'skill', 'trigger', 'match', 'SpecialSkillType', 'SpecialSkill', 'category'
];
const cardImageSrc = "https://at7j5fltn.cloudimg.io/crop_px/0,56,256,200-128x72/n/_imgsrc_/cardsmallHOLDER.png";
const cardImageSrcL = "https://at7j5fltn.cloudimg.io/crop_px/0,56,256,200-256x144/n/_imgsrc_/cardsmallHOLDER.png";
const rarityList = {
    '1': 'N',
    '2': 'N',
    '3': 'R',
    '4': 'SR',
    '5': 'SSR',
    '6': 'UR',
};

// evolve related
let evolvable = (row)=> row["maxRarity"] > row["minRarity"];

let evolved = (row)=> evolvable(row) && row["rarity"] === row["maxRarity"];

let evolveAll = function (value) {
    $table.bootstrapTable('getData', false).forEach(function (row, i, array) {
        evolvable(row) ? (array[i]["rarity"] = (value ? row["maxRarity"] : row["minRarity"])) : '';
    });
    $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh
};

let evolveDependent = (value, row) => ( generalLvDependent(value, row, (row) => evolved(row) ? 1: 0) );

let evolveEvent = function(self) {
    const record = $table.bootstrapTable('getData', false).find(entry => sanitize(entry.ID) === self.id);
    record["rarity"] = record[(record["rarity"] === record["minRarity"] ? "maxRarity" : "minRarity")];
    $table.bootstrapTable('updateByUniqueId', {id: 0});     // force refresh
};

// Rarity related
let drawStar = (value, classes="")=> {
    if (!value) {return ''}
    if (!classes) { classes = rarityList[value]; }
    let img = makeLogo(classes, inTextlogo);
    return img.repeat(value);
};

let maxRarityFormatter = (value) => drawStar(value);

let evolvableRarityFormatter = (value, row, evolved, event, css, evolvability) => {
    let color = rarityList[value];
    let extraStarClass = evolved ? color : "empty";
    if (evolvability !== undefined) { return drawStar(value) + drawStar(evolvability, "empty");}
    let extraStar = !evolvable(row) ? '' :
        `<img class="logo ${css}" id="${sanitize(row["ID"])}" src="${generalImg.replace('...', inTextlogo)}${extraStarClass}.png" onclick="${event}(this)">`;
    return drawStar(value - evolved, color) + extraStar;
};

let forceEvolvableFormatter = (value) => {
    return evolvableRarityFormatter(value, '', false, '', '', value >= 3);

};

let minRarityFormatter = (value, row) => {
    return evolvableRarityFormatter(value, row, false, '', '');
};


let rarityFormatter = (value, row) => {
    return evolvableRarityFormatter(value, row, evolved(row), "evolveEvent", "star");
};

let rarityFilterFormatter = (value, row, filter) => {
    const matcher = [true];
    for (const each of filter) {
        if (parseInt(each.split('+')[0]) === parseInt(value)) {
            // rarity matched
            if (each.indexOf('+') !== -1) {
                // filter for only non evolved
                matcher.push(evolved(row));
            } else if (parseInt(each) > 3) {
                // filter for only evolved
                matcher.push(!evolved(row));
            } else {
                // unevolvalbe
                matcher.push(false);
            }
        }
    }
    return matcher.reduce((accumulator, current) => accumulator && current);
};

// Score related
let cardScoreDependent = (value, row) => {
    value = evolveDependent(value, row);
    let targetLv = Math.min(parseInt(row["lv"]), parseInt(row["rarity"]) * 10);
    if (LvData === undefined) {return value;}   // handle unknown error fail load at 1st time
    const record = LvData.find(entry => entry["level"] === targetLv);
    return ~~(value * record["scoreGrowthRate"] / 1000);
};

let lvLimitFormatter = (value, row) => Math.min(value, parseInt(row["rarity"]) * 10);

let cardScoreFormatter = (value) => `${value}<br/><span class="blinking">${parseInt(value*1.2)}${makeLogo("match")}</span>`;

$(function () {
    // FIXME: Hardcoded UI button
    $('#filter-bar').append(`
            <button type="button" class="btn btn-info UI" data-toggle="modal" data-target="#rarityModal" data-v="Trade/Enhance">${loadLocaleGeneral('Trade/Enhance', 'UI')}</button>
            <button type="button" class="btn btn-success UI" data-v="Set All Lv" onclick="setAllLv('lv', 60)">${loadLocaleGeneral('Set All Lv', "UI")}</button>
            <button type="button" class="btn btn-warning UI" data-v="Evolve All" onclick="evolveAll(true)">${loadLocaleGeneral('Evolve All', "UI")}</button>
            <button type="button" class="btn btn-danger UI" data-v="Devolve All" onclick="evolveAll(false)">${loadLocaleGeneral('Devolve All', "UI")}</button>
    `);
    $('#rarityBtn').html(`
        <button type="button" class="btn btn-danger" data-dismiss="modal">
            <span class="glyphicon glyphicon-remove"></span> <span data-v="Close" class="UI">${loadLocaleGeneral('Close', 'UI')}</span>
        </button>
    `);
    $('#rarityTableLabel').html(`${loadLocaleGeneral('Trade/Enhance', 'UI')}`);

    $.getJSON("json/cardRarity.json", function (data) {
        let columns = [];
        for (let key in data[0]) {
            let column = {
                field: key,
                title: loadHeaderLocale(fillTitle(key))
            };
            if (key === 'rarity') {
                column.formatter = (value) => {
                    if (parseInt(value) < 3 || parseInt(value) === 6) {
                        return maxRarityFormatter(value);
                    } else if (parseInt(value) === 3) {
                        return forceEvolvableFormatter(value);
                    } else if (parseInt(value) < 7) {
                        return `${forceEvolvableFormatter(value)} / ${maxRarityFormatter(value)}`;
                    } else {
                        return value + '???';
                    }
                }
            }
            columns.push(column);
        }
        $('#rarityTable').bootstrapTable({
            columns: columns,
            data: data,
        });
    });

    $.getJSON("json/cardDetail.json", function (data) {
        let tmpData = [];
        data.forEach((row, index, array) => {
            let currLv = {};
            currLv["level"] = row["level"];
            currLv["next exp."] = index < data.length - 1 ? array[index + 1]["experience"] : 'MAX';
            currLv["total exp."] = 0;
            for (let i = 0; i <= index; ++i) {
                currLv["total exp."] += array[i]["experience"];
            }
            currLv["total ticket"] = currLv["total exp."] / 100;
            currLv["scoreGrowthRate"] = row["scoreGrowthRate"];
            tmpData.push(currLv);
        });
        LvData = tmpData;

        let divideTable = '';
        for (let i = 0; i < LvData.length / 10; ++i) {
            divideTable += `<div class="col-xs-6 col-md-4"><table id="LvTable${i}"></table></div>`;
        }
        $(`#LvTableLabel`).html(loadLocaleGeneral('Level Experience Table', 'UI'));
        $(`#LvTableContent`).html(divideTable);
        let keys = Object.keys(LvData[0]);
        let columns = [];
        for (let key of keys) {
            let column = {
                field: key,
                title: loadHeaderLocale(fillTitle(key)),
            };
            switch (key.valueOf()) {
                case "scoreGrowthRate":
                    column.formatter = (value) => {
                        return value / 10 + '%';
                    };
                    break;
            }
            columns.push(column);
        }
        for (let i = 0; i < LvData.length / 10; ++i) {
            $(`#LvTable${i}`).bootstrapTable({
                columns: columns,
                data: LvData.slice(i * 10, (i + 1) * 10),
            });
        }

    });
    $.getJSON("json/cardTable.json", function (data) {
        // Make columns
        let keys = Object.keys(data[0]);
        let columns = [];
        for (let key of keys) {
            fieldList.push(key);
            let column = {
                field: key,
                title: loadHeaderLocale(fillTitle(key)),
                sortable: true,
                sorter: regexSorter,
                dependency: evolveDependent,
                formatter: translateFormatter,
                cellStyle : () => ({classes: "compact"}),
        };
            switch(key.valueOf()) {
                case "ID":
                    column.formatter = function(value, row) {
                        let rarity = rarityFormatter(row["rarity"], row);
                        return `<div class="cell-container"><div class="bottom-right">${rarity}</div></div>`;
                    };
                    column.sorter = (valueA, valueB, rowA, rowB)=> {
                        // Sort by rarity, then card ID.
                        let raritySort = regexSort(rowA["rarity"], rowB["rarity"]);
                        return raritySort ? raritySort : regexSort(valueA, valueB);
                    };
                    column.cellStyle = (value, row) => ({
                        css: {
                            "height": "76px",
                            "width": "128px",
                            "background-image":
                                `url(${cardImageSrc.replace("HOLDER", evolveDependent(value, row))})`,
                            "background-size": "100%",
                            "background-position": "0px -2px",
                            "background-repeat": "no-repeat",
                            "vertical-align": "bottom",
                        }});
                    break;
                case "lv":
                    column.width = "1px";
                    column.formatter = lvLimitFormatter;
                    column.editable = {
                        tpl: makeLvInput(60),   // not important: maxLv overwrite at runtime
                        mode: "inline",
                        showbuttons: "bottom",
                    };
                    break;
                case "minRarity":
                case "maxRarity":
                    column.formatter = key.valueOf() === "minRarity" ? minRarityFormatter : maxRarityFormatter;
                    column.visible = false;
                    break;
                case "rarity":
                    column.width = "2.5em";
                    column.formatter = rarityFormatter;
                    column.visible = false;
                    column.filterFormatter = rarityFilterFormatter;
                    break;
                case "score":
                    column.cellStyle = () => ({classes: "compact", css: {"width": "4.125em"}});
                    column.dependency = cardScoreDependent;
                    column.formatter = cardScoreFormatter;
                    column.visible = key.valueOf() === "score";
                    break;
                case "match":
                    column.cellStyle = () => ({
                        css: {
                            "width": "80px",
                        }});
                    column.formatter = logoFormatter;
                    column.dependency = undefined;
                    if (/Mobile|Opera Mini/i.test(navigator.userAgent)) {
                        column.visible = false;     // disable this column for mobile by default for better view.
                    }
                    break;
                case "effect": case "target":
                    column.formatter = loadLocaleQuan;
                    break;
                case "SSEffect":
                    column.formatter = paramsFormatterGraphical;
                    column.sortFormatter = paramsFormatter;
                    column.cellStyle = ()=>({classes: "compact", css:{"max-width": "17em"}});
                    break;
                case "SpecialSkillType":
                    column.visible = false;
                    break;
                case "CT":
                    column.formatter = CTFormatter;
                    break;
                case "binaryMap":
                    column.width = "1px";
                    column.sortter = rangeSorter;
                    column.formatter = rangeFormatter;
                    break;
                    // hidden
                case "cardName": case "category":
                    column.visible = false;
                    break;
                default:
            }
            columns.push(column);
        }
        $table.bootstrapTable({
            data: data,
            columns: columns,
            minimumCountColumns: 2,
            stickyHeader: true,
            stickyHeaderOffsetY: stickyHeaderOffsetY + 'px',
            toolbar: '#filter-bar',
            pagination: true,
            pageList: [9, 18, 40, 100, 200],
            pageSize: 9,
            paginationVAlign: "both",
            locale: readLang()
        }).on('editable-save.bs.table', (e, field, row, old) => {
            // update only if level make change
            if (row[field] !== old) {
                $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh
            }
        }).on('editable-shown.bs.table', (e, field, row, $el, editable) => {
            editable.input.$input.attr({"max": `${parseInt(row["rarity"])*10}`}); // Always correct Lv range.
        }).on('sort.bs.table', (e, name, order) => {
            if (name.valueOf() === 'match') {
                for (let row of $table.bootstrapTable('getData', false)) {
                    if (Array.isArray(row["match"])) {
                        let curOrder = row["match"][0]  < row["match"][1] ? 'asc' : 'desc';
                        if (curOrder.valueOf() !== order.valueOf()) {
                            row["match"].reverse();
                        }
                    }
                }
            }
        }).on('click-cell.bs.table', ($e, field, value, row) => {
            if (field.valueOf() === "ID") {
                let $detailLabel = $('#detailLabel');
                // Pop-up heading
                let titleText = translateFormatter(row['category']) + ' - ' + translateFormatter(row['cardName']);
                let logo = `${logoFormatter(row["match"])}`;
                $detailLabel.html(`<div class="flexer">${titleText}${logo}</div>`);
                let write = (which, text, formatter = undefined) => {
                    if (text.valueOf() === '-' || !text) {
                        return '';
                    }
                    if (which.valueOf() === 'skill') {
                        text = translateFormatter(row["trigger"]) + translateFormatter(text);
                    } else if (which.valueOf() === 'CT') {
                        // text = `<div class="flexer">${text} </div>`;
                    }
                    let textType = loadHeaderLocale(fillTitle(which));
                    if (formatter === undefined) {
                        formatter = (sth) => sth;
                    }
                    let rst;
                    if (Array.isArray(text)) {
                        let txt1 = `${translateFormatter(formatter(text[0]))} (${loadLocaleGeneral("未進化", "words")})</td>`,
                            txt2 = `${translateFormatter(formatter(text[1]))} (${loadLocaleGeneral("進化済", "words")})</td>`;
                        rst = `<td class="info"><div class="desciText">${txt1}</td></div>`;
                        rst += `<td class="info"><div class="desciText">${txt2}</td></div>`;
                    } else {
                        rst = `<td colspan="2"><div class="desciText">${translateFormatter(formatter(text))}</div></td>`;
                    }
                    return `<tr><td><div class="desciText">${textType}:</div></td>${rst}</tr>`;
                };
                let Description = `<img class="cut" src="${cardImageSrcL.replace("HOLDER", Array.isArray(value) ? value[0] : value)}">`;
                Description += `<br/>${minRarityFormatter(row["minRarity"], row)}`;
                if (evolvable(row)) {
                    Description = `<table class="bordlessTable"><tr><td>${Description}</td>`;
                    Description += `<td><img class="cut" src="${cardImageSrcL.replace("HOLDER", value[1])}">`;
                    Description += `<br/>${maxRarityFormatter(row["maxRarity"], row)}</td></tr></table>`;
                }
                Description += `<table class="bordlessTable">`;
                if (row["SpecialSkill"].valueOf() !== '-') {
                    Description += write("SpecialSkill", row["SpecialSkill"]);
                    Description += write("SSEffect", row["SSEffect"], paramsFormatter);
                    Description += write("binaryMap", row["binaryMap"], rangeFormatter);
                    Description += write("CT", row["CT"], CTFormatter);
                }
                if (row["skill"].valueOf() !== '-') {
                    Description += write("skill", row["skill"]);
                    Description += write("target", row["target"], loadLocaleQuan);
                    Description += write("effect", row["effect"], loadLocaleQuan);
                    Description += `</table>`;
                }
                let $detailContent = $('#detailContent');
                $detailContent.html(Description);
                let makeTable = '';
                for (let i = 0; i < parseInt(row["maxRarity"]); ++i) {
                    makeTable += `<div class="col-xs-4 col-md-2"><table id="detailTable${i}"></table></div>`;
                }
                let btnAttr = `data-toggle="collapse" data-target="#levelTable" aria-expanded="false" aria-controls="levelTable"`;
                let fieldName = `<div class="lefter">${loadLocaleGeneral("Show Level Score Table", "UI")}</div>`;
                let menuSym = `<div class="righter"><span class="glyphicon glyphicon-chevron-right"></span></div>`;
                let btn = `<button class="btn btn-info btn-block menu UI" data-v="Show Level Score Table" ${btnAttr} onclick="rotateArrow(this)">${fieldName}${menuSym}</button>`;
                $detailContent.append(`<p>${btn}<div class="collapse" id="levelTable">${makeTable}</div></p>`);
                let keys = Object.keys(LvData[0]);
                let columns = [];
                for (let key of keys) {
                    if (key === "next exp." || key === "total exp." || key === "total ticket") continue;
                    let column = {
                        field: key,
                        title: loadHeaderLocale(fillTitle(key)),
                        formatter: (value, curRow) => {
                            if (curRow["level"] > parseInt(row["minRarity"]) * 10) {
                                return `<div class="evolved">${value}</div>`
                            }
                            return value;
                        },
                    };
                    switch (key.valueOf()) {
                        case "scoreGrowthRate":
                            column.formatter = (value, curRow) => {
                                if (evolvable(row)) {
                                    let score = cardScoreFormatter(~~(value * row["score"][0] / 1000));
                                    let scoreEvolve = cardScoreFormatter(~~(value * row["score"][1] / 1000));
                                    if (curRow["level"] <= parseInt(row["minRarity"]) * 10) {
                                        return `<table><tr><td>${score}</td><td class="evolved">${scoreEvolve}</td></tr></table>`;
                                    } else {
                                        // Level must be evolved
                                        return `<div class="evolved">${scoreEvolve}</div>`;
                                    }
                                } else {
                                    return cardScoreFormatter(~~(value * row["score"] / 1000))
                                }
                            };
                            break;
                    }
                    columns.push(column);
                }
                for (let i = 0; i < parseInt(row["maxRarity"]); ++i) {
                    $(`#detailTable${i}`).bootstrapTable({
                        columns: columns,
                        data: LvData.slice(i * 10, (i + 1) * 10),
                    });
                }
                $('#detail').modal('show');
            }
        });
        filterGenerator(cardFilterable, data);
    });
});

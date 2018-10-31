const cardFilterable = [
    'minRarity', 'maxRarity', 'rarity', 'skill', 'trigger', 'match', 'SpecialSkillType', 'SpecialSkill', 'category'
];
const cardimageSrc = "https://puchi-xet.loveliv.es/cardsmall/cardsmallHOLDER.png";
const rarityList = {
    '1': 'N',
    '2': 'N',
    '3': 'R',
    '4': 'SR',
    '5': 'SSR',
    '6': 'UR',
};

let evolvable = (row)=> row["maxRarity"] > row["minRarity"];

let evolved = (row)=> evolvable(row) && row["rarity"] === row["maxRarity"];

let evolveAll = function (value) {
    $table.bootstrapTable('getData', false).forEach(function (row, i, array) {
        evolvable(row) ? (array[i]["rarity"] = (value ? row["maxRarity"] : row["minRarity"])) : '';
    });
    $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh
};

let evolveDependent = (value, row) => ( generalLvDependent(value, row, (row) => evolved(row) ? 1: 0) );

let cardScoreDependent = (value, row) => {
    value = evolveDependent(value, row);
    let targetLv = Math.min(parseInt(row["lv"]), parseInt(row["rarity"]) * 10);
    const record = LvData.find(entry => entry["level"] === targetLv);
    if (LvData === undefined || record === undefined) {return value;}   // handle unknown error fail load at 1st time
    return ~~(value * record["scoreGrowthRate"] / 1000);
};

let evolveEvent = function(self) {
    const record = $table.bootstrapTable('getData', false).find(entry => sanitize(entry.ID) === self.id);
    record["rarity"] = record[(record["rarity"] === record["minRarity"] ? "maxRarity" : "minRarity")];
    $table.bootstrapTable('updateByUniqueId', {id: 0});     // force refresh
};

let drawstar = (value, classes="")=> {
    if (!value) {return ''}
    if (!classes) { classes = rarityList[value]; }
    let img = makeLogo(classes);
    return img.repeat(value);
};

let maxRarityFormatter = (value) => drawstar(value);

let evolvableRarityFormatter = (value, row, evolved, event, css, evolvability) => {
    let color = rarityList[value];
    let extraStarClass = evolved ? color : "empty";
    if (evolvability !== undefined) { return drawstar(value) + drawstar(evolvability, "empty");}
    let extraStar = evolvable(row) ?
        `<img class="logo ${css}" id="${sanitize(row["ID"])}" src="${generalImg}${extraStarClass}.png" onclick="${event}(this)">`
        : '';
    return drawstar(value - evolved, color) + extraStar;
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


$(function () {
    $.getJSON("json/cardDetail.json", function (data) {
        let tmpData = [];
        data.forEach((row, index, array) => {
            let currLv = {};
            currLv["level"] = row["level"];
            currLv["next"] = index < data.length - 1 ? array[index + 1]["experience"] : 'MAX';
            currLv["total"] = 0;
            for (let i = 0; i <= index; ++i) {
                currLv["total"] += array[i]["experience"];
            }
            currLv["scoreGrowthRate"] = row["scoreGrowthRate"];
            tmpData.push(currLv);
        });
        LvData = tmpData;
    });
    $.getJSON("json/cardTable.json", function (data) {
        // Make columns
        let keys = Object.keys(data[0]);
        let columns = [];
        for (let key of keys) {
            let column = {
                field: key,
                title: capitalize(key),
                sortable: true,
                sorter: regexSorter,
                dependency: evolveDependent,
            };

            switch(column.field.valueOf()) {
                case "ID":
                    column.title = "Image";
                    column.formatter = function() {
                        return '';
                    };
                    column.sortable = false;
                    column.cellStyle = (value, row) => ({
                        css: {
                            "height": "72px",
                            "width": "128px",
                            "background-image":
                                `url(${cardimageSrc.replace("HOLDER", evolveDependent(value, row))})`,
                            "background-position": "28.125%",
                            "background-size": "100%",
                            "background-repeat": "no-repeat",
                        }});
                    break;
                case "lv":
                    column.width = "1px";
                    column.sortable = false;
                    column.formatter = lvLimitFormatter;
                    column.editable = {
                        tpl: `<input type='number' min=1 max=70 style='width:70px'>`,
                        mode: "inline",
                        showbuttons: "bottom",
                    };
                    break;
                case "minRarity":
                case "maxRarity":
                    column.formatter = column.field.valueOf() === "minRarity" ? minRarityFormatter : maxRarityFormatter;
                    column.visible = false;
                    break;
                case "rarity":
                    column.width = "50px";
                    column.formatter = rarityFormatter;
                    break;
                case "scoreBase":
                case "score":
                    column.width = "1px";
                    column.dependency = cardScoreDependent;
                    column.formatter = cardScoreFormatter;
                    column.visible = column.field.valueOf() === "score";
                    break;
                case "match":
                    column.width = "90px";
                    column.formatter = logoFormatter;
                    column.dependency = undefined;
                    break;
                case "SSEffect":
                    column.formatter = paramsFormatterGraphical;
                    column.sortFormatter = paramsFormatter;
                    break;
                case "SpecialSkillType":
                    column.title = 'SSType';
                    column.visible = false;
                    break;
                case "SpecialSkill":
                    column.title = 'SS';
                    break;
                case "CT":
                    column.formatter = CTFormatter;
                    break;
                case "binaryMap":
                    column.sortable = false;
                    column.formatter = rangeFormatter;
                    column.title = "Range";
                    column.width = '60px';
                    break;
                case "evolve":
                    column.width = "1px";
                    column.sortable = false;
                    column.visible = false;
                    column.formatter = function(value, row) {
                        let disable = (row["minRarity"] === row["maxRarity"] ? "disabled" : "");
                        let status = `name="${sanitize(row["ID"])}" ${value ? "checked" : ""} ${disable}`;
                        return `<input type="checkbox" onclick="evolveEvent(this)" ${status}>`;
                    };
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
                let titleText = row['category'] + ' - ' + row['cardName'];
                let logo = `${logoFormatter(row["match"])}`;
                $detailLabel.html(`<div class="flexer">${titleText}${logo}</div>`);
                const words = {
                    target: "条件",
                    CT: "CT",
                    effect: "効果",
                    SSEffect: "効果",
                    binaryMap: "Range",
                    SpecialSkill: "SS",
                    skill: "Skill",
                    rarity: "Rarity",
                };
                let write = (which, text, formatter = undefined) => {
                    if (text.valueOf() === '-' || !text) {
                        return '';
                    }
                    if (which.valueOf() === 'skill') {
                        text = row["trigger"] + text;
                    } else if (which.valueOf() === 'CT') {
                        // text = `<div class="flexer">${text} </div>`;
                    }
                    let textType = words[which];
                    if (formatter === undefined) {
                        formatter = (sth) => sth;
                    }
                    let rst;
                    if (Array.isArray(text)) {
                        rst = `<td class="info"><div class="desciText">${formatter(text[0])} (未進化)</td></div>`;
                        rst += `<td class="info"><div class="desciText">${formatter(text[1])} (進化済)</td></div>`;
                    } else {
                        rst = `<td colspan="2"><div class="desciText">${formatter(text)}</div></td>`;
                    }
                    return `<tr><td><div class="desciText">${textType}:</div></td>${rst}</tr>`;
                };
                let Description = `<img class="cut" src="${cardimageSrc.replace("HOLDER", Array.isArray(value) ? value[0] : value)}">`;
                Description += `<br/>${minRarityFormatter(row["minRarity"], row)}`;
                if (evolvable(row)) {
                    Description = `<table class="bordlessTable"><tr><td>${Description}</td>`;
                    Description += `<td><img class="cut" src="${cardimageSrc.replace("HOLDER", value[1])}">`;
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
                    Description += write("target", row["target"]);
                    Description += write("effect", row["effect"]);
                    Description += `</table>`;
                }
                let $detailContent = $('#detailContent');
                $detailContent.html(Description);
                let makeTable = '';
                for (let i = 0; i < parseInt(row["maxRarity"]); ++i) {
                    makeTable += `<div class="col-md-4"><table id="detailTable${i}"></table></div>`;
                }
                let btnAttr = `data-toggle="collapse" data-target="#levelTable" aria-expanded="false" aria-controls="levelTable"`;
                let btn = `<button class="btn btn-info btn-block menu" ${btnAttr}>${"Show Level table"}</button>`;
                $detailContent.append(`${btn}<br/><div class="collapse" id="levelTable">${makeTable}</div>`);
                let keys = Object.keys(LvData[0]);
                let columns = [];
                for (let key of keys) {
                    let column = {
                        field: key,
                        title: capitalize(key),
                        width: "1px",
                        formatter: (value, curRow) => {
                            if (curRow["level"] > parseInt(row["minRarity"]) * 10) {
                                return `<div class="evolved">${value}</div>`
                            }
                            return value;
                        },
                    };
                    switch (key.valueOf()) {
                        case "scoreGrowthRate":
                            column.title = "Score";
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
                        case "level":
                            column.title = 'lv';
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

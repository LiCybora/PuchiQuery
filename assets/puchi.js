// selector
let $detailATable = $('#detailATable');
let $detailPTable = $('#detailPTable');
// JSON data storage
let selectedScoreRise = 0;
let selectedScoreBase = 0;
// constant
const detailACol = ['skillLevel', 'next exp.', 'total exp.', 'effect value', 'cost', 'range'];
const detailPCol = ['level', 'effect'];
const puchiFilterable = [
    'costume', 'name', 'class', 'group', 'unit',
    'passiveSkill', 'condition', 'skillType', 'activeSkill'
];
const imageSrc = "https://puchi-xet.loveliv.es/sprawlpict/sprawlpictHOLDER.png";
const formatter = {
    "range": rangeFormatter,
    "effect value": paramsFormatter,
    "effect": passiveFormatter,
};

let scoreDependent = (value, row) => value + (row["lv"] - 1) * row["score/lv"];
let ALvDependent = (value, row) => generalLvDependent(value, row, (row) => row["S.Lv"] - 1);
let PLvDependent = (value, row) => generalLvDependent(value, row, (row) => ~~(row["lv"] / 10));

let renderScoreTable = (base, rise) =>  {
    // Render Score
    const field = [
        'level_01-10', 'score_01-10',
        'level_11-20', 'score_11-20',
        'level_21-30', 'score_21-30',
        'level_31-40', 'score_31-40',
        'level_41-50', 'score_41-50',
    ];
    let scol = [];
    let sdata = [];
    for (let i = 0; i < 10; ++i) {
        let entry = {};
        field.forEach(function(field) {
            let fieldTitle = field.slice(0,5);
            if (i === 0) {
                scol.push({
                    field: field,
                    title: fillTitle(fieldTitle),
                    formatter: (($('input[name=bonus]:checked').val() > 100 && (fieldTitle.valueOf() === "score")) ?
                        (function(value) { return `<text class="blinking">${value}</text>`;}) : idleFormatter),
                });
            }
            let number = parseInt(field.slice(6,8));
            if (fieldTitle.valueOf() === "level") {
                entry[field] = number + i;
            } else {
                entry[field] = ~~((base + rise * (number + i - 1))
                    * $('input[name=bonus]:checked').val() / 100);
            }
        });
        sdata.push(entry);
    }
    let scoreInfo = `<div class="desciText">Score: ${base} (at Lv 1 no bonus) `;
    scoreInfo += `(+${rise} per Lv)</div>`;
    $('#scoreContent').html(scoreInfo);
    $('#scoreTable').bootstrapTable('destroy');
    $('#scoreTable').bootstrapTable({
        columns: scol,
        data: sdata,
    });
};

let renderActiveTable = (row, detailCol, lvDependent, table)=> {
    const extraData = LvData.find(entry => entry.ID === row.ID);   // Get correct record
    const lvSize = extraData[detailCol[1]] === undefined ? row[detailCol[1]].length : extraData[detailCol[1]].length;
    const skillLevel = [...Array(lvSize).keys()].map(x => ++x);
    let totalExp = [];
    if (detailCol.includes("total exp.")) {
        for (let i = 0; i < skillLevel.length; ++i) {
            let rst = 0;
            for (let j = 0; j < i; ++j) {
                rst += extraData["next exp."][j];
            }
            totalExp.push(rst);
        }
    } else {totalExp = undefined;}
    let col =[];
    let data = [];
    for (let i = 0; i < skillLevel.length; ++i) {
        let thisEntry = {};
        for (const field of detailCol) {
            if (field.valueOf() === 'range' && !Array.isArray(row[field]) && row[field].length < 64) break;
            if (i === 0) {
                // init col
                col.push({
                    field: field,
                    title: fillTitle(field),
                    formatter: formatter[field],
                    dependency: lvDependent,
                });
            }
            let record = (row[field] === undefined) ?
                (extraData[field] === undefined ?  totalExp : extraData[field] ) : row[field];
            if (field.valueOf() === detailCol[0]) {
                record = skillLevel;
            }
            thisEntry[field] = Array.isArray(record) ? record[i] : record;
        }
        data.push(thisEntry);
    }
    table.bootstrapTable('destroy')
    table.bootstrapTable({
        columns: col,
        data: data,
        uniqueId: detailCol[0],
        rowStyle: function() {
            return {
                css: {"line-height": "0.8",}
            };
        },
    });
};

let changeBonus = function() {
    renderScoreTable(selectedScoreBase, selectedScoreRise);
};

let imageFormatter = function(value) {
    let src = imageSrc.replace("HOLDER", `${value}`);
    return `<img src="${src}" width = "50px" height="50px">`;
};

// OnLoad
$(function () {
    // Load lv-dependent data
    $.getJSON("json/puchiDetail.json", function (skillData) {
        LvData = skillData;
    });
    // Load display data
    $.getJSON("json/puchiTable.json", function (data) {
        // Make columns
        let keys = Object.keys(data[0]);
        let columns = [];
        for (let key of keys) {
            let column = {
                field: key,
                title: fillTitle(key),
                sortable: true,
                sorter: regexSorter,

            };
            switch (column.field.valueOf()) {
                case "ID":
                    column.formatter = imageFormatter;
                    column.sortable = false;
                    break;
                case "group": case "unit": case "class": case "costume": case "name": case "score/lv":
                    column.visible = false;
                    break;
                case "lv": case "S.Lv":
                    column.editable = {
                        tpl: `<input type='number' min=1 max=${(column.field.valueOf()==="lv"?50:10)} style='width:70px'>`,
                        mode: "inline",
                        showbuttons: "bottom",
                    };
                    column.sortable = false;
                    column.width = '1px';
                    break;
                case "score":
                    column.dependency = scoreDependent;
                    column.formatter = scoreFormatter;
                    break;
                case "passiveSkil":
                case "condition":
                    column.dependency = PLvDependent;
                    break;
                case "rate":
                    column.dependency = PLvDependent;
                    column.formatter = passiveRateFormatter;
                    column.sortFormatter = passiveRateFormatter;
                    break;
                case "effect":
                    column.dependency = PLvDependent;
                    column.formatter = passiveEffectFormatter;
                    column.sortFormatter = passiveEffectFormatter;
                    break;
                case "cost":
                    column.dependency = ALvDependent;
                    column.width = '1px';
                    break;
                case "skillType":
                    column.visible = false;
                case "effect value":
                    column.formatter = paramsFormatterGraphical;
                    column.sortFormatter = paramsFormatter;
                case "activeSkill":
                    column.dependency = ALvDependent;
                    break;
                case "range":
                    column.formatter = rangeFormatter;
                    column.width = "60px";
                    column.sortable = false;
                    column.dependency = ALvDependent;
                    break;
            }
            columns.push(column)
        }
        $table.bootstrapTable({
            data: data,
            columns: columns,
            stickyHeader: true,
            stickyHeaderOffsetY: stickyHeaderOffsetY + 'px',
            toolbar: '#filter-bar',
            pagination: true,
            pageList: [9, 18, 40, 100, 200],
            pageSize: 9,
            uniqueId: "ID",
            paginationVAlign: "both",
        }).on('editable-save.bs.table', function(e, field, row, old, $el) {
            // update only if level make change
            if (row[field] !== old) {
                $table.bootstrapTable('updateByUniqueId', {id: 0});    // refresh
            }
        }).on('click-cell.bs.table', function($element, field, value, row) {
            // Show Details when entry clicked
            if (field.valueOf() === "ID") {
                let $detailLabel = $('#detailLabel');
                // Pop-up heading
                $detailLabel.text(row['costume'] + ' - ' + row['name']);
                $detailLabel.append(`<img class="righter" src="${memberImg}${row.ID}.png" width="100px">`);
                // Render Active skill table
                let Description = `<div class="desciText">Active Skill: ${row['activeSkill']}</div>`;
                Description += `<div class="desciText">Skill Type: ${row['skillType']}</div>`;
                $('#detailContentA').html(Description);
                renderActiveTable(row, detailACol, ALvDependent, $detailATable);
                // Render Passive Skill table
                Description = `<div class="lefter">Passive Skill: ${row['passiveSkill']}</div>`;
                Description += `<div class="righter">Trigger Condition: ${row['condition']}</div>`;
                $('#detailContentP').html(Description);
                renderActiveTable(row, detailPCol, PLvDependent, $detailPTable);
                selectedScoreBase = row["score"];
                selectedScoreRise = row["score/lv"];
                renderScoreTable(selectedScoreBase, selectedScoreRise);
                // Popup show details
                $('#detail').modal('show');
            }
        });
        // Render filter option
        filterGenerator(puchiFilterable, data);
    });
});
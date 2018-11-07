let locale = {};
let $table = $('#table');

let readLocale = (file) => {
    $.getJSON(file, (data) => {
        locale = data;
    });
};

let checkFile = (file) => {
    let response = jQuery.ajax({
        url: file,
        type: 'HEAD',
        async: false
    }).status;
    return (response === 200);
};

let applyLocale = (lang) => {
    if (checkFile(`assets/locale/${lang}.json`)) {
        readLocale(`assets/locale/${lang}.json`);
        changeTableLocale(lang);
    } else if (checkFile(`assets/locale/${lang.split('-')[0]}.json`)) {
        readLocale(`assets/locale/${lang.split('-')[0]}.json`);
        changeTableLocale(lang);
    } else {
        return false;
    }
    return true;
};

let changeTableLocale = (lang) => {
    if (lang.indexOf('zh') !== -1 && lang.valueOf() !== 'zh-CN') lang = 'zh-TW';
    // update table
    $table.bootstrapTable("changeLocale", lang);
}

let loadLocaleGeneral = (value, area) => (
    value in locale[area] && locale[area][value] ? locale[area][value] : value
);

function setCookie(cname, cvalue, exdays) {
    let d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    let expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

let readLang = ()=> {
    let lastLang = getCookie('lang');
    if (lastLang === '') {
        // use browser prefer language as identifier
        return setLocale(navigator.languages
            ? navigator.languages
            : navigator.language);
    } else {
        // use last setting if exist
        return setLocale(lastLang);
    }
};

let setLocale = (lang) => {
    let rst = false;
    if (Array.isArray(lang)) {
        for (const each of lang) {
            rst = applyLocale(each);
            if (rst) {
                break;
            }
        }
    } else {
        rst = applyLocale(lang);
    }
    if (rst) {
        // locale found. record cookie
        setCookie('lang', lang, 30);
        return lang;
    } else {
        // Use English if none of locale match. This is to avoid client lack of font display japanese character.
        applyLocale('en');
        return 'en-US';
    }
};

$(function () {
    if (/Trident\/\d./i.test(navigator.userAgent)){
        // This is Microsoft Edge
        window.alert('IE is not supported! Please use Firefox or Chromium and come back again!');
    }
    $.ajaxSetup({
        async: false
    });
    readLang();
    $('#intro').html(locale["msg"]["text"]);
    // UI localize
    // FIXME: These are all hardcoded!
    let $localHead = $('#localeHead');
    $localHead.text(`${loadLocaleGeneral('title', 'msg')} - ${loadLocaleGeneral($localHead.data('v'), "UI")}`);
    $('#topBtn').html(`
        <a type="button" href="puchi.html" target="_parent" class="btn btn-primary .btn-lg" role="button">
            <img class="logo" src="assets/img/puchi.png"> <span class="UI" data-v="Puchi">${loadLocaleGeneral('Puchi', 'UI')}</span>
        </a>
        <a type="button"  href="card.html" target="_parent" class="btn btn-primary .btn-lg" role="button">
            <img class="logo" src="assets/img/IconCard.png"> <span class="UI" data-v="Card">${loadLocaleGeneral('Card', 'UI')}</span>
        </a>
        <a type="button" href="https://github.com/LiCybora/PuchiQuery/" target="_parent" class="btn btn-info .btn-lg" role="button">
            <img class="logo" src="assets/img/github.png"> <span class="UI" data-v="Feedback">${loadLocaleGeneral('Feedback', 'UI')}</span>
        </a>`
    );
    $('#filter-bar').html(`
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#filter">
            <span class="glyphicon glyphicon-filter"></span> <span class="UI" data-v="Filter">${loadLocaleGeneral('Filter', 'UI')}</span>
        </button>`
    );
    $('#filterBtnTop').html(`
         <button class="btn btn-default" id="collapseAll">
            <span class="glyphicon glyphicon-expand"></span> <span class="UI" data-v="Collapse All">${loadLocaleGeneral('Collapse All', 'UI')}</span>
        </button>
        <button class="btn btn-default" id="expandAll">
            <span class="glyphicon glyphicon-collapse-down"></span> <span class="UI" data-v="Expand All">${loadLocaleGeneral('Expand All', 'UI')}</span>
        </button>`
    );

    $('#filterBtnBottom').html(`
        <button type="button" class="btn btn-success" onclick="filterApply()">
            <span class="glyphicon glyphicon-ok"></span> <span data-v="Apply" class="UI">${loadLocaleGeneral('Apply', 'UI')}</span>
        </button>
        <button type="button" class="btn btn-warning" onclick="resetFilter()">
            <span class="glyphicon glyphicon glyphicon-repeat"></span> <span data-v="Reset" class="UI">${loadLocaleGeneral('Reset', 'UI')}</span>
        </button>
        <button type="button" class="btn btn-danger" data-dismiss="modal">
            <span class="glyphicon glyphicon-remove"></span> <span data-v="Close" class="UI">${loadLocaleGeneral('Close', 'UI')}</span>
        </button>`
    );
    $('#filterHead').html(`<h2 class="modal-title UI" data-v="Filter" id="filterLabel">${loadLocaleGeneral('Filter', 'UI')}</h2>`);
    $('#detailBtn').html(`
        <button type="button" class="btn btn-danger" data-dismiss="modal">
            <span class="glyphicon glyphicon-remove"></span> <span data-v="Close" class="UI">${loadLocaleGeneral('Close', 'UI')}</span>
        </button>
    `);
    $(this).attr('title', $localHead.text());

});

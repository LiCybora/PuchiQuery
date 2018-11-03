let locale = {};

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
    } else if (checkFile(`assets/locale/${lang.split('-')[0]}.json`)) {
        readLocale(`assets/locale/${lang.split('-')[0]}.json`);
    } else {
        return lang === 'ja'
    }

    return true;
};

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
    } else {
        // Use English if none of locale match. This is to avoid client lack of font display japanese character.
        applyLocale('en');
    }
};

$(function () {
    $.ajaxSetup({
        async: false
    });
    let lastLang = getCookie('lang');
    if (lastLang === '') {
        // use browser prefer language as identifier
        setLocale(navigator.languages
            ? navigator.languages
            : navigator.language);
    } else {
        // use last setting if exist
        setLocale(lastLang);
    }
    $('#intro').html(locale["msg"]["text"]);
});

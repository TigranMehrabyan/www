/*
db.update({_id: "05af8mE3WBGsbPPm"}, { $set: { level: 22 } }, {});

db.findOne({ _id: "05af8mE3WBGsbPPm" }, function (err, user) {

    console.log(user.level);

});
*/

const fs = require('fs');

const md5 = require('js-md5');

const geoip = require('geoip-lite');

const nodemailer = require('nodemailer');

const atpl = require('atpl');

const xml2js = require('xml2js');

const axios = require('axios');

function Utils() {}

Utils.prototype.md5 = function(string) {

    if (!string) return false;

	return md5(string);

}

Utils.prototype.getRandomInt = function(min, max) {

    return Math.floor(Math.random() * (max - min + 1)) + min;

}

Utils.prototype.parseCookies = function(req) {

    var list = {}, rc = req.headers.cookie;

    rc && rc.split(';').forEach(function(cookie) {

        var parts = cookie.split('=');

        list[parts.shift().trim()] = unescape(parts.join('='));

    });

    return list;

}

Utils.prototype.getDomain = function(url) {

    if (!url) return false;

    return url.replace('http://','').replace('https://','').split(/[/?#]/)[0];

}

Utils.prototype.getDate = function(mills, type, withoutHours, separator) {

    var output, date = (mills) ? new Date(mills) : new Date();

    var sep = (separator !== undefined) ? separator : ".";

    var year = date.getFullYear();

    var month = date.getMonth() + 1; if (month < 10) month = '0' + month;

    var day = date.getDate(); if (day < 10) day = '0' + day;

    output = (type === 2) ? (day + sep + month + sep + year) : (year + sep + month + sep + day);

    if (withoutHours) return output;

    var hour = date.getHours(); if (hour < 10) hour = '0' + hour;

    var minute = date.getMinutes(); if (minute < 10) minute = '0' + minute;

    return output + " " + hour + ":" + minute;

}

Utils.prototype.translit = function(string, lang) {

    if (!string || typeof string !== "string") return false;

    String.prototype.replaceArray = function(find, replace) {

        var replaceString = this, regex;

        for (var i = 0; i < find.length; i++) {

            regex = new RegExp(find[i], "gi");

            replaceString = replaceString.replace(regex, replace[i]);

        }

        return replaceString;

    };

    var armLetters = ['եւ', 'ու', 'և', 'ա', 'բ', 'գ', 'դ', 'ե', 'զ', 'է', 'ը', 'թ', 'ժ', 'ի', 'լ', 'խ', 'ծ', 'կ', 'հ', 'ձ', 'ղ', 'ճ', 'մ', 'յ', 'ն', 'շ', 'ո', 'չ', 'պ', 'ջ', 'ռ', 'ս', 'վ', 'տ', 'ր', 'ց', 'փ', 'ք', 'օ', 'ֆ'];

    var rusLetters = ['а', 'б', 'в', 'г', 'д', 'е', 'ё', 'ж', 'з', 'и', 'й', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'ъ', 'ы', 'ь', 'э', 'ю', 'я'];

    var rusTranslit = ['a', 'b', 'v', 'g', 'd', 'e', 'yo', 'zh', 'z', 'i', 'y', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'kh', 'c', 'ch', 'sh', 'sch', '', 'i', '', 'e', 'yu', 'ya'];

    var armTranslit = ['ev', 'u', 'ev', 'a', 'b', 'g', 'd', 'e', 'z', 'e', 'y', 't', 'zh', 'i', 'l', 'kh', 'ts', 'k', 'h', 'dz', 'gh', 'ch', 'm', 'y', 'n', 'sh', 'o', 'ch', 'p', 'j', 'r', 's', 'v', 't', 'r', 'c', 'p', 'q', 'o', 'f'];

    if (lang === 'arm') {

        string = string.replaceArray(armLetters, armTranslit);

    } else if (lang === 'english') {

        string = string.replaceArray(rusLetters, rusTranslit);

    } else {

        string = string.replaceArray(armLetters, armTranslit).replaceArray(rusLetters, rusTranslit);

    }

    return string;

}

Utils.prototype.copy = function(mainObj) {

    if (mainObj === null || typeof mainObj !== "object") return null;

    var objCopy = {}, key;

    for (key in mainObj) {

        objCopy[key] = mainObj[key];

    }

    return objCopy;

}

Utils.prototype.correctUserName = function(name) {

    name = name.replace(/[^A-Za-z\s\-\u0410-\u044F\u0531-\u0587]/g,'').trim();

    name = name.replace(/(?=(\s))\1{2,}/g, "$1");

    name = name.replace(/(?=(.))\1{3,}/g, "$1");

    name = name.toLowerCase();

    //name = utils.translit(name);

    name = name.replace(/^(.)|\s(.)/g, function(l) {return l.toUpperCase()});

    if (name.length < 3) name = "User " + this.getRandomInt(100, 999);

    else if (name.length > 20) name = name.substr(0, 20);

    return name;

}

Utils.prototype.validateEmail = function(email) {

    return email.match(/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/);

}

Utils.prototype.userSignIn = function(dataUser, res, db) {

    var nowTime = Date.now();

    var authKey = md5(dataUser._id + dataUser.password + nowTime).substr(2, 22);

    db.Users.update({_id: dataUser._id}, { $set: { logDate: nowTime, authKey: authKey } }, {});

    return res.json({authKey: authKey});

}

Utils.prototype.sorting = function(keys, defaultIndex, query) {

    if (!defaultIndex && !query.sort) return {};

    var sort = (query.sort) ? query.sort*1 : defaultIndex;

    var sortKey = keys[sort-1] || keys[defaultIndex-1];

    var sortVal = (query.reverse) ? 1 : -1;

    return {[sortKey]: sortVal};

}

Utils.prototype.pagination = function(page, perPage, count, req, res) {

    var pages = Math.ceil(count / perPage);

    if (count === 0) {

        req.data.page = page;

        req.data.pages = pages;

        return;

    }

    if (page > pages) {

        req.error = true; return;

    }

    var i = (page > 5 ? page - 4 : 1);

    var pageInList = i, showPagesList = [];

    for (; i <= (page + 4) && i <= pages; i++) {

        showPagesList.push(i);

    }

    var pagesUri = req.baseUrl + req._parsedUrl.pathname, i = 0;

    for (var key in req.query) {

        if (key !== "p") {

            var value = req.query[key];

            if (Array.isArray(value)) value = value.pop();

            pagesUri += (i === 0) ? "?" : "&";

            pagesUri += key+"="+value;

            i++;

        }

    }

    pagesUri += (i === 0) ? "?" : "&";

    req.data.pagesUri = pagesUri;

    req.data.page = page;

    req.data.pages = pages;

    req.data.pageInList = pageInList;

    req.data.showPagesList = showPagesList;

}

Utils.prototype.cashback = function(cashback) {

    // cashback = x-y%  x-y$  x-yr

    if (!cashback) return false;

    var output = {};

    var k = cashback.substr(-1);

    if (k !== '%' && k !== '$' && k !== 'r') return false;

    output.k = k;

    cashback = cashback.slice(0, -1);

    cashback = cashback.split('-');

    for (var i = 0; i < cashback.length; i++) {

        cashback[i] *= 1;

        if (isNaN(cashback[i])) return false;

    }

    if (cashback.length === 1) {

        output.val = cashback[0];

    } else if (cashback.length === 2) {

        output.from = cashback[0];

        output.to = cashback[1];

    } else return false;

    //console.log(output);

    return output;

}

Utils.prototype.getDiscountCaskbackOutput = function(cashback, data) {

    var discountProcent = 0, discounts = data.discounts;

    if (!discounts.length) return false;

    for (var j = 0; j < discounts.length; j++) {

        discountProcent = discounts[j];

        if (discountProcent !== 0) break;

    }

    if (discountProcent === 0) return false;

    return this.getCaskbackOutput(cashback, data, discountProcent);

}

Utils.prototype.getCaskbackOutput = function(cashback, data, discountProcent) {

    /* cashback:
        from
        to
        val
        k
    */

    cashback = this.cashback(cashback);

    if (!cashback) return false;

    if (cashback.k === "r") cashback.k = data.langs.currency_r;

    var userStatus = data.user.status || 1;

    var userProcent = data.configs.userProcent;

    var userPocentAdd = (userStatus - 1) * data.configs.userProcentGrowth;

    userProcent += userPocentAdd;

    if (discountProcent) userProcent += this.toFixed(userProcent * discountProcent / 100);

    if (userProcent > 100) userProcent = 100;

    if (cashback.val) {

        var val = this.toFixed(cashback.val * userProcent / 100);

        return val + ' ' + cashback.k;

    }

    var to = this.toFixed(cashback.to * userProcent / 100);

    if (cashback.from === 0) {

        return data.langs.upto + ' ' + to + ' ' + cashback.k;

    }

    var from = this.toFixed(cashback.from * userProcent / 100);

    return from + ' - ' + to + ' ' + cashback.k;

}

Utils.prototype.getAllCountriesList = function(selectedCodes, lang, all) {

    var returnData = {

        data: {},
        allItem: (all) ? true : false,
        selectedCodes: []

    };

    if (!lang) lang = 1;

    returnData.data = require("../langs/countries_" + lang + ".json");

    if (typeof selectedCodes === "string" && selectedCodes.length === 2) selectedCodes = [selectedCodes];

    if (selectedCodes && Array.isArray(selectedCodes) && selectedCodes.length) returnData.selectedCodes = selectedCodes;

    return returnData;

}

Utils.prototype.getCustomCountriesNames = function(codes, lang) {


    if (!codes || !Array.isArray(codes) || !codes.length) return [];

    if (codes.length === 1 && codes[0] === "all") return ["all"];

    if (!lang) lang = 1;

    var countriesData = require("../langs/countries_" + lang + ".json");

    var returnData = [];

    for (var i = 0; i < codes.length; i++) {

        if (countriesData[codes[i]]) returnData.push(countriesData[codes[i]]);

    }

    return returnData;

}

Utils.prototype.getCountryName = function(code, lang) {

    if (!code || typeof code !== "string" || code.length !== 2) return "";

    if (!lang) lang = 1;

    var countriesData = require("../langs/countries_" + lang + ".json");

    return countriesData[code] || "";

}

Utils.prototype.getCountryByIp = function(ip) {

    if (!ip) return {name: "", code: false};

    if (ip === '127.0.0.1') return {name: 'Armenia', code: 'AM'};

    var geoData = geoip.lookup(ip);

    if (!geoData || !geoData.country) return {name: "", code: false};

    return {name: this.getCountryName(geoData.country), code: geoData.country};

}

Utils.prototype.getCountOf = function(search, inList, mutchKey) {

    var mutchList = [], count = 0;

    if (mutchKey.indexOf(".") !== -1) {

        mutchKey = mutchKey.split(".");

    }

    if (Array.isArray(mutchKey)) {

        for (var i = 0; i < inList.length; i++) {

            mutchList.push(inList[i][mutchKey[0]][mutchKey[1]]);

        }

    } else {

        for (var i = 0; i < inList.length; i++) {

            mutchList.push(inList[i][mutchKey]);

        }

    }

    for (var i = 0; i < mutchList.length; i++) {

        if (Array.isArray(mutchList[i])) {

            if (mutchList[i].indexOf(search) !== -1) count++;

        } else if (search === mutchList[i]) count++;

    }

    return count;

}

Utils.prototype.toFixed = function(number, limit) {

    if (!limit) limit = 1;

    if (typeof number !== "number" || number === NaN) return false;

    var string = number + "";

    var splitingArray = string.split(".");

    if (splitingArray.length !== 2) return string*1;

    if (splitingArray[1].length < limit) return string*1;

    var newString = splitingArray[0] + "." + splitingArray[1].substr(0, limit);

    return newString*1;

}

Utils.prototype.exchange = function(val, rate, from, to) {

    /*
    var exchangeLink = 'https://free.currencyconverterapi.com/api/v6/convert?q='+ currency + '_USD&compact=ultra';

    request(exchangeLink, function (err, res2, exchangeJson) {

        if (currency !== "USD") {

            var exchangeRate;

            if (!err) {

              var exchangeData = JSON.parse(exchangeJson);

              exchangeRate = exchangeData[currency + '_USD'];

            }

            if (currency === "RUB" && !exchangeRate) exchangeRate = 0.014;

            var oldIncome = income;

            order_sum = utils.exchange(order_sum, exchangeRate, currency, "USD");

            income = utils.exchange(income, exchangeRate, currency, "USD");

            console.log("income " + oldIncome + " " + currency + " = " + income + " $");

        }
    */

    if (!from || !to || !rate) return false;

    rate *= 1;

    rate = rate * (1 - 3.05/100);

    var key = from + '_' + to;

    return this.toFixed((val * rate), 3);

}

Utils.prototype.getMillisecondsToday = function() {

  var date = new Date();

  return (date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()) * 1000;

};

Utils.prototype.readModuleFile = function(path, callback) {

    try {

        var filename = require.resolve(path);

        fs.readFile(filename, 'utf8', callback);

    } catch (e) {

        callback(e);

    }

    /* utils.readModuleFile("../views/mail.html", function (err, html) {});*/

}

Utils.prototype.sendMail = function(options, data, callback) {

    if (!options || (options.html && !data) || !options.to || (!options.text && !options.html)) return callback();

    if (Array.isArray(options.to)) options.to = options.to.join(', ');

  var transporter = 	nodemailer.createTransport({
  pool: true,
  host: "mail.adm.tools",
  port: 465,
  secure: true, // use TLS
  auth: {
   user: 'support@promocash.pro',
            pass: '7h-g9#8DY^fG',
  },
});



    var sendMail = function(mailOptions) {

        transporter.sendMail(mailOptions, function(error, info) {

            if (error) return callback(error);

            return callback({success: true, info: info.response})

        });

    }

    var mailLangs = require("../langs/mails.json");

    var mailLang = options.lang || 1;

    mailLangs = mailLangs[['rus','eng'][mailLang-1]];

    var mailOptions = {

        from: options.from || 'support@promocash.pro',
        to: options.to,
        subject: options.subject || mailLangs[options.html+'_subject']

    };

    if (data) {

        data.title = mailOptions.subject;

        data.langs = mailLangs;

    }

    if (options.text) {

        mailOptions.text = options.text;

        return sendMail(mailOptions);

    }

    if (options.html) {

        this.loadMailTemplate(options.html, data, function(htmlTemplate) {

            mailOptions.html = htmlTemplate;

            return sendMail(mailOptions);

        });

    }

}

Utils.prototype.loadMailTemplate = function(template, data, callback) {

    var path = '../views/mail/';

    var file = template + '.html';

    atpl.renderFile(path, file, data, false, function(err, htmlTemplate) {

        if (err) console.log(err);

        callback(htmlTemplate);

    });

}

Utils.prototype.uploadPhoto = function(options, callback) {

    var sharp = require('sharp');

    sharp.cache(false);

    var errorHandler = function(tmpFilePath) {

        fs.unlink(tmpFilePath, (err) => {

            if (err) console.log(err.toString());

            callback("error");

        });

    }

    var file = options.file, path = options.path, newNamePrefix = options.newNamePrefix;

    var ext = file.mimetype.split('/').pop();

    if (ext !== "png" && ext !== "jpeg") return errorHandler(file.path);

    if (ext === "jpeg") ext = "jpg";

    if (!newNamePrefix) newNamePrefix = "photo_";

    if (!options.width) options.width = null;

    if (!options.height) options.height = null;

    var newFileName = newNamePrefix + this.getRandomInt(10, 99) + Date.now() + "." + ext;

    sharp(file.path).resize(options.width, options.height).toFile(path + newFileName, (err, info) => {

        if (err) return errorHandler(file.path);

        fs.unlink(file.path, (err) => {

            if (err) console.log(err.toString());

            if (!options.removeOldFile) return callback(false, newFileName);

            fs.unlink(path + options.removeOldFile, (err) => {

                if (err) console.log(err.toString());

                callback(false, newFileName);

            });

        });

    });

}

Utils.prototype.createCategories = function(categories, lang, categoryPageId) {

    if (!categories.length) return {list: false, data: false};

    var parents = [], childrens = [], pageData, parentPageData;

    for (var i = 0; i < categories.length; i++) {

        categories[i].name = categories[i]["name"+lang];

        if (categories[i].parentId) {

            childrens.push(categories[i]);

        } else {

            categories[i].childs = [];

            parents.push(categories[i]);

        }

        if (categoryPageId && categories[i]._id === categoryPageId) pageData = categories[i];

    }

    for (var i = 0; i < childrens.length; i++) {

        for (var j = 0; j < parents.length; j++) {

            if (parents[j]._id === childrens[i].parentId) {

                parents[j].childs.push(childrens[i]);

                if (pageData && pageData.parentId && parents[j]._id === pageData.parentId) parentPageData = parents[j];

                break;

            }

        }

    }

    return {list: parents, data: (pageData || false), parentData: (parentPageData || false)};

}
Utils.prototype.parseShopProdutsFeed = async function(configs, db , storeAll, offer_id, storeId) {

    try {

        
        console.log("startUpdateProduct");
        if(storeAll==='undefined') return;
        let data = await axios.get(storeAll);
        let xml = data.data;
        xml = xml.replace('<shop>', '');
        xml = xml.replace('</shop>', '');
        let result = await xml2js.parseStringPromise(xml, {mergeAttrs: true});
        data = result && result.yml_catalog;
        let categories = data.categories &&  data.categories[0].category;
        let ProdcategoriesRes = await this.importProductCategory(categories, db, offer_id, storeId);
        if (ProdcategoriesRes.error) return {error: ProdcategoriesRes.error};
       let products = data.offers && data.offers[0].offer;
       let productRes = await this.importProducts(products, db, offer_id, storeId);
       if (productRes.error) return {error: productRes.error};
       return {success: true, count: productRes.count};
        console.log("== Import success!");


    } catch(err) {

        console.log(err);

        return {error: err.toString()}

    }

};

Utils.prototype.importProducts = async function(products, db, offer_id, storeId) {
 try {

        if (!Array.isArray(products) || !products.length) return {error: "Товари не знайдено!"};

        let importCount = 0;

        for (let i = 0; i < products.length; i++) {

            let item = products[i];


          // console.log('-------------------------');
	   //console.log(item);
          
           
           let id = item.id[0];
           
           let name = item.name[0];
           
           let available =item.available && item.available[0];

            let prod_category_id =item.categoryId && item.categoryId[0];
           
           let currency_id =item.currencyId && item.currencyId[0];
           
           let description =item.description && item.description[0];
           
           let modified_time =item.modified_time[0];
           
           let picture =item.picture && item.picture[0];
           
           let price =item.price && item.price[0];
           
           let url =item.url && item.url[0];
           
           let vendor =item.vendor && item.vendor[0];
           
           let vendorCode =item.vendorCode && item.vendorCode[0];
           
           let store_offer_id = offer_id;

           
           db.Products.findOne({id: id}, function(err, product) {

                if (product) {

                    let updateData = {};

                    if (product.name !== name) updateData.name = name;
                    
                    if (product.available !== available) updateData.available = available;
                    
                    if (product.desc_1 !== description) updateData.desc_1 = description;
                    
                    if (product.picture !== picture) updateData.picture = picture;
                    
                    if (product.price !== price) updateData.price = price;
                    
                    if (product.url !== url) updateData.url = url;
                    
                    if (product.vendor !== vendor) updateData.vendor = vendor;
                    
                    if (product.vendorCode !== vendorCode) updateData.vendorCode = vendorCode;
                    
                    if (product.store_offer_id !== store_offer_id) updateData.store_offer_id = store_offer_id;
                    
                    if (product.prod_category_id !== prod_category_id) updateData.prod_category_id = prod_category_id;
                    
                   
                                       

                    updateData.date = Date.now();

                    db.Products.update({_id: product._id}, {$set: updateData});

                    return

                }

                let insertData = {

                        id: id,
                        
                        available: available,
                        
                        name: name,

			store: {_id: storeId},
                        
                        prod_category_id: prod_category_id,
                        
                        currency: currency_id,
                        
                        store_offer_id: store_offer_id,
                        
                        vendor: vendor,
                        
                        vendorCode: vendorCode,
                   
                        modified_time: modified_time,

			picture: picture,

			countries: ["all"],

			price: price,

			url: url,

			status: 1,

			profit: 0,

			purchases: 0,

			desc_1: description || "",

			
			

                };

                //console.log(insertData)

                db.Products.insert(insertData);

            });
           
           


            importCount++;

            //if (i > 10) break;

        }

        console.log(importCount);

        return {success: true, count: importCount}

    } catch(err) {

        console.log(err);

        return {error: err.toString()}

    }

};




Utils.prototype.parsePromocodesFeed = async function(configs, db) {

    try {

        if (Date.now() < configs.promocodesLastUpdateDate + configs.promocodesUpdateInterval * 3600000) return;

        console.log("startUpdatePromocodes");
        

        let data = await axios.get(configs.promocodesXML);

        let xml = data.data;
        let result = await xml2js.parseStringPromise(xml, {mergeAttrs: true});
        data = result && result.admitad_coupons;
        let categories = data.categories[0].category;
        
        let categoriesRes = await this.importPromoCategory(categories, db);
        if (categoriesRes.error) return {error: categoriesRes.error};
        
        
        let coupons = data.coupons && data.coupons[0].coupon;
        
        let couponRes = await this.importPromocodes(coupons, db);

        if (couponRes.error) return {error: couponRes.error};

        configs.promocodesLastUpdateDate = Date.now();

        db.Configs.update({_id: "CONFIGS"}, {$set: {promocodesLastUpdateDate: configs.promocodesLastUpdateDate}});
        
        let fid_names = [configs.promocodesXML2, configs.promocodesXML3, configs.promocodesXML4,
        configs.promocodesXML5,
    configs.promocodesXML6,
configs.promocodesXML7,
configs.promocodesXML8,
configs.promocodesXML9,
configs.promocodesXML10];
        
        
    
    
        for (let i = 0; i < 9; i++) {
       
       
       
       let data = await axios.get(fid_names[i]);

        let xml = data.data;
        let result = await xml2js.parseStringPromise(xml, {mergeAttrs: true});
        data = result && result.admitad_coupons;
        
        let coupons = data.coupons && data.coupons[0].coupon;
        let couponRes = await this.importPromocodes(coupons, db);

        if (couponRes.error) return {error: couponRes.error};

        configs.promocodesLastUpdateDate = Date.now();

       db.Configs.update({_id: "CONFIGS"}, {$set: {promocodesLastUpdateDate: configs.promocodesLastUpdateDate}});
        
        }

        return {success: true, count: couponRes.count};

        console.log("== Import success!");

    } catch(err) {

        console.log(err);

        return {error: err.toString()}

    }

};


Utils.prototype.importProductCategory = async function(categories, db, offer_id, storeId) {
 try {

        if (!Array.isArray(categories) || !categories.length) return {error: "Категорії не найдено!"};

        let importCount = 0;

        for (let i = 0; i < categories.length; i++) {

            let item = categories[i];
            
            let id = Number(item.id && item.id[0]);
            let parent_id = Number(item.parentId&& item.parentId[0]);
            let name = item._;
            
            
            db.Productcategory.findOne({id: id, storeId: storeId}, function(err, productcategory) {
                
              

                if (productcategory) {


                    let updateData = {};

                    if (productcategory.name !== name) updateData.name = name;
                    if (productcategory.parent_id !== parent_id) updateData.parent_id = parent_id;
		

                    updateData.date = Date.now();

                    db.Productcategory.update({_id: productcategory._id}, {$set: updateData});

                    return

                }

                let insertData = {

                    id: id,
                    parent_id: parent_id,
                    name: name,
                    offer_id: offer_id,
                    storeId: storeId,
                    date: Date.now()

                };

              //  console.log(insertData);

               db.Productcategory.insert(insertData);

            });

            importCount++;

            //if (i > 10) break;

        }
 

        return {success: true, count: importCount}

    } catch(err) {

        console.log(err);

        return {error: err.toString()}

    }

};



Utils.prototype.importPromoCategory = async function(categories, db) {
 try {

        if (!Array.isArray(categories) || !categories.length) return {error: "Категорії не найдено!"};

        let importCount = 0;

        for (let i = 0; i < categories.length; i++) {

            let item = categories[i];
            
            let id = Number(item.id && item.id[0]);
            let name = item._;
            
            db.Promocodcategory.findOne({id: id}, function(err, promocategory) {

                if (promocategory) {

                    let updateData = {};

                    if (promocategory.name !== name) updateData.name = name;

		

                    updateData.date = Date.now();

                    db.Promocodcategory.update({_id: promocategory._id}, {$set: updateData});

                    return

                }

                let insertData = {

                    id: id,
                    name: name,
                    name_en: '',

                    date: Date.now()

                };

              //  console.log(insertData);

                db.Promocodcategory.insert(insertData);

            });

            importCount++;

            //if (i > 10) break;

        }
 

        return {success: true, count: importCount}

    } catch(err) {

        console.log(err);

        return {error: err.toString()}

    }

};


Utils.prototype.importPromocodes = async function(coupons, db) {
 try {

        if (!Array.isArray(coupons) || !coupons.length) return {error: "Промокодов не найдено!"};

        let importCount = 0;

        for (let i = 0; i < coupons.length; i++) {

            let item = coupons[i];

          //  console.log('-------------------------');
			//console.log(item);

            let id = item.id[0];

         let name = item.name[0];

	let advcampaign_id = item.advcampaign_id[0];



            if (!id || !name) continue;

			let description = item.description && item.description[0];

			let specie_id = item.specie_id && item.specie_id[0];



            let logo = item.logo && item.logo[0];

            let promo_code = item.promocode && item.promocode[0];

            let gotolink = item.gotolink && item.gotolink[0];

            let date_start = item.date_start && item.date_start[0];

            let date_end = item.date_end && item.date_end[0];

            let discount = item.discount && item.discount[0];

			let rating = item.rating && item.rating[0];

			let types = item.types && item.types[0];

			let categories = item.categories && item.categories[0];

            if (date_start) date_start = date_start.split(" ")[0];

            if (date_end) date_end = date_end.split(" ")[0];

            db.Promocodes.findOne({id: id}, function(err, promocode) {

                if (promocode) {

                    let updateData = {};

                    if (promocode.name !== name) updateData.name = name;

					if (promocode.advcampaign_id !== advcampaign_id) updateData.advcampaign_id = advcampaign_id;

					if (promocode.specie_id !== specie_id) updateData.specie_id = specie_id;

					if (promocode.description !== description) updateData.description = description;

                    if (promocode.promocode !== promo_code) updateData.promocode = promo_code;

                    if (promocode.date_end !== date_end) updateData.date_end = date_end;

					 if (promocode.types !== types) updateData.types = types;

					 	 if (promocode.categories !== categories) updateData.categories = categories;


                    //if (promocode.discount !== discount) updateData.discount = discount;

                    //if (promocode.date_start !== date_start) updateData.date_start = date_start;

                    //if (promocode.date_end !== date_end) updateData.date_end = date_end;

                    updateData.date = Date.now();

                    db.Promocodes.update({_id: promocode._id}, {$set: updateData});

                    return

                }

                let insertData = {

                    id: id,

                    name: name,

					description: description,

					advcampaign_id: advcampaign_id,

					specie_id: specie_id,

                    logo: logo,

                    promocode: promo_code || "",

                    gotolink: gotolink,

                    date_start: (date_start == "None") ? "" : date_start,

                    date_end: (date_end == "None") ? "" : date_end,

                    discount: discount,

					rating: rating,

					types: types,

					categories: categories,

                    date: Date.now()

                };

                //console.log(insertData)

                db.Promocodes.insert(insertData);

            });

            importCount++;

            //if (i > 10) break;

        }

        //console.log(importCount);

        return {success: true, count: importCount}

    } catch(err) {

        console.log(err);

        return {error: err.toString()}

    }

};



module.exports = new Utils;
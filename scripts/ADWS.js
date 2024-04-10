/*
    STACK360 - Web-based Business Management System
    Copyright (C) 2024 Arahant LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see https://www.gnu.org/licenses.
*/

/**
 * jQuery based interface to Arahant Dynamic SOAP Services.
 *
 * Created by Blake McBride on 12/13/15.
 *
 * All rights reserved.
 */

'use strict';

var ADWS = function () {
};

ADWS.callSoap = async function (service, cls, json=null, validation=false) {

    const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

    function makeDynamic(json) {
        let r = '      <arg0>\n';
        for (let k in json) {
            let v = json[k];
            if (v === null) {
            } else if (typeof v === "string") {
                if (v.length <= 10) {
                    r += '        <objectList name="' + k + '" rank="0" type="String" value="' + v + '">\n';
                    r += '            <longValue xsi:nill="true"/>\n';
                    r += '            <objectList xsi:nill="true"/>\n';
                    r += '            <stringList xsi:nil="true"/>\n';
                    r += '        </objectList>\n';
                } else {
                    r += '        <objectList name="' + k + '" rank="0" type="String">\n';
                    r += '            <longValue>' + v + '</longValue>longValue>\n';
                    r += '            <objectList xsi:nill="true"/>\n';
                    r += '            <stringList xsi:nil="true"/>\n';
                    r += '         </objectList>\n';
                }
            } else if (typeof v === "number") {
                if (v.toString().indexOf(".") > -1) {
                    r += '        <objectList name="' + k + '" rank="0" type="Double" value="' + v + '">\n';
                    r += '            <longValue xsi:nill="true"/>\n';
                    r += '            <objectList xsi:nill="true"/>\n';
                    r += '            <stringList xsi:nil="true"/>\n';
                    r += '        </objectList>\n';
                } else {
                    r += '        <objectList name="' + k + '" rank="0" type="Integer" value="' + v + '">\n';
                    r += '            <longValue xsi:nill="true"/>\n';
                    r += '            <objectList xsi:nill="true"/>\n';
                    r += '            <stringList xsi:nil="true"/>\n';
                    r += '        </objectList>\n';
                }
            } else if (typeof v === "boolean") {
                r += '        <objectList name="' + k + '" rank="0" type="Boolean" value="' + v + '">\n';
                r += '            <longValue xsi:nill="true"/>\n';
                r += '            <objectList xsi:nill="true"/>\n';
                r += '            <stringList xsi:nil="true"/>\n';
                r += '        </objectList>\n';
            }
        }
        r += '      </arg0>\n';
        return r;
    }

    if (!AWS.builder) {
        AWS.builder = new xml2js.Builder({ headless: true, rootName: "arg0" });          //  JSON -> XML
        AWS.parser = new xml2js.Parser({ explicitArray: false, explicitRoot: false });   //  XML -> JSON
    }

    if (json === undefined || json === null || json === '')
        json = {};
    else
        json = { ...json };  // shallow copy
    json._user = AWS.user;
    json._password = AWS.password;
    json._uuid = AWS.uuid;
    json._contextCompanyId = AWS.companyId;
    json._frontEndType = 'JavaScript';
    json._sendValidations = validation;
    json._package = "com.arahant.dynamic.services." + service;
    json._class = cls;
    json._method = 'main';
    const xmlArgs = makeDynamic(json);
    const data = '<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema">' +
        '  <SOAP-ENV:Body>' +
        '    <tns:execute xmlns:tns="http://operations.arahant.com">' +
                 xmlArgs +
        '    </tns:execute>' +
        '  </SOAP-ENV:Body>' +
        '</SOAP-ENV:Envelope>';

    let pass = 1;

    function decodeJson(rjson) {
        let j = rjson['S:Body']['ns2:executeResponse']['return'];
        let r = {};
        j = Utils.assureArray(j.objectList);
        for (let i=0 ; i < j.length ; i++) {
            let e = j[i];
            switch (e.$.type) {
                case "String":
                    if (e.$.value === undefined)
                        r[e.$.name] = e.longValue;
                    else
                        r[e.$.name] = e.$.value;
                    break;
                case "Integer":
                    r[e.$.name] = parseInt(e.$.value);
                    break;
                case "Double":
                    r[e.$.name] = parseFloat(e.$.value);
                    break;
                case "Boolean":
                    r[e.$.name] = e.$.value === "true";
                    break;
            }
        }
        return r;
    }

    const doCall = function (pass, resolve, reject) {
        if (pass === 1)
            Server.incCount();
        jQuery.ajax({
            type: 'POST',
            url: AWS.url + '/StandardDynamicwebservicesOps',  // + '?reqtime=' + Date.now(),  this causes OPTIONS  + POST doesn't cache
            data: data,
            contentType: 'text/xml; charset=utf-8',
            dataType: 'text',
            success: function (data, status, hdr) {
                AWS.parser.parseStringPromise(data).then(function (rjson) {
                    rjson = decodeJson(rjson);
                    rjson.wsStatus = "" + rjson._wsStatus;   //  for app consistency
                    if (rjson._wsStatus !== 0) {
                        Utils.showMessage('Error', rjson._wsMessage).then(function () {
                            Server.decCount();
                            if (rjson.wsStatus === 2)
                                Framework.logout();
                            resolve(rjson);
                        });
                    } else {
                        Server.decCount();
                        resolve(rjson);
                    }
                });
            },
            error: async function (error, status) {
                if (pass < 3) {
                    doCall(pass + 1, resolve, reject);
                    return;
                }
                const msg = 'Error communicating with the server.';
                Server.decCount();
                await Utils.showMessage('Error', msg);
            }
        });
    };

    return new Promise(function (resolve, reject) {
        doCall(1, resolve, reject);
    });
};


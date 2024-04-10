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
 * jQuery based interface to Arahant SOAP Services.
 *
 * Historic note: Arahant was initially built entirely with standard SOAP.  AWS.js implements this.
 * Later we moved to dynamic SOAP (an internal invention).  This allowed us to do SOAP without a bunch of back-end
 * and front-end code generation.  That is implemented in ADWS.js
 * Finally, we moved to JSON/REST.  That is implemented in Server.js
 * With the HTML front-end, utilizing any of the three is pretty equal because any differences are handled
 * by those three js files.  So, from the front-end perspective, they're pretty equal.  Additionally, for all
 * practical purposes, all three are equally fast.  From the back-end perspective, SOAP is the hardest to implement,
 * followed by Dynamic SOAP and REST calls which are, by far, easier to implement.  On the back-end,
 * implementing standard SOAP was significantly harder than the other two.  The REST calls are simpler and more
 * standard then the dynamic SOAP.
 *
 * One gotcha is arrays.  SOAP is XML and the HTML front-end is all JSON.  When translating between XML and JSON, XML
 * arrays of two or more elements work fine but the translation routine can't tell the difference between an empty
 * array and a missing element or a single element array and a scalar (non-array).  The utility function
 * Utils.assureArray() corrects this issue but must be used manually.
 *
 *
 * Created by Blake McBride on 12/13/15.
 *
 * All rights reserved.
 */

'use strict';

var AWS = function () {
};

AWS.url = '';
AWS.user = '';
AWS.password = '';
AWS.personId = '';
AWS.uuid = '';
AWS.companyId = '';
AWS.builder = null;
AWS.parser = null;

AWS.callSoap = async function (service, method, json = null, validation = false) {

    const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

    const prettifyXml = function(sourceXml)
    {
        if (!isChrome)
            return sourceXml;
        var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
        var xsltDoc = new DOMParser().parseFromString([
            // describes how we want to modify the XML - indent everything
            '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
            '  <xsl:strip-space elements="*"/>',
            '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
            '    <xsl:value-of select="normalize-space(.)"/>',
            '  </xsl:template>',
            '  <xsl:template match="node()|@*">',
            '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
            '  </xsl:template>',
            '  <xsl:output indent="yes"/>',
            '</xsl:stylesheet>',
        ].join('\n'), 'application/xml');

        var xsltProcessor = new XSLTProcessor();
        xsltProcessor.importStylesheet(xsltDoc);
        var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
        var resultXml = new XMLSerializer().serializeToString(resultDoc);
        return resultXml;
    };

    if (!AWS.builder) {
        AWS.builder = new xml2js.Builder({ headless: true, rootName: "arg0" });          //  JSON -> XML
        AWS.parser = new xml2js.Parser({ explicitArray: false, explicitRoot: false });   //  XML -> JSON
    }

    if (json === undefined || json === null || json === '')
        json = {};
    else
        json = { ...json };  // shallow copy
    json.user = AWS.user;
    json.password = AWS.password;
    json.uuid = AWS.uuid;
    json.contextCompanyId = AWS.companyId;
    json.frontEndType = 'JavaScript';
    json.sendValidations = validation;
    json._service = service;  // for informational purposes only
    json._method = method;    // for informational purposes only
    let xmlArgs;
    try {
        xmlArgs = AWS.builder.buildObject(json);
    } catch (err) {
        console.error("builder error in AWS.callSoap");
        throw err;
    }
    service += 'Ops';
    const data = '<S:Envelope xmlns:S="http://schemas.xmlsoap.org/soap/envelope/">' +
        '  <S:Body>' +
        '    <ns2:' + method + ' xmlns:ns2="http://operations.arahant.com">' +
        xmlArgs +
        '    </ns2:' + method + '>' +
        '  </S:Body>' +
        '</S:Envelope>';

    const formattedData = prettifyXml(data);

    let pass = 1;

    const doCall = function (pass, resolve, reject) {
        if (pass === 1)
            Server.incCount();
        jQuery.ajax({
            type: 'POST',
            url: AWS.url + '/' + service,  // + '?reqtime=' + Date.now(),  this causes OPTIONS  + POST doesn't cache
            data: formattedData,
            contentType: 'text/xml; charset=utf-8',
            dataType: 'text',
            success: function (data, status, hdr) {
                try {
                    AWS.parser.parseStringPromise(data).then(function (rjson) {
                        let a = rjson["S:Body"];
                        rjson = a[Object.keys(a)[0]].return;
                        if (rjson.wsStatus !== "0") {
                            Utils.showMessage('Error', rjson.wsMessage).then(function () {
                                Server.decCount();
                                if (rjson.wsStatus === "2")
                                    Framework.logout();
                                resolve(rjson);
                            });
                        } else {
                            Server.decCount();
                            resolve(rjson);
                        }
                    });
                } catch (err) {
                    console.error("Parse error in AWS.callSoap");
                    Server.decCount();
                    throw err;
                }
            },
            error: async function (error, status) {
                if (pass < 3) {
                    doCall(pass + 1, resolve, reject);
                    return;
                }
                const msg = 'Error communicating with the server.';
                await Utils.showMessage('Error', msg);
                Server.decCount();
                resolve({wsStatus: "1", wsMessage: msg});
            }
        });
    };

    return new Promise(function (resolve, reject) {
        doCall(1, resolve, reject);
    });
};

AWS.setURL = function (urlArg) {
    AWS.url = urlArg;
    Server.setURL(urlArg);
    return AWS;
};

AWS.setUser = function (u, p) {
    AWS.user = u;
    AWS.password = p;
    return AWS;
};

AWS.setPersonId = function (pid) {
    AWS.personId = pid;
    return AWS;
};

AWS.setUuid = function (uuid) {
    AWS.uuid = uuid;
    AWS.password = '';
    Server.setUUID(uuid);
    return AWS;
};

AWS.setCompanyId = function (cid) {
    AWS.companyId = cid;
    return AWS;
};

AWS.setName = function (fname, lname) {
    AWS.fname = fname;
    AWS.lname = lname;
};

/**
 * Make a servlet call with a list of files to upload.
 * This makes calls to the com.arahant.servlets.FileUploadServlet class on the backend.
 *
 * @param fieldId of HTML control - OR - an array of FileInfo objects
 * @param uploadType
 * @param json
 * @returns {Promise<unknown>}
 */
AWS.fileUpload = async function (fieldId, uploadType, json) {
    return new Promise(function (resolve, reject) {
        const fd = new FormData();

        function fileExtension(name) {
            const i = name.lastIndexOf(".");
            return i === -1 ? '' : name.substr(i+1);
        }

        if (Array.isArray(fieldId)) {
            const attachments = fieldId;
            for (let i = 0; i < attachments.length; i++) {
                fd.append('Filedata' + i, attachments[i]);  // it doesn't matter what the first argument is so long as it is a unique string
                fd.append("extension-"+i, fileExtension(attachments[i].name));
            }
            if (attachments.length === 1)
                fd.append('Filename', attachments[0].name);
        } else {
            const ctl = $$(fieldId);
            const n = ctl.numberOfUploadFiles();
            for (let i=0 ; i < n ; i++) {
                fd.append('Filedata' + i, ctl.uploadFile(i));  // it doesn't matter what the first argument is so long as it is a unique string
                fd.append("extension-"+i, ctl.uploadFileExtension(i));
            }
            if (n === 1)
                fd.append('Filename', ctl.uploadFilename(0));
        }
        fd.append('uploadType', uploadType);
        fd.append('uuid', AWS.uuid);
        fd.append('contextCompanyId', AWS.companyId);
        fd.append('frontEndType', 'JavaScript');
        if (json) 
            for (let key in json)
                fd.append(key, json[key]);
        Server.incCount();
        $.ajax({
            url: AWS.url + '/FileUploadServlet',
            type: 'POST',
            data: fd,
            cache: false,
            dataType: 'json',
            processData: false,
            contentType: false,
            success: function (data, status, jqXHR) {
                Server.decCount();
                resolve(data);
            },
            error: async function (jqXHR, status, error) {
                await Utils.showMessage('Error', 'Error uploading file');
                Server.decCount();
                resolve({wsStatus: "1", wsMessage: status });
            }
        });
    });
};

/**
 *
 * This method can be used for simultaneously for REST, Dynamic, & SOAP calls.  Server.callAll can not.
 *
 * Used to call a number of simultaneous web services and wait till they're all done
 * before processing any of their results.  This function works simultaneously with
 * SOAP and REST calls.
 *
 * This function takes a variable number of arguments.
 *
 * The first argument is an array of the Promises from each web service call.
 *
 * Each remaining argument is a function that gets the result from the positionally corresponding
 * promise in the first argument.  If any are null there is no function executed for that returned promise.
 * Each function that gets executed gets passed the return value of the associated web service.
 *
 * A Promise is returned which resolves to true on error and false on success.
 *
 */
AWS.callAll = function (pa /*, ... each subsequent arg is a function to handle the result of the next promise in pa */) {
    const args = arguments;
    return new Promise(function (resolve, reject) {
        Promise.all(pa).then(function (ret) {
            for (let i = 0; i < ret.length; i++)
                if (ret[i].wsStatus && ret[i].wsStatus !== "0" || ret[i]._Success === false) {
                    resolve(true);  //  error
                    return;
                }
            for (let i=1 ; i < args.length  &&  i <= ret.length ; i++) {
                let fun = args[i];
                if (fun)
                    fun(ret[i-1]);
            }
            resolve(false);  //  success
        });
    });
};

/**
 *  Removes the user association between the back-end and front-end.
 */
AWS.logout = function() {
    Server.logout();
    AWS.uuid = '';
    AWS.user = '';
    AWS.password = '';
    AWS.companyId = '';
}

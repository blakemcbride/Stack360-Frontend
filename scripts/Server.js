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

/* global utils */

/*
        This file is a modified version of what is in the KISS system.
        It has been moved here to reflect the fact that it is not the same.
 */

'use strict';

/**
 * All rights reserved.
 *
 * Created by Blake McBride on 9/24/16.
 */

/**
 * This class provides the facilities used to communicate with the back-end via JSON/REST.
 */
class Server {

    // class variables
    static #timeLastCall;
    static #maxInactiveSeconds = 0;  // max number of seconds between calls or zero for no max (or auto logout)


    /**
     * Set the URL of the back-end.
     *
     * @param {string} url
     */
    static setURL(url) {
        Server.url = url;
    }

    // internal
    static setUUID(uuid) {
        Server.uuid = uuid;
    }

    /**
     *  Removes the user association between the back-end and front-end.
     */
    static logout() {
        Server.uuid = '';
    }

    /**
     * Evoke a back-end REST service.
     * <br><br>
     * This function is typically called with an <code>await</code> or a <code>then</code> in order to process the result.
     *
     * @param {string} pkg the package
     * @param {string} cls the class of the service to be called
     * @param {object} injson data to be passed to the back-end
     *
     * @returns {Promise<any>} data returned from the back-end
     */
    static call(pkg, cls, injson) {
        Server.#checkTime();
        const path = "REST";  // path to servlet
        if (!injson)
            injson = {};
        else
            injson = { ...injson };  // shallow copy
        injson._uuid = Server.uuid;
        injson._method = 'main';
        injson._class = cls;
        injson._package = pkg;

        injson._user = '';
        injson._frontEndType = 'JavaScript';
        injson._contextCompanyId = AWS.companyId;
        injson._sendValidations = false;

        const doCall = function (pass, resolve, reject) {
            if (pass === 1)
                Server.incCount();
            jQuery.ajax({
                type: 'POST',
                url: Server.url + '/' + path,
                data: JSON.stringify(injson),
                contentType: 'application/json',
                dataType: 'json',
                success: async function (data, status, hdr) {
                    Server.decCount();
                    if (!data._Success)
                        await Utils.showMessage('Error', data._ErrorMessage);
                    if (data._ErrorCode === 2)
                        Framework.logout();
                    resolve(data);
                },
                error: async function (error, status) {
                    if (pass < 3) {
                        doCall(pass + 1, resolve, reject);
                        return;
                    }
                    const msg = 'Error communicating with the server.';
                    await Utils.showMessage('Error', msg);
                    Server.decCount();
                    resolve({_Success: false, _ErrorMessage: msg});
                    //reject(error, status);
                }
            });
        };

        return new Promise(function (resolve, reject) {
            doCall(1, resolve, reject);
        });
    }

    static incCount() {
        if (++Utils.suspendDepth === 1)
            document.body.style.cursor = 'wait';
    }

    static decCount() {
        if (--Utils.suspendDepth === 0)
            document.body.style.cursor = 'default';
    }

    /**
     * Send the file upload to the server.
     * This method displays a wait message and a final status message.
     * <br><br>
     * <code>fd</code> can either be form data or it can be the ID of the file upload control.
     *
     * @param {string} pkg package in back-end
     * @param {string} cls class on back-end
     * @param {FormData|string} fd ctl-id, FormData, FileList, or array of FileList
     * @param {object} injson optional data to be sent to the back-end
     * @param {string} waitMsg  optional wait message
     * @param {string} successMessage optional success message
     *
     * @see Utils.getFileUploadCount
     * @see Utils.getFileUploadFormData
     */
    static fileUploadSend(pkg, cls, fd, injson, waitMsg, successMessage) {
        Server.#checkTime();
        return new Promise(function (resolve, reject) {
            if (typeof fd === 'string')
                fd = $$(fd).getFormData();
            else if (Array.isArray(fd)) {
                const flst = fd;
                fd = new FormData();
                let i = 0;
                for (let j=0 ; j < flst.length ; j++) {
                    const files = flst[j];
                    if (Array.isArray(files))
                        for ( ; i < files.length ; i++)
                            fd.append('_file-' + i, files[i]);
                    else
                        fd.append('_file-' + i++, files);
                }
            } else if (fd instanceof FileList) {
                const files = fd;
                fd = new FormData();
                for (let i=0 ; i < files.length ; i++)
                    fd.append('_file-' + i, files[i]);
            }
            fd.append('_uuid', Server.uuid);
            fd.append('_user', '');
            fd.append('_frontEndType', 'JavaScript');
            fd.append('_package', pkg);
            fd.append('_class', cls);
            fd.append('_method', 'main');
            fd.append('_contextCompanyId', AWS.companyId);
            fd.append('_sendValidations', false);
            if (injson)
                for (let key in injson) {
                    let val = injson[key];
                    fd.append(key, typeof val === 'object' ? JSON.stringify(val) : val);
                }
            Utils.waitMessage(waitMsg ? waitMsg : "File upload in progress.");
            Server.incCount();
            $.ajax({
                url: Server.url + '/REST',
                type: 'POST',
                processData: false,
                contentType: false,
                data: fd,
                dataType: 'json',  // what is coming back
                cache: false,
                success: async function (res, status, hdr) {
                    Utils.waitMessageEnd();
                    if (res._Success)
                        await Utils.showMessage("Information", successMessage ? successMessage : "Upload successful.");
                    else {
                        if (res._ErrorMessage === 2)
                            Framework.logout();
                        await Utils.showMessage("Error", res._ErrorMessage);
                    }
                    Server.decCount();
                    resolve(res);
                },
                error: async function (hdr, status, error) {
                    const msg = 'Error communicating with the server.';
                    Utils.waitMessageEnd();
                    await Utils.showMessage("Error", msg);
                    Server.decCount();
                    resolve({_Success: false, _ErrorMessage: msg});
                }
            });
        });
    }

    /**
     * Used to call a number of simultaneous web services and wait till they're all done
     * before processing any of their results.
     * <br><br>
     * This function takes a variable number of arguments.
     * <br><br>
     * The first argument is an array of the Promises from each web service call.
     * <br><br>
     * Each remaining argument is a function that gets the result from the positionally corresponding
     * promise in the first argument.  If any are null there is no function executed for that returned promise.
     * Each function that gets executed gets passed the return value of the associated web service.
     * <br><br>
     * You can wait for this function to complete asynchronously by calling it with an await.
     * <br><br>
     * The return value is <code>false</code> if all the web services complete and <code>true</code> if there is an error.
     *
     */
    static callAll(pa /*, ... each subsequent arg is a function to handle the result of the next promise in pa */) {
        Server.#checkTime();
        const args = arguments;
        return new Promise(function (resolve, reject) {
            Promise.all(pa).then(function (ret) {
                for (let i = 0; i < ret.length; i++)
                    if (!ret[i]._Success) {
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
    }

    /**
     * Set the maximum number of seconds between calls or zero for no max.
     * If the maximum number of seconds is exceeded, the user will be logged out
     * on their next attempt to make a service call.
     *
     * @param seconds
     */
    static setMaxInactivitySeconds(seconds) {
        Server.#maxInactiveSeconds = seconds;
        Server.#timeLastCall = (new Date()).getTime() / 1000; // seconds since 1970
    }

    /**
     * Set the maximum number of minutes between calls or zero for no max.
     * If the maximum number of minutes is exceeded, the user will be logged out
     * on their next attempt to make a service call.
     *
     * @param minutes
     */
    static setMaxInactivityMinutes(minutes) {
        Server.setMaxInactivitySeconds(minutes * 60);
    }

    /**
     * Set the maximum number of hours between calls or zero for no max.
     * If the maximum number of hours is exceeded, the user will be logged out
     * on their next attempt to make a service call.
     *
     * @param hours
     */
    static setMaxInactivityHours(hours) {
        Server.setMaxInactivitySeconds(hours * 60 * 60);
    }

    static async #checkTime() {
        if (!Server.#maxInactiveSeconds)
            return;
        const now = (new Date()).getTime() / 1000;
        if (now - Server.#timeLastCall > Server.#maxInactiveSeconds) {
            await Utils.showMessage("Warning", "Auto logout due to inactivity.  Please re-login.");
            window.onbeforeunload = null;  //  allow logout
            Server.uuid = '';
            location.reload();
        } else
            Server.#timeLastCall = now;
    }
}




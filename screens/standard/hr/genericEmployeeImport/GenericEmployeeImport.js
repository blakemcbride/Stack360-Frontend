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

/*
     All rights reserved.

 */


'use strict';

(async function () {
    const WS = 'StandardHrGenericEmployeeImport';

    // SAW THESE API'S IN FLASH, BUT THEY ARE NOT USED IN IMPORT API
    
    // const params = {
    //     name: "",
    //     nameSearchType: "",
    //     personId: ""
    // }
    // AWS.callSoap(WS, 'searchScreenGroups', params).then(screenGroups => {
    //     if (screenGroups.wsStatus === "0") {
    //         screenGroups.screenDef = Utils.assureArray(screenGroups.screenDef);
    //     }  
    // });

    // AWS.callSoap(WS, 'searchSecurityGroups', params).then(securityGroups => {
    //     if (securityGroups.wsStatus === "0") {
    //         securityGroups.item = Utils.assureArray(securityGroups.item);
    //     }  
    // });

    $$('import').onclick(async function () {
        if ($$('file').isError('Employee file'))
            return;
        if ($$('importType').isError('Import Type'))
            return;

        const params = {
            uploadType: "genericEmployeeFileUpload",
            importType: $$('importType').getValue()
        };
        Utils.waitMessage('File upload in progress.');
        await AWS.fileUpload('file', 'FileUploadServlet', params);
        Utils.waitMessageEnd();
        Utils.showMessage('Status', 'Import process complete.');
    });
})();

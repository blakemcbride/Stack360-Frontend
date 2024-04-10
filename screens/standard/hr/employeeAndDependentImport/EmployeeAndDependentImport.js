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
    const WS = 'StandardHrEmployeeAndDependentImport';

    const params = {
        name: "",
        nameSearchType: "",
        personId: ""
    }
    $$('eadi-screen_group').add('', "(select)");
    AWS.callSoap(WS, 'searchScreenGroups', params).then(screenGroups => {
        if (screenGroups.wsStatus === "0") {
            screenGroups.screenDef = Utils.assureArray(screenGroups.screenDef);
            $$('eadi-screen_group').addItems(screenGroups.screenDef, "id", "title");
        }  
    });

    $$('eadi-security_group').add('', "(select)");
    AWS.callSoap(WS, 'searchSecurityGroups', params).then(securityGroups => {
        if (securityGroups.wsStatus === "0") {
            securityGroups.item = Utils.assureArray(securityGroups.item);
            $$('eadi-security_group').addItems(securityGroups.item, "groupId", "name");
        }  
    });

    $$('eadi-empl_import').onclick(async function () {
        if ($$('eadi-empl_file').isError('Employee file'))
            return;
        if ($$('eadi-screen_group').isError('Screen group'))
            return;
        if ($$('eadi-security_group').isError('Security group'))
            return;

        const params = {
            securityGroupId: $$('eadi-security_group').getValue(),
            screenGroupId: $$('eadi-screen_group').getValue(),
            uploadType: "employeeFileUpload"
        };
        Utils.waitMessage('File upload in progress.');
        await AWS.fileUpload('eadi-empl_file', 'FileUploadServlet', params);
        Utils.waitMessageEnd();
        Utils.showMessage('Status', 'Import process complete.');
    });

    $$('eadi-dep_import').onclick(async function () {
        if ($$('eadi-dep_file').isError('Dependent file'))
            return;

        const params = {
            uploadType: "dependentFileUpload"
        };
        Utils.waitMessage('File upload in progress.');
        await AWS.fileUpload('eadi-dep_file', 'FileUploadServlet', params);
        Utils.waitMessageEnd();
        Utils.showMessage('Status', 'Import process complete.');
    });


})();

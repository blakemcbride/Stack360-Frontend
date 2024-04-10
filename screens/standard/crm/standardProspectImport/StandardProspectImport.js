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

(function () {

    const WS = 'StandardCrmStandardProspectImport';

    function initData() {

        const sourceReqData = {
            codeSearchType: 0,
            descriptionSearchType: 0
        };
        AWS.callSoap(WS, "searchProspectSources", sourceReqData).then(res => {
            if (res.wsStatus) {
                let sourceCtl = $$('prospect-source');
                sourceCtl.clear();

                sourceCtl.add("", "(choose)");

                // Add the sources to the drop down control.
                if (res.item) {
                    res.item.forEach(item => {
                        sourceCtl.add(item.id, item.code, item);
                    });
                }

            }
        });

        const statusReqData = {
            codeSearchType: 0,
            descriptionSearchType: 0
        };
        AWS.callSoap(WS, "searchProspectStatuses", statusReqData).then(res => {
            if (res.wsStatus) {
                let statusCtl = $$('prospect-status');
                statusCtl.clear();

                statusCtl.add("", "(choose)");

                // Add the status to the drop down control.
                if (res.item) {
                    res.item.forEach(item => {
                        statusCtl.add(item.id, item.code, item);
                    });
                }

            }
        });

        const typeReqData = {
            codeSearchType: 0,
            descriptionSearchType: 0
        };
        AWS.callSoap(WS, "searchProspectTypes", typeReqData).then(res => {
            if (res.wsStatus) {
                let typeCtl = $$('prospect-type');
                typeCtl.clear();

                typeCtl.add("", "(choose)");

                // Add the types to the drop down control.
                if (res.item) {
                    res.item.forEach(item => {
                        typeCtl.add(item.id, item.code, item);
                    });
                }

            }
        });

        $$('pr-salesperson').forceSelect();

    }

    initData();

    $$('pr-salesperson').setSelectFunction(() => {
        Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection').then(data => {
            if (data._status === "ok") {
                $$('pr-salesperson').setValue(data.employeeid, `${data.lname}, ${data.fname} ${data.mname}`);
            }
        })
    });

    $$('pr-import').onclick(async () => {
        if ($$('prospect-status').isError('Prospect Status'))
            return;
        if ($$('prospect-source').isError('Prospect Source'))
            return;
        if ($$('prospect-type').isError('Prospect Type'))
            return;
        if ($$('pr-salesperson').isError('Salesperson'))
            return;
        if ($$('pr-file').isError('Import'))
            return;

        let data = {
            statusId: $$('prospect-status').getValue(),
            sourceId: $$('prospect-source').getValue(),
            typeId: $$('prospect-type').getValue(),
            employeeId: $$('pr-salesperson').getValue(),
            companyId: AWS.companyId
        };
        Utils.waitMessage('File upload in progress.');
        await AWS.fileUpload('pr-file', 'StandardProspectFileUpload', data);
        Utils.waitMessageEnd();
        Utils.showMessage('Status', 'Import proces complete.');
    });

    $('#pr-documentation').click(() => {
        Utils.showReport('docs/StandardProspectImport_Doc.pdf');
    });

    $('#view-template').click(() => {
        Utils.showReport('docs/StandardProspectImport_Template.csv');
    });

})();

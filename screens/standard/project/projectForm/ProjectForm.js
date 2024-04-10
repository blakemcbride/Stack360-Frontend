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
    const WS = 'com.arahant.services.standard.project.projectForm';
    const SWS = 'StandardProjectProjectForm';
    const DWS = "standard.project.projectForm";

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary);

    const columnDefs = [
        {headerName: '', field: 'id', hide: true},
        {headerName: '', field: 'formCode', hide: true },
        {headerName: 'Form', field: 'formDescription', width: 50  },
        {headerName: 'Date', field: 'dateFormatted', width: 35 },
        {headerName: 'Internal', field: 'internal', width: 30 },
        {headerName: 'ID', field: 'formid', width: 30 },
        {headerName: 'File Type', field: 'extension', width: 40 },
        {headerName: 'Comment', field: 'comments', width: 200 }
    ];
    const grid = new AGGrid('forms-grid', columnDefs, 'id');

    grid.show();

    grid.setOnSelectionChanged(function (rows) {
        $$('rotate-left').enable(rows);
        $$('rotate-right').enable(rows);
        $$('view').enable(rows);
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    let data = {
    };
    const rights = await AWS.callSoap(SWS, 'checkRight', data);
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('rotate-left').show(rights.accessLevel === '2');
    $$('rotate-right').show(rights.accessLevel === '2');
    $$('report').show(rights.accessLevel === '2');
    $$('export').show(rights.accessLevel === '2');
    $$('edit').show(rights.accessLevel === '2');
    $$('delete').show(rights.accessLevel === '2');
    $$('add').show(rights.accessLevel === '2');

    $$('shift').enable(rights.accessLevel === '2');
    grid.enable(rights.accessLevel === '2');


    async function getShifts(projectId) {
        // fill the list of shifts
        const data = {
            projectId: projectId
        };
        const res = await Server.call(WS, 'GetShifts', data);
        const shiftCtl = $$('shift');
        shiftCtl.clear().triggerGlobalChange(false);
        if (res._Success) {
            if (res.shifts.length === 1) {
                const shift = res.shifts[0];
                shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
                $$('add').enable(rights.accessLevel === '2');
            } else {
                shiftCtl.add('', 'All').addItems(res.shifts, 'project_shift_id', 'shift_start').enable(rights.accessLevel === '2');
                $$('add').disable();
            }
        }
    }
    await getShifts(projectId);

    async function listFormsForProject() {
        $$('rotate-left').disable();
        $$('rotate-right').disable();
        $$('view').disable();
        $$('edit').disable();
        $$('delete').disable();
        let data = {
            projectId: projectId,
            shiftId: $$('shift').getValue()
        };
        let res = await AWS.callSoap(SWS, 'listFormsForProject', data);
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            grid.clear();
            if (res.item.length) {
                grid.addRecords(res.item);
                $$('zip-download').enable(rights.accessLevel === '2');
                $$('report').enable(rights.accessLevel === '2');
                $$('export').enable(rights.accessLevel === '2');
            }
            if (res.item.length === 1)
                $$('status').setValue("Displaying 1 Project Form");
            else
                $$('status').setValue("Displaying " + res.item.length + " Project Forms");
        }
    }

    listFormsForProject();

    $$('shift').onChange(() => {
        listFormsForProject();
        let shiftId = $$('shift').getValue();
        if (shiftId) {
            $$('add').enable(rights.accessLevel === '2');
        } else {
            $$('add').disable();
        }
    });

    $$('add').onclick(async function () {
        Utils.popup_open('add-form-popup');

        $$('add-form-description').clear();
        $$('add-form-internal').setValue(true);
        $('#add-form-file-name').val(null);
        $$('add-form-comments').clear();

        const data = {
        };
        let res = await AWS.callSoap(SWS, 'listFormTypes', data);
        let listTypeCodes = {};
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            let ctl = $$('add-form-code');
            ctl.clear().add('', '(select)');
            for (let i=0 ; i < res.item.length ; i++) {
                ctl.add(res.item[i].id, res.item[i].code, res.item[i].description);
                listTypeCodes[res.item[i].code] = res.item[i].id;
            }
        }

        $$('add-form-code').onChange(function () {
            $$('add-form-description').setValue($$('add-form-code').getData());
        });

        $$('add-form-popup-ok').onclick(async function () {
            if ($$('add-form-code').isError('Form Code'))
                return;
            if ($$('add-form-file-name').isError('Form'))
                return;

            let data = {
                projectId: projectId,
                shiftId: $$('shift').getValue(),
                formTypeId: $$('add-form-code').getValue(),
                comments: $$('add-form-comments').getValue(),
                internal: $$('add-form-internal').getValue()
            };
            Utils.waitMessage('File upload in progress.');
            await AWS.fileUpload('add-form-file-name', 'projectFormUpload', data);
            Utils.waitMessageEnd();
            Utils.popup_close();
            listFormsForProject();
        });

        $$('add-form-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(async function () {
        Utils.popup_open('edit-form-popup');

        const data = {
        };
        let res = await AWS.callSoap(SWS, 'listFormTypes', data);
        let listTypeCodes = {};
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            let ctl = $$('edit-form-code');
            ctl.clear();
            for (let i=0 ; i < res.item.length ; i++) {
                ctl.add(res.item[i].id, res.item[i].code, res.item[i].description);
                listTypeCodes[res.item[i].code] = res.item[i].id;
            }
        }
        let row = grid.getSelectedRow();
        $$('edit-form-code').setValue(listTypeCodes[row.formCode]);
        $$('edit-form-internal').setValue(row.internal === "Yes");
        $$('edit-form-description').setValue($$('edit-form-code').getData());
        $$('edit-form-comments').setValue(row.comments);

        $$('edit-form-code').onChange(function () {
            $$('edit-form-description').setValue($$('edit-form-code').getData());
        });

        $$('edit-form-popup-ok').onclick(async function () {
            const data = {
                projectId: projectId,
                id: row.id,
                typeCodeId: $$('edit-form-code').getValue(),
                internal: $$('edit-form-internal').getValue() ? 'Yes' : 'No',
                comments: $$('edit-form-comments').getValue()
            };
            await AWS.callSoap(SWS, 'editForm', data);
            Utils.popup_close();
            listFormsForProject();
        });

        $$('edit-form-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('zip-download').onclick(function () {
        Utils.popup_open('download-popup');

        const data = {
        };
        AWS.callSoap(SWS, 'listFormTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                let ctl = $$('download-popup-form-type');
                ctl.clear().add('', '(select)');
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].id, res.item[i].code);
            }
        });

        $$('download-popup-all-types').onChange(function () {
            if ($$("download-popup-all-types").getValue())
                $$('download-popup-form-type').disable();
            else
                $$('download-popup-form-type').enable(rights.accessLevel === '2');
        });

        $$('download-popup-ok').onclick(function () {
            if (!$$("download-popup-all-types").getValue())
                if ($$('download-popup-form-type').isError('Form Type'))
                    return;

            const data = {
                projectId: projectId,
                allFormTypes: $$("download-popup-all-types").getValue(),
                formType: $$("download-popup-form-type").getValue(),
                includeInternal: $$("download-popup-internal").getValue()
            };
            Utils.waitMessage("Zip file generation in progress; Please wait.");
            AWS.callSoap(SWS, 'downloadZip', data).then(function (res) {
                Utils.waitMessageEnd();
                if (res.wsStatus === "0") {
                    Utils.showReport(res.fileUrl);
                }
            });

            Utils.popup_close();
        });

        $$('download-popup-cancel').onclick(function () {
            Utils.popup_close();
        });

    });

    $$('rotate-left').onclick(function () {
        const data = {
            id: grid.getSelectedRow().id
        };
        Utils.waitMessage('Image rotation in progress.');
        AWS.callSoap(SWS, 'rotateLeft', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
            }
        });
    });

    $$('rotate-right').onclick(function () {
        const data = {
            id: grid.getSelectedRow().id
        };
        Utils.waitMessage('Image rotation in progress.');
        AWS.callSoap(SWS, 'rotateRight', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
            }
        });
    });

    $$('report').onclick(function () {
        if (!$$('shift').getValue()) {
            Utils.showMessage('Error', 'Please select a shift first.');
            return;
        }
        Utils.popup_open('report-popup');

        const data = {
        };
        AWS.callSoap(SWS, 'listFormTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                let ctl = $$('report-popup-form-type');
                ctl.clear().add('', '(select)');
                for (let i = 0; i < res.item.length; i++)
                    ctl.add(res.item[i].id, res.item[i].code);
            }
        });

        $$('report-popup-ok').onclick(function () {
            if ($$('report-popup-form-type').isError('Form Type'))
                return;
            if ($$('report-popup-n-per-page').isError('Number per page'))
                return;

            const data = {
                projectId: projectId,
                shiftId: $$('shift').getValue(),
                formType: $$('report-popup-form-type').getValue(),
                beginningDate: $$('report-popup-beginning-date').getIntValue(),
                endingDate: $$('report-popup-ending-date').getIntValue(),
                entriesPerPage: Number($$('report-popup-n-per-page').getValue())
            };
            Utils.waitMessage("Report in progress; Please wait.");
            ADWS.callSoap(DWS, 'FormReport', data).then(function (res) {
                Utils.waitMessageEnd();
                if (res.wsStatus === "0") {
                    Utils.showReport(res.reportUrl);
                }
            });
            Utils.popup_close();
        });

        $$('report-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('export').onclick(function () {
        const data = {
            projectId: projectId
        };
        Utils.waitMessage("Export in progress; Please wait.");
        AWS.callSoap(SWS, 'exportForms', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                Utils.showMessage('Information', 'Available external forms have been exported.');
            }
        });
    });

    function view() {
        const data = {
            id: grid.getSelectedRow().id
        };
        Utils.waitMessage("Retrieving Form; Please wait.");
        AWS.callSoap(SWS, 'getForm', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    }

    $$('view').onclick(view);

    grid.setOnRowDoubleClicked(view);

    $$('delete').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Form?', function () {
            const data = {
                projectId: projectId,
                ids: grid.getSelectedRow().id
            };
            Utils.waitMessage('Form deletion in progress');
            AWS.callSoap(SWS, 'deleteForm', data).then(function (res) {
                Utils.waitMessageEnd();
                if (res.wsStatus === "0") {
                    listFormsForProject();
                }
            });
        });
    });

})();

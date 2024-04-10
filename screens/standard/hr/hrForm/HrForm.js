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
    const WS = 'StandardHrHrForm';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'File Name', field: 'filename', width: 30},
        {headerName: 'Code', field: 'formTypeCode', width: 15},
        {headerName: 'Internal', field: 'internal', width: 15},
        {headerName: 'Description', field: 'formTypeDescription', width: 30},
        {headerName: 'Date', field: 'date2', type: 'numericColumn', width: 20},
        {headerName: 'File Type', field: 'extension', width: 20},
        {headerName: 'Comment Preview', field: 'commentPreview', width: 100}
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.multiSelect();
    grid.show();

    let data = {};
    AWS.callSoap(WS, 'checkRight', data).then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    grid.setOnSelectionChanged(function (rows) {
        if (rows.length === 1) {
            $$('view').enable();
            $$('edit').enable();
            $$('delete').enable();
            $$('copy').enable();
            $$('re-assign').enable();
            $$('separate').enable();
            $$('combine').disable();
        } else {
            $$('view').disable();
            $$('edit').disable();
            $$('delete').enable();
            $$('copy').disable();
            $$('re-assign').disable();
            $$('separate').disable();
            $$('combine').enable();
        }
    });

    function updateGrid() {
        grid.clear();
        $$('view').disable();
        $$('edit').disable();
        $$('delete').disable();
        $$('copy').disable();
        $$('re-assign').disable();
        $$('separate').disable();
        $$('combine').disable();
        data = {
            personId: personId
        };
        AWS.callSoap(WS, 'listFormsForPerson', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                for (let i = 0; i < res.item.length; i++)
                    res.item[i].date2 = DateUtils.intToStr4(Utils.toNumber(res.item[i].date))
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Employee Form(s)');
            }
        });
    }
    updateGrid();

    $$('add').onclick(function () {
        Utils.popup_open('add-popup');

        $('#ap-title').text('Add Form');

        $$('ap-code').clear();
        $$('ap-description').clear();
        $$('ap-comments').clear();
        $$('ap-file').clear();

        let data = {
        };
        AWS.callSoap(WS, 'listFormTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('ap-code');
                ctl.clear().add('', '(select)');
                ctl.addItems(res.item, 'id', 'code', 'description');
                ctl.onChange(function () {
                    $$('ap-description').setValue(ctl.getData());
                });
            }
        });

        $$('ap-ok').onclick(async function () {
            if ($$('ap-code').isError('Code'))
                return;
            if ($$('ap-file').isError('Form'))
                return;

            let data = {
                personId: personId,
                formTypeId: $$('ap-code').getValue(),
                comments: $$('ap-comments').getValue(),
                myFilename: $$('ap-file').uploadFilename(0)
            };
            Utils.waitMessage('File upload in progress.');
            await AWS.fileUpload('ap-file', 'hrFormUpload', data);
            Utils.waitMessageEnd();
            updateGrid();
            /////////////
            Utils.popup_close();
        });

        $$('ap-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    function viewForm() {
        let row = grid.getSelectedRow();
        let data = {
            id: row.id
        };
        Utils.waitMessage('Downloading form.');
        AWS.callSoap(WS, 'getForm', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    }

    $$('view').onclick(viewForm);
    grid.setOnRowDoubleClicked(viewForm);

    $$('edit').onclick(function () {
        Utils.popup_open('edit-popup');

        $('#ep-title').text('Edit Form');

        let row = grid.getSelectedRow();

        $$('ep-date').setValue(row.date2);

        let data = {
        };
        AWS.callSoap(WS, 'listFormTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('ep-code');
                ctl.clear().add('', '(select)');
                ctl.addItems(res.item, 'id', 'code', 'description');
                ctl.setValue(row.formTypeId);
                $$('ep-description').setValue(ctl.getData());
                ctl.onChange(function () {
                    $$('ep-description').setValue(ctl.getData());
                });
            }
        });

        data = {
            id: row.id
        };
        AWS.callSoap(WS, 'loadForm', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('ep-comments').setValue(res.comments);
            }
        });

        $$('ep-ok').onclick(async function () {
            if ($$('ep-code').isError('Code'))
                return;

            let data = {
                id: row.id,
                formTypeId: $$('ep-code').getValue(),
                comments: $$('ep-comments').getValue()
            };
            await AWS.callSoap(WS, 'saveForm', data);
            updateGrid();
            Utils.popup_close();
        });

        $$('ep-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('delete').onclick(function () {
       Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Employee Form?', function () {
           let ids = [];
           let rows = grid.getSelectedRows();
           for (let i=0 ; i < rows.length ; i++)
               ids.push(rows[i].id);
           let data = {
               ids: ids
           };
           AWS.callSoap(WS, 'deleteForms', data).then(function (res) {
               if (res.wsStatus === "0") {
                   updateGrid();
               }
           });
       });
    });

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    $$('copy').onclick(function () {
        Utils.popup_open('copy-form-popup');

        let row = grid.getSelectedRow();

        $$('cfp-code-1').setValue(row.formTypeCode);
        $$('cfp-description-1').setValue(row.formTypeDescription);

        let data = {
            firstName: null,
            firstNameSearchType: 0,
            lastName: null,
            lastNameSearchType: 0,
            personId: personId,
            searchType: 'E',
            ssn: null
        };
        AWS.callSoap(WS, 'searchPersons', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('cfp-person');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].personId, makeName(res.item[0].firstName, res.item[0].middleName, res.item[0].lastName));
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i=0 ; i < res.item.length ; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[i].firstName, res.item[i].middleName, res.item[i].lastName));
                    ctl.setValue(personId);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(personId, personName);
                }
            }
        });

        $$('cfp-person').setSelectFunction(async function () {
            let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
            if (res._status === "ok")
                $$('cfp-person').setValue(res.employeeid, makeName(res.fname, res.mname, res.lname));
        });

        data = {
        };
        AWS.callSoap(WS, 'listFormTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('cfp-code-2');
                ctl.clear().add('', '(select)');
                ctl.addItems(res.item, 'id', 'code', 'description');
                ctl.setValue(row.formTypeId);
                $$('cfp-description-2').setValue(ctl.getData());
                ctl.onChange(function () {
                    $$('cfp-description-2').setValue(ctl.getData());
                });
            }
        });

        $$('cfp-ok').onclick(function () {
            let data = {
                formId: row.id,
                formTypeId: $$('cfp-code-2').getValue(),
                personId: $$('cfp-person').getValue()
            };
            AWS.callSoap(WS, 'copyForm', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                    Utils.showMessage('Status', 'Form copied successfully.');
                    Utils.popup_close();
                }
            });
        });

        $$('cfp-cancel').onclick(function () {
            Utils.popup_close();
        });

    });

    $$('re-assign').onclick(function () {
        Utils.popup_open('reassign-form-popup');

        let row = grid.getSelectedRow();

        $$('rfp-code-1').setValue(row.formTypeCode);
        $$('rfp-description-1').setValue(row.formTypeDescription);
        $$('rfp-person-1').setValue(personName);

        let data = {
            firstName: null,
            firstNameSearchType: 0,
            lastName: null,
            lastNameSearchType: 0,
            personId: null,
            searchType: 'E',
            ssn: null
        };
        AWS.callSoap(WS, 'searchPersons', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('rfp-person');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].personId, makeName(res.item[0].firstName, res.item[0].middleName, res.item[0].lastName));
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i=0 ; i < res.item.length ; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[0].firstName, res.item[0].middleName, res.item[0].lastName));
                } else {
                    ctl.forceSelect();
                }
            }
        });

        $$('rfp-person').setSelectFunction(async function () {
            let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
            if (res._status === "ok")
                $$('rfp-person').setValue(res.employeeid, makeName(res.fname, res.mname, res.lname));
        });

        $$('rfp-ok').onclick(function () {
            if ($$('rfp-person').isError('Person'))
                return;
            let newPersonId = $$('rfp-person').getValue();
            if (newPersonId === personId) {
                Utils.showMessage('Error', "You can't assign back to the same person.");
                return;
            }
            let data = {
                formId: row.id,
                personId: newPersonId
            };
            AWS.callSoap(WS, 'reassignForm', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', 'Form Re-assigned successfully.')
                }
            });
            Utils.popup_close();
            updateGrid();
        });

        $$('rfp-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('combine').onclick(function () {
        let rows = grid.getSelectedRows();
        let allSameType = true;
        let formTypeId = rows[0].formTypeId;
        let formIds = [];

        for (let i=0 ; i < rows.length ; i++ ) {
            if (rows[i].extension !== "pdf") {
                Utils.showMessage('Error', 'Only Adobe PDF Forms can be combined.');
                return;
            }
            if (rows[i].formTypeId !== formTypeId)
                allSameType = false;
            formIds.push(rows[i].id);
        }

        const columnDefs = [
            {headerName: 'Code', field: 'formTypeCode', width: 40},
            {headerName: 'Date', field: 'date2', type: 'numericColumn', width: 30},
            {headerName: 'Comment Preview', field: 'formTypeDescription', width: 100}
        ];
        const cfGrid = new AGGrid('cf-grid', columnDefs);
        cfGrid.show();

        cfGrid.addRecords(rows);

        Utils.popup_open('combine-popup');

        let data = {
        };
        AWS.callSoap(WS, 'listFormTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('cf-code');
                ctl.clear().add('', '(select)');
                ctl.addItems(res.item, 'id', 'code', 'description');
                if (allSameType) {
                    ctl.setValue(formTypeId);
                    $$('cf-description').setValue(ctl.getData());
                } else
                    $$('cf-description').clear();
                ctl.onChange(function () {
                    $$('cf-description').setValue(ctl.getData());
                });
            }
        });

        $$('cf-ok').onclick(function () {
            if ($$('cf-code').isError('Code'))
                return;
            data = {
                formIds: formIds,
                formTypeId: $$('cf-code').getValue()
            };
            AWS.callSoap(WS, 'combineForms', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                }
            });
            Utils.popup_close();
        });

        $$('cf-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('separate').onclick(function () {
        let row = grid.getSelectedRow();

        if (row.extension !== 'pdf') {
            Utils.showMessage('Error', 'Only Adobe PDF Forms can be separated.');
            return;
        }

        $$('sp-code-1').setValue(row.formTypeCode);
        $$('sp-description-1').setValue(row.formTypeDescription);

        $$('sp-pages').clear();

        let data = {
        };
        AWS.callSoap(WS, 'listFormTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('sp-code-2');
                ctl.clear().add('', '(select)');
                ctl.addItems(res.item, 'id', 'code', 'description');
                ctl.setValue(row.formTypeId);
                $$('sp-description-2').setValue(ctl.getData());
                ctl.onChange(function () {
                    $$('sp-description-2').setValue(ctl.getData());
                });
            }
        });

        Utils.popup_open('separate-popup');

        $$('sp-ok').onclick(function () {
            if ($$('sp-pages').isError('Pages'))
                return;
            let pages = $$('sp-pages').getValue();
            pages = pages.replace(/o/ig, '0');
            pages = pages.replace(/[li]/gi, '1');
            pages = pages.replace(/ /g, '');
            let badChars = pages.replace(/[0123456789,]*/g, '');
            let numbers = pages.replace(/,/g, '');
            if (badChars) {
                Utils.showMessage('Error', 'Pages contains non-numeric entries.');
                return;
            }
            if (!numbers) {
                Utils.showMessage('Error', 'Pages must include some page numbers.');
                return;
            }
            let pageNumbers = [];
            let pm = pages.split(',');
            for (let i=0 ; i < pm.length ; i++)
                if (pm[i])
                    pageNumbers.push(pm[i]);
            let data = {
                formId: row.id,
                formTypeId: $$('sp-code-2').getValue(),
                pageNumbers: pageNumbers
            };
            AWS.callSoap(WS, 'extractPagesFromForm', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', 'Form Separated Successfully.');
                    Utils.popup_close();
                    updateGrid();
                }
            });

        });

        $$('sp-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

})();

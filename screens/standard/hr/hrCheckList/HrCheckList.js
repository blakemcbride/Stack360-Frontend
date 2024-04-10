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

    const WS = 'StandardHrHrCheckList';
    const lowCap = 10;
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    res = await AWS.callSoap(WS, "listEmployeeStatuses");
    if (res.wsStatus === '0') {
        $$('statusList').clear().addItems(res.item, 'employeeStatusId', 'name');
    } else
        return;

    const columnDefs = [
        {headerName: 'Check List Item', field: 'name', width: 60  },
        {headerName: 'Responsibility', field: 'responsibility2', width: 14  },
        {headerName: 'Active Date', field: 'activeDateFormatted', width: 13  },
        {headerName: 'Inactive Date', field: 'inactiveDateFormatted', width: 13  }
    ];
    const grid = new AGGrid('grid', columnDefs, 'itemId');
    grid.show();

    function updateGrid() {
        grid.clear();

        if (!$$('statusList').getValue())
            return;
        
        $$('add').enable();
        $$('edit').disable();
        $$('delete').disable();
        $$('report').enable();

        const data = {
            employeeStatusId: $$('statusList').getValue()
        };
        
        AWS.callSoap(WS, "listChecklistItems", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.responsibility2 = row.responsibility === 'E' ?  'Employee' : row.responsibility === 'M' ? 'Manager':'HR Administrator';
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Employee Check List Items');
            }
        });
    }

    $$('statusList').onChange(updateGrid);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    const listDocuments = (res) => {
        const ctl = $$('document');
        ctl.clear();

        if (!res.item || res.item.length === 0) {
            ctl.add('', '(nothing to select)').disable();
        } else if (res.item.length === 1) {
            ctl.add(res.item[0].companyFormId, res.item[0].formName).disable();
        } else if (res.item.length <= lowCap) {
            ctl.add('', '(choose)');
            ctl.addItems(res.item, 'companyFormId', 'formName');
            ctl.enable();
        } else {
            ctl.forceSelect();
        }
    }

    /////////////////////////////////////////////////////////////////////////////////
    // add document popup
    /////////////////////////////////////////////////////////////////////////////////
    const addDocument = async () => {

        Utils.popup_open('add-document');

        return new Promise(function (resolve, reject) {

            const reset = () => {
                $$('psp-code').setValue("");
                $$('psp-comments').setValue("");
                $$('psp-first-active-date').setValue("");
                $$('psp-last-active-date').setValue("");
                $$('psp-comments').setValue("");
            };

            const ok = async () => {
                if ($$('psp-code').isError('Code'))
                    return;
                if ($$('psp-form').isError('Form'))
                    return;
                if ($$('psp-comments').isError('Comments'))
                    return;

                const data = {
                    formTypeId: $$('psp-code').getValue(),
                    comments: $$('psp-comments').getValue(),
                    firstActiveDate: $$('psp-first-active-date').getIntValue(),
                    lastActiveDate: $$('psp-last-active-date').getIntValue(),
                    myFilename: $$('psp-form').uploadFilename(0)
                };
                Utils.waitMessage('File upload in progress.');
                await AWS.fileUpload('psp-form', 'companyFormUpload', data);
                Utils.waitMessageEnd();

                Utils.popup_close();
                resolve(data);
            };

            const cancel = () => {
                Utils.popup_close();
                resolve({});
            };

            AWS.callSoap(WS, 'listFormTypes').then(function (res) {
                if (res.wsStatus === "0") {
                    let ctl = $$('psp-code');
                    ctl.addItems(res.item, 'id', 'code', 'description');
                    ctl.onChange(function () {
                        $$('psp-description').setValue(ctl.getData());
                    });
                }
            });

            reset();

            $$('add-document-ok').onclick(ok);

            $$('add-document-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // screen or group search popup
    /////////////////////////////////////////////////////////////////////////////////
    const screenOrGroupSelection = async () => {

        Utils.popup_open('screen-or-group-selection');

        return new Promise(function (resolve, reject) {

            let screenOrGroupSearchGrid = null;

            const changeCount = count => {
                Utils.setText('scrGrpCount', `Displaying ${count} Screen Groups`);
            };

            const reset = () => {
                $$('psp-id').setValue("");
                $$('psp-name').setValue("");
                $$('psp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-screens').setValue(true);
                $$('psp-groups').setValue(true);
                $$('psp-wizards').setValue(true);

                screenOrGroupSearchGrid.clear();
                changeCount(0);
            };

            const ok = () => {
                let screenOrGroup = screenOrGroupSearchGrid.getSelectedRow();

                if (!screenOrGroup)
                    screenOrGroup = null;

                Utils.popup_close();
                resolve(screenOrGroup);
            };

            const cancel = () => {
                Utils.popup_close();
                resolve(null);
            };            

            // Setup drop downs.
            bindToEnum('psp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Name', field: 'name', width: 100},
                    {headerName: 'Type', field: 'type', width: 40},
                    {headerName: 'Parent Screen', field: 'parentScreenName', width: 60},
                    {headerName: 'Wizard Name', field: 'wizardName', width: 50}
                ];

                screenOrGroupSearchGrid = new AGGrid('screenOrGroupGrid', columnDefs, 'groupId');
                screenOrGroupSearchGrid.show();
            };

            if (!screenOrGroupSearchGrid)
                initDataGrid();

            reset();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            screenOrGroupSearchGrid.setOnSelectionChanged($$('screen-or-group-ok').enable);

            screenOrGroupSearchGrid.setOnRowDoubleClicked(ok);

            $$('screenOrGroupSearch').onclick(async () => {
                const inParams = {
                    screenOrGroupId: $$('psp-id').getValue(),
                    name: $$('psp-name').getValue(),
                    nameSearchType: $$('psp-name-type').getValue(),
                    includeScreens: $$('psp-screens').getValue(),
                    includeScreenGroups: $$('psp-groups').getValue(),
                    includeWizards: $$('psp-wizards').getValue(),
                };

                const data = await AWS.callSoap(WS, 'searchScreensAndGroups', inParams);

                // Clear the grid.
                screenOrGroupSearchGrid.clear();

                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    screenOrGroupSearchGrid.addRecords(records);

                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });

            $$('screen-or-group-ok').onclick(ok);

            $$('screen-or-group-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // company form search popup
    /////////////////////////////////////////////////////////////////////////////////
    const companyFormSelection = async () => {

        Utils.popup_open('company-form-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            const changeCount = count => {
                Utils.setText('companyFormCount', `Displaying ${count} Company Documents`);
            };

            const reset = () => {
                $$('psp-comment-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-comment').clear();
        
                formSearchGrid.clear();
                changeCount(0);
            };

            const ok = () => {
                let companyForm = formSearchGrid.getSelectedRow();
        
                if (!companyForm)
                    companyForm = null;
                
                resolve(companyForm);
                Utils.popup_close();
        
                reset();
            };

            const cancel = () => {
                reset();
                resolve(null);
                Utils.popup_close();
            };           
        
            // Setup drop downs.
            bindToEnum('psp-comment-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Company Documents', field: 'formName'},
                    {headerName: 'Comments', field: 'comments'}
                ];
        
                formSearchGrid = new AGGrid('companyFormGrid', columnDefs, 'id');
                formSearchGrid.show();
            };
        
            if (!formSearchGrid)
                initDataGrid();
        
            reset();
        
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
        
            formSearchGrid.setOnSelectionChanged($$('company-form-ok').enable);
        
            formSearchGrid.setOnRowDoubleClicked(ok);
        
            $$('companyFormReset').onclick(reset);
        
            $$('companyFormSearch').onclick(async () => {
                const inParams = {
                    name: $$('psp-comment').getValue(),
                    nameSearchType: $$('psp-comment-type').getValue(),
                };

                const data = await AWS.callSoap(WS, 'listAvailableDocuments', inParams);
        
                // Clear the grid.
                formSearchGrid.clear();
        
                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);
        
                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });
        
            $$('company-form-ok').onclick(ok);
        
            $$('company-form-cancel').onclick(cancel);
        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // check list item detail-popup
    /////////////////////////////////////////////////////////////////////////////////
    $$('add').onclick(() => {
        let screenId = undefined, screenGroupId = undefined, newFormComments = undefined;
        $$('dp-title').setValue('Add Check List Item');

        $$('dp-name').clear();
        $$('dp-active-date').clear(); $$('dp-inactive-date').clear();
        $$('screenOrGroup').setValue('');
        $$('dp-responsibility').clear();
        // $$('document').useDropdown();

        AWS.callSoap(WS, "listAvailableDocuments").then(function (res) {
            if (res.wsStatus === '0') {
                listDocuments(res);
            }
        });

        Utils.popup_open('detail-popup', 'dp-name');

        $$('chooseScreen').onclick(async () => {
            const selectedNode = await screenOrGroupSelection();
            
            if (selectedNode) {
                $$('screenOrGroup').setValue(selectedNode.name);

                screenId = selectedNode.type === "Screen" ? selectedNode.screenId : undefined;
                screenGroupId = selectedNode.type === "Screen" ? undefined : selectedNode.groupId;
            }
        });

        $$('document').setSelectFunction(async function () {
            let selectedNode = await companyFormSelection();
            if (selectedNode && selectedNode.data) {
                AWS.callSoap(WS, "listAvailableDocuments", {companyFormId: selectedNode.data.companyFormId}).then(function (res) {
                    if (res.wsStatus === '0') {
                        listDocuments(res);
                        $$('document').setValue(selectedNode.data.companyFormId, selectedNode.data.formName);
                    }
                });
            }
        });

        $$('addDocument').onclick(async () => {
            const data = await addDocument();
            if (data) {
                newFormComments = data.comments;
                AWS.callSoap(WS, "listAvailableDocuments", {name: newFormComments, nameSearchType: "4"}).then(function (res) {
                    if (res.wsStatus === '0') {
                        listDocuments(res);
                    }
                });
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Item'))
                return;
            if ($$('dp-responsibility').isError('Responsibility'))
                return;

            const data = {
                activeDate: $$('dp-active-date').getIntValue(),
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                employeeStatusId: $$('statusList').getValue(),
                name: $$('dp-name').getValue(),
                responsibility: $$('dp-responsibility').getValue(),
                screenId: screenId,
                screenGroupId: screenGroupId,
                companyFormId: $$('document').getValue(),
            };
            AWS.callSoap(WS, "newChecklistItem", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = grid.getSelectedRow();
        let screenId = row.screenId, screenGroupId = row.screenGroupId, newFormComments = undefined;
        $$('dp-title').setValue('Edit Check List Item');

        $$('dp-name').setValue(row.name);
        $$('dp-active-date').setValue(row.activeDate); $$('dp-inactive-date').setValue(row.inactiveDate);
        $$('screenOrGroup').setValue(row.screenOrGroupName);
        $$('dp-responsibility').setValue(row.responsibility);

        AWS.callSoap(WS, "listAvailableDocuments", {checklistItemId: row.itemId}).then(function (res) {
            if (res.wsStatus === '0') {
                listDocuments(res);
                if (res.selectedItem  &&  res.selectedItem.companyFormId)
                    $$('document').setValue(res.selectedItem.companyFormId, res.selectedItem.formName);
            }
        });

        Utils.popup_open('detail-popup', 'dp-name');

        $$('chooseScreen').onclick(async () => {
            const selectedNode = await screenOrGroupSelection();
            if (selectedNode && selectedNode.data) {
                $$('screenOrGroup').setValue(selectedNode.data.name);

                screenId = selectedNode.data.type === "Screen" ? selectedNode.data.screenId : undefined;
                screenGroupId = selectedNode.data.type === "Screen" ? undefined : selectedNode.data.groupId;
            }
        });

        $$('addDocument').onclick(async () => {
            const data = await addDocument();
            if (data) {
                newFormComments = data.comments;
                AWS.callSoap(WS, "listAvailableDocuments", {name: newFormComments, nameSearchType: "4"}).then(function (res) {
                    if (res.wsStatus === '0') {
                        listDocuments(res);
                    }
                });
            }
        });

        $$('document').setSelectFunction(async function () {
            let selectedNode = await companyFormSelection();
            if (selectedNode && selectedNode.data) {
                AWS.callSoap(WS, "listAvailableDocuments", {companyFormId: selectedNode.data.companyFormId}).then(function (res) {
                    if (res.wsStatus === '0') {
                        listDocuments(res);
                        $$('document').setValue(selectedNode.data.companyFormId, selectedNode.data.formName);
                    }
                });
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Item'))
                return;
            if ($$('dp-responsibility').isError('Responsibility'))
                return;

            const data = {
                activeDate: $$('dp-active-date').getIntValue(),
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                employeeStatusId: $$('statusList').getValue(),
                name: $$('dp-name').getValue(),
                checklistItemId: row.itemId,
                responsibility: $$('dp-responsibility').getValue(),
                screenId: screenId,
                screenGroupId: screenGroupId,
                companyFormId: $$('document').getValue(),
            };
            AWS.callSoap(WS, "saveChecklistItem", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Check List Item?', () => {
            const data = {
                ids: [grid.getSelectedRow().itemId]
            };
            
            AWS.callSoap(WS, "deleteChecklistItems", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getChecklistItemsReport", {statusId: $$('statusList').getValue()}).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });
})();

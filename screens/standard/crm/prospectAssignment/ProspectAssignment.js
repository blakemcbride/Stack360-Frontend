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

    const WS = 'StandardCrmProspectAssignment';
    
    const columnDefs = [
        { headerName: 'Prospect Name', field: 'name', width: 150 },
        { headerName: 'City', field: 'city', width: 80 },
        { headerName: 'State', field: 'state', width: 60 },
        { headerName: 'Zip', field: 'zip', width: 60 },
        { headerName: 'Sales Person', field: 'salesPerson'},
    ];
    const ProspectGrid = new AGGrid('prospect-grid', columnDefs, 'id');

    ProspectGrid.show();

    const SelectedGrid = new AGGrid('selected-grid', columnDefs, 'id');

    SelectedGrid.show();

    let excludeIds = [];
    let gridLimit = 0;

    const listSmartChooser = (elements) => {

        elements.map(element => {
            const ctl = $$(element.tag);
            ctl.clear();

            AWS.callSoap(WS, element.url, element.param).then(res => {
                if (res.wsStatus === '0') {
                    const items = Utils.assureArray(res[element.item]);
                    if (!items.length)
                        ctl.nothingToSelect();
                    else if (items.length === 1)
                        ctl.singleValue(items[0][element.ID], items[0][element.label]);
                    else if (items.length <= res.lowCap)
                        ctl.useDropdown(items, element.ID, element.label);
                    else
                        ctl.forceSelect();
            /*
                    if (res.selectedItem) {
                        res.selectedItem = Utils.assureArray(res.selectedItem);
                        ctl.addItems(res.selectedItem, element.ID, element.label);
                        ctl.setValue(res.selectedItem[element.ID], res.selectedItem[element.label]);
                    }
            
                    if (element.selected)
                        ctl.setValue(element.selected);
             */
                }
            });
        });
    };

    const init = () => {
        $$('select').disable();
        $$('remove').disable();
        $$('assign').disable();
        $$('sales-person').clear();
        $$('assign-sales-person').clear();
        $$('assign-date').clear();
        excludeIds = [];

        const params = {
            firstName: '',
            firstNameSearchType: 0,
            id: '',
            lastName: '',
            lastNameSearchType: 0
        };
        // AWS.callSoap(WS, 'searchEmployees', params).then(res => {
        //     if (res.wsStatus === '0') {
        //         res.item = Utils.assureArray(res.item);
        //         $$('sales-person').add('', '(all)').addItems(res.item, 'id', 'name');
        //         $$('assign-sales-person').add('', '(choose)').addItems(res.item, 'id', 'name');
        //     }
        // });

        listSmartChooser([
            {tag: 'sales-person', url: 'searchEmployees', item: 'item', ID: 'id', label: 'name'},
            {tag: 'assign-sales-person', url: 'searchEmployees', item: 'item', ID: 'id', label: 'name'}
        ]);

        $$('sales-person').setSelectFunction(() => {
            Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection', {allowNullSelection: false, title: 'Search for Employee'}).then(data => {
                if (data._status === "ok") {
                    if (data === -1)
                        $$('sales-person').setValue(null, '');
                    else {
                        $$('sales-person').setValue(data.employeeid, `${data.lname}, ${data.fname} ${data.mname}`);
                    }
                }
            })
        });

        $$('assign-sales-person').setSelectFunction(() => {
            Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection', {allowNullSelection: false, title: 'Search for Employee'}).then(data => {
                if (data._status === "ok") {
                    if (data === -1)
                        $$('assign-sales-person').setValue(null, '');
                    else {
                        $$('assign-sales-person').setValue(data.employeeid, `${data.lname}, ${data.fname} ${data.mname}`);
                    }
                }
            })
        });
    };

    init();

    const reset = () => {
        $$('ps-search-type').setValue('1');
        $$('ps-name').clear();
        $$('sales-person').setValue('');
    };

    $$('reset').onclick(reset);

    const search = () => {
        ProspectGrid.clear();
        $$('select').disable();
        const params = {
            employeeId: $$('sales-person').getValue(),
            excludeIds: excludeIds,
            name: $$('ps-name').getValue(),
            nameSearchType: $$('ps-search-type').getValue()
        }
        AWS.callSoap(WS, 'searchProspects', params).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                ProspectGrid.addRecords(res.item);
                gridLimit = res.cap;
                if (res.item.length >= gridLimit) {
                    $$('prospect-status').setValue('Displaying ' + res.item.length + ' Prospects (Limit)').setColor('red');
                } else {
                    $$('prospect-status').setValue('Displaying ' + res.item.length + ' Prospects').setColor('black');
                }
            }
        });
    };

    $$('search').onclick(search);

    const select = () => {
        const row = ProspectGrid.getSelectedRow();
        if (!row) {
            return;
        }

        excludeIds.push(row.id);
        ProspectGrid.deleteSelectedRows();

        SelectedGrid.addRecord(row);

        if (ProspectGrid.getNumberOfRows() >= gridLimit) {
            $$('prospect-status').setValue('Displaying ' + ProspectGrid.getNumberOfRows() + ' Prospects (Limit)').setColor('red');
        } else {
            $$('prospect-status').setValue('Displaying ' + ProspectGrid.getNumberOfRows() + ' Prospects').setColor('black');
        }

        if (SelectedGrid.getNumberOfRows() >= gridLimit) {
            $$('selected-status').setValue('Displaying ' + SelectedGrid.getNumberOfRows() + ' Prospects (Limit)').setColor('red');
        } else {
            $$('selected-status').setValue('Displaying ' + SelectedGrid.getNumberOfRows() + ' Prospects').setColor('black');
        }

        if (SelectedGrid.getNumberOfRows() > 0) {
            $$('assign').enable();
        } else {
            $$('assign').disable();
        }
    };

    ProspectGrid.setOnSelectionChanged((rows) => {
        $$('select').enable(rows);
    });
    ProspectGrid.setOnRowDoubleClicked(select);

    $$('select').onclick(select);

    SelectedGrid.setOnSelectionChanged((rows) => {
        $$('remove').enable(rows);
    });

    const remove = () => {
        const row = SelectedGrid.getSelectedRow();
        if (!row) {
            return;
        }

        const index = excludeIds.findIndex(e => e === row.id);
        excludeIds.splice(index, 1);

        SelectedGrid.deleteSelectedRows();
        $$('remove').disable();

        if (SelectedGrid.getNumberOfRows() >= gridLimit) {
            $$('selected-status').setValue('Displaying ' + SelectedGrid.getNumberOfRows() + ' Prospects (Limit)').setColor('red');
        } else {
            $$('selected-status').setValue('Displaying ' + SelectedGrid.getNumberOfRows() + ' Prospects').setColor('black');
        }

        if (SelectedGrid.getNumberOfRows() > 0) {
            $$('assign').enable();
        } else {
            $$('assign').disable();
        }
    };

    $$('remove').onclick(remove);

    const assign = () => {
        if ($$('assign-sales-person').isError('Assign to Sales Person')) {
            return;
        }

        const params = {
            employeeId: $$('assign-sales-person').getValue(),
            nextContactDate: $$('assign-date').getIntValue(),
            prospectIds: excludeIds
        };
        AWS.callSoap(WS, 'assignProspects', params).then(res => {
            if (res.wsStatus === '0') {
                SelectedGrid.clear();
                $$('selected-status').setValue('Displaying 0 Prospects').setColor('black');
                const message = excludeIds.length + ' Prospects assigned successfully to ' + $$('assign-sales-person').getData().name;
                Utils.showMessage('Information', message);
                init();
            }
        });
    };

    $$('assign').onclick(assign);

})();
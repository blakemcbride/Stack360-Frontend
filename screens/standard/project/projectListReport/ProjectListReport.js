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
    const WS = 'StandardProjectProjectListReport';
    let categories = [];
    let types = [];
    let statuses = [];

    $$('categories-smart-chooser').forceSelect();
    $$('types-smart-chooser').forceSelect();
    $$('status-smart-chooser').forceSelect();

    $$('requesting-company-smart-chooser').setSelectFunction(async function () {
        let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
        if (res._status === "ok")
            $$('requesting-company-smart-chooser').setValue(res.id, res.name);
    });

    $$('filter-status').onChange(function () {
       if ($$('filter-status').getValue() === '3') {
           $$('status-smart-chooser').enable();
           updateStatusSmartChooser();
       } else
           $$('status-smart-chooser').clear().disable();
    });

    let data = {
        name: null,
        nameSearchType: 0
    };
    AWS.callSoap(WS, 'searchCompanies', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('requesting-company-smart-chooser');
            ctl.clear();
            if (res.item.length === 0)
                ctl.nothingToSelect();
            else if (res.item.length === 1)
                ctl.singleValue(res.item[0].id, res.item[0].name);
            else if (res.item.length <= res.lowCap)
                ctl.useDropdown(res.item, 'id', 'name');
            else
                ctl.forceSelect();
        }
    });

    $$('categories-smart-chooser').setSelectFunction(function () {
        const savedCategories = Utils.cloneArrayShallow(categories);
        Utils.popup_open('project-category-popup');

        let columnDefs = [
            {headerName: 'Code', field: 'code', width: 33  },
            {headerName: 'Description', field: 'description', width: 66 }
        ];
        const agrid = new AGGrid('pcp-available-grid', columnDefs, 'id');
        agrid.show();

        columnDefs = [
            {headerName: 'Code', field: 'code', width: 33  },
            {headerName: 'Description', field: 'description', width: 66 }
        ];
        const fgrid = new AGGrid('pcp-filter-grid', columnDefs, 'id');
        fgrid.show();
        fgrid.addRecords(categories);

        function updateAgrid() {
            let data = {
                code: $$('pcp-code').getValue(),
                codeSearchType: $$('pcp-code-type').getValue(),
                description: $$('pcp-description').getValue(),
                descriptionSearchType: $$('pcp-description-type').getValue()
            };
            AWS.callSoap(WS, 'searchProjectCategories', data).then(function (res) {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    agrid.clear();
                    for (let i = 0; i < res.item.length; i++) {
                        let found = false;
                        for (let j = 0; j < categories.length; j++)
                            if (categories[j].id === res.item[i].id) {
                                found = true;
                                break;
                            }
                        if (!found)
                            agrid.addRecord(res.item[i]);
                    }
                    $$('pcp-available-status').setValue('Displaying ' + (res.item.length-categories.length) + ' Project Categories');
                }
            });
        }
        updateAgrid();

        function reset() {
            $$('pcp-code').clear();
            $$('pcp-description').clear();
            $$('pcp-code-type').setValue('2');
            $$('pcp-description-type').setValue('2');
        }
        reset();
        $$('pcp-reset').onclick(reset);

        $$('pcp-search').onclick(updateAgrid);

        function updateAvailableStatus() {
            $$('pcp-available-status').setValue('Displaying ' + agrid.getAllRows().length + ' Project Categories');
        }

        function updateFilterStatus() {
            $$('pcp-filter-status').setValue('Displaying ' + fgrid.getAllRows().length + ' Project Categories');
        }

        function add() {
            const row = agrid.getSelectedRow();
            categories.push(row);
            fgrid.addRecord(row);
            updateFilterStatus();
            agrid.deleteSelectedRows();
            updateAvailableStatus();
            $$('pcp-add').disable();
        }

        $$('pcp-add').disable();
        agrid.setOnRowDoubleClicked(add).clearSelection();
        $$('pcp-add').onclick(add);

        agrid.setOnSelectionChanged($$('pcp-add').enable);

        fgrid.setOnSelectionChanged($$('pcp-remove').enable);

        function remove() {
            const row = fgrid.getSelectedRow();
            fgrid.deleteSelectedRows();
            updateFilterStatus();
            $$('pcp-remove').disable();
            categories = fgrid.getAllRows();
            updateAgrid();
        }

        $$('pcp-remove').onclick(remove);
        fgrid.setOnRowDoubleClicked(remove);

        $$('pcp-ok').onclick(function () {
            Utils.popup_close();
            let r = '';
            for (let i=0 ; i < categories.length ; i++)
                if (r)
                    r += ', ' + categories[i].code;
                else
                    r = categories[i].code;
            $$('categories-smart-chooser').setValue('', r);
        });

        $$('pcp-cancel').onclick(function () {
            categories = savedCategories;
            Utils.popup_close();
        });
    });

    $$('types-smart-chooser').setSelectFunction(function () {
        const savedTypes = Utils.cloneArrayShallow(types);
        Utils.popup_open('project-type-popup');

        let columnDefs = [
            {headerName: 'Code', field: 'code', width: 33  },
            {headerName: 'Description', field: 'description', width: 66 }
        ];
        const agrid = new AGGrid('ptp-available-grid', columnDefs, 'id');
        agrid.show();

        columnDefs = [
            {headerName: 'Code', field: 'code', width: 33  },
            {headerName: 'Description', field: 'description', width: 66 }
        ];
        const fgrid = new AGGrid('ptp-filter-grid', columnDefs, 'id');
        fgrid.show();
        fgrid.addRecords(types);

        function updateAgrid() {
            let data = {
                code: $$('ptp-code').getValue(),
                codeSearchType: $$('ptp-code-type').getValue(),
                description: $$('ptp-description').getValue(),
                descriptionSearchType: $$('ptp-description-type').getValue()
            };
            AWS.callSoap(WS, 'searchProjectTypes', data).then(function (res) {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    agrid.clear();
                    for (let i = 0; i < res.item.length; i++) {
                        let found = false;
                        for (let j = 0; j < types.length; j++)
                            if (types[j].id === res.item[i].id) {
                                found = true;
                                break;
                            }
                        if (!found)
                            agrid.addRecord(res.item[i]);
                    }
                    $$('ptp-available-status').setValue('Displaying ' + (res.item.length-types.length) + ' Project Types');
                }
            });
        }
        updateAgrid();

        function reset() {
            $$('ptp-code').clear();
            $$('ptp-description').clear();
            $$('ptp-code-type').setValue('2');
            $$('ptp-description-type').setValue('2');
        }
        reset();
        $$('ptp-reset').onclick(reset);

        $$('ptp-search').onclick(updateAgrid);

        function updateAvailableStatus() {
            $$('ptp-available-status').setValue('Displaying ' + agrid.getAllRows().length + ' Project Types');
        }

        function updateFilterStatus() {
            $$('ptp-filter-status').setValue('Displaying ' + fgrid.getAllRows().length + ' Project Types');
        }

        function add() {
            const row = agrid.getSelectedRow();
            types.push(row);
            fgrid.addRecord(row);
            updateFilterStatus();
            agrid.deleteSelectedRows();
            updateAvailableStatus();
            $$('ptp-add').disable();
        }

        $$('ptp-add').disable();
        agrid.setOnRowDoubleClicked(add).clearSelection();
        $$('ptp-add').onclick(add);

        agrid.setOnSelectionChanged($$('ptp-add').enable);

        fgrid.setOnSelectionChanged($$('ptp-remove').enable);

        function remove() {
            const row = fgrid.getSelectedRow();
            fgrid.deleteSelectedRows();
            updateFilterStatus();
            $$('ptp-remove').disable();
            types = fgrid.getAllRows();
            updateAgrid();
        }

        $$('ptp-remove').onclick(remove);
        fgrid.setOnRowDoubleClicked(remove);

        $$('ptp-ok').onclick(function () {
            Utils.popup_close();
            let r = '';
            for (let i=0 ; i < types.length ; i++)
                if (r)
                    r += ', ' + types[i].code;
                else
                    r = types[i].code;
            $$('types-smart-chooser').setValue('', r);
        });

        $$('ptp-cancel').onclick(function () {
            types = savedTypes;
            Utils.popup_close();
        });
    });

    function updateStatusSmartChooser() {
        let r = '';
        for (let i=0 ; i < statuses.length ; i++)
            if (r)
                r += ', ' + statuses[i].code;
            else
                r = statuses[i].code;
        $$('status-smart-chooser').setValue('', r);
    }

    $$('status-smart-chooser').setSelectFunction(function () {
        const savedStatuses = Utils.cloneArrayShallow(statuses);
        Utils.popup_open('project-status-popup');

        let columnDefs = [
            {headerName: 'Code', field: 'code', width: 33  },
            {headerName: 'Description', field: 'description', width: 66 }
        ];
        const agrid = new AGGrid('psp-available-grid', columnDefs, 'id');
        agrid.show();

        columnDefs = [
            {headerName: 'Code', field: 'code', width: 33  },
            {headerName: 'Description', field: 'description', width: 66 }
        ];
        const fgrid = new AGGrid('psp-filter-grid', columnDefs, 'id');
        fgrid.show();
        fgrid.addRecords(statuses);

        function updateAgrid() {
            let data = {
                code: $$('psp-code').getValue(),
                codeSearchType: $$('psp-code-type').getValue(),
                description: $$('psp-description').getValue(),
                descriptionSearchType: $$('psp-description-type').getValue()
            };
            AWS.callSoap(WS, 'searchProjectStatuses', data).then(function (res) {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    agrid.clear();
                    for (let i = 0; i < res.item.length; i++) {
                        let found = false;
                        for (let j = 0; j < statuses.length; j++)
                            if (statuses[j].id === res.item[i].id) {
                                found = true;
                                break;
                            }
                        if (!found)
                            agrid.addRecord(res.item[i]);
                    }
                    $$('psp-available-status').setValue('Displaying ' + (res.item.length-statuses.length) + ' Project Types');
                }
            });
        }
        updateAgrid();

        function reset() {
            $$('psp-code').clear();
            $$('psp-description').clear();
            $$('psp-code-type').setValue('2');
            $$('psp-description-type').setValue('2');
        }
        reset();
        $$('psp-reset').onclick(reset);

        $$('psp-search').onclick(updateAgrid);

        function updateAvailableStatus() {
            $$('psp-available-status').setValue('Displaying ' + agrid.getAllRows().length + ' Project Types');
        }

        function updateFilterStatus() {
            $$('psp-filter-status').setValue('Displaying ' + fgrid.getAllRows().length + ' Project Types');
        }

        function add() {
            const row = agrid.getSelectedRow();
            statuses.push(row);
            fgrid.addRecord(row);
            updateFilterStatus();
            agrid.deleteSelectedRows();
            updateAvailableStatus();
            $$('psp-add').disable();
        }

        $$('psp-add').disable();
        agrid.setOnRowDoubleClicked(add).clearSelection();
        $$('psp-add').onclick(add);

        agrid.setOnSelectionChanged($$('psp-add').enable);

        fgrid.setOnSelectionChanged($$('psp-remove').enable);

        function remove() {
            const row = fgrid.getSelectedRow();
            fgrid.deleteSelectedRows();
            updateFilterStatus();
            $$('psp-remove').disable();
            statuses = fgrid.getAllRows();
            updateAgrid();
        }

        $$('psp-remove').onclick(remove);
        fgrid.setOnRowDoubleClicked(remove);

        $$('psp-ok').onclick(function () {
            Utils.popup_close();
            updateStatusSmartChooser();
        });

        $$('psp-cancel').onclick(function () {
            statuses = savedStatuses;
            Utils.popup_close();
        });
    });

    function getStatusIds() {
        const s = [];
        if ($$('filter-status').getValue() === '3')
            for (let i=0 ; i < statuses.length ; i++)
                s.push(statuses[i].id);
        return s;
    }

    function getTypeIds() {
        const s = [];
        for (let i=0 ; i < types.length ; i++)
            s.push(types[i].id);
        return s;
    }

    function getCategoryIds() {
        const s = [];
        for (let i=0 ; i < categories.length ; i++)
            s.push(categories[i].id);
        return s;
    }

    $$('report').onclick(function () {
        let data = {
            includeAssignedOrgGroup: $$('assigned-org-group').getValue(),
            includeAssignedPerson: $$('assigned-people').getValue(),
            includeCategory: $$('include-category').getValue(),
            includeDateReported: $$('include-date-reported').getValue(),
            includeDescription: $$('include-description').getValue(),
            includeName: $$('include-id').getValue(),
            includeReference: $$('include-reference').getValue(),
            includeRequestingCompany: $$('include-name').getValue(),
            includeStatus: $$('include-status').getValue(),
            includeType: $$('include-type').getValue(),
            requestingCompanyId: $$('requesting-company-smart-chooser').getValue(),
            sortAsc: $$('sort-order').getValue(),
            sortType: $$('sort-field').getValue(),
            statusType: $$('filter-status').getValue(),
            statusIds: getStatusIds(),
            typeIds: getTypeIds(),
            categoryIds: getCategoryIds()
        };
        AWS.callSoap(WS, 'getReport', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });

    });

})();

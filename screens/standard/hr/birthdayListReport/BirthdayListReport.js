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

    const WS = 'StandardHrBirthdayListReport';

    $$('month').selectIndex(new Date().getMonth());

    $$('reportBy').onChange(() => {
        if ($$('reportBy').getValue() === 'M') {
            $$('month').show();
            $$('month-label').show();

            $$('fromDate').hide();
            $$('fromDate-label').hide();
            $$('toDate').hide();
            $$('toDate-label').hide();
        } else {
            $$('month').hide();
            $$('month-label').hide();

            $$('fromDate').show();
            $$('fromDate-label').show();
            $$('toDate').show();
            $$('toDate-label').show();
        }
    });

    let availableEmployeeStatusesGrid;
    const availableEmployeeStatusesColumnDefs = [
        {headerName: "Available Employee Statuses", field: "description", width: 200},
    ];
    availableEmployeeStatusesGrid = new AGGrid('availableEmployeeStatusesGrid', availableEmployeeStatusesColumnDefs);
    availableEmployeeStatusesGrid.show();

    let selectedEmployeeStatusesGrid;
    const selectedEmployeeStatusesColumnDefs = [
        {headerName: "Selected Employee Statuses", field: "description", width: 200},
    ];
    selectedEmployeeStatusesGrid = new AGGrid('selectedEmployeeStatusesGrid', selectedEmployeeStatusesColumnDefs);
    selectedEmployeeStatusesGrid.multiSelect();
    selectedEmployeeStatusesGrid.show();

    selectedEmployeeStatusesGrid.setOnSelectionChanged($$('remove').enable);
    selectedEmployeeStatusesGrid.setOnRowDoubleClicked(deselectEmployeeStatus);

    AWS.callSoap(WS, "listEmployeeStatuses").then(data => {
        availableEmployeeStatusesGrid.clear();
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);
            availableEmployeeStatusesGrid.addRecords(data.item);
            availableEmployeeStatusesGrid.setOnSelectionChanged($$('add').enable);
            availableEmployeeStatusesGrid.setOnRowDoubleClicked(selectEmployeeStatus);
        }
    });

    function selectEmployeeStatus() {
        selectedEmployeeStatusesGrid.addRecord(availableEmployeeStatusesGrid.getSelectedRow());
        availableEmployeeStatusesGrid.deleteSelectedRows();
        $$('add').disable();
        $$('remove').disable();
    }
    function deselectEmployeeStatus() {
        availableEmployeeStatusesGrid.addRecord(selectedEmployeeStatusesGrid.getSelectedRow());
        selectedEmployeeStatusesGrid.deleteSelectedRows();
        $$('add').disable();
        $$('remove').disable();
    }
    $$('add').onclick(selectEmployeeStatus);
    $$('remove').onclick(deselectEmployeeStatus);

    $$('report').onclick(() => {
        if ($$('reportBy').getValue() === 'M') {
            if ($$('month').isError('Month'))
                return;
        } else {
            if ($$('fromDate').isError('From Date'))
                return;

            if ($$('toDate').isError('To Date'))
                return;
        }

        const params = {
            dateFrom: $$('reportBy').getValue() !== 'M' ? $$('fromDate').getIntValue() : 0,
            dateTo: $$('reportBy').getValue() !== 'M' ? $$('toDate').getIntValue() : 0,
            month: $$('reportBy').getValue() === 'M' ? $$('month').getValue() : 0
        }
        if (selectedEmployeeStatusesGrid.numberOfSelectedRows() > 0) {
            let statusIds = [];

            const rows = selectedEmployeeStatusesGrid.getSelectedRows();
            for (let i = 0; i < rows.length; i++) {
                statusIds.push(rows[i].id);
            }
            params.statusIds = statusIds;
        }
        Utils.waitMessage("Generating report.  Please wait.")
        AWS.callSoap(WS, "getReport", params).then(res => {
            Utils.waitMessageEnd();
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();

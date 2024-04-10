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

    const WS = 'StandardCrmProspectLog';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    let prospectId = Utils.getData(CURRENT_PROSPECT_ID);
    let prospectName = Utils.getData(CURRENT_PROSPECT_NAME);

    $$('prospect-name').setValue(prospectName);

    const columnDefs = [
        {headerName: 'Date', field: 'contactDate', width: 50  },
        {headerName: 'Time', field: 'contactTime', width: 50 },
        {headerName: 'Log Entry', field: 'contactTime', width: 300 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');

    grid.show();
    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function updateGrid() {
        grid.clear();

        AWS.callSoap(WS, 'listLogs', {id: prospectId}).then(ret => {
            if (ret.wsStatus === '0') {
                ret.item = Utils.assureArray(ret.item);
                for (let i=0 ; i < ret.item.length ; i++) {
                    let r = ret.item[i];
                    r.contactDate = DateUtils.intToStr4(Number(r.contactDate));
                    r.contactTime = TimeUtils.format(Number(r.contactTime));
                }
                grid.addRecords(ret.item);
                $$('status').setValue(`Displaying ${ret.item.length} Prospect Log Entries`);
            }
        });
    }

    updateGrid();

    const resultGrid = new AGGrid('dp-result-grid', [{headerName: 'Description', field: 'description' }], 'id'); 
    resultGrid.show();
    
    function detailPopup(row) {

        function resetDialog() {
            $$('dp-title').setValue(row ? 'Edit Prospect Log Entry':'Add Prospect Log Entry');
            
            $$('dp-contact-date').setValue(DateUtils.dateToInt(new Date));
            $$('dp-contact-time').setValue(TimeUtils.current());

            $$('dp-detail').clear();
            $$('dp-company-employees').clear();
            $$('dp-prospect-employees').clear();

            resultGrid.clear();
        }

        /**
         * Initialize the new worker dialog.
         */
        async function initDialog() {

            resetDialog();

            let data = await AWS.callSoap(WS, 'listActivities');
            fillDropDownFromService('dp-activity', data, 'id', 'code');

            if (row) {
                $$('dp-activity').setValue(row.activityId);
                data = await AWS.callSoap(WS, 'loadLog', {id: row.id});

                $$('dp-detail').setValue(data.contactText);
                $$('dp-company-employees').setValue(data.employees);
                $$('dp-prospect-employees').setValue(data.prospectEmployees);
            }
        }

        initDialog();

        Utils.popup_open('detail-popup');

        return new Promise(function (resolve, reject) {
            $$('dp-activity').onChange(v => {
                resultGrid.clear();
                AWS.callSoap(WS, 'listResults', {activityId: $$('dp-activity').getValue()}).then(ret => {
                    if (ret.wsStatus === 0) {
                        ret.items = Utils.assureArray(ret.items);
                        resultGrid.addRecords(ret.items);
                    }
                });
            });
            
            function ok() {
                if ($$('dp-contact-date').isError('Contact Date'))
                    return;
                if ($$('dp-contact-time').isError('Contact Time'))
                    return;
                if ($$('dp-activity').isError('Sales Activity'))
                    return;
                if ($$('dp-detail').isError('Detail'))
                    return;
                // if (!resultGrid.getSelectedRow()) {
                //     Utils.showMessage('Error', 'At least one of the Activity Result is required');
                //     return;
                // }

                const data = {
                    resultId: resultGrid.getSelectedRow() ? resultGrid.getSelectedRow().id : null,
                    contactDate: $$('dp-contact-date').getIntValue(),
                    contactText: $$('dp-detail').getValue(),
                    contactTime: $$('dp-contact-time').getValue(),
                    employees: $$('dp-company-employees').getValue(),
                    prospectEmployees: $$('dp-prospect-employees').getValue(),
                    activityId: $$('dp-activity').getValue()
                };
                Utils.popup_close();
                resolve(data);
            }
            
            function cancel() {
                Utils.popup_close();
                resolve(null);
            }

            $$('dp-ok').onclick(ok);
            $$('dp-cancel').onclick(cancel);
        });

    };

    $$('add').onclick(async () => {
        const data = await detailPopup();
        if (data) {
            AWS.callSoap(WS, 'newLog', { ...data, id: prospectId }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    async function edit() {
        const row = grid.getSelectedRow();
        const data = await detailPopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveLog', { ...data, id: row.id }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Prospect Log Entries?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteLogs", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });            
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getReport', {id: prospectId}).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    });
})();
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
    const WS = 'StandardMiscAlertManagingCompany';

    let alertsGrid;

    const alertsColumnDefs = [
        {headerName: "Detail", field: "detail", width: 600},
        {headerName: "Start Date", field: "startDateFormatted", type: 'numericColumn', width: 150},
        {headerName: "End Date", field: "endDateFormatted", type: 'numericColumn', width: 150},
        {headerName: "Last Edited By", field: "lastChangePerson", width: 200},
        {headerName: "Last Edited Date", field: "lastChangeDate", width: 200}
    ];

    alertsGrid = new AGGrid('alertsGrid', alertsColumnDefs);

    alertsGrid.show();

    function searchAlerts() {
        const params = {
            alertDate: $$('amc-date').getIntValue(),
            personFilter: $$('amc-sentByCurrent').getValue()
        }

        AWS.callSoap(WS, 'searchAlerts', params).then(data => {
            alertsGrid.clear();
            $$('edit').disable();
            $$('delete').disable();
            if (data.wsStatus === "0") {
                data.alerts = Utils.assureArray(data.alerts);
                for (let i = 0; i < data.alerts.length; i++) {
                    data.alerts[i].startDateFormatted = data.alerts[i].startDate !== '0' ? DateUtils.intToStr4(Number(data.alerts[i].startDate)) : '';
                    data.alerts[i].endDateFormatted = data.alerts[i].endDate !== '0' ? DateUtils.intToStr4(Number(data.alerts[i].endDate)) : '';
                }
                alertsGrid.addRecords(data.alerts);     
                $$('alerts-label').setValue('Displaying ' + data.alerts.length + ' Alerts');
                alertsGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
                alertsGrid.setOnRowDoubleClicked(edit);
            }     
        });
    }
    $$('amc-date').onChange(searchAlerts);
    $$('amc-sentByCurrent').onChange(searchAlerts);

    $$('add').onclick(() => {
        $('#employee-search').css('display', 'none');
        Utils.popup_set_height('alert-popup', '420px');

        $$('alert-label').setValue('Add');
        $$('amc-alertType').setValue('1').enable();
        $$('amc-message').clear();
        $$('amc-startDate').clear();
        $$('amc-endDate').clear();

        $$('amc-ok').onclick(() => {
            if ($$('amc-message').isError('Detail')) {
                return;
            }
            if ($$('amc-startDate').isError('Start Date')) {
                return;
            }
            if ($$('amc-endDate').isError('End Date')) {
                return;
            }
            const params = {
                alertType: $$('amc-alertType').getValue(),
                endDate: $$('amc-endDate').getIntValue(),
                message: $$('amc-message').getValue(),
                startDate: $$('amc-startDate').getIntValue()
            }
            
            AWS.callSoap(WS, 'newAlert', params).then(data => {
                if (data.wsStatus === "0") {
                    searchAlerts();
                    Utils.popup_close();
                }     
            });
        });
        $$('amc-cancel').onclick(Utils.popup_close);
        Utils.popup_open('alert-popup');
    });
    function edit() {
        $('#employee-search').css('display', 'none');
        Utils.popup_set_height('alert-popup', '420px');
        $$('alert-label').setValue('Edit');
        $$('amc-alertType').disable();

        const row = alertsGrid.getSelectedRow();
        const params = {
            id: row.id
        }
        AWS.callSoap(WS, 'loadAlert', params).then(data => {
            if (data.wsStatus === "0") {               
                $$('amc-alertType').setValue(data.alertType);
                $$('amc-message').setValue(data.message);
                $$('amc-startDate').setValue(Number(data.startDate));
                $$('amc-endDate').setValue(Number(data.endDate));     
            }     
        });

        $$('amc-ok').onclick(() => {
            if ($$('amc-message').isError('Detail')) {
                return;
            }
            if ($$('amc-startDate').isError('Start Date')) {
                return;
            }
            if ($$('amc-endDate').isError('End Date')) {
                return;
            }
            const params = {
                alertType: $$('amc-alertType').getValue(),
                endDate: $$('amc-endDate').getIntValue(),
                message: $$('amc-message').getValue(),
                startDate: $$('amc-startDate').getIntValue(),
                id: row.id
            }
            AWS.callSoap(WS, 'saveAlert', params).then(data => {
                if (data.wsStatus === "0") {
                    searchAlerts();
                    Utils.popup_close();
                }     
            });
        });
        $$('amc-cancel').onclick(Utils.popup_close);
        Utils.popup_open('alert-popup');
    }
    $$('edit').onclick(edit);
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Alert?', () => {
            const row = alertsGrid.getSelectedRow();
            const data = {
                ids: row.id
            };
            AWS.callSoap(WS, 'deleteAlerts', data).then(function (res) {
                if (res.wsStatus === "0") {
                    searchAlerts();
                }
            });
        });
    });
    searchAlerts();
})();

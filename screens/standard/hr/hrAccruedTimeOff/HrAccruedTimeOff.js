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

    const WS = 'StandardHrHrAccruedTimeOff';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== "0") {
            return;
        }
    });

    const requestColumnDefs = [
        { headerName: 'First Day Off', field: 'firstDateFormatted' },
        { headerName: 'Last Day Off', field: 'lastDateFormatted' },
        { headerName: 'Type (Project)', field: 'project' },
        { headerName: 'Requester Comments', field: 'requestingComments' }
    ];
    const requestGrid = new AGGrid('request-grid', requestColumnDefs, 'id');

    requestGrid.show();
    requestGrid.setOnSelectionChanged($$('mark').enable);

    function initData() {
        $$('start-date').setValue('20200101');
        $$('show').disable();
        $$('add').disable();

        const data = {
            personId: personId
        };
        AWS.callSoap(WS, 'listTimeRelatedBenefits', data).then(res => {
            if (res.wsStatus === '0') {
                let benefitsCtrl = $$('accrued-benefit');
                benefitsCtrl.clear();

                benefitsCtrl.add("", "(select)");

                // Add the sources to the drop down control.
                if (res.item) {
                    res.item.forEach(item => {
                        benefitsCtrl.add(item.id, item.name, item);
                    });
                }
            }
        });

        const benefitRequestData = {
            employeeId: personId
        };
        AWS.callSoap(WS, 'getBenefitPeriod', benefitRequestData).then(res => {
            if (res.wsStatus === '0') {
                $$('start-date').setValue(res.startDate);
            }
        });

        AWS.callSoap(WS, 'listApprovedTimeOffRequests', data).then(res => {
            res.item = Utils.assureArray(res.item);
            requestGrid.clear();
            for (let i=0 ; i < res.item.length ; i++) {
                res.item[i].firstDateFormatted = DateUtils.intToStr4(res.item[i].firstDate);
                res.item[i].lastDateFormatted = DateUtils.intToStr4(res.item[i].lastDate);
            }
            requestGrid.addRecords(res.item);
        });
    }

    initData();

    const columnDefs = [
        { headerName: 'Date', field: 'dateFormatted', width: 30 },
        { headerName: 'Hours', type: 'numericColumn', field: 'hoursFormatted', width: 30 },
        { headerName: 'Net Time Off', type: 'numericColumn', field: 'runningTotal', width: 30 },
        { headerName: 'Description', field: 'description' },
    ];
    const grid = new AGGrid('grid', columnDefs);

    grid.show();

    $$('accrued-benefit').onChange((v) => {
        if (v) {
            $$('add').enable();
            $$('show').enable();
        } else {
            $$('add').disable();
            $$('show').disable();
        }
        grid.clear();
    });

    $$('date-range').onChange((value) => {
        if (value === '1') {
            $$('ending-date').disable();
        } else {
            $$('ending-date').enable();
        }
    });

    function updateGrid() {
        const showEntries = $$('date-range').getValue();
        const data = {
            employeeId: personId,
            accrualAccountId: $$('accrued-benefit').getValue(),
            startDate: $$('start-date').getIntValue(),
            endDate: showEntries === '2' ? $$('ending-date').getIntValue() : ''
        };

        AWS.callSoap(WS, 'listAccruedTimeOff', data).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                grid.clear();
                for (let i=0 ; i < res.item.length ; i++) {
                    if (res.item[i].hours === '0.0') {
                        res.item[i].hoursFormatted = '';
                    } else if (Number(res.item[i].hours) < 0) {
                        res.item[i].hoursFormatted = '(' + (Number(res.item[i].hours) * -1).toFixed(2) + ')';
                    } else {
                        res.item[i].hoursFormatted = (Number(res.item[i].hours)).toFixed(2);
                    }
                    if (res.item[i].runningTotal) {
                        res.item[i].runningTotal = (Number(res.item[i].runningTotal)).toFixed(1);
                    }
                }
                grid.addRecords(res.item);
                if (res.item.length < Utils.toNumber(res.cap))
                    $$('status').setColor('black').setValue('Displaying ' + res.item.length + " Employe Accrued Time Off " + ( res.item.length === 1 ? "Entry" : "Entries"));
                else
                    $$('status').setColor('red').setValue('Displaying ' + res.item.length + " Employe Accrued Time Off " + ( res.item.length === 1 ? "Entry" : "Entries") + " (limit)");
                $$('total').setValue((res.total ? (Number(res.total)).toFixed(1) : '0.0'));
            }
        });
    }

    $$('show').onclick(() => {
        updateGrid();
    });

    $$('show-time-off').onChange((v) => {
        if (v === true) {
            $('#approved-requests').css('display', 'block');
            $('#grid').css('height', 'calc(100% - 370px)');
            $('#status').css('bottom', '240px');
            $('#bottom-bar').css('bottom', '230px');
        } else {
            $('#approved-requests').css('display', 'none');
            $('#grid').css('height', 'calc(100% - 150px)');
            $('#status').css('bottom', '20px');
            $('#bottom-bar').css('bottom', '10px');
        }
    });

    const addAccruedTime = () => {
        $$('ap-description').clear();
        $$('ap-date').setValue(20201210);
        $$('ap-hours').setValue('0');
        $$('ap-type').setValue(1);
        Utils.popup_open('add-popup', 'ap-description');

        $$('ap-ok').onclick(() => {
            if ($$('ap-description').isError('Description'))
                    return;
    
            const data = {
                description: $$('ap-description').getValue(),
                accrualAccountId: $$('accrued-benefit').getValue(),
                hours: $$('ap-type').getValue() === '1' ? $$('ap-hours').getValue() * -1 : $$('ap-hours').getValue(),
                date: $$('ap-date').getIntValue(),
                employeeId: personId
            };
            AWS.callSoap(WS, 'newAccruedTimeOff', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    };

    $$('add').onclick(addAccruedTime);

    $$('report').onclick(() => {
        if ($$('accrued-benefit').isError('Benefit'))
            return;
        const showEntries = $$('date-range').getValue();
        const data = {
            employeeId: personId,
            accrualAccountId: $$('accrued-benefit').getValue(),
            startDate: $$('start-date').getIntValue(),
            endDate: showEntries === '2' ? $$('ending-date').getIntValue() : 0
        };

        AWS.callSoap(WS, "reportAccruedTimeOff", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });
    requestGrid.onSle

    $$('mark').onclick(() => {
        const data = {
            ids: requestGrid.getValue()
        };

        AWS.callSoap(WS, "markTimeOffRequestsEntered", data).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
            }
        });
    })

})();

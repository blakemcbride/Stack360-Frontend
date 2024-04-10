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
    const WS = 'StandardHrPaySchedule';

    function getListPaySchedules(selection) {
        $$('ps-paySchedules').clear().add('', "(select)");
        AWS.callSoap(WS, 'listPaySchedules').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ps-paySchedules').addItems(data.item, "id", "name");
                if (selection) {
                    $$('ps-paySchedules').setValue(selection);
                    $$('paySchedulesEdit').enable();
                    $$('paySchedulesDelete').enable();
                } else {
                    paySchedulesGrid.clear();
                    $$('paySchedulesEdit').disable();
                    $$('paySchedulesDelete').disable();
                }
            }  
        });
    }

    getListPaySchedules();

    $$('ps-paySchedules').onChange(() => {
        $$('edit').disable();                    
        $$('delete').disable();    

        if ($$('ps-paySchedules').getValue() !== '') {
            $$('paySchedulesEdit').enable();
            $$('paySchedulesDelete').enable();
            $$('generate').enable();
            $$('add').enable();
            $$('report').enable();
            searchPayPeriods(); 
        } else {
            $$('paySchedulesEdit').disable();
            $$('paySchedulesDelete').disable();
            $$('generate').disable();
            $$('add').disable();
            $$('report').disable();
            paySchedulesGrid.clear();
        }
    });   

    let date = new Date();
    $$('ps-fromDate').setValue(new Date(date.getFullYear(), 0, 1));
    $$('ps-toDate').setValue(new Date(date.getFullYear() + 1, 0, 0));

    $$('ps-fromDate').onChange(() => {
        $$('edit').disable();                    
        $$('delete').disable();    

        if ($$('ps-paySchedules').getValue() !== '') {
            $$('paySchedulesEdit').enable();
            $$('paySchedulesDelete').enable();
            $$('generate').enable();
            $$('add').enable();
            $$('report').enable();
            searchPayPeriods(); 
        } else {
            $$('paySchedulesEdit').disable();
            $$('paySchedulesDelete').disable();
            $$('generate').disable();
            $$('add').disable();
            $$('report').disable();
            paySchedulesGrid.clear();
        }
    });

    $$('ps-toDate').onChange(() => {
        $$('edit').disable();                    
        $$('delete').disable();    

        if ($$('ps-paySchedules').getValue() !== '') {
            $$('paySchedulesEdit').enable();
            $$('paySchedulesDelete').enable();
            $$('generate').enable();
            $$('add').enable();
            $$('report').enable();
            searchPayPeriods(); 
        } else {
            $$('paySchedulesEdit').disable();
            $$('paySchedulesDelete').disable();
            $$('generate').disable();
            $$('add').disable();
            $$('report').disable();
            paySchedulesGrid.clear();
        }
    });

    let paySchedulesGrid;
 
    const paySchedulesColumnDefs = [
        {headerName: "First Date", field: "firstDateFormatted", type: "numericColumn", width: 120},
        {headerName: "Last Date", field: "lastDateFormatted", type: "numericColumn", width: 120},
        {headerName: "Pay Date", field: "payDatePerson", type: "numericColumn", width: 120},
        {headerName: "First Pay Period of Year", field: "beginningOfYearFormatted", width: 240}
    ];
    paySchedulesGrid = new AGGrid('paySchedulesGrid', paySchedulesColumnDefs);
    paySchedulesGrid.show();  

    function searchPayPeriods() {

        const params = {           
            id: $$('ps-paySchedules').getValue(),
            fromDate: $$('ps-fromDate').getIntValue(),
            toDate: $$('ps-toDate').getIntValue()
        };
        AWS.callSoap(WS, 'searchPayPeriods', params).then(data => {
            if (data.wsStatus === '0') {     
                paySchedulesGrid.clear();
                data.item = Utils.assureArray(data.item);
                $$('ps-status').setValue('Displaying ' + data.item.length + ' Pay Periods');
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].firstDateFormatted = DateUtils.intToStr4(Number(data.item[i].firstDate));
                    data.item[i].lastDateFormatted = DateUtils.intToStr4(Number(data.item[i].lastDate));
                    data.item[i].payDatePerson = DateUtils.intToStr4(Number(data.item[i].payDate));
                    data.item[i].beginningOfYearFormatted = data.item[i].beginningOfYear === 'true' ? 'Yes' : 'No';
                }
                paySchedulesGrid.addRecords(data.item);
                paySchedulesGrid.setOnSelectionChanged(() => {
                    $$('edit').enable();                    
                    $$('delete').enable();                    
                });
                paySchedulesGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    $$('paySchedulesAdd').onclick(() => {
        $$('pay-schedule-label').setValue('Add');
        $$('ps-payScheduleName').clear();
        $$('ps-payScheduleDescription').clear();

        Utils.popup_open("pay-schedule-popup", "ps-payScheduleName");

        $$('pay-schedule-ok').onclick(() => {
            if ($$('ps-payScheduleName').isError('Name'))
                return;

            const params = {
                description: $$('ps-payScheduleDescription').getValue(),
                name: $$('ps-payScheduleName').getValue()
            }
            AWS.callSoap(WS, 'newPaySchedule', params).then(data => {
                if (data.wsStatus === "0") {
                    getListPaySchedules(data.id);
                    Utils.popup_close();
                }  
            });
        });
        $$('pay-schedule-cancel').onclick(Utils.popup_close);
    });

    $$('paySchedulesEdit').onclick(() => {
        $$('pay-schedule-label').setValue('Edit');
        let payScheduleData = $$('ps-paySchedules').getData();
        $$('ps-payScheduleName').setValue(payScheduleData.name);
        $$('ps-payScheduleDescription').setValue(payScheduleData.description);

        Utils.popup_open("pay-schedule-popup");

        $$('pay-schedule-ok').onclick(() => {
            if ($$('ps-payScheduleName').isError('Name'))
                return;

            const params = {
                description: $$('ps-payScheduleDescription').getValue(),
                name: $$('ps-payScheduleName').getValue(),
                id: payScheduleData.id
            }
            AWS.callSoap(WS, 'savePaySchedule', params).then(data => {
                if (data.wsStatus === "0") {
                    getListPaySchedules(payScheduleData.id);
                    Utils.popup_close();
                }  
            });
        });
        $$('pay-schedule-cancel').onclick(Utils.popup_close);
    });

    $$('paySchedulesDelete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Pay Schedule?', function () {
            const params = {
                id: $$('ps-paySchedules').getValue()
            }
            AWS.callSoap(WS, 'deletePaySchedule', params).then(data => {
                if (data.wsStatus === "0") {
                    getListPaySchedules();
                }  
            });
        });     
    });

    $$('generate').onclick(() => {
        function reset() {
            $$('ps-periodTypeEvery').setValue('');
            $$('ps-periodTypeEveryOther').disable().setValue('');
            $$('ps-periodTypeEveryOf').disable().clear();
            $$('ps-periodTypeEveryOfAnd1').disable().clear();
            $$('ps-periodTypeEveryOfAnd2').disable().clear();
        }

        $$('ps-periodsFromDate').setValue($$('ps-fromDate').getIntValue());
        $$('ps-periodsToDate').setValue($$('ps-toDate').getIntValue());
        $$('ps-periodType').setValue('1');
        reset();
        $$('ps-setPayPeriodYear').setValue(true);
        
        $$('ps-periodType').onChange(() => {
            reset();
            switch ($$('ps-periodType').getValue()) {
                case '1':
                    $$('ps-periodTypeEvery').enable();
                    break;
                case '2':
                    $$('ps-periodTypeEveryOther').enable();
                    break;
                case '3':
                    $$('ps-periodTypeEveryOf').enable();
                    break;
                case '4':
                    $$('ps-periodTypeEveryOfAnd1').enable();
                    $$('ps-periodTypeEveryOfAnd2').enable();
                    break; 
                default:
                    break;
            }
        });

        Utils.popup_open("generate-per-periods-popup");

        $$('generate-per-periods-ok').onclick(() => {

            switch ($$('ps-periodType').getValue()) {
                case '1':
                    if ($$('ps-periodTypeEvery').isError('Period'))
                        return;
                    break;
                case '2':
                    if ($$('ps-periodTypeEveryOther').isError('Period'))
                        return;
                    break;
                case '3':
                    if ($$('ps-periodTypeEveryOf').isError('Period'))
                        return;
                    break;
                case '4':
                    if ($$('ps-periodTypeEveryOfAnd1').isError('Period'))
                        return;
                    if ($$('ps-periodTypeEveryOfAnd2').isError('Period'))
                        return;
                    break; 
                default:
                    break;
            }

            const params = {
                fromDate: $$('ps-periodsFromDate').getIntValue(),
                id: $$('ps-paySchedules').getValue(),
                periodStart: $$('ps-periodType').getValue() === '3' ? $$('ps-periodTypeEveryOf') : $$('ps-periodType').getValue() === '4' ? $$('ps-periodTypeEveryOfAnd1').getValue() : 0,
                periodStart2: $$('ps-periodType').getValue() === '4' ? $$('ps-periodTypeEveryOfAnd2').getValue() : 0,
                periodType: $$('ps-periodType').getValue(),
                setFirstPayPeriodAsBeginning: $$('ps-setPayPeriodYear').getValue(),
                toDate: $$('ps-periodsToDate').getIntValue()
            }
            AWS.callSoap(WS, 'loadDefaultPayPeriods', params).then(data => {
                if (data.wsStatus === "0") {
                    searchPayPeriods();
                    Utils.popup_close();
                }  
            });
        });
        $$('generate-per-periods-cancel').onclick(Utils.popup_close);
    });

    $$('add').onclick(() => {
        $$('pay-period-label').setValue('Add');
        $$('ps-periodLastDate').clear();
        $$('ps-periodPayDate').clear();
        $$('ps-payPeriodYear').setValue(false);

        Utils.popup_open("pey-period-popup");

        $$('pey-period-ok').onclick(() => {
            if ($$('ps-periodLastDate').isError('Last Date'))
                return;
            if ($$('ps-periodPayDate').isError('Pay Date'))
                return;

            const params = {
                beginningOfYear: $$('ps-payPeriodYear').getValue(),
                id: $$('ps-paySchedules').getValue(),
                lastDate: $$('ps-periodLastDate').getIntValue(),
                payDate: $$('ps-periodPayDate').getIntValue()
            }
            AWS.callSoap(WS, 'newPayPeriod', params).then(data => {
                if (data.wsStatus === "0") {
                    searchPayPeriods();
                    Utils.popup_close();
                }  
            });
        });
        $$('pey-period-cancel').onclick(Utils.popup_close);
    });

    function edit() {
        const row = paySchedulesGrid.getSelectedRow();

        $$('pay-period-label').setValue('Edit');
        $$('ps-periodLastDate').setValue(row.lastDate);
        $$('ps-periodPayDate').setValue(row.payDate);
        $$('ps-payPeriodYear').setValue(row.beginningOfYear === 'true');

        Utils.popup_open("pey-period-popup");

        $$('pey-period-ok').onclick(() => {
            if ($$('ps-periodLastDate').isError('Last Date'))
                return;
            if ($$('ps-periodPayDate').isError('Pay Date'))
                return;

            const params = {
                beginningOfYear: $$('ps-payPeriodYear').getValue(),
                id: row.id,
                lastDate: $$('ps-periodLastDate').getIntValue(),
                payDate: $$('ps-periodPayDate').getIntValue()
            }
            AWS.callSoap(WS, 'savePayPeriod', params).then(data => {
                if (data.wsStatus === "0") {
                    searchPayPeriods();
                    Utils.popup_close();
                }  
            });
        });
        $$('pey-period-cancel').onclick(Utils.popup_close);
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Pay Period?', function () {
            const params = {
                ids: paySchedulesGrid.getSelectedRow().id
            }
            AWS.callSoap(WS, 'deletePayPeriods', params).then(data => {
                if (data.wsStatus === "0") {
                    searchPayPeriods();
                }  
            });
        });     
    });

    $$('report').onclick(() => {
        const params = {
            fromDate: $$('ps-fromDate').getIntValue(),
            id: $$('ps-paySchedules').getValue(),
            toDate: $$('ps-toDate').getIntValue()
        };

        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });  
    });
})();

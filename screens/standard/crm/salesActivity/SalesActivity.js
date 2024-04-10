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

    const WS = 'StandardCrmSalesActivity';

    let columnDefs = [
        {headerName: 'Code', field: 'code', width: '10'},
        {headerName: 'Description', field: 'description', width: '180'},
        {headerName: 'Points', field: 'points', type: "numericColumn", width: '10'},
    ];
    let activityGrid = new AGGrid('acitivity-grid', columnDefs, 'id');
    activityGrid.show();

    columnDefs = [
        {headerName: 'Description', field: 'description', width: '80'},
        {headerName: 'Days Until First Follow Up', field: 'firstDays', type: "numericColumn", width: '20'},
    ];
    let resultsGrid = new AGGrid('results-grid', columnDefs, 'id');
    resultsGrid.show();

    const updateActivityGrid = () => {
        activityGrid.clear();
        resultsGrid.clear();

        $$('activity-edit').disable();
        $$('activity-delete').disable();
        $$('activity-moveup').disable();
        $$('activity-movedown').disable();

        $$('result-add').disable();
        $$('result-edit').disable();
        $$('result-delete').disable();
        $$('result-moveup').disable();
        $$('result-movedown').disable();
        
        AWS.callSoap(WS, "listActivities", {
            showActive: $$('active-activity').getValue(),
            showInactive: $$('inactive-activity').getValue(),
        }).then((res) => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.lastActiveDateFormatted = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                activityGrid.addRecords(res.item);

                $$('activity-status').setValue('Displaying ' + res.item.length + ' Sales Activities');
            }
        });
    }

    updateActivityGrid();

    $$('active-activity').onChange((v) => {
        updateActivityGrid();
    });

    $$('inactive-activity').onChange((v) => {
        activityGrid.destroy();
        if (v) {
            columnDefs = [
                {headerName: 'Code', field: 'code', width: '10'},
                {headerName: 'Description', field: 'description', width: '160'},
                {headerName: 'Points', field: 'points', type: "numericColumn", width: '10'},
                {headerName: 'Last Active Date', field: 'lastActiveDateFormatted', type: "numericColumn", width: '20'},
            ];
        } else {
            columnDefs = [
                {headerName: 'Code', field: 'code', width: '10'},
                {headerName: 'Description', field: 'description', width: '180'},
                {headerName: 'Points', field: 'points', type: "numericColumn", width: '10'},
            ];
        }
        activityGrid = new AGGrid('acitivity-grid', columnDefs, 'id');
        activityGrid.show();

        activityGrid.setOnSelectionChanged((rows) => {
            $$('activity-edit').enable(rows);
            $$('activity-delete').enable(rows);
            $$('activity-moveup').enable(rows);
            $$('activity-movedown').enable(rows);
    
            $$('result-add').enable(rows);
    
            updateResultsGrid();
        });
        activityGrid.setOnRowDoubleClicked(editActivityPopup);

        updateActivityGrid();
    });

    const addActivityPopup = () => {
        $$('aap-title').setValue('Add Sales Activity');
        $$('aap-code').clear();
        $$('aap-description').clear();
        $$('aap-date').clear();
        $$('aap-points').clear();
        $$('aap-all-company').clear();

        Utils.popup_open('add-activity-popup', 'aap-code');

        const ok = () => {
            if ($$('aap-code').isError('Code')) {
                return;
            }

            AWS.callSoap(WS, 'newActivity', { 
                allCompanies: $$('aap-all-company').getValue(),
                code: $$('aap-code').getValue(),
                description: $$('aap-description').getValue(),
                lastActiveDate: $$('aap-date').getIntValue(),
                points: $$('aap-points').getValue()
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateActivityGrid();
                }
            });

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('aap-ok').onclick(ok);
        $$('aap-cancel').onclick(cancel);
    };

    $$('activity-add').onclick(addActivityPopup);

    const editActivityPopup = () => {
        $$('aap-title').setValue('Edit Sales Activity');
        AWS.callSoap(WS, 'checkRight').then((res) => {
            if (res.wsStatus !== '0') {
                return;
            }
        });
        const row = activityGrid.getSelectedRow();
        if (!row) {
            return;
        }

        $$('aap-code').setValue(row.code);
        $$('aap-description').setValue(row.description);
        $$('aap-date').setValue(row.lastActiveDate);
        $$('aap-points').setValue(row.points);
        $$('aap-all-company').setValue(row.allCompanies);

        Utils.popup_open('add-activity-popup', 'aap-code');

        const ok = () => {
            if ($$('aap-code').isError('Code')) {
                return;
            }

            AWS.callSoap(WS, 'saveActivity', { 
                allCompanies: $$('aap-all-company').getValue(),
                code: $$('aap-code').getValue(),
                description: $$('aap-description').getValue(),
                lastActiveDate: $$('aap-date').getIntValue(),
                points: $$('aap-points').getValue(),
                id: row.id
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateActivityGrid();
                }
            });

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('aap-ok').onclick(ok);
        $$('aap-cancel').onclick(cancel);
    };

    $$('activity-edit').onclick(editActivityPopup);
    activityGrid.setOnRowDoubleClicked(editActivityPopup);

    const updateResultsGrid = () => {
        const activity = activityGrid.getSelectedRow();
        resultsGrid.clear();

        $$('result-edit').disable();
        $$('result-delete').disable();
        $$('result-moveup').disable();
        $$('result-movedown').disable();
        
        AWS.callSoap(WS, "listResults", {
            activityId: activity.id,
            showActive: $$('active-result').getValue(),
            showInactive: $$('inactive-result').getValue(),
        }).then((res) => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.lastActiveDateFormatted = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                resultsGrid.addRecords(res.item);

                $$('results-status').setValue('Displaying ' + res.item.length + ' Activity Results');
            }
        });
    }

    activityGrid.setOnSelectionChanged((rows) => {
        $$('activity-edit').enable(rows);
        $$('activity-delete').enable(rows);
        $$('activity-moveup').enable(rows);
        $$('activity-movedown').enable(rows);

        $$('result-add').enable(rows);

        updateResultsGrid();
    });

    $$('active-result').onChange((v) => {
        updateResultsGrid();
    });

    $$('inactive-result').onChange((v) => {
        resultsGrid.destroy();
        if (v) {
            columnDefs = [
                {headerName: 'Description', field: 'description', width: '80'},
                {headerName: 'Days Until First Follow Up', field: 'firstDays', type: "numericColumn", width: '20'},
                {headerName: 'Last Active Date', field: 'lastActiveDateFormatted', type: "numericColumn", width: '20'},
            ];
        } else {
            columnDefs = [
                {headerName: 'Description', field: 'description', width: '80'},
                {headerName: 'Days Until First Follow Up', field: 'firstDays', type: "numericColumn", width: '20'},
            ];
        }
        resultsGrid = new AGGrid('results-grid', columnDefs, 'id');
        resultsGrid.show();

        resultsGrid.setOnSelectionChanged((rows) => {
            $$('result-edit').enable(rows);
            $$('result-delete').enable(rows);
            $$('result-moveup').enable(rows);
            $$('result-movedown').enable(rows);
        });

        resultsGrid.setOnRowDoubleClicked(editResultPopup);

        updateResultsGrid();
    });

    $$('activity-delete').onclick(() => {

        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Sales Activity?', () => {
            const data = {
                ids: [activityGrid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteActivities", data).then((res) => {
                if (res.wsStatus === '0') {
                    updateActivityGrid();
                }
            });
        });
    });

    $$('activity-moveup').onclick(() => {
        let id = activityGrid.getSelectedRow().id;
        AWS.callSoap(WS, "moveActivity", { 
            id: activityGrid.getSelectedRow().id, 
            moveUp: true
        }).then((res) => {
            if (res.wsStatus === '0') {
                updateActivityGrid();
                setTimeout(() => activityGrid.selectId(id), 100);
            }
        });
    });

    $$('activity-movedown').onclick(() => {
        let id = activityGrid.getSelectedRow().id;
        AWS.callSoap(WS, "moveActivity", { 
            id: activityGrid.getSelectedRow().id, 
            moveUp: false
        }).then((res) => {
            if (res.wsStatus === '0') {
                updateActivityGrid();
                setTimeout(() => activityGrid.selectId(id), 100);
            }
        });
    });

    const addResultPopup = () => {
        const activity = activityGrid.getSelectedRow();
        if (!activity) {
            return;
        }
        $$('arp-title').setValue('Add Activity Result');
        $$('arp-description').clear();
        $$('arp-date').clear();
        $$('arp-first-days').clear();
        $$('arp-second-days').clear();
        $$('arp-third-days').clear();
        $$('arp-first-task').clear();
        $$('arp-second-task').clear();
        $$('arp-third-task').clear();

        Utils.popup_open('add-result-popup', 'arp-description');

        const ok = () => {
            if ($$('arp-description').isError('Description')) {
                return;
            }

            AWS.callSoap(WS, 'newResult', { 
                activityId: activity.id,
                description: $$('arp-description').getValue(),
                lastActiveDate: $$('arp-date').getIntValue(),
                firstDays: $$('arp-first-days').getValue(),
                secondDays: $$('arp-second-days').getValue(),
                thirdDays: $$('arp-third-days').getValue(),
                firstTask: $$('arp-first-task').getValue(),
                secondTask: $$('arp-second-task').getValue(),
                thirdTask: $$('arp-third-task').getValue(),
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateResultsGrid();
                }
            });

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('arp-ok').onclick(ok);
        $$('arp-cancel').onclick(cancel);
    };

    $$('result-add').onclick(addResultPopup);

    const editResultPopup = () => {
        const result = resultsGrid.getSelectedRow();
        if (!result) {
            return;
        }
        $$('arp-title').setValue('Edit Activity Result');

        AWS.callSoap(WS, 'loadResult', {
            resultId: result.id
        }).then(res => {
            if (res.wsStatus === '0') {
                $$('arp-description').setValue(res.description);
                $$('arp-date').setValue(res.lastActiveDate);
                $$('arp-first-days').setValue(res.firstDays);
                $$('arp-second-days').setValue(res.secondDays);
                $$('arp-third-days').setValue(res.thirdDays);
                $$('arp-first-task').setValue(res.firstTask);
                $$('arp-second-task').setValue(res.secondTask);
                $$('arp-third-task').setValue(res.thirdTask);
            }
        })

        Utils.popup_open('add-result-popup', 'arp-description');

        const ok = () => {
            if ($$('arp-description').isError('Description')) {
                return;
            }

            AWS.callSoap(WS, 'saveResult', { 
                id: result.id,
                description: $$('arp-description').getValue(),
                lastActiveDate: $$('arp-date').getIntValue(),
                firstDays: $$('arp-first-days').getValue(),
                secondDays: $$('arp-second-days').getValue(),
                thirdDays: $$('arp-third-days').getValue(),
                firstTask: $$('arp-first-task').getValue(),
                secondTask: $$('arp-second-task').getValue(),
                thirdTask: $$('arp-third-task').getValue(),
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateResultsGrid();
                }
            });

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('arp-ok').onclick(ok);
        $$('arp-cancel').onclick(cancel);
    };

    resultsGrid.setOnSelectionChanged((rows) => {
        $$('result-edit').enable(rows);
        $$('result-delete').enable(rows);
        $$('result-moveup').enable(rows);
        $$('result-movedown').enable(rows);
    });

    $$('result-edit').onclick(editResultPopup);
    resultsGrid.setOnRowDoubleClicked(editResultPopup);

    $$('result-delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Activity Result?', () => {
            const data = {
                ids: [resultsGrid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteResults", data).then((res) => {
                if (res.wsStatus === '0') {
                    updateResultsGrid();
                }
            });
        });
    });

    $$('result-moveup').onclick(() => {
        let id = resultsGrid.getSelectedRow().id;
        AWS.callSoap(WS, "moveResult", { 
            id: resultsGrid.getSelectedRow().id, 
            moveUp: true
        }).then((res) => {
            if (res.wsStatus === '0') {
                updateResultsGrid();
                setTimeout(() => resultsGrid.selectId(id), 100);
            }
        });
    });

    $$('result-movedown').onclick(() => {
        let id = resultsGrid.getSelectedRow().id;
        AWS.callSoap(WS, "moveResult", { 
            id: resultsGrid.getSelectedRow().id, 
            moveUp: false
        }).then((res) => {
            if (res.wsStatus === '0') {
                updateResultsGrid();
                setTimeout(() => resultsGrid.selectId(id), 100);
            }
        });
    });

})();

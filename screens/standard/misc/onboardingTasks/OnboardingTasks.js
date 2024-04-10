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
    const WS = 'StandardMiscOnboardingTasks';

    function getListOnboardingConfigs(selection) {
        $$('ot-configurations').clear().add('', "(select)");
        AWS.callSoap(WS, 'listOnboardingConfigs').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ot-configurations').addItems(data.item, "configId", "configName");
                if (selection) {
                    $$('ot-configurations').setValue(selection);
                    $$('configurationsEdit').enable();
                    $$('configurationsDelete').enable();
                    $$('add').enable();
                } else {
                    tasksGrid.clear();
                    $$('configurationsEdit').disable();
                    $$('configurationsDelete').disable();
                    $$('add').disable();
                }
            }  
        });
    }

    getListOnboardingConfigs();

    $$('ot-configurations').onChange(() => {
        $$('edit').disable();                    
        $$('delete').disable();

        if ($$('ot-configurations').getValue() !== '') {
            $$('configurationsEdit').enable();
            $$('configurationsDelete').enable();
            $$('add').enable();
            getListTasksForConfig(); 
        } else {
            $$('configurationsEdit').disable();
            $$('configurationsDelete').disable();
            $$('add').disable();
            tasksGrid.clear();
        }
    });   

    let tasksGrid;
 
    const tasksColumnDefs = [
        {headerName: "Name", field: "taskName", width: 200},
        {headerName: "Description", field: "description", width: 800},
        {headerName: "Days to Complete", field: "completeByDays", type: "numericColumn", width: 200}
    ];
    tasksGrid = new AGGrid('tasksGrid', tasksColumnDefs);
    tasksGrid.show();  

    function getListTasksForConfig() {

        const params = {           
            configId: $$('ot-configurations').getValue()
        };
        AWS.callSoap(WS, 'listTasksForConfig', params).then(data => {
            if (data.wsStatus === '0') {     
                tasksGrid.clear();
                data.item = Utils.assureArray(data.item);                
                tasksGrid.addRecords(data.item);
                tasksGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
                tasksGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    $$('configurationsAdd').onclick(async () => {
        let checkRight = await AWS.callSoap(WS, 'checkRight');

        $$('oc-label').setValue('Add');
        $$('ot-ocName').clear();

        Utils.popup_open("oc-popup", "ot-ocName");

        $$('oc-ok').onclick(() => {
            if ($$('ot-ocName').isError('Name'))
                return;

            const params = {
                configName: $$('ot-ocName').getValue(),
                allCompanies: checkRight.canAccessAllCompanies
            }
            AWS.callSoap(WS, 'newConfig', params).then(data => {
                if (data.wsStatus === "0") {
                    getListOnboardingConfigs(data.id);
                    getListTasksForConfig();
                    Utils.popup_close();
                }  
            });
        });
        $$('oc-cancel').onclick(Utils.popup_close);
    });

    $$('configurationsEdit').onclick(async () => {
        let checkRight = await AWS.callSoap(WS, 'checkRight');

        $$('oc-label').setValue('Edit');
        let configurationData = $$('ot-configurations').getData();
        $$('ot-ocName').setValue(configurationData.configName);

        Utils.popup_open("oc-popup");

        $$('oc-ok').onclick(() => {
            if ($$('ot-ocName').isError('Name'))
                return;

            const params = {
                allCompanies: checkRight.canAccessAllCompanies,
                configName: $$('ot-ocName').getValue(),
                configId: configurationData.configId
            }
            AWS.callSoap(WS, 'saveConfig', params).then(data => {
                if (data.wsStatus === "0") {
                    getListOnboardingConfigs(configurationData.configId);
                    Utils.popup_close();
                }  
            });
        });
        $$('oc-cancel').onclick(Utils.popup_close);
    });

    $$('configurationsDelete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Onboarding Configuration?', function () {
            const params = {
                ids: $$('ot-configurations').getValue()
            }
            AWS.callSoap(WS, 'deleteConfigs', params).then(data => {
                if (data.wsStatus === "0") {
                    getListOnboardingConfigs();
                }  
            });
        });     
    });

    $$('add').onclick(() => {
        $$('task-label').setValue('Add');
        $$('ot-taskName').clear();
        $$('ot-taskDescription').clear();
        $$('ot-taskCompleteAfter').clear();
        $$('ot-taskScreen').clear().add('', '(select)');

        Utils.popup_open("task-popup");

        AWS.callSoap(WS, 'listOnboardingScreens').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ot-taskScreen').addItems(data.item, "screenId", "screenName");
            }  
        });

        $$('task-ok').onclick(() => {
            if ($$('ot-taskName').isError('Name'))
                return;
            if ($$('ot-taskDescription').isError('Description'))
                return;
            if ($$('ot-taskScreen').isError('Screen'))
                return;

            const params = {
                completeByDays: $$('ot-taskCompleteAfter').getValue(),
                configId: $$('ot-configurations').getValue(),
                description: $$('ot-taskDescription').getValue(),
                screenId: $$('ot-taskScreen').getValue(),
                taskName: $$('ot-taskName').getValue()
            }
            AWS.callSoap(WS, 'newTask', params).then(data => {
                if (data.wsStatus === "0") {
                    getListTasksForConfig();
                    Utils.popup_close();
                }  
            });
        });
        $$('task-cancel').onclick(Utils.popup_close);
    });

    function edit() {
        const row = tasksGrid.getSelectedRow();

        $$('task-label').setValue('Edit');

        $$('ot-taskScreen').clear().add('', '(select)');
        AWS.callSoap(WS, 'listOnboardingScreens').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ot-taskScreen').addItems(data.item, "screenId", "screenName");
                $$('ot-taskScreen').setValue(row.screenId);
            }  
        });
        $$('ot-taskCompleteAfter').setValue(row.completeByDays);
        $$('ot-taskDescription').setValue(row.description);
        $$('ot-taskName').setValue(row.taskName);

        Utils.popup_open("task-popup");

        $$('task-ok').onclick(() => {
            if ($$('ot-taskName').isError('Name'))
                return;
            if ($$('ot-taskDescription').isError('Description'))
                return;
            if ($$('ot-taskScreen').isError('Screen'))
                return;

            const params = {
                completeByDays: $$('ot-taskCompleteAfter').getValue(),
                configId: $$('ot-configurations').getValue(),
                description: $$('ot-taskDescription').getValue(),
                screenId: $$('ot-taskScreen').getValue(),
                taskName: $$('ot-taskName').getValue(),
                taskId: row.taskId
            }
            AWS.callSoap(WS, 'saveTask', params).then(data => {
                if (data.wsStatus === "0") {
                    getListTasksForConfig();
                    Utils.popup_close();
                }  
            });
        });
        $$('task-cancel').onclick(Utils.popup_close);
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Onboarding Task?', function () {
            const params = {
                ids: tasksGrid.getSelectedRow().taskId
            }
            AWS.callSoap(WS, 'deleteTasks', params).then(data => {
                if (data.wsStatus === "0") {
                    getListTasksForConfig();
                }  
            });
        });     
    });
})();

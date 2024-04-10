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
    const WS = 'StandardHrProjectSummary';
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    let res = await AWS.callSoap(WS, 'checkRight');
    if (res.wsStatus === "0") {
    } else
        return;

    $$('ps-project').setValue(projectName + " - " + projectSummary);

    let projectData = {};

    function getProjectData() {
        const params = {
            projectId: projectId
        }
        AWS.callSoap(WS, 'listEmployeesForAssignment', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
    
                const baog = $$('ps-assignedTo');
                baog.clear().add('', '(select)');
                baog.addItems(data.item, "employeeId", "displayName");    
                if (projectData.assignedEmployeeId !== undefined) {
                    baog.setValue(projectData.assignedEmployeeId);
                }
            }
        });
    
        AWS.callSoap(WS, 'listProjectTypes').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
    
                const baog = $$('ps-type');
                baog.clear().add('', '(select)');
                baog.addItems(data.projectTypes, "projectTypeId", "code");    
                if (projectData.projectTypeId !== undefined) {
                    baog.setValue(projectData.projectTypeId);
                }
            }
        });
    
        AWS.callSoap(WS, 'listStatuses', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
    
                const baog = $$('ps-status');
                baog.clear().add('', '(select)');
                baog.addItems(data.item, "statusId", "statusCode"); 
                if (projectData.statusId !== undefined) {
                    baog.setValue(projectData.statusId);
                }   
            }
        });
    
        AWS.callSoap(WS, 'loadSummary', params).then(data => {
            if (data.wsStatus === "0") {
                $$('ps-assignedTo').setValue(data.assignedEmployeeId);
                $$('ps-type').setValue(data.projectTypeId);
                $$('ps-status').setValue(data.statusId);
                $$('ps-summary').setValue(data.summary);
                $$('ps-detail').setValue(data.detail);
                $$('ps-requestDate').setValue(Number(data.dateRequested));
                $$('ps-requestTime').setValue(Number(data.timeRequested));
    
                $$('ps-completedDate').setValue(Number(data.dateCompleted));
                if (data.dateCompleted !== '0') {
                    $$('ps-completedTime').setValue(Number(data.timeCompleted));
                }
                projectData = {
                    assignedEmployeeId: data.assignedEmployeeId,
                    dateCompleted: data.dateCompleted,
                    detail: data.detail,
                    projectId: projectId,
                    projectTypeId: data.projectTypeId,
                    statusId: data.statusId,
                    summary: data.summary,
                    timeCompleted: data.timeCompleted
                }
            }
        });
    }

    getProjectData();

    $$('ps-reset').onclick(() => {
        $$('ps-assignedTo').setValue(projectData.assignedEmployeeId);
        $$('ps-type').setValue(projectData.projectTypeId);
        $$('ps-status').setValue(projectData.statusId);
        $$('ps-summary').setValue(projectData.summary);
        $$('ps-detail').setValue(projectData.detail);
        $$('ps-completedTime').clear();

        $$('ps-completedDate').setValue(Number(projectData.dateCompleted));

        if (data.dateCompleted !== '0') {
            $$('ps-completedTime').setValue(Number(projectData.timeCompleted));
        }

        $$('ps-update').disable();
        $$('ps-reset').disable();
        $$('ps-project').setValue(projectName + ' - ' + projectSummary).setColor('black');
    });

    $$('ps-update').onclick(() => {
        const params = {
            assignedEmployeeId: $$('ps-assignedTo').getValue(),
            dateCompleted: $$('ps-completedDate').getIntValue(),
            detail: $$('ps-detail').getValue(),
            projectId: projectId,
            projectTypeId: $$('ps-type').getValue(),
            statusId: $$('ps-status').getValue(),
            summary: $$('ps-summary').getValue(),
            timeCompleted: $$('ps-completedDate').getIntValue() !== 0 ? $$('ps-completedTime').getValue() : -1
        }

        AWS.callSoap(WS, 'saveProject', params).then(data => {
            if (data.wsStatus === "0") {
                getProjectData();
                $$('ps-update').disable();
                $$('ps-reset').disable();
                $$('ps-project').setValue(projectName + ' - ' + projectSummary).setColor('black');
            }
        });        
    });

    $$('ps-assignedTo').onChange(() => {
        $$('ps-update').enable();
        $$('ps-reset').enable();
        $$('ps-project').setValue(projectName + ' - ' + projectSummary + ' (unsaved changes)').setColor('red');
    });
    $$('ps-type').onChange(() => {
        $$('ps-update').enable();
        $$('ps-reset').enable();
        $$('ps-project').setValue(projectName + ' - ' + projectSummary + ' (unsaved changes)').setColor('red');
    });
    $$('ps-status').onChange(() => {
        $$('ps-update').enable();
        $$('ps-reset').enable();
        $$('ps-project').setValue(projectName + ' - ' + projectSummary + ' (unsaved changes)').setColor('red');

        if ($$('ps-status').getValue() === '00001-0000000078') {
            $$('ps-completedDate').setValue(DateUtils.today());
            $$('ps-completedTime').setValue(TimeUtils.current());
        } else {
            $$('ps-completedDate').setValue(0);
            $$('ps-completedTime').setValue(-1);
        }
    });
    $$('ps-summary').onChange(() => {
        $$('ps-update').enable();
        $$('ps-reset').enable();
        $$('ps-project').setValue(projectName + ' - ' + projectSummary + ' (unsaved changes)').setColor('red');
    });
    $$('ps-completedDate').onChange(() => {
        $$('ps-update').enable();
        $$('ps-reset').enable();
        $$('ps-project').setValue(projectName + ' - ' + projectSummary + ' (unsaved changes)').setColor('red');
    });
    $$('ps-completedTime').onChange(() => {
        $$('ps-update').enable();
        $$('ps-reset').enable();
        $$('ps-project').setValue(projectName + ' - ' + projectSummary + ' (unsaved changes)').setColor('red');
    });

})();

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
    const WS = 'StandardProjectEmployeeProjectList';
    let resultsGrid;

    function ProjectInfo() {}

    ProjectInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            const projectId = params.data.projectId;
            const data = {
                projectId: projectId
            };
            AWS.callSoap(WS, 'getProjectDetail', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_open("project-info-popup");
                    $$('project-info-project-id').setValue(params.data.projectName);
                    $$('project-info-requesting-person').setValue(res.requestingPersonOrCreatedBy);
                    $$('project-info-summary').setValue(params.data.projectSummary);
                    $$('project-info-phase').setValue(res.phaseFormatted);
                    $$('project-info-requesting-company').setValue(res.requestingNameFormatted);
                    $$('project-info-status').setValue(res.statusFormatted);
                    $$('project-info-details').setValue(res.detail);
                    $$('project-info-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        const span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.projectSummary;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };

    const showTable = () => {
        const columnDefs = [
            {headerName: "Priority", field: "employeePriority", width: 20},
            {headerName: "Assigned", field: "dateTimeAssignedFormatted", width: 30},
            {headerName: "Reported", field: "dateTimeReportedFormatted", width: 30},
            {headerName: "ID", field: "projectName", width: 20},
            {headerName: "Summary", field: "projectSummary", cellRenderer: 'projectInfo', width: 100},
            {headerName: "Status", field: "projectStatusCode", width: 40},
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.addComponent('projectInfo', ProjectInfo);
        resultsGrid.show();
        getListAssignedProjects();
    }    

    const rememberVisitedProject = function (id, name, summary) {
        let visitedProjects = Utils.getData(VISITED_PROJECTS);
        if (!visitedProjects)
            visitedProjects = {};
        if (visitedProjects[id])
            return;
        visitedProjects[id] = {};
        visitedProjects[id].name = name;
        visitedProjects[id].summary = summary;
        Utils.saveData(VISITED_PROJECTS, visitedProjects);
    };

    function edit() {
        Utils.saveData(CURRENT_PROJECT_ID, resultsGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, resultsGrid.getSelectedRow().projectName);
        Utils.saveData(CURRENT_PROJECT_SUMMARY, resultsGrid.getSelectedRow().description);
        rememberVisitedProject(resultsGrid.getSelectedRow().projectId, resultsGrid.getSelectedRow().projectName, resultsGrid.getSelectedRow().description);
        Framework.getChild();
    }

    $$('edit').onclick(edit);

    const getListAssignedProjects = () => {
        $$('edit').disable();
        resultsGrid.clear();
        const params = {
            dateAssigned: 0,
            dateAssignedSearchType: 0,
            projectStatusId: ""
        }
        AWS.callSoap(WS, 'listAssignedProjects', params).then(listAssignedProjects => {
            if (listAssignedProjects.wsStatus === "0") {
                const rowData = Utils.assureArray(listAssignedProjects.item);
                resultsGrid.addRecords(rowData); 
                resultsGrid.setOnSelectionChanged($$('edit').enable);
                resultsGrid.setOnRowDoubleClicked(edit);
            }            
        });        
    }

    $$('refresh').onclick(getListAssignedProjects);

    $$('report').onclick(() => {
        const params = {
            user: ""
        };
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });     
    });
    showTable();
})();
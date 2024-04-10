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
    const WS = 'StandardHrHrEvaluation';
    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);
    $$('worker-name').setValue(personName);
    let resultsGrid;

    const showTable = () => {
        const columnDefs = [
            {headerName: "Evaluation Date", field: "evalDate", width: 30},
            {headerName: "Next Evaluation Date", field: "nextEvalDate", width: 40},
            {headerName: "Status", field: "statusFormatted", width: 50},
            {headerName: "Description", field: "description", width: 100}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
        getListEmployeeEvals();
    }        

    $$('add').onclick(() => {
        $$('ev-date').setValue(new Date());
        $$('ev-ndate').clear();
        $$('ev-supervisor').clear();
        $$('ev-description').clear();
        $$('ev-scomments').clear();
        $$('ev-pcomments').clear();
        $$('ev-ecomments').clear();    
        $$('ev-ecomments').readOnly();    

        const params = {
            firstName: null,
            firstNameSearchType: 0,
            lastName: null,
            lastNameSearchType: 0,
            personId: personId,
            searchType: 'E',
            ssn: null
        };

        AWS.callSoap(WS, 'searchEmployees', params).then(res => {
            if (res.wsStatus === "0") {
                res.employees = Utils.assureArray(res.employees);
                const ctl = $$('ev-supervisor');
                ctl.clear();
                if (res.employees.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.employees.length === 1) {
                    ctl.singleValue(res.employees[0].personId, makeName(res.employees[0].fname, res.employees[0].middleName, res.employees[0].lname));
                } else if (res.employees.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.employees.length; i++)
                        ctl.add(res.employees[i].personId, makeName(res.employees[i].fname, res.employees[i].middleName, res.employees[i].lname));
                    ctl.setValue(Framework.userInfo.personId);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
                }
            }
        });

        Utils.popup_open("ev-popup");
        $$('ev-title').setValue('Add Evaluation');

        $$('ev-ok').onclick(() => {
            if ($$('ev-date').isError('Evaluation Date'))
                return;
            if($$('ev-ndate').isError('Next Evaluation Date'))
                return;
            if($$('ev-supervisor').isError('Supervisor'))
                return;
            if($$('ev-description').isError('Description'))
                return;
            if($$('ev-scomments').isError('Supervisor Comments'))
                return;
            if($$('ev-pcomments').isError('Private Comments'))
                return;

            const params = {
                applyToAll: false,
                description: $$('ev-description').getValue(),
                employeeId: personId,
                evalDate: $$('ev-date').getIntValue(),
                internalSupervisorComments: $$('ev-pcomments').getValue(),
                nextEvalDate: $$('ev-ndate').getIntValue(),
                supervisorComments: $$('ev-scomments').getValue(),
                supervisorId: $$('ev-supervisor').getValue()
            };
            AWS.callSoap(WS, 'newEmployeeEval', params).then(data => {
                if (data.wsStatus === '0') {
                    getListEmployeeEvals();   
                    Utils.popup_close();
                }
            });        
        });

        $$('ev-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(edit);

    $$('ev-supervisor').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok")
            $$('ev-supervisor').setValue(res.employeeid, res.lname + ", " + res.fname);
    });

    async function edit () {
        const row = resultsGrid.getSelectedRow();
        if (row.status !== "S") { 
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Supervisor Edit' to be edited.");
        }

        const evalId = {
            id: row.employeeEvalId
        }
        const employeeEval = await AWS.callSoap(WS, 'loadEmployeeEval', evalId);
        $$('ev-date').setValue(employeeEval.evalDate);
        $$('ev-ndate').setValue(employeeEval.nextEvalDate);
        $$('ev-supervisor').setValue(employeeEval.supervisorId);
        $$('ev-description').setValue(employeeEval.description);
        $$('ev-scomments').setValue(employeeEval.supervisorComments);
        $$('ev-pcomments').setValue(employeeEval.internalSupervisorComments);  
        $$('ev-ecomments').readOnly();    

        const params = {
            firstName: null,
            firstNameSearchType: 0,
            lastName: null,
            lastNameSearchType: 0,
            personId: employeeEval.supervisorId,
            searchType: 'E',
            ssn: null
        };

        AWS.callSoap(WS, 'searchEmployees', params).then(res => {
            if (res.wsStatus === "0") {
                res.employees = Utils.assureArray(res.employees);
                const ctl = $$('ev-supervisor');
                ctl.clear();
                if (res.employees.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.employees.length === 1) {
                    ctl.singleValue(res.employees[0].personId, makeName(res.employees[0].fname, res.employees[0].middleName, res.employees[0].lname));
                } else if (res.employees.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.employees.length; i++)
                        ctl.add(res.employees[i].personId, makeName(res.employees[i].fname, res.employees[i].middleName, res.employees[i].lname));
                    ctl.setValue(res.selectedItem.personId);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(res.selectedItem.personId, res.selectedItem.lname + ", " + res.selectedItem.fname);
                }
            }
        });

        Utils.popup_open("ev-popup");
        $$('ev-title').setValue('Edit Evaluation');

        $$('ev-ok').onclick(() => {
            if ($$('ev-date').isError('Evaluation Date'))
                return;
            if($$('ev-ndate').isError('Next Evaluation Date'))
                return;
            if($$('ev-supervisor').isError('Supervisor'))
                return;
            if($$('ev-description').isError('Description'))
                return;
            if($$('ev-scomments').isError('Supervisor Comments'))
                return;
            if($$('ev-pcomments').isError('Private Comments'))
                return;

            const params = {
                applyToAll: false,
                employeeEvalId: row.employeeEvalId,
                description: $$('ev-description').getValue(),
                employeeId: personId,
                evalDate: $$('ev-date').getIntValue(),
                internalSupervisorComments: $$('ev-pcomments').getValue(),
                nextEvalDate: $$('ev-ndate').getIntValue(),
                supervisorComments: $$('ev-scomments').getValue(),
                supervisorId: $$('ev-supervisor').getValue()
            };
            AWS.callSoap(WS, 'saveEmployeeEval', params).then(data => {
                if (data.wsStatus === '0') {
                    getListEmployeeEvals();   
                    Utils.popup_close();
                }
            });        
        });

        $$('ev-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('delete').onclick(() => {
        const row = resultsGrid.getSelectedRow();
        if (row.status !== "S") {
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Supervisor Edit' to be deleted.");
            
        }        
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Evaluation?', () => {
            const params = {
                ids: row.employeeEvalId
            };
            AWS.callSoap(WS, "deleteEmployeeEval", params).then(data => {
                if (data.wsStatus === '0') {
                    getListEmployeeEvals();
                }
            });
        });
    });

    $$('send').onclick(() => {
        const row = resultsGrid.getSelectedRow();
        if (row.status !== "S") { 
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Supervisor Edit' to send them to the employee.");
        }
        
        Utils.yesNo('Confirmation', 'Sending the Employee Evaluation to the Employee will make it read-only until the employee sends it back.  Continue?', () => {
            const params = {
                evaluationId: row.employeeEvalId
            };
            AWS.callSoap(WS, "markEvaluationForEmployeeEdit", params).then(data => {
                if (data.wsStatus === '0') {
                    getListEmployeeEvals();
                }
            });
        });
    });

    $$('edit-detail').onclick(() => {
        const row = resultsGrid.getSelectedRow();
        if (row.status !== "S") { 
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Supervisor Edit' to be edited.");
        }
        $$('ev-edit-details-edit').disable();

        let evDetailsGrid; 
        const showTable = () => {
            const columnDefs = [
                {headerName: "Evaluation Category", field: "evalCategoryName", width: 90},
                {headerName: "Supervisor Score", field: "supervisorScore", width: 80},
                {headerName: "Employee Score", field: "employeeScore", width: 80},
                {headerName: "Supervisor Notes Preview", field: "notes", width: 110}
            ];
            evDetailsGrid = new AGGrid('ev-detailsGrid', columnDefs);
            evDetailsGrid.show();
            getListEmployeeEvalDetails();
        }    

        const getListEmployeeEvalDetails = () => {
            const params = {
                employeeEvalId: row.employeeEvalId
            };
            evDetailsGrid.clear();

            AWS.callSoap(WS, "listEmployeeEvalDetails", params).then(listEvDetails => {
                if (listEvDetails.wsStatus === '0') {
                    const rowData = Utils.assureArray(listEvDetails.item);
                    evDetailsGrid.addRecords(rowData); 
                    evDetailsGrid.setOnSelectionChanged($$('ev-edit-details-edit').enable);
                    evDetailsGrid.setOnRowDoubleClicked(editEvDetails);
                }
            });
        }

        $$('ev-edit-details-edit').onclick(editEvDetails);

        $$('ev-edit-details-cancel').onclick(() => {
            Utils.popup_close();
        });
        
        function editEvDetails() {
            const rowEval = evDetailsGrid.getSelectedRow();
            $$('ev-pnotes').clear();
            $$('ev-snotes').clear();
            $$('ev-enotes').clear();
            $$('ev-detail-cat-name').setValue(rowEval.evalCategoryName);
            $$('ev-sscore').clear();
            $$('ev-escore').clear();
            
            const evalCatId = {
                evalCatId: rowEval.evalCategoryId
            }
            AWS.callSoap(WS, "loadEvalDescription", evalCatId).then(data => {
                if (data.wsStatus === '0') {
                    $$('ev-detail-description').setValue(data.description);
                }
            });

            const evalId = {
                id: rowEval.detailId
            }

            AWS.callSoap(WS, "loadEmployeeEvalDetail", evalId).then(data => {
                if (data.wsStatus === '0') {
                    $$('ev-sscore').setValue(data.supervisorScore);
                    $$('ev-escore').setValue(data.employeeScore);
                    $$('ev-pnotes').setValue(data.internalSupervisorNotes);
                    $$('ev-snotes').setValue(data.supervisorNotes);
                    $$('ev-enotes').setValue(data.employeeNotes);
                }
            });

            Utils.popup_open("ev-edit-detail-popup");

            $$('ev-edit-detail-ok').onclick(() => {
                if ($$('ev-pnotes').isError('Private Notes'))
                    return;
                if($$('ev-snotes').isError('Supervisor Notes'))
                    return;
                if($$('ev-sscore').isError('Supervisor Score'))
                    return;

                const params = {
                    detailId: rowEval.detailId,
                    internalSupervisorNotes: $$('ev-pnotes').getValue(),
                    supervisorNotes: $$('ev-snotes').getValue(),
                    supervisorScore: $$('ev-sscore').getValue(),
                }
                AWS.callSoap(WS, "saveEmployeeEvalDetail", params).then(data => {
                    if (data.wsStatus === '0') {
                        getListEmployeeEvalDetails();   
                        Utils.popup_close();
                    }
                });
            });

            $$('ev-edit-detail-cancel').onclick(() => {
                Utils.popup_close();
            });
        }

        Utils.popup_open("ev-edit-details-popup");

        showTable();
    });

    $$('report').onclick(() => {
        const row = resultsGrid.getSelectedRow();
        Utils.popup_open("ev-reporting-popup");

        $$('ev-reporting-ok').onclick(() => {
            const params = {
                evalIds: row.employeeEvalId,
                showPrivate: $$('includePC').getValue()
            };
            AWS.callSoap(WS, 'getEmployeeEvalsReport', params).then(data => {
                if (data.wsStatus === '0') {     
                    Utils.showReport(data.fileName);
                    Utils.popup_close();
                }
            });     
        });

        $$('ev-reporting-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('finalize').onclick(() => {
        const row = resultsGrid.getSelectedRow();

        if (row.status !== "S") { 
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Supervisor Edit' to be finalized.");
        }
        
        Utils.yesNo('Confirmation', 'Finalizing the Employee Evaluation will make it read-only.  Continue?', () => {
            const params = {
                evaluationId: row.employeeEvalId
            };
            AWS.callSoap(WS, "finalizeEvaluation", params).then(data => {
                if (data.wsStatus === '0') {
                    getListEmployeeEvals();
                }
            });
        });
    });

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const getListEmployeeEvals = () => {
        $$('edit').disable();
        $$('edit-detail').disable();
        $$('delete').disable();
        $$('send').disable();
        $$('finalize').disable();
        $$('report').disable();
        resultsGrid.clear();
        const params = {
            employeeId: personId
        }
        AWS.callSoap(WS, 'listEmployeeEvals', params).then(listEmployeeEvals => {
            if (listEmployeeEvals.wsStatus === "0") {
                const rowData = Utils.assureArray(listEmployeeEvals.item);
                for (let i = 0; i < rowData.length; i++) {
                    rowData[i].evalDate = rowData[i].evalDate !== "0" ? DateUtils.intToStr4(Number(rowData[i].evalDate)) : '';
                    rowData[i].nextEvalDate = rowData[i].nextEvalDate !== "0" ? DateUtils.intToStr4(Number(rowData[i].nextEvalDate)) : '';
                }
                resultsGrid.addRecords(rowData); 
                resultsGrid.setOnSelectionChanged((rows) => {
                    $$('edit').enable(rows);
                    $$('edit-detail').enable(rows);
                    $$('delete').enable(rows);
                    $$('send').enable(rows);
                    $$('finalize').enable(rows);
                    $$('report').enable(rows);
                });   
                resultsGrid.setOnRowDoubleClicked(edit);
            }            
        });        
    }
    showTable();
})();

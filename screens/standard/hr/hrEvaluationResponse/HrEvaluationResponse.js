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
    const WS = 'StandardHrHrEvaluationResponse';
    let resultsGrid;

    
    const columnDefs = [
        {headerName: "Evaluation Date", field: "evalDateFormatted", width: 40},
        {headerName: "Status", field: "statusFormatted", width: 60},
        {headerName: "Description", field: "description", width: 100}
    ];
    resultsGrid = new AGGrid('resultsGrid', columnDefs, 'employeeEvalId');
    resultsGrid.show();
    
    const getListEmployeeEvals = () => {
        $$('edit').disable();
        $$('edit-detail').disable();
        $$('send').disable();
        $$('report').disable();
        
        resultsGrid.clear();
        AWS.callSoap(WS, 'listEmployeeEvals').then(listEmployeeEvals => {
            if (listEmployeeEvals.wsStatus === "0") {
                const rowData = Utils.assureArray(listEmployeeEvals.item);
                resultsGrid.addRecords(rowData); 
                Utils.setText('status-label', `Displaying ${rowData.length} Employee Evaluation${rowData.length > 1 ? 's' : ''}`);  
            }
        });        
    }

    resultsGrid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('edit-detail').enable(rows);
        $$('send').enable(rows);
        $$('report').enable(rows);
    }); 

    getListEmployeeEvals();

    $$('edit').onclick(edit);

    function edit () {
        const row = resultsGrid.getSelectedRow();
        if (row.status !== "E") { 
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Employee Edit' to be edited.");
        }

        $$('ev-title').setValue('Edit Evaluation');
        Utils.popup_open('ev-popup', 'ev-ecomments');
        AWS.callSoap(WS, 'loadEmployeeEval', {
            id: row.employeeEvalId
        }).then(res => {
            if (res.wsStatus === '0') {
                $$('ev-date').setValue(res.evalDate);
                $$('ev-ndate').setValue(res.nextEvaldate);
                $$('ev-supervisor').setValue(res.supervisorLName + ', ' + res.supervisorFName);
                $$('ev-scomments').setValue(res.supervisorComments);
                $$('ev-description').setValue(res.description);
                $$('ev-ecomments').setValue(res.employeeComments);
            }
        });

        $$('ev-ok').onclick(() => {
            const data = {
                employeeComments: $$('ev-ecomments').getValue(),
                employeeEvalId: row.employeeEvalId
            };
            AWS.callSoap(WS, 'saveEmployeeEval', data).then(res => {
                if (res.wsStatus === '0') {
                    Utils.popup_close();
                    getListEmployeeEvals();
                }
            })
        });

        $$('ev-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('send').onclick(() => {
        const row = resultsGrid.getSelectedRow();
        if (row.status !== "E") { 
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Employee Edit' to send them to the employee.");
        }

        Utils.yesNo('Confirmation', 'Sending the Employee Evaluation to the Supervisor will make it read-only.  Continue?', () => {
            const params = {
                evaluationId: row.employeeEvalId
            };
            AWS.callSoap(WS, "markEvaluationForSupervisorEdit", params).then(res => {
                if (res.wsStatus === '0') {
                    getListEmployeeEvals();
                }
            });
        });
    });

    $$('edit-detail').onclick(() => {
        const row = resultsGrid.getSelectedRow();
        if (row.status !== "E") { 
            return Utils.showMessage("Error", "Employee Evaluations must have a status of 'Employee Edit' to be edited.");
        }

        $$('ev-edit-details-edit').disable();

        let evDetailsGrid; 
        const showTable = () => {
            const columnDefs = [
                {headerName: "Evaluation Category", field: "evalCategoryName", width: 110},
                {headerName: "Supervisor Score", field: "supervisorScore", type: 'numericColumn', width: 80},
                {headerName: "Employee Score", field: "employeeScore", type: 'numericColumn', width: 80},
                {headerName: "Employee Notes Preview", field: "employeeNotePreview", width: 110}
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
            $$('ev-edit-details-edit').disable();

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

        $$('ev-edit-details-close').onclick(() => {
            Utils.popup_close();
        });
        
        function editEvDetails() {
            const rowEval = evDetailsGrid.getSelectedRow();
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

            if (rowEval.evalDetailId) {
                AWS.callSoap(WS, 'loadEmployeeEvalDetail', {
                    id: rowEval.evalDetailId
                }).then(res => {
                    if (res.wsStatus === '0') {
                        $$('ev-sscore').setValue(res.supervisorScore);
                        $$('ev-escore').setValue(res.employeeScore);
                        $$('ev-snotes').setValue(res.supervisorNotes);
                        $$('ev-enotes').setValue(res.employeeNotes);
                    }
                })
            }

            Utils.popup_open("ev-edit-detail-popup", 'ev-escore');

            $$('ev-edit-detail-ok').onclick(() => {
                if (!rowEval.evalDetailId) {
                    const params = {
                        employeeEvalId: rowEval.employeeEvalId,
                        employeeNotes: $$('ev-enotes').getValue(),
                        employeeScore: $$('ev-escore').getValue(),
                        evalCategoryId: rowEval.evalCategoryId
                    };
                    AWS.callSoap(WS, 'newEmployeeEvalDetail', params).then(res => {
                        if (res.wsStatus === '0') {
                            getListEmployeeEvalDetails();
                            Utils.popup_close();
                        }
                    });
                } else {
                    if ($$('ev-enotes').getValue() === '' && $$('ev-escore').getValue() === 0 ) {
                        const params = {
                            ids: rowEval.evalDetailId
                        };
                        AWS.callSoap(WS, 'deleteEmployeeEvalDetails', params).then(res => {
                            if (res.wsStatus === '0') {
                                getListEmployeeEvalDetails();
                                Utils.popup_close();
                            }
                        });
                    } else {
                        const params = {
                            detailId: rowEval.evalDetailId,
                            employeeNotes: $$('ev-enotes').getValue(),
                            employeeScore: $$('ev-escore').getValue(),
                        };
                        AWS.callSoap(WS, 'saveEmployeeEvalDetail', params).then(res => {
                            if (res.wsStatus === '0') {
                                getListEmployeeEvalDetails();
                                Utils.popup_close();
                            }
                        });
                    }
                }
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
        const params = {
            evalIds: row.employeeEvalId
        };
        AWS.callSoap(WS, 'getEmployeeEvalsReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.fileName);
            }
        });
    });

    resultsGrid.setOnRowDoubleClicked(edit);

})();

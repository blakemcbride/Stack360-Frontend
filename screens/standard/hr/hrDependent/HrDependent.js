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
    const WS = 'StandardHrHrDependent';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);
    $$('employee-name').setValue(personName);

    
    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    // $$('pspp-status').onChange(() => {
    //     if ($$('pspp-status').getValue() === "2") {
    //         $$('chooseStatus').enable();
    //     } else {
    //         $$('chooseStatus').disable();
    //     }
    // });

    let dependentsGrid;
    let sponsoringGrid;
 
    const dependentsColumnDefs = [
        {headerName: "Last Name", field: "lastName", width: 100},
        {headerName: "First Name", field: "firstName", width: 100},
        {headerName: "Middle Name", field: "middleName", width: 100},
        {headerName: "Relationship", field: "relationship", width: 80},
        {headerName: "Sex", field: "sex", type: "numericColumn", width: 20},
        {headerName: "SSN", field: "ssn", type: "numericColumn", width: 60},
        {headerName: "DOB", field: "dob", type: "numericColumn", width: 60},
        {headerName: "Dependency Status", field: "status", width: 200}
    ];

    dependentsGrid = new AGGrid('dependentsGrid', dependentsColumnDefs);
    dependentsGrid.show();

    sponsoringGrid = new AGGrid('sponsoringGrid', dependentsColumnDefs);
    sponsoringGrid.show();


    function getListDependents() {
        if (dependentsGrid !== undefined) {
            dependentsGrid.clear();
        }
        const params = {
            employeeId: personId
        };

        AWS.callSoap(WS, 'listDependents', params).then(data => {
            if (data.wsStatus === '0') {    
                data.item = Utils.assureArray(data.item);

                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].dob = data.item[i].dob !== '0' ? DateUtils.intToStr4(Number(data.item[i].dob)) : '';                    
                }

                $$('dep-length').setValue("Displaying " + data.item.length + " Employee Dependents");

                dependentsGrid.addRecords(data.item);
                dependentsGrid.setOnSelectionChanged((rows) => {
                    $$('edit').enable(rows);
                    $$('delete').enable(rows);
                });
                dependentsGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    function getListDependees() {
        if (sponsoringGrid !== undefined) {
            sponsoringGrid.clear();
        }
        const params = {
            employeeId: personId
        };

        AWS.callSoap(WS, 'listDependees', params).then(data => {
            if (data.wsStatus === '0') {    
                data.item = Utils.assureArray(data.item);

                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].dob = data.item[i].dob !== '0' ? DateUtils.intToStr4(Number(data.item[i].dob)) : '';                    
                }

                $$('emp-length').setValue("Displaying " + data.item.length + " Employees");
                sponsoringGrid.addRecords(data.item);                
            }
        });   
    }

    getListDependents();
    getListDependees();

    $$('add').onclick(() => {
        $$('dep-title').setValue('Add Dependent');
        $$('dep-firstName').clear();
        $$('dep-relationshipType').setValue('');
        $$('dep-middleName').clear();
        $$('dep-relationship').clear().disable();
        $$('dep-lastName').setValue(personName.split(',')[0]);
        $$('dep-ssn').clear();
        $$('dep-sex').setValue('M');
        $$('dep-dob').clear();
        $$('dep-student').setValue(false);
        $$('dep-handicap').setValue(false);
        $$('dep-accalendar').setValue('NA');
        $$('dep-inactiveDate').clear();

        $$('dep-firstName').enable();
        $$('dep-middleName').enable();
        $$('dep-lastName').enable();
        $$('dep-ssn').enable();
        $$('dep-sex').enable();
        $$('dep-dob').enable();

        $$('dep-isEmpl').setValue('If this Dependent already exists in the system (same SSN), you can load that person.');
        $$('dep-load_person').show();
        $$('dep-employeeStatus-label').hide();
        $$('dep-employeeStatus').hide();
        $$('dep-employeeStatus').clear();

        let employeeId = '';

        const searchPerson = () => {
            let formSearchGrid;
            
            Utils.popup_open('dep-search');
                
            const reset = () => {
                $$('esp-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-first-search').clear();
    
                $$('esp-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-second-search').clear();

                $$('esp-third-search').clear();
    
                $$('esp-reset').enable();
                $$('esp-search').enable();
    
                $$('esp-ok').disable();
    
                formSearchGrid.clear();
                $$('esp-count').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    $$('dep-firstName').setValue(row.firstName);
                    $$('dep-middleName').setValue(row.middleName);
                    $$('dep-lastName').setValue(row.lastName);
                    $$('dep-ssn').setValue(row.ssn);
                    $$('dep-sex').setValue(row.sex);
                    $$('dep-dob').setValue(row.dob);

                    if (row.isEmployee === "Yes") {
                        $$('dep-firstName').disable();
                        $$('dep-middleName').disable();
                        $$('dep-lastName').disable();
                        $$('dep-ssn').disable();
                        $$('dep-sex').disable();
                        $$('dep-dob').disable();

                        $$('dep-isEmpl').setValue('The Dependent has an Employee record.');
                        $$('dep-load_person').hide();
                        $$('dep-employeeStatus-label').show();
                        $$('dep-employeeStatus').show();
                        $$('dep-employeeStatus').setValue(row.employeeStatus);

                        employeeId = row.id;

                    } else {
                        $$('dep-firstName').enable();
                        $$('dep-middleName').enable();
                        $$('dep-lastName').enable();
                        $$('dep-ssn').enable();
                        $$('dep-sex').enable();
                        $$('dep-dob').enable();
                        employeeId = '';
                        $$('dep-isEmpl').setValue('If this Dependent already exists in the system (same SSN), you can load that person.');
                        $$('dep-load_person').show();
                        $$('dep-employeeStatus-label').hide();
                        $$('dep-employeeStatus').hide();
                        $$('dep-employeeStatus').clear();
                    }
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('esp-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Last Name', field: 'lastName', width: 80},
                    {headerName: 'First Name', field: 'firstName', width: 80},
                    {headerName: 'Middle Name', field: 'middleName', width: 80},
                    {headerName: 'SSN', field: 'ssn', type: "numericColumn", width: 80},
                    {headerName: 'Employee', field: 'isEmployee', width: 80}
                ];
    
                formSearchGrid = new AGGrid('esp-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const inParams = {
                    employeeId: personId,
                    firstName: $$('esp-second-search').getValue(),
                    firstNameSearchType: $$('esp-second-criteria').getValue(),
                    lastName: $$('esp-first-search').getValue(),
                    lastNameSearchType: $$('esp-first-criteria').getValue(),
                    ssn: $$('esp-third-search').getValue()
                };

                
                AWS.callSoap(WS, 'searchPersons', inParams).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('esp-count').setValue(`Displaying ${records.length} item`);
                        } else {
                            $$('esp-count').setValue(`Displaying 0 item`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('esp-reset').onclick(reset);
            $$('esp-search').onclick(search);
            $$('esp-ok').onclick(ok);
            $$('esp-cancel').onclick(cancel);
    
            search();
        };

        $$('dep-load_person').onclick(searchPerson);

        $$('dep-relationshipType').onChange(() => {
            if ($$('dep-relationshipType').getValue() === "O") {
                $$('dep-relationship').enable();
            } else {
                $$('dep-relationship').disable();
            }
        });

        $$('dep-student').onChange(() => {
            if ($$('dep-student').getValue()) {
                $$('dep-accalendar').enable();
                $$('dep-accalendar').setValue('S');
            } else {
                $$('dep-accalendar').disable();
                $$('dep-accalendar').setValue('NA');
            }
        });

        Utils.popup_open('dep-popup');

        $$('dep-ok').onclick(() => {

            const params = {
                dob: $$('dep-dob').getIntValue(),
                employeeId: personId,
                firstName: $$('dep-firstName').getValue(),
                handicap: $$('dep-handicap').getValue(),
                inactiveDate: $$('dep-inactiveDate').getIntValue(),
                lastName: $$('dep-lastName').getValue(),
                middleName: $$('dep-middleName').getValue(),
                relationship: $$('dep-relationship').getValue(),
                relationshipType: $$('dep-relationshipType').getValue(),
                sex: $$('dep-sex').getValue(),
                ssn: $$('dep-ssn').getValue(),
                student: $$('dep-student').getValue(),
                studentTermType: $$('dep-accalendar').getValue() !== "NA" ? $$('dep-accalendar').getValue() : ''
            }

            if (employeeId !== '') {
                params.personId = employeeId;
            }

            AWS.callSoap(WS, 'newDependent', params).then(data => {
                if (data.wsStatus === '0') {
                    getListDependents();
                    Utils.popup_close();
                }
            });      
        });

        $$('dep-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = dependentsGrid.getSelectedRow();

        $$('dep-title').setValue('Edit Dependent');

        $$('dep-firstName').clear();
        $$('dep-relationshipType').setValue('');
        $$('dep-middleName').clear();
        $$('dep-relationship').clear();
        $$('dep-lastName').setValue(personName.split(',')[0]);
        $$('dep-ssn').clear();
        $$('dep-sex').setValue('M');
        $$('dep-dob').clear();
        $$('dep-student').setValue(false);
        $$('dep-handicap').setValue(false);
        $$('dep-accalendar').setValue('NA');
        $$('dep-inactiveDate').clear();

        $$('dep-firstName').enable();
        $$('dep-middleName').enable();
        $$('dep-lastName').enable();
        $$('dep-ssn').enable();
        $$('dep-sex').enable();
        $$('dep-dob').enable();

        $$('dep-isEmpl').setValue('If this Dependent already exists in the system (same SSN), you can load that person.');
        $$('dep-load_person').show();
        $$('dep-employeeStatus-label').hide();
        $$('dep-employeeStatus').hide();
        $$('dep-employeeStatus').clear();

        const params = {
            dependentId: row.dependentId
        }

        AWS.callSoap(WS, 'loadDependent', params).then(data => {
            if (data.wsStatus === '0') {
                $$('dep-firstName').setValue(data.firstName);
                $$('dep-relationshipType').setValue(data.relationshipType);
                $$('dep-middleName').setValue(data.middleName);
                $$('dep-relationship').setValue(data.relationship);
                if (data.relationshipType === "O")
                    $$('dep-relationship').enable();
                else
                    $$('dep-relationship').disable();
                $$('dep-lastName').setValue(data.lastName);
                $$('dep-ssn').setValue(data.ssn);
                $$('dep-sex').setValue(data.sex);
                $$('dep-dob').setValue(data.dob !== "0" ? DateUtils.intToDate(Number(data.dob)) : '');
                $$('dep-student').setValue(data.student);
                $$('dep-handicap').setValue(data.handicap);
                $$('dep-accalendar').setValue(data.studentTermType !== " " ? data.studentTermType : "NA");
                $$('dep-inactiveDate').setValue(data.inactiveDate !== "0" ? DateUtils.intToDate(Number(date.inactiveDate)) : '');

                if (data.isEmployee === "true") {
                    $$('dep-firstName').disable();
                    $$('dep-middleName').disable();
                    $$('dep-lastName').disable();
                    $$('dep-ssn').disable();
                    $$('dep-sex').disable();
                    $$('dep-dob').disable();

                    $$('dep-isEmpl').setValue('The Dependent has an Employee record.');
                    $$('dep-load_person').hide();
                    $$('dep-employeeStatus-label').show();
                    $$('dep-employeeStatus').show();
                    $$('dep-employeeStatus').setValue(data.employeeStatus);

                } else {
                    $$('dep-firstName').enable();
                    $$('dep-middleName').enable();
                    $$('dep-lastName').enable();
                    $$('dep-ssn').enable();
                    $$('dep-sex').enable();
                    $$('dep-dob').enable();                    
                    $$('dep-isEmpl').setValue('If this Dependent already exists in the system (same SSN), you can load that person.');
                    $$('dep-load_person').show();
                    $$('dep-employeeStatus-label').hide();
                    $$('dep-employeeStatus').hide();
                    $$('dep-employeeStatus').clear();
                }
            }
        });    

        let employeeId = '';

        const searchPerson = () => {
            let formSearchGrid;
            
            Utils.popup_open('dep-search');
                
            const reset = () => {
                $$('esp-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-first-search').clear();
    
                $$('esp-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-second-search').clear();

                $$('esp-third-search').clear();
    
                $$('esp-reset').enable();
                $$('esp-search').enable();
    
                $$('esp-ok').disable();
    
                formSearchGrid.clear();
                $$('esp-count').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    $$('dep-firstName').setValue(row.firstName);
                    $$('dep-middleName').setValue(row.middleName);
                    $$('dep-lastName').setValue(row.lastName);
                    $$('dep-ssn').setValue(row.ssn);
                    $$('dep-sex').setValue(row.sex);
                    $$('dep-dob').setValue(row.dob);

                    if (row.isEmployee === "Yes") {
                        $$('dep-firstName').disable();
                        $$('dep-middleName').disable();
                        $$('dep-lastName').disable();
                        $$('dep-ssn').disable();
                        $$('dep-sex').disable();
                        $$('dep-dob').disable();

                        $$('dep-isEmpl').setValue('The Dependent has an Employee record.');
                        $$('dep-load_person').hide();
                        $$('dep-employeeStatus-label').show();
                        $$('dep-employeeStatus').show();
                        $$('dep-employeeStatus').setValue(row.employeeStatus);

                        employeeId = row.id;

                    } else {
                        $$('dep-firstName').enable();
                        $$('dep-middleName').enable();
                        $$('dep-lastName').enable();
                        $$('dep-ssn').enable();
                        $$('dep-sex').enable();
                        $$('dep-dob').enable();
                        employeeId = '';
                        $$('dep-isEmpl').setValue('If this Dependent already exists in the system (same SSN), you can load that person.');
                        $$('dep-load_person').show();
                        $$('dep-employeeStatus-label').hide();
                        $$('dep-employeeStatus').hide();
                        $$('dep-employeeStatus').clear();
                    }
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('esp-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Last Name', field: 'lastName', width: 80},
                    {headerName: 'First Name', field: 'firstName', width: 80},
                    {headerName: 'Middle Name', field: 'middleName', width: 80},
                    {headerName: 'SSN', field: 'ssn', type: "numericColumn", width: 80},
                    {headerName: 'Employee', field: 'isEmployee', width: 80}
                ];
    
                formSearchGrid = new AGGrid('esp-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const inParams = {
                    employeeId: personId,
                    firstName: $$('esp-second-search').getValue(),
                    firstNameSearchType: $$('esp-second-criteria').getValue(),
                    lastName: $$('esp-first-search').getValue(),
                    lastNameSearchType: $$('esp-first-criteria').getValue(),
                    ssn: $$('esp-third-search').getValue()
                };

                
                AWS.callSoap(WS, 'searchPersons', inParams).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('esp-count').setValue(`Displaying ${records.length} item`);
                        } else {
                            $$('esp-count').setValue(`Displaying 0 item`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('esp-reset').onclick(reset);
            $$('esp-search').onclick(search);
            $$('esp-ok').onclick(ok);
            $$('esp-cancel').onclick(cancel);
    
            search();
        };

        $$('dep-load_person').onclick(searchPerson);

        $$('dep-relationshipType').onChange(() => {
            if ($$('dep-relationshipType').getValue() === "O") {
                $$('dep-relationship').enable();
            } else {
                $$('dep-relationship').disable();
            }
        });

        $$('dep-student').onChange(() => {
            if ($$('dep-student').getValue()) {
                $$('dep-accalendar').enable();
                $$('dep-accalendar').setValue('S');
            } else {
                $$('dep-accalendar').disable();
                $$('dep-accalendar').setValue('NA');
            }
        });

        Utils.popup_open('dep-popup');

        $$('dep-ok').onclick(() => {

            const params = {
                dependentId: row.dependentId,
                dob: $$('dep-dob').getIntValue(),
                employeeId: personId,
                firstName: $$('dep-firstName').getValue(),
                handicap: $$('dep-handicap').getValue(),
                inactiveDate: $$('dep-inactiveDate').getIntValue(),
                lastName: $$('dep-lastName').getValue(),
                middleName: $$('dep-middleName').getValue(),
                relationship: $$('dep-relationship').getValue(),
                relationshipType: $$('dep-relationshipType').getValue(),
                sex: $$('dep-sex').getValue(),
                ssn: $$('dep-ssn').getValue(),
                student: $$('dep-student').getValue(),
                studentTermType: $$('dep-accalendar').getValue() !== "NA" ? $$('dep-accalendar').getValue() : ''
            }

            AWS.callSoap(WS, 'saveDependent', params).then(data => {
                if (data.wsStatus === '0') {
                    getListDependents();
                    Utils.popup_close();
                }
            });      
        });

        $$('dep-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Please note that dependents with Active or Inactive benefits will not be deleted. Instead, these dependents will be ' +
        'given an Inactive Status (as of today) to preserve benefit history. Also, dependents with Active benefits will have their benefits ended as of today. \n Are you sure you want to delete the selected Dependent?', () => {
            const row = dependentsGrid.getSelectedRow();
            const params = {
                dependentIds: row.dependentId
            }
            
            AWS.callSoap(WS, 'deleteDependent', params).then(data => {
                if (data.wsStatus === '0') {
                    getListDependents();
                }
            });      
        });        
    });

    $$('dep-report').onclick(() => {
        const params = {
            employeeId: personId
        }
        
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });

    $$('emp-report').onclick(() => {
        const params = {
            personId: personId
        }
        
        AWS.callSoap(WS, 'getDependeeReport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });
})();

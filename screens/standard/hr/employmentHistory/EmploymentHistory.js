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

    const WS = 'StandardHrEmploymentHistory';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        { headerName: 'Work Period', field: 'workPeriod' },
        { headerName: 'Company', field: 'companyName' },
        { headerName: 'Job Title', field: 'jobTitle' },
    ];
    const grid = new AGGrid('grid', columnDefs, 'employmentId');

    grid.show();

    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function updateGrid() {
        grid.clear();
        const data = {
            employeeId: personId
        };

        AWS.callSoap(WS, 'listEmploymentHistory', data).then(ret => {
            if (ret.wsStatus === '0') {
                const records = Utils.assureArray(ret.item);
                
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} Employment ${records.length > 1 ? 'Histories' : 'History'}`);

                $$('edit').disable();
                $$('delete').disable();
            }
        });
    }

    updateGrid();

    const addEmploymentHistory = () => {
        $$('ep-title').setValue('Add Employment History');
        $$('ep-company').clear();
        $$('ep-street').clear();
        $$('ep-city').clear();
        $$('ep-state').clear();
        $$('ep-phone').clear();
        $$('ep-supervisor').clear();
        $$('ep-contactSupervisor').clear();
        $$('ep-jobTitle').clear();
        $$('ep-from-month').setValue('');
        $$('ep-from-year').setValue('');
        $$('ep-to-month').setValue('');
        $$('ep-to-year').setValue('');
        $$('ep-startingSalary').setValue('0');
        $$('ep-endingSalary').setValue('0');
        $$('ep-responsibilities').clear();
        $$('ep-reasonForLeaving').clear();
        Utils.popup_open('employment-popup', 'ep-company');

        $$('pp-ok').onclick(() => {
            if ($$('ep-company').isError('Company Name'))
                return;

            const data = {
                companyName: $$('ep-company').getValue(),
                street: $$('ep-street').getValue(),
                city: $$('ep-city').getValue(),
                state: $$('ep-state').getValue(),
                companyPhone: $$('ep-phone').getValue(),
                contactSupervisor: $$('ep-contactSupervisor').getValue(),
                endingSalary: $$('ep-endingSalary').getValue(),
                jobTitle: $$('ep-jobTitle').getValue(),
                reasonForLeaving: $$('ep-reasonForLeaving').getValue(),
                responsibilities: $$('ep-responsibilities').getValue(),
                startingSalary: $$('ep-startingSalary').getValue(),
                supervisor: $$('ep-supervisor').getValue(),
                workFromMonth: $$('ep-from-month').getValue(),
                workFromYear: $$('ep-from-year').getValue(),
                workToMonth: $$('ep-to-month').getValue(),
                workToYear: $$('ep-to-year').getValue(),
                personId: personId
            };
            AWS.callSoap(WS, 'newEmploymentHistory', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('pp-cancel').onclick(() => {
            Utils.popup_close();
        });
    };

    const editEmploymentHistory = () => {
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }
        $$('ep-title').setValue('Edit Employment History');
        AWS.callSoap(WS, 'loadEmploymentHistory', {
            employmentId: row.employmentId
        }).then(res => {
            $$('ep-company').setValue(res.companyName);
            $$('ep-street').setValue(res.street);
            $$('ep-city').setValue(res.city);
            $$('ep-state').setValue(res.state);
            $$('ep-phone').setValue(res.companyPhone);
            $$('ep-supervisor').setValue(res.supervisor);
            $$('ep-contactSupervisor').setValue(res.contactSupervisor);
            $$('ep-jobTitle').setValue(res.jobTitle);
            $$('ep-from-month').setValue(res.workFromMonth > 0 ? res.workFromMonth : '');
            $$('ep-from-year').setValue(res.workFromYear > 0 ? res.workFromYear : '');
            $$('ep-to-month').setValue(res.workToMonth > 0 ? res.workToMonth : '');
            $$('ep-to-year').setValue(res.workToYear > 0 ? res.workToYear : '');
            $$('ep-startingSalary').setValue(res.startingSalary);
            $$('ep-endingSalary').setValue(res.endingSalary);
            $$('ep-responsibilities').setValue(res.responsibilities);
            $$('ep-reasonForLeaving').setValue(res.reasonForLeaving);
            Utils.popup_open('employment-popup', 'ep-company');

            $$('pp-ok').onclick(() => {
                if ($$('ep-company').isError('Company Name'))
                    return;

                const data = {
                    employmentId: row.employmentId,
                    companyName: $$('ep-company').getValue(),
                    street: $$('ep-street').getValue(),
                    city: $$('ep-city').getValue(),
                    state: $$('ep-state').getValue(),
                    companyPhone: $$('ep-phone').getValue(),
                    contactSupervisor: $$('ep-contactSupervisor').getValue(),
                    endingSalary: $$('ep-endingSalary').getValue(),
                    jobTitle: $$('ep-jobTitle').getValue(),
                    reasonForLeaving: $$('ep-reasonForLeaving').getValue(),
                    responsibilities: $$('ep-responsibilities').getValue(),
                    startingSalary: $$('ep-startingSalary').getValue(),
                    supervisor: $$('ep-supervisor').getValue(),
                    workFromMonth: $$('ep-from-month').getValue(),
                    workFromYear: $$('ep-from-year').getValue(),
                    workToMonth: $$('ep-to-month').getValue(),
                    workToYear: $$('ep-to-year').getValue(),
                    personId: personId
                };
                AWS.callSoap(WS, 'saveEmploymentHistory', data).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                        Utils.popup_close();
                    }
                });
            });

            $$('pp-cancel').onclick(() => {
                Utils.popup_close();
            });
        });
    };

    $$('add').onclick(addEmploymentHistory);

    $$('edit').onclick(editEmploymentHistory);
    grid.setOnRowDoubleClicked(editEmploymentHistory);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Employment History?', () => {
            const data = {
                ids: [grid.getSelectedRow().employmentId]
            };
            
            AWS.callSoap(WS, "deleteEmploymentHistory", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

})();

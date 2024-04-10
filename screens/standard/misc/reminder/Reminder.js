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

    const WS = 'com.arahant.services.standard.misc.reminder';

    const columnDefs = [
        {headerName: 'Due Date', field: 'dueDate', width: 55},
        {headerName: 'For Person', field: 'forPersonName', width: 80},
        {headerName: 'About Person', field: 'aboutPersonName', width: 80},
        {headerName: 'Project', field: 'description', width: 100},
        {headerName: 'Summary', field: 'summary', width: 250}
    ];
    const grid = new AGGrid('grid', columnDefs, 'reminder_id');
    grid.multiSelect();
    grid.show();

    grid.setOnSelectionChanged((rows) => {
        if (rows.length === 0) {
            $$('view').disable();
            $$('edit').disable();
            $$('inactivate').disable();
        } else if (rows.length === 1) {
            $$('view').enable();
            $$('edit').enable();
            $$('inactivate').enable();
        } else {
            $$('view').disable();
            $$('edit').disable();
            $$('inactivate').enable();
        }
    });

    function forPersonSetup(ctlName, val) {
        const ctl = $$(ctlName);
        ctl.clear('');

        if (val === 'E') {
            Server.call(WS, "GetLoginEmployees").then(function (res) {
                if (res._Success) {
                    ctl.enable().clear();
                    if (res.employees.length === 0)
                        ctl.nothingToSelect();
                    else if (res.employees.length === 1)
                        ctl.singleValue(res.employees[0].person_id, res.employees[0].lname + ", " + res.employees[0].fname + " " + res.employees[0].mname);
                    else if (res.employees.length < res.lowCap) {
                        ctl.useDropdown();
                        for (let i = 0; i < res.employees.length; i++)
                            ctl.add(res.employees[i].person_id, res.employees[i].lname + ", " + res.employees[i].fname + " " + res.employees[i].mname);
                    } else
                        ctl.forceSelect();
                }
            });
        } else {
            ctl.disable();
        }
    }

    $$('remind-who').onChange((val) => {
        forPersonSetup('for-person', val);
    });

    function forPersonSearch(ctlName) {
        $$(ctlName).setSelectFunction(async function () {
            const data = {
                onlyEmployeesWithLogin: true,
                title: 'Employee To Be Reminded'
            }
            let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection', data);
            if (res._status === "ok")
                $$(ctlName).setValue(res.employeeid, makeName(res.fname, res.mname, res.lname));
        });
    }

    forPersonSearch('for-person');

    function setupAboutPerson(ctlName) {
        Server.call(WS, "SearchPersons").then(function (res) {
            const ctl = $$(ctlName);
            if (res._Success) {
                ctl.clear();
                if (res.employees.length === 0)
                    ctl.nothingToSelect();
                else if (res.employees.length === 1)
                    ctl.singleValue(res.employees[0].person_id, res.employees[0].lname + ", " + res.employees[0].fname + " " + res.employees[0].mname);
                else if (res.employees.length < res.lowCap) {
                    ctl.useDropdown();
                    for (let i = 0; i < res.employees.length; i++)
                        ctl.add(res.employees[i].person_id, res.employees[i].lname + ", " + res.employees[i].fname + " " + res.employees[i].mname);
                } else
                    ctl.forceSelect('(no particular person)');
            }
        });

        $$(ctlName).setSelectFunction(async function () {
            let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
            if (res._status === "ok")
                $$(ctlName).setValue(res.employeeid, makeName(res.fname, res.mname, res.lname));
        });
    }

    setupAboutPerson('about-person');

    function setupAboutProject(ctlName) {
        Server.call(WS, "SearchPersons").then(function (res) {
            const ctl = $$(ctlName);
            if (res._Success) {
                ctl.clear();
                if (res.employees.length === 0)
                    ctl.nothingToSelect();
                else if (res.employees.length === 1)
                    ctl.singleValue(res.employees[0].person_id, res.employees[0].lname + ", " + res.employees[0].fname + " " + res.employees[0].mname);
                else if (res.employees.length < res.lowCap) {
                    ctl.useDropdown();
                    for (let i = 0; i < res.employees.length; i++)
                        ctl.add(res.employees[i].person_id, res.employees[i].lname + ", " + res.employees[i].fname + " " + res.employees[i].mname);
                } else
                    ctl.forceSelect('(no particular project)');
            }
        });

        $$(ctlName).setSelectFunction(async function () {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok")
                $$(ctlName).setValue(res.projectId, res.summary);
        });
    }

    setupAboutProject('about-project');

    function search() {
        grid.clear();
        const data = {
            remindType: $$('remind-who').getValue(),
            remindPerson: $$('for-person').getValue(),
            aboutPerson: $$('about-person').getValue(),
            aboutProject:  $$('about-project').getValue()
        };
        Server.call(WS, "GetReminders", data).then(function (res) {
            if (res._Success) {
                for (let i=0 ; i < res.reminders.length ; i++) {
                    let r = res.reminders[i];
                    if (r.reminder_date)
                        r.dueDate = DateUtils.intToStr4(r.reminder_date);
                    r.forPersonName = makeName(r.for_fname, r.for_mname, r.for_lname);
                    r.aboutPersonName = makeName(r.about_fname, r.about_mname, r.about_lname);
                }
                grid.addRecords(res.reminders);
            }
        });
    }

    $$('search').onclick(search);

    function makeName(fname, mname, lname) {
        if (!lname)
            return '';
        let r = lname;
        if (fname)
            r += ', ' + fname;
        else
            return r;
        if (mname)
            r += ' ' + mname;
        return r;
    }

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Reminder');

        $$('dp-remind-who').clear().enable();
        $$('dp-for-person').clear().disable();
        $$('dp-due-date').clear().enable();
        $$('dp-summary').clear().enable();
        $$('dp-detail').clear().enable();
        Utils.popup_open('detail-popup');

        $$('dp-remind-who').onChange((val) => {
            forPersonSetup('dp-for-person', val);
        });
        forPersonSearch('dp-for-person');

        setupAboutPerson('dp-about-person');

        setupAboutProject('dp-about-project');

        $$('dp-ok').onclick(() => {
            if ($$('dp-summary').isError('Summary'))
                return;
            const remind = $$('dp-remind-who').getValue();
            if (remind === 'E' && !$$('dp-for-person').getValue()) {
                Utils.showMessage('Error', 'Remind person selection required.');
                return;
            }
            const data = {
                remindType: $$('dp-remind-who').getValue(),
                remindPerson: $$('dp-for-person').getValue(),
                dueDate: $$('dp-due-date').getIntValue(),
                aboutPerson: $$('dp-about-person').getValue(),
                aboutProject:  $$('dp-about-project').getValue(),
                summary: $$('dp-summary').getValue(),
                detail: $$('dp-detail').getValue()
            };
            Server.call(WS, "NewReminder", data).then(function (res) {
                if (res._Success) {
                   search();
                   Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(() => {
        $$('dp-title').setValue('Edit Reminder');

        const row = grid.getSelectedRow();
        let reminderType;

        if (!row.person_id) {
            reminderType = 'A';
            $$('dp-for-person').clear().disable();
        } else if (row.person_id === Framework.userInfo.personId) {
            reminderType = 'M';
            $$('dp-for-person').clear().disable();
        } else {
            reminderType = 'E';
            $$('dp-for-person').setValue(row.person_id, row.forPersonName);
        }

        if (!row.about_person)
            $$('dp-about-person').clear().enable().forceSelect('(no particular person)');
        else
            $$('dp-about-person').clear().enable().forceSelect().setValue(row.about_person, row.aboutPersonName);
        $$('dp-about-person').setSelectFunction(async function () {
            let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
            if (res._status === "ok")
                $$('dp-about-person').setValue(res.employeeid, makeName(res.fname, res.mname, res.lname));
        });

        if (!row.about_project)
            $$('dp-about-project').clear().enable().forceSelect('(no particular project)');
        else
            $$('dp-about-project').clear().enable().forceSelect().setValue(row.about_project, row.description);
        $$('dp-about-project').setSelectFunction(async function () {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok")
                $$('dp-about-project').setValue(res.projectId, res.summary);
        });

        $$('dp-remind-who').setValue(reminderType).enable();

        $$('dp-due-date').setValue(row.reminder_date).enable();
        $$('dp-summary').setValue(row.summary).enable();
        $$('dp-detail').setValue(row.detail).enable();

        Utils.popup_open('detail-popup');

        $$('dp-remind-who').onChange((val) => {
            forPersonSetup('dp-for-person', val);
        });
        forPersonSearch('dp-for-person');

        $$('dp-ok').onclick(() => {
            if ($$('dp-summary').isError('Summary'))
                return;
            const remind = $$('dp-remind-who').getValue();
            if (remind === 'E' && !$$('dp-for-person').getValue()) {
                Utils.showMessage('Error', 'Remind person selection required.');
                return;
            }
            const data = {
                reminderId: row.reminder_id,
                remindType: $$('dp-remind-who').getValue(),
                remindPerson: $$('dp-for-person').getValue(),
                dueDate: $$('dp-due-date').getIntValue(),
                aboutPerson: $$('dp-about-person').getValue(),
                aboutProject:  $$('dp-about-project').getValue(),
                summary: $$('dp-summary').getValue(),
                detail: $$('dp-detail').getValue()
            };
            Server.call(WS, "UpdateReminder", data).then(function (res) {
                if (res._Success) {
                    search();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function view() {
        const row = grid.getSelectedRow();

        $$('dp-title').setValue('View Reminder');
        let reminderType;
        if (!row.person_id)
            reminderType = 'A';
        else if (row.person_id === Framework.userInfo.personId)
            reminderType = 'M';
        else
            reminderType = 'E';
        $$('dp-remind-who').setValue(reminderType).disable();
        $$('dp-for-person').setValue(row.person_id, row.forPersonName).disable();
        $$('dp-due-date').setValue(row.reminder_date).disable();
        $$('dp-summary').setValue(row.summary).disable();
        $$('dp-detail').setValue(row.detail).disable();
        $$('dp-about-person').clear().disable().setValue(row.about_person, row.aboutPersonName);
        $$('dp-about-project').clear().disable().setValue(row.about_project, row.description);
        Utils.popup_open('detail-popup');

        $$('dp-ok').onclick(() => {
            Utils.popup_close();
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('view').onclick(view);

    grid.setOnRowDoubleClicked(view);

    $$('reset').onclick(() => {
        $$('remind-who').clear();
        $$('for-person').clear('').disable();
        $$('about-person').clear();
        $$('about-project').clear();
    });

    $$('inactivate').onclick(() => {
       Utils.yesNo('Query', 'Okay to deactivate the selected reminders?', () => {
           const data = {
               reminderIds: []
           };
           const rows = grid.getSelectedRows();
           for (let i in rows)
               data.reminderIds.push(rows[i].reminder_id);
           Server.call(WS, "DeactivateReminders", data).then(function (res) {
               if (res._Success) {
                   search();
               }
           });
       });
    });

})();

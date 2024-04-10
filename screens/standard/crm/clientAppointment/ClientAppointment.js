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

    const WS = 'StandardCrmClientAppointment';
    
    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== "0") {
            return;
        }
    });

    const clientId = Utils.getData("CURRENT_CLIENT_ID");
    const clientName = Utils.getData("CURRENT_CLIENT_NAME");

    $$('client-name').setValue(clientName);

    const columnDefs = [
        { headerName: 'Day', field: 'day', width: 50 },
        { headerName: 'Date', field: 'dateFormatted', width: 50 },
        { headerName: 'Time', field: 'timeFormatted', width: 50 },
        { headerName: 'Length', field: 'lengthFormatted', width: 50 },
        { headerName: 'Type', field: 'typeFormatted', width: 50 },
        { headerName: 'Purpose', field: 'purpose' },
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');

    grid.show();
    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function formatLength(length) {
        const hours = NumberUtils.round(length / 60, 0);
        
        if (length === 0) {
            return "";
        } else if (hours > 0) {
            const minutes = length - (hours * 60);
            let lengthFormatted = hours + " hour";
            
            if (hours > 1) {
                lengthFormatted += "s";
            }
            
            if (minutes > 0) {
                lengthFormatted += ", ";
                lengthFormatted += minutes;
                lengthFormatted += " minute";
                if (minutes > 1) {
                    lengthFormatted += "s";
                }
            }
            
            return lengthFormatted;
        } else if (length === 1) {
            return length + " minute";
        } else {
            return length + " minutes";
        }
    }

    function updateGrid() {
        const data = {
            id: clientId,
            fromDate: $$('filter-from-date').getIntValue(),
            toDate: $$('filter-to-date').getIntValue(),
            status: $$('filter-status').getValue(),
            type: $$('filter-appointment-type').getValue(),
            attendeeOnly: $$('filter-chk-status').getValue()
        };

        grid.clear();

        AWS.callSoap(WS, 'listAppointments', data).then(ret => {
            if (ret.wsStatus === '0') {
                const records = Utils.assureArray(ret.item);
                for (let i = 0; i < records.length; i ++) {
                    let row = records[i];
                    row.dateFormatted = DateUtils.intToStr4(Number(row.date));
                    row.typeFormatted = row.type === 'P' ? 'Appointment':'Reminder';
                    row.statusFormatted = row.status === 'A' ? 'Active': (row.status === 'C' ? 'Cancelled':'Done/Complete');
                    row.timeFormatted = TimeUtils.format(Math.floor(row.time), false);
                    row.lengthFormatted = formatLength(row.length);
                }
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} Appointments & Reminders`);
            }
        });
    }

    updateGrid();

    function updateDate(op) {
        let start = null, end = null;
        const curr = new Date;
        
        switch (op) {
            case "today":
                start = DateUtils.dateToInt(curr);
                end = DateUtils.dateToInt(curr);
                break;
            case "week":
                let first = curr.getDate() - curr.getDay();
                start = DateUtils.dateToInt(new Date(curr.setDate(first)));
                end = DateUtils.intAddDays(start, 6);
                break;
            case "month":
                start = DateUtils.dateToInt(new Date(curr.getFullYear(), curr.getMonth(), 1));
                end = DateUtils.dateToInt(new Date(curr.getFullYear(), curr.getMonth() + 1, 0));
                break;
            case "daybefore":
                let s = $$('filter-from-date').getIntValue() ? $$('filter-from-date').getIntValue() : DateUtils.dateToInt(curr);
                start = DateUtils.intAddDays(s, -1);
                end = DateUtils.intAddDays(s, -1);
                break;
            case "dayafter":
                let da = $$('filter-from-date').getIntValue() ? $$('filter-from-date').getIntValue() : DateUtils.dateToInt(curr);
                start = DateUtils.intAddDays(da, 1);
                end = DateUtils.intAddDays(da, 1);
                break;
            case "all":
                break;
        }

        $$('filter-from-date').setValue(start);
        $$('filter-to-date').setValue(end);

        updateGrid();
    }

    $$('filter-day-before').onclick(() => updateDate('daybefore'));
    $$('filter-day-after').onclick(() => updateDate('dayafter'));
    $$('filter-today').onclick(() => updateDate('today'));
    $$('filter-this-week').onclick(() => updateDate('week'));
    $$('filter-this-month').onclick(() => updateDate('month'));
    $$('filter-all').onclick(() => updateDate('all'));

    $$('filter-from-date').onChange((v) => {
        const from = $$('filter-from-date').getIntValue();
        const to = $$('filter-to-date').getIntValue();

        if (!to || to <= from) {
            $$('filter-to-date').setValue(from);
        }
        updateGrid();
    });

    $$('filter-to-date').onChange((v) => {
        const from = $$('filter-from-date').getIntValue();
        const to = $$('filter-to-date').getIntValue();

        if (!from || to <= from) {
            $$('filter-from-date').setValue(to);
        }
        updateGrid();
    });

    $$('filter-status').onChange(updateGrid);
    $$('filter-appointment-type').onChange(updateGrid);
    $$('filter-chk-status').onChange(updateGrid);

    const listSmartChooser = (data) => {
        const elements = Utils.assureArray(data);

        elements.map(element => {
            $$(element.tag).clear();

            AWS.callSoap(WS, element.url, element.param).then(res => {
            
                if (res.wsStatus === '0') {
                    if (!res.item) {
                        $$(element.tag).clear();
                        $$(element.tag).forceSelect();
                        return;
                    }
            
                    if (res.item.length > res.lowCap) {
                        $$(element.tag).forceSelect();
                    }
            
                    $$(element.tag).addItems(Utils.assureArray(res.item), element.ID, element.label);
            
                    if (res.selectedItem) {
                        $$(element.tag).addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
                        $$(element.tag).setValue(res.selectedItem[element.ID], res.selectedItem[element.label]);
                    }
            
                    if (element.selected) {
                        $$(element.tag).setValue(element.selected);
                    }
                }
            });
        });
    };

    const searchEmployee = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('rp-employee').setValue(row.id, row.lastName + ', ' + row.firstName + ' ' + row.middleName);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Last Name', field: 'lastName', width: 80},
                {headerName: 'First Name', field: 'firstName', width: 80},
                {headerName: 'Middle Name', field: 'middleName', width: 80},
            ];

            formSearchGrid = new AGGrid('esp-grid', columnDefs, 'id');
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        formSearchGrid.setOnSelectionChanged((rows) => {
            $$('esp-ok').enable(rows);
        });

        formSearchGrid.setOnRowDoubleClicked(ok);

        const search = () => {
            const inParams = {
                firstName: $$('esp-fname-search').getValue(),
                firstNameSearchType: $$('esp-fname-criteria').getValue(),
                lastName: $$('esp-lname-search').getValue(),
                lastNameSearchType: $$('esp-lname-criteria').getValue(),
            };

            AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('esp-count').setValue(`Displaying ${records.length} Employees`);
                    } else {
                        $$('esp-count').setValue(`Displaying 0 Employees`);
                    }
                }
            })
        };

        $$('esp-reset').onclick(reset);
        $$('esp-search').onclick(search);
        $$('esp-ok').onclick(ok);
        $$('esp-cancel').onclick(cancel);

        search();
    };

    const searchPerson = (attendees, updateAttendeeGrid) => {
        const excludes = attendees.map(a => a.personId);
        let formSearchGrid = null;
        
        Utils.popup_open('person-search');
            
        const reset = () => {
            $$('psp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('psp-lname-search').clear();

            $$('psp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('psp-fname-search').clear();

            $$('psp-type').setValue('true');

            $$('psp-reset').enable();
            $$('psp-search').enable();

            $$('psp-ok').disable();

            formSearchGrid.clear();
            $$('psp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            const data = { ...row, employee: $$('psp-type').getValue() };
            if (data) {
                attendees.push({personId: data.id});
                updateAttendeeGrid();
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('psp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('psp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Last Name', field: 'lastName', width: 80},
                {headerName: 'First Name', field: 'firstName', width: 80},
                {headerName: 'Middle Name', field: 'middleName', width: 80},
                {headerName: 'Phone', field: 'phone', width: 80},
                {headerName: 'Email', field: 'email', width: 80},
            ];

            formSearchGrid = new AGGrid('psp-grid', columnDefs, 'id');
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        formSearchGrid.setOnSelectionChanged((rows) => {
            $$('psp-ok').enable(rows);
        });

        formSearchGrid.setOnRowDoubleClicked(ok);

        const search = () => {
            const inParams = {
                firstName: $$('psp-fname-search').getValue(),
                firstNameSearchType: $$('psp-fname-criteria').getValue(),
                lastName: $$('psp-lname-search').getValue(),
                lastNameSearchType: $$('psp-lname-criteria').getValue(),
                excludeIds: excludes,
                id: clientId
            };

            AWS.callSoap(WS, $$('psp-type').getValue() === 'true' ? 'searchEmployees':'searchContacts', inParams).then(data => {
                if (data.wsStatus === '0') {

                    formSearchGrid.clear();

                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);

                        const count = records.length;
                        $$('psp-count').setValue(`Displaying ${count} Employees`);
                    } else {
                        $$('psp-count').setValue(`Displaying 0 Employees`);
                    }
                }
            })
        };

        $$('psp-reset').onclick(reset);
        $$('psp-search').onclick(search);
        $$('psp-ok').onclick(ok);
        $$('psp-cancel').onclick(cancel);
    };

    const searchLocation = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('location-search');
    
        const reset = () => {
            $$('lsp-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('lsp-code-search').clear();

            $$('lsp-desc-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('lsp-desc-search').clear();

            $$('lsp-reset').enable();
            $$('lsp-search').enable();

            $$('lsp-ok').disable();

            formSearchGrid.clear();
            $$('lsp-count').setValue(`Displaying 0 Appointment Locations`);
        };

        const ok = () => {
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('apt-location').setValue(row.id, row.code);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('lsp-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('lsp-desc-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Code', field: 'code', width: 80},
                {headerName: 'Description', field: 'description', width: 120},
            ];

            formSearchGrid = new AGGrid('lsp-grid', columnDefs, 'id');
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        formSearchGrid.setOnSelectionChanged((rows) => {
            $$('lsp-ok').enable(rows);
        });

        formSearchGrid.setOnRowDoubleClicked(ok);

        const search = () => {
            const inParams = {
                code: $$('lsp-code-search').getValue(),
                codeSearchType: $$('lsp-code-criteria').getValue(),
                description: $$('lsp-desc-search').getValue(),
                descriptionSearchType: $$('lsp-desc-criteria').getValue(),
            };

            AWS.callSoap(WS, 'searchLocations', inParams).then(data => {
                if (data.wsStatus === '0') {

                    // Clear the grid.
                    formSearchGrid.clear();

                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);

                        $$('lsp-count').setValue(`Displaying ${records.length} Appointment Locations`);
                    } else {
                        $$('lsp-count').setValue(`Displaying 0 Appointment Locations`);
                    }
                }
            })
        };

        $$('lsp-reset').onclick(reset);
        $$('lsp-search').onclick(search);
        $$('lsp-ok').onclick(ok);
        $$('lsp-cancel').onclick(cancel);
    };

    const chooseType = () => {
        Utils.popup_open('choose-add-type');
            
        $$('add-type').setValue('P');

        const ok = () => {
            const type = $$('add-type').getValue();
            if (type === 'P') {
                Utils.popup_close();
                addAppointmentPopup();
            } else if (type === 'A') {
                Utils.popup_close();   
                addReminderPopup(); 
            }
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('at-ok').onclick(ok);
        $$('at-cancel').onclick(cancel);
    };

    const addReminderPopup = (row) => {
        Utils.popup_open('reminder-popup');
            
        const reset = () => {
            $$('rp-title').setValue(!row ? 'Add Client Reminder':'Edit Client Reminder');

            $$('rp-employee').setValue('');
            $$('rp-date').clear();
            $$('rp-status').setValue('A');
            $$('rp-purpose').clear();

            $$('rp-employee').forceSelect();
        };

        // $$('rp-employee').setSelectFunction(searchEmployee);
        $$('rp-employee').setSelectFunction(() => {
            Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection', {allowNullSelection: false}).then(data => {
                if (data._status === "ok") {
                    if (data === -1)
                        $$('rp-employee').setValue(null, '');
                    else {
                        $$('rp-employee').setValue(data.employeeid, `${data.lname}, ${data.fname} ${data.mname}`);
                    }
                }
            })
        });

        reset();

        if (row) {
            const p1 = AWS.callSoap(WS, 'searchEmployees', {arrangementId: row.id});
            const p2 = AWS.callSoap(WS, 'loadArrangement', {id: row.id});

            AWS.callAll([p1, p2],
                function (ret) {
                    $$('rp-employee').setValue(ret.selectedItem.id, `${ret.selectedItem.lastName}, ${ret.selectedItem.firstName} ${ret.selectedItem.middleName}`);
                },
                function (ret) {
                    $$('rp-purpose').setValue(ret.purpose);
                    $$('rp-date').setValue(row.date);
                }
            );
        }

        const ok = () => {
            if ($$('rp-employee').isError('Employee'))
                return;
            if ($$('rp-purpose').isError('Purpose'))
                return;

            const data = {
                date: $$('rp-date').getIntValue(),
                personId: $$('rp-employee').getValue(),
                purpose: $$('rp-purpose').getValue(),
                status: $$('rp-status').getValue()
            };

            if (data) {
                AWS.callSoap(WS, 'newArrangement', { ...data, orgGroupId: clientId}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('rp-ok').onclick(ok);
        $$('rp-cancel').onclick(cancel);
    };

    const editReminderPopup = (row) => {
        Utils.popup_open('reminder-popup');
            
        const reset = () => {
            $$('rp-title').setValue(!row ? 'Add Client Reminder':'Edit Client Reminder');

            $$('rp-employee').setValue('');
            $$('rp-date').clear();
            $$('rp-status').setValue('A');
            $$('rp-purpose').clear();

            $$('rp-employee').forceSelect();
        };

        $$('rp-employee').setSelectFunction(searchEmployee);

        reset();

        if (row) {
            const p1 = AWS.callSoap(WS, 'searchEmployees', {arrangementId: row.id});
            const p2 = AWS.callSoap(WS, 'loadArrangement', {id: row.id});

            AWS.callAll([p1, p2],
                function (ret) {
                    $$('rp-employee').setValue(ret.selectedItem.id, `${ret.selectedItem.lastName}, ${ret.selectedItem.firstName} ${ret.selectedItem.middleName}`);
                },
                function (ret) {
                    $$('rp-purpose').setValue(ret.purpose);
                    $$('rp-date').setValue(row.date);
                }
            );
        }

        const ok = () => {
            if ($$('rp-employee').isError('Employee'))
                return;
            if ($$('rp-purpose').isError('Purpose'))
                return;

            const data = {
                date: $$('rp-date').getIntValue(),
                personId: $$('rp-employee').getValue(),
                purpose: $$('rp-purpose').getValue(),
                status: $$('rp-status').getValue()
            };

            if (data) {
                AWS.callSoap(WS, 'saveArrangment', { ...data, id: row.id}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('rp-ok').onclick(ok);
        $$('rp-cancel').onclick(cancel);
    };

    const timeProgressRenderer = (params) => {
        let width = 0, left = 0;
        const hours = Utils.assureArray(params.data.hours)[params.column.colId];
        let current = false;

        if (hours) {
            Utils.assureArray(hours.appointmentSegments).map(h => {
                current = h.current;
                width = (h.finalMinute - h.startMinute + 1) / 60 * 100;
                left = h.startMinute;
            });
        }

        // let res = `<div style="background: ${current === 'true' ? '#6699FF':'#FFCCCC'}; margin-left: ${left}px; width: ${width}px; height: 100%;"></div>`;
        let res = ``;
        const { customStart, customEnd } = params.data;

        if ( customStart && Math.floor(customStart / 100) <= params.column.colId && Math.round(customEnd / 100) >= params.column.colId) {
            let l = 0, w = 0;

            l = params.column.colId * 100 - customStart;
            if (l < 0)
                l = -l;
            else
                l = 0;

            w = customEnd - params.column.colId * 100;
            if (w >= 100)
                w = 100;
            if (customStart === customEnd)
                w = 0;

            if (l !== 0)
                l = l / 60 * 100;
            if (w !== 100)
                w = w / 60 * 100;

            res = `<div style="background: ${current === 'true' ? '#6699FF':'#FFCCCC'}; margin-left: ${l}px; width: ${w}px; height: 100%;"></div>`;

            // res = `<div style="background: #6699FF; margin-left: ${l}px; width: ${w}px; height: 50%; top: 25%; position: absolute;"></div>`;
        }
        
        return `<div style="margin-left: -12px; width: 100px; height: 100%;">${res}</div>`;
    };

    const columns = [
        { headerName: "Attendee", field: "attendee", width: 150, pinned: 'left', cellRenderer: (p) => {
            return `<img src="assets/${p.data.employee === 'true'?'employee':'contact'}${p.data.primary === 'true'?'Primary':''}.png" style="position: relative; top: 5px; left: -5px;"> ${p.data.lastName}, ${p.data.firstName}`;
        }},
    ];
    for (let i = 0; i < 24; i ++) {                
        columns.push({ 
            headerName: `${i % 12 === 0 ? 12 : i % 12}:00 ${ i < 12 ? 'am' : 'pm'}`, 
            cellRenderer: timeProgressRenderer,
            width: 100 
        });
    }

    const attendeeGrid = new AGGrid('apt-grid', columns, 'personId');
    attendeeGrid.suppressHorizontalScroll = false;
    attendeeGrid.show();
    attendeeGrid.setOnSelectionChanged((rows) => {
        $$('apt-attendee-edit').enable(rows);
        $$('apt-attendee-remove').enable(rows);
    });

    function anyPrimaries(data) {
        for (let i=0 ; i < data.length ; i++)
            if (data[i].primary === 'true')
                return true;
        return false;
    }

    const addAppointmentPopup = (row) => {
        let tabContainer = null;
        let attendees = [];
        let fillForm = true;
        let primaryContactId = null;
        let primaryEmployeeId = null;

        const updateAttendeeGrid = () => {
            attendeeGrid.clear();

            const data = {
                date: row ? row.date : $$('apt-date').getIntValue(),
                id: row ? row.id:null,
                item: attendees.map(a => a.personId),
                fillFromId: fillForm,
                primaryContactId: primaryContactId,
                primaryEmployeeId: primaryEmployeeId
            };

            AWS.callSoap(WS, 'listAttendeeAppointments', data).then(ret => {
                if (ret.wsStatus === '0') {

                    let customStart = $$('apt-time').getValue();
                    let customEnd = null;

                    if (customStart) {
                        let hours = $$('apt-duration-hours').getValue() !== '' ? $$('apt-duration-hours').getValue() : 0;
                        let mins = $$('apt-duration-mins').getValue() !== '' ? $$('apt-duration-mins').getValue() : 0;
                        customEnd = customStart + hours * 100 + mins;
                        if ((customEnd % 100) >= 60) {
                            customEnd += 100;
                            customEnd -= 60;
                        }
                    }

                    attendees = Utils.assureArray(ret.item);

                    for (let i = 0; i < attendees.length; i ++) {
                        attendees[i].customStart = customStart;
                        attendees[i].customEnd = customEnd;
                    }
                    
                    attendeeGrid.addRecords(attendees);
                    if (fillForm) {
                        fillForm = false;
                    }
                }
            });

            $$('apt-attendee-edit').disable();
            $$('apt-attendee-remove').disable();
        };

        const resetDialog = () => {
            if (row) {
                $$('apt-title').setValue(`Edit Client Appointment`);
            } else {
                $$('apt-title').setValue(`Add Client Appointment`);
            }

            $$('apt-date').setValue($$('filter-from-date').getIntValue());
            $$('apt-time').clear();
            $$('apt-duration-hours').setValue(0);
            $$('apt-duration-mins').setValue(0);
            $$('apt-other-attendee').clear();

            $$('apt-purpose').clear();

            $$('apt-status').setValue('A');
            $$('apt-location').setValue('');
            $$('apt-location-detail').clear();

            attendees = [];
            updateAttendeeGrid();

            tabContainer.selectTab('attendeeTabButton');
        };

        const initDialog = () => {
            // Setup tab layout.
            tabContainer = new TabContainer('appointmentTabContainer');

            resetDialog();

            listSmartChooser({tag: 'apt-location', url: 'searchLocations', ID: 'id', label: 'code', param: {appointmentId: row ? row.id : null}})
            $$('apt-location').setSelectFunction(searchLocation);

            if (!row) {
                return;
            }

            AWS.callSoap(WS, 'loadAppointment', {id: row.id}).then(ret => {
                if (ret.wsStatus === '0') {
                    $$('apt-location-detail').setValue(ret.location);
                    $$('apt-other-attendee').setValue(ret.attendees);
                    $$('apt-purpose').setValue(ret.purpose);
                    $$('apt-status').setValue(row.status);
                    $$('apt-date').setValue(row.date);
                    $$('apt-time').setValue(row.time);
                    $$('apt-duration-hours').setValue(Math.floor(row.length / 60));
                    $$('apt-duration-mins').setValue(row.length % 60);
                }
            });
        };

        initDialog();
        
        Utils.popup_open('appointment-popup');
    
        $$('apt-day-before').onclick(() => {
            const s = $$('apt-date').getIntValue() ? $$('apt-date').getIntValue() : DateUtils.dateToInt(new Date);
            $$('apt-date').setValue(DateUtils.intAddDays(s, -1));
            updateAttendeeGrid();
        });

        $$('apt-day-after').onclick(() => {
            const s = $$('apt-date').getIntValue() ? $$('apt-date').getIntValue() : DateUtils.dateToInt(new Date);
            $$('apt-date').setValue(DateUtils.intAddDays(s, 1));
            updateAttendeeGrid();
        });

        $$('apt-attendee-add').onclick(() => searchPerson(attendees, updateAttendeeGrid));

        $$('apt-attendee-edit').onclick(() => {
            const row = attendeeGrid.getSelectedRow();
            editAttendee(row);
        });

        $$('apt-attendee-remove').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Attendee?', () => {
                const row = attendeeGrid.getSelectedRow();
                const newAttendees = [];
                for (let i = 0; i < attendees.length; i ++) {
                    if (attendees[i].personId === row.personId )
                        continue;
                    newAttendees.push(attendees[i]);
                }
                attendees = newAttendees;
                updateAttendeeGrid();
            });
        });

        $$('apt-time').onChange(updateAttendeeGrid);
        $$('apt-duration-hours').onChange(updateAttendeeGrid);
        $$('apt-duration-mins').onChange(updateAttendeeGrid);

        const editAttendee = (row) => {
            Utils.popup_open('edit-attendee');
        
            $$('eap-name').setValue(`${row.lastName}, ${row.firstName}`);
            $$('eap-primary').setValue(row.primary || row.primary === 'true');

            const ok = () => {
                const primary = $$('eap-primary').getValue()

                if (row.employee === 'true') {
                    if (primary) {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee === 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'true';
                                    primaryEmployeeId = row.personId;
                                } else {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    } else {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee === 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    }                    
                } else {
                    if (primary) {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee !== 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'true';
                                    primaryContactId = row.personId;
                                } else {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    } else {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee !== 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    }
                }

                const employees = [], contacts = [];

                attendees.map(a => {
                    if (a.employee === 'true')
                        employees.push(a);
                    else
                        contacts.push(a);
                });

                if (!anyPrimaries(employees)) {
                    primaryEmployeeId = null;
                }
                if (!anyPrimaries(contacts)) {
                    primaryContactId = null;
                }
                // updateAttendeeGrid();
                attendeeGrid.clear();
                attendeeGrid.addRecords(attendees);
                Utils.popup_close();
            };

            const cancel = () => {
                Utils.popup_close();
            };

            $$('eap-ok').onclick(ok);
            $$('eap-cancel').onclick(cancel);
        };
        attendeeGrid.setOnRowDoubleClicked(() => {
            const row = attendeeGrid.getSelectedRow();
            editAttendee(row);
        });
        
        const ok = async () => {
            if (!attendees.length) {
                Utils.showMessage('Error', 'At least one Attendee is required');
                tabContainer.selectTab('attendeeTabButton');
                return;                    
            }
            if ($$('apt-time').isError('Time')) {
                tabContainer.selectTab('attendeeTabButton');
                return;
            }
            if ($$('apt-duration-hours').isError('Duration')) {
                tabContainer.selectTab('attendeeTabButton');
                return;
            }
            if ($$('apt-duration-hours').isError('Duration')) {
                tabContainer.selectTab('attendeeTabButton');
                return;
            }
            if ($$('apt-purpose').isError('Purpose')) {
                tabContainer.selectTab('purposeTabButton');
                return;
            }
            if ($$('apt-location').isError('Location')) {
                tabContainer.selectTab('statusTabButton');
                return;
            }

            const employees = [], contacts = [];

            attendees.map(a => {
                if (a.employee === 'true')
                    employees.push(a);
                else
                    contacts.push(a);
            });

            const data = {
                length: $$('apt-duration-hours').getValue()*60 + $$('apt-duration-mins').getValue(),
                attendees: $$('apt-other-attendee').getValue(),
                date: $$('apt-date').getIntValue(),
                location: $$('apt-location-detail').getValue(),
                locationId: $$('apt-location').getValue(),
                purpose: $$('apt-purpose').getValue(),
                status: $$('apt-status').getValue(),
                time: $$('apt-time').getValue(),
                employees: employees.map(e => {return {id: e.personId, primary: e.primary}}),
                contacts: contacts.map(c => {return {id: c.personId, primary: c.primary}})
            };

            if (!data.employees.length && !await Utils.yesNo('Confirmation', 'No Attendees have been specified.  Continue?'))
                return;
            if (!anyPrimaries(data.employees) && !await Utils.yesNo('Confirmation', 'A Primary Attendee is not assigned.  Continue?'))
                return;

            if (data) {
                AWS.callSoap(WS, 'newAppointment', { ...data, orgGroupId: clientId}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }
            
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('apt-ok').onclick(ok);
        $$('apt-cancel').onclick(cancel);
    };

    const editAppointmentPopup = (row) => {
        let tabContainer = null;
        let attendees = [];
        let fillForm = true;
        let primaryContactId = null;
        let primaryEmployeeId = null;
        
        const updateAttendeeGrid = () => {
            attendeeGrid.clear();

            const data = {
                date: row ? row.date : $$('apt-date').getIntValue(),
                id: row ? row.id:null,
                item: attendees.map(a => a.personId),
                fillFromId: fillForm,
                primaryContactId: primaryContactId,
                primaryEmployeeId: primaryEmployeeId
            };

            AWS.callSoap(WS, 'listAttendeeAppointments', data).then(ret => {
                if (ret.wsStatus === '0') {

                    const customStart = $$('apt-time').getValue();
                    let customEnd = null;

                    if (customStart) {
                        const hours = $$('apt-duration-hours').getValue() !== '' ? $$('apt-duration-hours').getValue() : 0;
                        const mins = $$('apt-duration-mins').getValue() !== '' ? $$('apt-duration-mins').getValue() : 0;
                        customEnd = customStart + hours * 100 + mins;
                        if ((customEnd % 100) >= 60) {
                            customEnd += 100;
                            customEnd -= 60;
                        }
                    }

                    attendees = Utils.assureArray(ret.item);

                    for (let i = 0; i < attendees.length; i ++) {
                        attendees[i].customStart = customStart;
                        attendees[i].customEnd = customEnd;
                    }
                    
                    attendeeGrid.addRecords(attendees);
                    if (fillForm) {
                        fillForm = false;
                    }
                }
            });

            $$('apt-attendee-edit').disable();
            $$('apt-attendee-remove').disable();
        };

        const resetDialog = () => {
            if (row) {
                $$('apt-title').setValue(`Edit Client Appointment`);
            } else {
                $$('apt-title').setValue(`Add Client Appointment`);
            }

            $$('apt-date').setValue($$('filter-from-date').getIntValue());
            $$('apt-time').clear();
            $$('apt-duration-hours').setValue(0);
            $$('apt-duration-mins').setValue(0);
            $$('apt-other-attendee').clear();

            $$('apt-purpose').clear();

            $$('apt-status').setValue('A');
            $$('apt-location').setValue('');
            $$('apt-location-detail').clear();

            attendees = [];
            updateAttendeeGrid();

            tabContainer.selectTab('attendeeTabButton');
        };

        const initDialog = () => {
            // Setup tab layout.
            tabContainer = new TabContainer('appointmentTabContainer');

            resetDialog();

            listSmartChooser({tag: 'apt-location', url: 'searchLocations', ID: 'id', label: 'code', param: {appointmentId: row ? row.id : null}})
            $$('apt-location').setSelectFunction(searchLocation);

            if (!row) {
                return;
            }

            AWS.callSoap(WS, 'loadAppointment', {id: row.id}).then(ret => {
                if (ret.wsStatus === '0') {
                    $$('apt-location-detail').setValue(ret.location);
                    $$('apt-other-attendee').setValue(ret.attendees);
                    $$('apt-purpose').setValue(ret.purpose);
                    $$('apt-status').setValue(row.status);
                    $$('apt-date').setValue(row.date);
                    $$('apt-time').setValue(row.time);
                    $$('apt-duration-hours').setValue(Math.floor(row.length / 60));
                    $$('apt-duration-mins').setValue(row.length % 60);
                }
            });
        };

        initDialog();
        
        Utils.popup_open('appointment-popup');
    
        $$('apt-day-before').onclick(() => {
            const s = $$('apt-date').getIntValue() ? $$('apt-date').getIntValue() : DateUtils.dateToInt(new Date);
            $$('apt-date').setValue(DateUtils.intAddDays(s, -1));
            updateAttendeeGrid();
        });

        $$('apt-day-after').onclick(() => {
            const s = $$('apt-date').getIntValue() ? $$('apt-date').getIntValue() : DateUtils.dateToInt(new Date);
            $$('apt-date').setValue(DateUtils.intAddDays(s, 1));
            updateAttendeeGrid();
        });

        $$('apt-attendee-add').onclick(() => searchPerson(attendees, updateAttendeeGrid));

        $$('apt-attendee-edit').onclick(() => {
            const row = attendeeGrid.getSelectedRow();
            editAttendee(row);
        });

        $$('apt-attendee-remove').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Attendee?', () => {
                const row = attendeeGrid.getSelectedRow();
                const newAttendees = [];
                for (let i = 0; i < attendees.length; i ++) {
                    if (attendees[i].personId === row.personId )
                        continue;
                    newAttendees.push(attendees[i]);
                }
                attendees = newAttendees;
                updateAttendeeGrid();
            });
        });

        $$('apt-time').onChange(updateAttendeeGrid);
        $$('apt-duration-hours').onChange(updateAttendeeGrid);
        $$('apt-duration-mins').onChange(updateAttendeeGrid);

        const editAttendee = (row) => {
            
            Utils.popup_open('edit-attendee');
        
            $$('eap-name').setValue(`${row.lastName}, ${row.firstName}`);
            $$('eap-primary').setValue(row.primary || row.primary === 'true');

            const ok = () => {
                const primary = $$('eap-primary').getValue()

                if (row.employee === 'true') {
                    if (primary) {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee === 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'true';
                                    primaryEmployeeId = row.personId;
                                } else {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    } else {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee === 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    }                    
                } else {
                    if (primary) {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee !== 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'true';
                                    primaryContactId = row.personId;
                                } else {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    } else {
                        for (let i = 0; i < attendees.length; i ++) {
                            if (attendees[i].employee !== 'true') {
                                if (attendees[i].personId === row.personId) {
                                    attendees[i].primary = 'false';
                                }
                            }
                        }
                    }
                }

                const employees = [], contacts = [];

                attendees.map(a => {
                    if (a.employee === 'true')
                        employees.push(a);
                    else
                        contacts.push(a);
                });

                if (!anyPrimaries(employees)) {
                    primaryEmployeeId = null;
                }
                if (!anyPrimaries(contacts)) {
                    primaryContactId = null;
                }
                // updateAttendeeGrid();
                attendeeGrid.clear();
                attendeeGrid.addRecords(attendees);
                Utils.popup_close();
            };

            let cancel = () => {
                Utils.popup_close();
            };

            $$('eap-ok').onclick(ok);
            $$('eap-cancel').onclick(cancel);
        };
        attendeeGrid.setOnRowDoubleClicked(() => {
            const row = attendeeGrid.getSelectedRow();
            editAttendee(row);
        });
        
        const ok = async () => {
            if (!attendees.length) {
                Utils.showMessage('Error', 'At least one Attendee or Other Attendees are required');
                tabContainer.selectTab('attendeeTabButton');
                return;                    
            }
            if ($$('apt-time').isError('Time')) {
                tabContainer.selectTab('attendeeTabButton');
                return;
            }
            if ($$('apt-duration-hours').isError('Duration')) {
                tabContainer.selectTab('attendeeTabButton');
                return;
            }
            if ($$('apt-duration-hours').isError('Duration')) {
                tabContainer.selectTab('attendeeTabButton');
                return;
            }
            if ($$('apt-purpose').isError('Purpose')) {
                tabContainer.selectTab('purposeTabButton');
                return;
            }
            if ($$('apt-location').isError('Location')) {
                tabContainer.selectTab('statusTabButton');
                return;
            }

            const employees = [], contacts = [];

            attendees.map(a => {
                if (a.employee === 'true')
                    employees.push(a);
                else
                    contacts.push(a);
            });

            const data = {
                length: $$('apt-duration-hours').getValue()*60 + $$('apt-duration-mins').getValue(),
                attendees: $$('apt-other-attendee').getValue(),
                date: $$('apt-date').getIntValue(),
                location: $$('apt-location-detail').getValue(),
                locationId: $$('apt-location').getValue(),
                purpose: $$('apt-purpose').getValue(),
                status: $$('apt-status').getValue(),
                time: $$('apt-time').getValue(),
                employees: employees.map(e => {return {id: e.personId, primary: e.primary}}),
                contacts: contacts.map(c => {return {id: c.personId, primary: c.primary}})
            };

            if (!data.employees.length && !await Utils.yesNo('Confirmation', 'No Attendees have been specified.  Continue?'))
                return;
            if (!anyPrimaries(data.employees) && !await Utils.yesNo('Confirmation', 'A Primary Attendee is not assigned.  Continue?'))
                return;

            if (data) {
                AWS.callSoap(WS, 'saveAppointment', { ...data, id: row.id}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }
            
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('apt-ok').onclick(ok);
        $$('apt-cancel').onclick(cancel);
    };

    $$('add').onclick(chooseType);

    function edit() {
        const row = grid.getSelectedRow();

        if (row.type === 'P') {
            editAppointmentPopup(row);
        } else {
            editReminderPopup(row);
        }
    }

    grid.setOnRowDoubleClicked(edit);
    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Appointment/Reminder?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteAppointments", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });            
        });
    });

    $$('report').onclick(() => {
        const data = {
            id: clientId,
            fromDate: $$('filter-from-date').getIntValue(),
            toDate: $$('filter-to-date').getIntValue(),
            status: $$('filter-status').getValue(),
            type: $$('filter-appointment-type').getValue(),
            attendeeOnly: $$('filter-chk-status').getValue()
        };

        AWS.callSoap(WS, 'getReport', data).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    });
})();
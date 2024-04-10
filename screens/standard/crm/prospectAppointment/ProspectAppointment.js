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

    const WS = 'StandardCrmProspectAppointment';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    let prospectId = Utils.getData(CURRENT_PROSPECT_ID);
    let prospectName = Utils.getData(CURRENT_PROSPECT_NAME);

    $$('prospect-name').setValue(prospectName);

    const columnDefs = [
        { headerName: 'Day', field: 'day', width: 50 },
        { headerName: 'Date', field: 'date1', width: 50 },
        { headerName: 'Time', field: 'time1', width: 50 },
        { headerName: 'Length', field: 'length1', width: 50 },
        { headerName: 'Type', field: 'type1', width: 50 },
        { headerName: 'Status', field: 'status1', width: 50 },
        { headerName: 'Purpose', field: 'purpose' },
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');

    grid.show();
    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function formatLength(length) {
        var hours = (length / 60).toFixed();
        
        if (length == 0)
        {
            return "";
        }
        else if (hours > 0)
        {
            var minutes = length - (hours * 60);
            var lengthFormatted = hours + " hour";
            
            if (hours > 1)
            {
                lengthFormatted += "s";
            }
            
            if (minutes > 0)
            {
                lengthFormatted += ", ";
                lengthFormatted += minutes;
                lengthFormatted += " minute";
                if (minutes > 1)
                {
                    lengthFormatted += "s";
                }
            }
            
            return lengthFormatted;
        }
        else if (length == 1)
        {
            return length + " minute";
        }
        else
        {
            return length + " minutes";
        }
        
        return length;
    }

    function updateGrid() {
        const data = {
            id: prospectId,
            fromDate: $$('filter-from-date').getIntValue(),
            toDate: $$('filter-to-date').getIntValue(),
            status: $$('filter-status').getValue(),
            type: $$('filter-appointment-type').getValue(),
            attendeeOnly: $$('filter-chk-status').getValue()
        };

        grid.clear();

        AWS.callSoap(WS, 'listAppointments', data).then(ret => {
            if (ret.wsStatus === '0') {
                var records = Utils.assureArray(ret.item);
                for (let i = 0; i < records.length; i ++) {
                    var row = records[i];
                    row.date1 = DateUtils.intToStr4(Number(row.date));
                    row.type1 = row.type === 'P' ? 'Appointment':'Reminder';
                    row.status1 = row.status === 'A' ? 'Active': (row.status === 'C' ? 'Cancelled':'Done/Complete');
                    row.time1 = TimeUtils.format(Math.floor(row.time/100000), false);
                    row.length1 = formatLength(row.length);
                }
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} Appointments & Reminders`);
            }
        });
    }

    updateGrid();

    function updateDate(op) {
        let start = null, end = null;
        let curr = new Date; // get current date
        
        
        switch (op) {
            case "today":
                start = DateUtils.dateToInt(curr);
                end = DateUtils.dateToInt(curr);
                break;
            case "week":
                var first = curr.getDate() - curr.getDay(); // First day is the day of the month - the day of the week

                start = DateUtils.dateToInt(new Date(curr.setDate(first)));
                end = DateUtils.intAddDays(start, 6);
                break;
            case "month":
                start = DateUtils.dateToInt(new Date(curr.getFullYear(), curr.getMonth(), 1));
                end = DateUtils.dateToInt(new Date(curr.getFullYear(), curr.getMonth() + 1, 0));
                break;
            case "daybefore":
                var s = $$('filter-from-date').getIntValue() ? $$('filter-from-date').getIntValue() : DateUtils.dateToInt(curr);
                start = DateUtils.intAddDays(s, -1);
                end = DateUtils.intAddDays(s, -1);
                break;
            case "dayafter":
                var s = $$('filter-from-date').getIntValue() ? $$('filter-from-date').getIntValue() : DateUtils.dateToInt(curr);
                start = DateUtils.intAddDays(s, 1);
                end = DateUtils.intAddDays(s, 1);
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
        let from = $$('filter-from-date').getIntValue();
        let to = $$('filter-to-date').getIntValue();

        if (!to || to <= from) {
            $$('filter-to-date').setValue(from);
        }
        updateGrid();
    });
    $$('filter-to-date').onChange((v) => {
        let from = $$('filter-from-date').getIntValue();
        let to = $$('filter-to-date').getIntValue();

        if (!from || to <= from) {
            $$('filter-from-date').setValue(to);
        }
        updateGrid();
    });
    $$('filter-status').onChange(updateGrid);
    $$('filter-appointment-type').onChange(updateGrid);
    $$('filter-chk-status').onChange(updateGrid);

    async function executeSelectFunc(element, fn, id, name) {
        let selectedNode = await fn();
        if (selectedNode) {
            $$(element).setValue(selectedNode[id], typeof name === "function" ? name(selectedNode) : selectedNode[name]);
        }
    }

    const listSmartChooser = (data) => {
        let elements = Utils.assureArray(data);

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
    
        return new Promise(async function (resolve, reject) {
            
            let reset = () => {
                $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-lname-search').clear();
    
                $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-fname-search').clear();
    
                $$('esp-reset').enable();
                $$('esp-search').enable();
    
                $$('esp-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            };
    
            let changeCount = count => {
                Utils.setText('esp-count', `Displaying ${count} Employees`);
            };
    
            let ok = () => {    
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
    
            // Setup drop downs.
            bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Last Name', field: 'lastName', width: 80},
                    {headerName: 'First Name', field: 'firstName', width: 80},
                    {headerName: 'Middle Name', field: 'middleName', width: 80},
                ];
    
                formSearchGrid = new AGGrid('esp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged((rows) => {
                $$('esp-ok').enable(rows);
            });
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
                let inParams = {
                    firstName: $$('esp-fname-search').getValue(),
                    firstNameSearchType: $$('esp-fname-criteria').getValue(),
                    lastName: $$('esp-lname-search').getValue(),
                    lastNameSearchType: $$('esp-lname-criteria').getValue(),
                };
    
                AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                    if (data.wsStatus === '0') {
    
                        // Clear the grid.
                        formSearchGrid.clear();
    
                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
    
                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };
    
            $$('esp-reset').onclick(reset);
            $$('esp-search').onclick(search);
            $$('esp-ok').onclick(ok);
            $$('esp-cancel').onclick(cancel);
    
            search();
    
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    
    };

    const searchPerson = (excludes) => {
        let formSearchGrid = null;
        
        Utils.popup_open('person-search');
    
        return new Promise(async function (resolve, reject) {
            
            let reset = () => {
                $$('psp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-lname-search').clear();
    
                $$('psp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-fname-search').clear();

                $$('psp-type').setValue('true');
    
                $$('psp-reset').enable();
                $$('psp-search').enable();
    
                $$('psp-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            };
    
            let changeCount = count => {
                Utils.setText('psp-count', `Displaying ${count} Employees`);
            };
    
            let ok = () => {    
                let row = formSearchGrid.getSelectedRow();
                resolve({ ...row, employee: $$('psp-type').getValue() });
                reset();
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
    
            // Setup drop downs.
            bindToEnum('psp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
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
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged((rows) => {
                $$('psp-ok').enable(rows);
            });
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
                let inParams = {
                    firstName: $$('psp-fname-search').getValue(),
                    firstNameSearchType: $$('psp-fname-criteria').getValue(),
                    lastName: $$('psp-lname-search').getValue(),
                    lastNameSearchType: $$('psp-lname-criteria').getValue(),
                    excludeIds: excludes,
                    id: prospectId
                };
    
                AWS.callSoap(WS, $$('psp-type').getValue() == 'true' ? 'searchEmployees':'searchContacts', inParams).then(data => {
                    if (data.wsStatus === '0') {
    
                        // Clear the grid.
                        formSearchGrid.clear();
    
                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
    
                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };
    
            $$('psp-reset').onclick(reset);
            $$('psp-search').onclick(search);
            $$('psp-ok').onclick(ok);
            $$('psp-cancel').onclick(cancel);
                
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    
    };

    const searchLocation = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('location-search');
    
        return new Promise(async function (resolve, reject) {
            
            let reset = () => {
                $$('lsp-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('lsp-code-search').clear();
    
                $$('lsp-desc-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('lsp-desc-search').clear();
    
                $$('lsp-reset').enable();
                $$('lsp-search').enable();
    
                $$('lsp-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            };
    
            let changeCount = count => {
                Utils.setText('lsp-count', `Displaying ${count} Appointment Locations`);
            };
    
            let ok = () => {    
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
    
            // Setup drop downs.
            bindToEnum('lsp-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('lsp-desc-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120},
                ];
    
                formSearchGrid = new AGGrid('lsp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged((rows) => {
                $$('lsp-ok').enable(rows);
            });
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
                let inParams = {
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
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
    
                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };
    
            $$('lsp-reset').onclick(reset);
            $$('lsp-search').onclick(search);
            $$('lsp-ok').onclick(ok);
            $$('lsp-cancel').onclick(cancel);
                
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    
    };

    const chooseType = () => {
        
        Utils.popup_open('choose-add-type');
    
        return new Promise(async function (resolve, reject) {
            
            $$('add-type').setValue('P');
    
            let ok = () => {
                resolve($$('add-type').getValue());
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('at-ok').onclick(ok);
            $$('at-cancel').onclick(cancel);
        });
    
    };

    const reminderPopup = (row) => {
        
        Utils.popup_open('reminder-popup');
    
        return new Promise(async function (resolve, reject) {
            
            let reset = () => {
                $$('rp-title').setValue(!row ? 'Add Prospect Reminder':'Edit Prospect Reminder');

                $$('rp-employee').setValue('');
                $$('rp-date').clear();
                $$('rp-status').setValue('A');
                $$('rp-purpose').clear();

                $$('rp-employee').forceSelect();
            };

            $$('rp-employee').setSelectFunction(() => executeSelectFunc('rp-employee', searchEmployee, 'id', (data) => `${data.lastName}, ${data.firstName} ${data.middleName}`));

            reset();

            if (row) {
                let p1 = AWS.callSoap(WS, 'searchEmployees', {arrangementId: row.id});
                let p2 = AWS.callSoap(WS, 'loadArrangement', {id: row.id});

                await AWS.callAll([p1, p2],
                    function (ret) {
                        $$('rp-employee').setValue(ret.selectedItem.id, `${ret.selectedItem.lastName}, ${ret.selectedItem.firstName} ${ret.selectedItem.middleName}`);
                    },
                    function (ret) {
                        $$('rp-purpose').setValue(ret.purpose);
                        $$('rp-date').setValue(row.date);
                    }
                );
            }
    
            let ok = () => {
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

                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('rp-ok').onclick(ok);
            $$('rp-cancel').onclick(cancel);
        });
    
    };

    const editAttendee = (row) => {
        
        Utils.popup_open('edit-attendee');
    
        return new Promise(async function (resolve, reject) {
            
            $$('eap-name').setValue(`${row.lastName}, ${row.firstName}`);
            $$('eap-primary').setValue(row.primary || row.primary == 'true');
    
            let ok = () => {
                resolve($$('eap-primary').getValue());
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('eap-ok').onclick(ok);
            $$('eap-cancel').onclick(cancel);
        });
    
    };

    const timeProgressRenderer = (params) => {
        let width = 0, left = 0;
        let hours = Utils.assureArray(params.data.hours)[params.column.colId];
        let current = false;

        if (hours) {
            Utils.assureArray(hours.appointmentSegments).map(h => {
                current = h.current;
                width = (h.finalMinute - h.startMinute + 1)/60*100;
                left = h.startMinute;
            })
        }

        let res = `<div style="background: ${current == 'true' ? '#6699FF':'#FFCCCC'}; margin-left: ${left}px; width: ${width}px; height: 100%;"></div>`;
        let { customStart, customEnd } = params.data;

        if ( customStart && Math.floor(customStart/100) <= params.column.colId && Math.round(customEnd/100) >= params.column.colId) {
            let l = 0, w = 0;

            l = params.column.colId*100 - customStart;
            if (l < 0) l = -l;
            else l = 0;

            w = customEnd - params.column.colId*100;
            if (w >= 100) w = 100;
            if (customStart === customEnd) w = 0;

            if (l != 0) l = l / 60 * 100;
            if (w != 100) w = w / 60 * 100;

            res += `<div style="background: #6699FF; margin-left: ${l}px; width: ${w}px; height: 50%; top: 25%; position: absolute;"></div>`;
        }
        
        return `<div style="margin-left: -12px; width: 100px; height: 100%;">${res}</div>`;
    };

    let columns = [
        { headerName: "Attendee", field: "attendee", width: 150, pinned: 'left', cellRenderer: (p) => {
            return `<img src="assets/${p.data.employee=='true'?'employee':'contact'}${p.data.primary=='true'?'Primary':''}.png" style="position: relative; top: 5px; left: -5px;"> ${p.data.lastName}, ${p.data.firstName}`;
        }},
    ];
    for (let i = 0; i < 24; i ++) {                
        columns.push({ 
            headerName: `${i % 12 === 0 ? 12 : i % 12}:00 ${ i < 12 ? 'am' : 'pm'}`, 
            cellRenderer: timeProgressRenderer,
            width: 100 
        });
    }

    let attendeeGrid = new AGGrid('apt-grid', columns, 'personId');
    attendeeGrid.suppressHorizontalScroll = false;
    attendeeGrid.show();
    attendeeGrid.setOnSelectionChanged((rows) => {
        $$('apt-attendee-edit').enable(rows);
        $$('apt-attendee-remove').enable(rows);
    });

    const appointmentPopup = (row) => {

        let tabContainer = null;
        let attendees = [];
        let fillForm = true;
        let primaryEmpId = null, primaryContactId = null;

        let updateAttendeeGrid = () => {
            attendeeGrid.clear();

            const data = {
                date: $$('apt-date').getIntValue(),
                id: row ? row.id:null,
                item: attendees.map(a => a.personId),
                fillFromId: fillForm
            };

            AWS.callSoap(WS, 'listAttendeeAppointments', data).then(ret => {
                if (ret.wsStatus === '0') {

                    let customStart = $$('apt-time').getValue();
                    let customEnd = null;

                    if (customStart) {
                        let hours = $$('apt-duration-hours').getValue() != '' ? $$('apt-duration-hours').getValue() : 0;
                        let mins = $$('apt-duration-mins').getValue() != '' ? $$('apt-duration-mins').getValue() : 0;
                        customEnd = customStart + hours * 100 + mins;
                        if ((customEnd % 100) >= 60) {
                            customEnd += 100;
                            customEnd -= 60;
                        }
                    }

                    attendees = Utils.assureArray(ret.item);

                    for (let i = 0; i < attendees.length; i ++) {
                        if (attendees[i].personId == primaryEmpId || attendees[i].personId == primaryContactId) {
                            attendees[i].primary = 'true';
                        }

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

        let resetDialog = () => {

            if (row) {
                $$('apt-title').setValue(`Edit Prospect Appointment`);
            } else {
                $$('apt-title').setValue(`Add Prospect Appointment`);
            }

            $$('apt-date').setValue(DateUtils.dateToInt(new Date));
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

        let initDialog = async () => {
            // Setup tab layout.
            tabContainer = new TabContainer('appointmentTabContainer');

            resetDialog();

            listSmartChooser({tag: 'apt-location', url: 'searchLocations', ID: 'id', label: 'code', param: {appointmentId: row?row.id:null}})
            $$('apt-location').setSelectFunction(() => executeSelectFunc('apt-location', searchLocation, 'id', 'code'));

            if (!row) {
                return;
            }

            AWS.callSoap(WS, 'loadAppointment', {id: row.id}).then(ret => {
                if (ret.wsStatus == '0') {
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
    
        return new Promise(async function (resolve, reject) {            

            $$('apt-day-before').onclick(() => {
                var s = $$('apt-date').getIntValue() ? $$('apt-date').getIntValue() : DateUtils.dateToInt(new Date);
                $$('apt-date').setValue(DateUtils.intAddDays(s, -1));
                updateAttendeeGrid();
            });

            $$('apt-day-after').onclick(() => {
                var s = $$('apt-date').getIntValue() ? $$('apt-date').getIntValue() : DateUtils.dateToInt(new Date);
                $$('apt-date').setValue(DateUtils.intAddDays(s, 1));
                updateAttendeeGrid();
            });

            $$('apt-attendee-add').onclick(async () => {
                let data = await searchPerson(attendees.map(a => a.personId));
                if (data) {
                    attendees.push({personId: data.id});
                    updateAttendeeGrid();
                }
            });

            $$('apt-attendee-edit').onclick(async () => {
                let row = attendeeGrid.getSelectedRow();
                let primary = await editAttendee(row);

                if (primary === null) 
                    return;

                for (let i = 0; i < attendees.length; i ++) {
                    if (attendees[i].personId != row.personId )
                        continue;
                    if (row.employee == 'true') {
                        primaryEmpId = attendees[i].personId;
                    } else {
                        primaryContactId = attendees[i].personId;
                    }
                }
                updateAttendeeGrid();
            });

            $$('apt-attendee-remove').onclick(() => {
                Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Attendee?', () => {
                    let row = attendeeGrid.getSelectedRow();
                    let newAttendees = [];
                    for (let i = 0; i < attendees.length; i ++) {
                        if (attendees[i].personId == row.personId )
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
            
            let ok = async () => {
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

                let employees = [], contacts = [];

                attendees.map(a => {
                    if (a.employee == 'true')
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

                

                if (!data.employees.length) {
                    if (!await Utils.yesNo('Confirmation', 'No Employees have been specified under Attendees.  Continue?'))
                        return;
                }  else {
                    if (!primaryEmpId && !await Utils.yesNo('Confirmation', 'A Primary Employee Attendee is not assigned.  Continue?'))
                        return;
                }
                if (!data.contacts.length) {
                    if (!await Utils.yesNo('Confirmation', 'No Contacts have been specified under Attendees.  Continue?'))
                        return;
                } else {
                    if (!primaryContactId && !await Utils.yesNo('Confirmation', 'A Primary Contact Attendee is not assigned.  Continue?'))
                        return;
                }
                
                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('apt-ok').onclick(ok);
            $$('apt-cancel').onclick(cancel);
        });
    
    };

    $$('add').onclick(async () => {
        let type = await chooseType();

        if (type === 'P') {

            let data = await appointmentPopup();
            if (data) {
                AWS.callSoap(WS, 'newAppointment', { ...data, orgGroupId: prospectId}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }
            
        } else if (type === 'A') {

            let data = await reminderPopup();
            if (data) {
                AWS.callSoap(WS, 'newArrangement', { ...data, orgGroupId: prospectId}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }

        }
    });

    async function edit() {
        let row = grid.getSelectedRow();

        if (row.type === 'P') {

            let data = await appointmentPopup(row);
            if (data) {
                AWS.callSoap(WS, 'saveAppointment', { ...data, id: row.id}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }

        } else {
            let data = await reminderPopup(row);
            if (data) {
                AWS.callSoap(WS, 'saveArrangment', { ...data, id: row.id}).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                    }
                });
            }
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
            id: prospectId,
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
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
    const WS = 'StandardMiscAlertHRAdmin';

    let alertsGrid;

    const alertsColumnDefs = [
        {headerName: "Detail", field: "detail", width: 600},
        {headerName: "Start Date", field: "startDateFormatted", type: 'numericColumn', width: 150},
        {headerName: "End Date", field: "endDateFormatted", type: 'numericColumn', width: 150},
        {headerName: "Last Edited By", field: "lastChangePerson", width: 200},
        {headerName: "Last Edited Date", field: "lastChangeDate", width: 200}
    ];

    alertsGrid = new AGGrid('alertsGrid', alertsColumnDefs);

    alertsGrid.show();

    function searchAlerts() {
        const params = {
            alertDate: $$('ahra-date').getIntValue(),
            personFilter: $$('ahra-sentByCurrent').getValue()
        }

        AWS.callSoap(WS, 'searchAlerts', params).then(data => {
            alertsGrid.clear();
            $$('edit').disable();
            $$('delete').disable();
            if (data.wsStatus === "0") {
                data.alerts = Utils.assureArray(data.alerts);
                for (let i = 0; i < data.alerts.length; i++) {
                    data.alerts[i].startDateFormatted = data.alerts[i].startDate !== '0' ? DateUtils.intToStr4(Number(data.alerts[i].startDate)) : '';
                    data.alerts[i].endDateFormatted = data.alerts[i].endDate !== '0' ? DateUtils.intToStr4(Number(data.alerts[i].endDate)) : '';
                }
                alertsGrid.addRecords(data.alerts);     
                $$('alerts-label').setValue('Displaying ' + data.alerts.length + ' Alerts');
                alertsGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
                alertsGrid.setOnRowDoubleClicked(edit);
            }     
        });
    }
    $$('ahra-date').onChange(searchAlerts);
    $$('ahra-sentByCurrent').onChange(searchAlerts);


    let orgGroupGrid;
    const orgGroupColumnDefs = [
        {headerName: "Org Groups", field: "orgGroupName", width: 320}
    ];
    orgGroupGrid = new AGGrid('orgGroupGrid', orgGroupColumnDefs);
    orgGroupGrid.show();

    let availableEmployeesGrid;
    const availableEmployeesColumnDefs = [
        {headerName: "Available Employees", field: "employeeName", width: 200}
    ];
    availableEmployeesGrid = new AGGrid('availableEmployeesGrid', availableEmployeesColumnDefs);
    availableEmployeesGrid.multiSelect();
    availableEmployeesGrid.show();

    let selectedEmployeesGrid;
    const selectedEmployeesColumnDefs = [
        {headerName: "Selected Employees", field: "employeeName", width: 200}
    ];
    selectedEmployeesGrid = new AGGrid('selectedEmployeesGrid', selectedEmployeesColumnDefs);
    selectedEmployeesGrid.multiSelect();
    selectedEmployeesGrid.show();

    $$('add').onclick(() => {
        $('#employee-search').css('display', 'none');
        Utils.popup_set_height('alert-popup', '420px');

        $$('alert-label').setValue('Add');
        $$('ahra-alertType').setValue('1').enable();
        $$('ahra-message').clear();
        $$('ahra-startDate').clear();
        $$('ahra-endDate').clear();
        $$('ahra-selectEmployee').disable();
        $$('ahra-deselectEmployee').disable();
        $$('ahra-lastNameStartsWith').clear().enable();
        $$('ahra-orgGroupStartsWith').clear().enable();
        $$('ahra-up').hide().disable();
        $$('ahra-open').hide().disable();
        $$('ahra-orgGroupFilter').enable();
        $$('ahra-lastNameFilter').enable();
        orgGroupGrid.clear();
        availableEmployeesGrid.clear();
        selectedEmployeesGrid.clear();

        let openedOrgGroup = [''];

        function getListOrgGroupsAndEmployees(isOpen, id = '') {
            $$('ahra-open').disable();
            $$('ahra-selectEmployee').disable();
            $$('ahra-deselectEmployee').disable();
            const params = {
                employeeLastNameStartsWith: $$('ahra-lastNameStartsWith').getValue(),
                orgGroupId: id,
                orgGroupNameStartsWith: $$('ahra-orgGroupStartsWith').getValue(),
                upOneLevel: !isOpen ? openedOrgGroup[openedOrgGroup.length - 1] : ''
            }
            if (selectedEmployeesGrid.getAllRows().length > 0) {
                let employeeIds = [];
                const selectedEmployees = selectedEmployeesGrid.getAllRows();
                for (let i = 0; i < selectedEmployees.length; i++) {
                    employeeIds.push(selectedEmployees[i].employeeId);
                }
                params.employeeIds = employeeIds;
            }
            AWS.callSoap(WS, 'listOrgGroupsAndEmployees', params).then(data => {
                orgGroupGrid.clear();
                availableEmployeesGrid.clear();

                if (data.wsStatus === "0") {
                    data.orgGroup = Utils.assureArray(data.orgGroup);
                    data.employees = Utils.assureArray(data.employees);

                    orgGroupGrid.addRecords(data.orgGroup);     
                    availableEmployeesGrid.addRecords(data.employees);     

                    orgGroupGrid.setOnSelectionChanged(() => {
                        $$('ahra-open').enable();
                    });
                    orgGroupGrid.setOnRowDoubleClicked(open);

                    availableEmployeesGrid.setOnSelectionChanged(() => {
                        $$('ahra-selectEmployee').enable();
                    });
                    availableEmployeesGrid.setOnRowDoubleClicked(selectEmployee);

                    selectedEmployeesGrid.setOnSelectionChanged(() => {
                        $$('ahra-deselectEmployee').enable();
                    });
                    selectedEmployeesGrid.setOnRowDoubleClicked(deselectEmployee);
                }     
            });
        }

        function open() {
            getListOrgGroupsAndEmployees(true, orgGroupGrid.getSelectedRow().orgGroupId);
            openedOrgGroup.push(orgGroupGrid.getSelectedRow().orgGroupId);
            $$('ahra-up').enable();
        }

        $$('ahra-open').onclick(open);

        $$('ahra-orgGroupFilter').onclick(() => {
            getListOrgGroupsAndEmployees(true, openedOrgGroup[openedOrgGroup.length - 1]);
        });
        $$('ahra-lastNameFilter').onclick(() => {
            getListOrgGroupsAndEmployees(true, openedOrgGroup[openedOrgGroup.length - 1]);
        });

        $$('ahra-up').onclick(() => {
            if (openedOrgGroup[openedOrgGroup.length - 1] !== '') {
                openedOrgGroup.splice(-1);
                if (openedOrgGroup[openedOrgGroup.length - 1] === '') {
                    $$('ahra-up').disable();  
                }
            }
            getListOrgGroupsAndEmployees(false);
        });

        $$('ahra-alertType').onChange(() => {
            if ($$('ahra-alertType').getValue() === '1') {
                $('#employee-search').css('display', 'none');
                Utils.popup_set_height('alert-popup', '420px');
                $$('ahra-up').hide().disable();
                $$('ahra-open').hide().disable();
            } else {
                $('#employee-search').css('display', 'block');
                Utils.popup_set_height('alert-popup', '645px');
                $$('ahra-up').show();
                $$('ahra-open').show();
            }
            
        });

        function selectEmployee() {
            selectedEmployeesGrid.addRecords(availableEmployeesGrid.getSelectedRows());
            availableEmployeesGrid.deleteSelectedRows();
            $$('ahra-selectEmployee').disable();
        }
        function deselectEmployee() {
            availableEmployeesGrid.addRecords(selectedEmployeesGrid.getSelectedRows());
            selectedEmployeesGrid.deleteSelectedRows();
            $$('ahra-deselectEmployee').disable();
        }
        $$('ahra-selectEmployee').onclick(selectEmployee);
        $$('ahra-deselectEmployee').onclick(deselectEmployee);

        $$('ahra-ok').onclick(() => {
            if ($$('ahra-message').isError('Detail')) {
                return;
            }
            if ($$('ahra-startDate').isError('Start Date')) {
                return;
            }
            if ($$('ahra-endDate').isError('End Date')) {
                return;
            }
            if ($$('ahra-alertType').getValue() === '2' && selectedEmployeesGrid.getAllRows().length === 0) {
                Utils.showMessage('Error', 'At least one Employee must be selected');
                return;
            }
            const params = {
                alertType: $$('ahra-alertType').getValue(),
                endDate: $$('ahra-endDate').getIntValue(),
                message: $$('ahra-message').getValue(),
                startDate: $$('ahra-startDate').getIntValue()
            }
            if ($$('ahra-alertType').getValue() === '2') {
                let employeeIds = [];
                const selectedEmployees = selectedEmployeesGrid.getAllRows();
                for (let i = 0; i < selectedEmployees.length; i++) {
                    employeeIds.push(selectedEmployees[i].employeeId);
                }
                params.employeeIds = employeeIds;
            }
            AWS.callSoap(WS, 'newAlert', params).then(data => {
                if (data.wsStatus === "0") {
                    searchAlerts();
                    Utils.popup_close();
                }     
            });
        });
        $$('ahra-cancel').onclick(Utils.popup_close);
        getListOrgGroupsAndEmployees('');
        Utils.popup_open('alert-popup');
    });
    function edit() {
        $('#employee-search').css('display', 'none');
        Utils.popup_set_height('alert-popup', '420px');
        $$('alert-label').setValue('Edit');

        orgGroupGrid.clear();
        availableEmployeesGrid.clear();
        selectedEmployeesGrid.clear();
        $$('ahra-selectEmployee').disable();
        $$('ahra-deselectEmployee').disable();
        $$('ahra-lastNameStartsWith').clear().disable();
        $$('ahra-orgGroupStartsWith').clear().disable();
        $$('ahra-up').hide().disable();
        $$('ahra-open').hide().disable();
        $$('ahra-alertType').disable();
        $$('ahra-orgGroupFilter').disable();
        $$('ahra-lastNameFilter').disable();

        const row = alertsGrid.getSelectedRow();
        const params = {
            id: row.id
        }
        AWS.callSoap(WS, 'loadAlert', params).then(data => {
            if (data.wsStatus === "0") {               
                $$('ahra-alertType').setValue(data.alertType);
                $$('ahra-message').setValue(data.message);
                $$('ahra-startDate').setValue(Number(data.startDate));
                $$('ahra-endDate').setValue(Number(data.endDate));     
                
                if (data.alertType === '2') {
                    data.employeeIds = Utils.assureArray(data.employeeIds);
                    selectedEmployeesGrid.addRecords(data.employeeIds);
                    selectedEmployeesGrid.setOnRowDoubleClicked();
                    selectedEmployeesGrid.setOnSelectionChanged();
                    $('#employee-search').css('display', 'block');
                    Utils.popup_set_height('alert-popup', '645px');
                    $$('ahra-up').show();
                    $$('ahra-open').show();
                }
            }     
        });

        $$('ahra-ok').onclick(() => {
            if ($$('ahra-message').isError('Detail')) {
                return;
            }
            if ($$('ahra-startDate').isError('Start Date')) {
                return;
            }
            if ($$('ahra-endDate').isError('End Date')) {
                return;
            }
            const params = {
                alertType: $$('ahra-alertType').getValue(),
                endDate: $$('ahra-endDate').getIntValue(),
                message: $$('ahra-message').getValue(),
                startDate: $$('ahra-startDate').getIntValue(),
                id: row.id
            }
            AWS.callSoap(WS, 'saveAlert', params).then(data => {
                if (data.wsStatus === "0") {
                    searchAlerts();
                    Utils.popup_close();
                }     
            });
        });
        $$('ahra-cancel').onclick(Utils.popup_close);
        Utils.popup_open('alert-popup');
    }
    $$('edit').onclick(edit);
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Alert?', () => {
            const row = alertsGrid.getSelectedRow();
            const data = {
                ids: row.id
            };
            AWS.callSoap(WS, 'deleteAlerts', data).then(function (res) {
                if (res.wsStatus === "0") {
                    searchAlerts();
                }
            });
        });
    });
    searchAlerts();
})();

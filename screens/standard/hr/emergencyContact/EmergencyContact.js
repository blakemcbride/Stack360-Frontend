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

    const WS = 'StandardHrEmergencyContact';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        { headerName: 'Name', field: 'contactName', width: 50 },
        { headerName: 'Relationship', field: 'relationship' },
        { headerName: 'Home Phone', field: 'homePhone', width: 50 },
        { headerName: 'Work Phone', field: 'workPhone', width: 50 },
        { headerName: 'Cell Phone', field: 'cellPhone', width: 50 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'contactId');

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

        AWS.callSoap(WS, 'listEmergencyContacts', data).then(ret => {
            if (ret.wsStatus === '0') {
                const records = Utils.assureArray(ret.item);
                
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} Emergency Contact${records.length > 1 ? 's' : ''}`);

                $$('edit').disable();
                $$('delete').disable();
            }
        });
    }

    updateGrid();


    $$('ep-relationship').onChange(relation => {
        if (relation === 'Other') {
            $$('ep-other').enable();
        } else {
            $$('ep-other').disable();
        }
    });

    const addEmergency = () => {
        $$('ep-title').setValue(`Add Emergency Contact`);
        $$('ep-name').clear();
        $$('ep-home-phone').clear();
        $$('ep-work-phone').setValue('');
        $$('ep-cell-phone').clear();
        $$('ep-relationship').setValue('');
        $$('ep-address').clear();
        $$('ep-other').disable();
        $$('ep-other').clear();
        Utils.popup_open('emergency-popup', 'ep-name');

        $$('pp-ok').onclick(() => {
            if ($$('ep-name').isError('Full Name'))
                    return;

            let relationship = $$('ep-relationship').getValue();
            if (relationship === 'Other') {
                relationship = $$('ep-other').getValue();
            }
                
            const data = {
                contactName: $$('ep-name').getValue(),
                homePhone: $$('ep-home-phone').getValue(),
                workPhone: $$('ep-work-phone').getValue(),
                cellPhone: $$('ep-cell-phone').getValue(),
                relationship: relationship,
                address: $$('ep-address').getValue(),
                personId: personId
            };
            AWS.callSoap(WS, 'newEmergencyContact', data).then(ret => {
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

    const editEmergency = () => {
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }
        $$('ep-title').setValue(`Edit Emergency Contact`);
        AWS.callSoap(WS, 'loadEmergencyContact', {
            contactId: row.contactId
        }).then(res => {
            $$('ep-name').setValue(res.contactName);
            $$('ep-home-phone').setValue(res.homePhone);
            $$('ep-work-phone').setValue(res.workPhone);
            $$('ep-cell-phone').setValue(res.cellPhone);
            if (res.relationship !== ''
                && res.relationship !== 'Spouse' 
                && res.relationship !== 'Child' 
                && res.relationship !== 'Sibling'
                && res.relationship !== 'Parent') 
            {
                $$('ep-relationship').setValue('Other');
                $$('ep-other').enable();
                $$('ep-other').setValue(res.relationship);
            } else {
                $$('ep-relationship').setValue(res.relationship);
            }
            $$('ep-address').setValue(res.address);
        });
        Utils.popup_open('emergency-popup', 'ep-name');

        $$('pp-ok').onclick(() => {
            if ($$('ep-name').isError('Full Name'))
                    return;

            let relationship = $$('ep-relationship').getValue();
            if (relationship === 'Other') {
                relationship = $$('ep-other').getValue();
            }
                
            const data = {
                contactId: row.contactId,
                contactName: $$('ep-name').getValue(),
                homePhone: $$('ep-home-phone').getValue(),
                workPhone: $$('ep-work-phone').getValue(),
                cellPhone: $$('ep-cell-phone').getValue(),
                relationship: relationship,
                address: $$('ep-address').getValue(),
                personId: personId
            };
            AWS.callSoap(WS, 'saveEmergencyContact', data).then(ret => {
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

    $$('add').onclick(addEmergency);

    $$('edit').onclick(editEmergency);
    grid.setOnRowDoubleClicked(editEmergency);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Emergency Contact?', () => {
            const data = {
                contactIds: [grid.getSelectedRow().contactId]
            };
            
            AWS.callSoap(WS, "deleteEmergencyContacts", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            employeeId: personId
        };

        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
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

    const WS = 'StandardHrReference';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        { headerName: 'Name', field: 'referenceName', width: 50 },
        { headerName: 'Relationship', field: 'relationship' },
        { headerName: 'Company', field: 'companyName', width: 50 },
        { headerName: 'Phone', field: 'phone', width: 50 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'referenceId');

    grid.show();
    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function formatRelationship(relationship) {
        if (relationship === "C") {
            return "Co-worker";
        } else if (relationship === "R") {
            return "Relative";
        } else if (relationship === "F") {
            return "Friend";
        } else if (relationship === "T") {
            return "School Teacher";
        } else if (relationship === "S") {
            return "Supervisor";
        } else {
            return relationship;
        }
    }

    function updateGrid() {

        grid.clear();

        const data = {
            employeeId: personId
        };

        AWS.callSoap(WS, 'listReferences', data).then(ret => {
            if (ret.wsStatus === '0') {
                const records = Utils.assureArray(ret.item);
                for (let i = 0; i < records.length; i ++) {
                    records[i].relationship = formatRelationship(records[i].relationship);
                }
                
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} Reference${records.length > 1 ? 's' : ''}`);

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

    const addReference = () => {
        $$('ep-title').setValue(`Add Reference`);
        $$('ep-name').clear();
        $$('ep-company').clear();
        $$('ep-phone').setValue('');
        $$('ep-years').setValue('0');
        $$('ep-relationship').setValue('');
        $$('ep-address').clear();
        $$('ep-other').disable();
        $$('ep-other').clear();
        Utils.popup_open('reference-popup', 'ep-name');

        $$('pp-ok').onclick(() => {
            if ($$('ep-name').isError('Name'))
                return;

            if ($$('ep-relationship').isError('Relationship'))
                return;

            let relationship = $$('ep-relationship').getValue();
            if (relationship === 'Other') {
                relationship = $$('ep-other').getValue();
            }
                
            const data = {
                referenceName: $$('ep-name').getValue(),
                relationship: relationship,
                companyName: $$('ep-company').getValue(),
                address: $$('ep-address').getValue(),
                phone: $$('ep-phone').getValue(),
                yearsKnown: $$('ep-years').getValue(),
                personId: personId
            };
            AWS.callSoap(WS, 'newReference', data).then(ret => {
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

    const editReference = () => {
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }
        $$('ep-title').setValue(`Edit Reference`);
        AWS.callSoap(WS, 'loadReference', {
            referenceId: row.referenceId
        }).then(res => {
            $$('ep-name').setValue(res.referenceName);
            $$('ep-company').setValue(res.companyName);
            $$('ep-phone').setValue(res.phone);
            if (res.relationship !== ''
                && res.relationship !== 'S' 
                && res.relationship !== 'C' 
                && res.relationship !== 'R'
                && res.relationship !== 'F'
                && res.relationship !== 'T') 
            {
                $$('ep-relationship').setValue('Other');
                $$('ep-other').enable();
                $$('ep-other').setValue(res.relationship);
            } else {
                $$('ep-relationship').setValue(res.relationship);
            }
            $$('ep-address').setValue(res.address);
            $$('ep-years').setValue(res.yearsKnown);
        });
        Utils.popup_open('reference-popup', 'ep-name');

        $$('pp-ok').onclick(() => {
            if ($$('ep-name').isError('Name'))
                return;

            if ($$('ep-relationship').isError('Relationship'))
                return;

            let relationship = $$('ep-relationship').getValue();
            if (relationship === 'Other') {
                relationship = $$('ep-other').getValue();
            }
                
            const data = {
                referenceId: row.referenceId,
                referenceName: $$('ep-name').getValue(),
                relationship: relationship,
                companyName: $$('ep-company').getValue(),
                address: $$('ep-address').getValue(),
                phone: $$('ep-phone').getValue(),
                yearsKnown: $$('ep-years').getValue(),
                personId: personId
            };
            AWS.callSoap(WS, 'saveReference', data).then(ret => {
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

    $$('add').onclick(addReference);

    $$('edit').onclick(editReference);
    grid.setOnRowDoubleClicked(editReference);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Reference?', () => {
            const data = {
                ids: [grid.getSelectedRow().referenceId]
            };
            
            AWS.callSoap(WS, "deleteReferences", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

})();

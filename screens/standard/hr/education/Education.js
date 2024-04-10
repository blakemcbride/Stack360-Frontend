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

    const WS = 'StandardHrEducation';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        { headerName: 'Enrollment Period', field: 'enrollmentPeriod' },
        { headerName: 'School', field: 'schoolName' },
        { headerName: 'Type', field: 'schoolType' },
        { headerName: 'Graduate', field: 'graduate', width: 50 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'educationId');

    grid.show();

    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function formatSchoolType(schoolType) {
        switch (schoolType) {
            case 'H':
                return 'High School';
            case 'U':
                return 'College Undergraduate';
            case 'G':
                return 'College Graduate';
            case 'T':
                return 'Tech / Trade School';
            case 'C':
                return 'Certificate';
            default:
                return schoolType;
        }
    }

    function updateGrid() {
        grid.clear();
        const data = {
            employeeId: personId
        };

        AWS.callSoap(WS, 'listEducation', data).then(ret => {
            if (ret.wsStatus === '0') {
                const records = Utils.assureArray(ret.item);
                for (let i = 0; i < records.length; i ++) {
                    records[i].schoolType = formatSchoolType(records[i].schoolType);
                    records[i].graduate = records[i].graduate === 'Y' ? 'Yes' : 'No';
                }
                
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} School${records.length > 1 ? 's' : ''}`);

                $$('edit').disable();
                $$('delete').disable();
            }
        });
    }

    updateGrid();

    function setOther() {
        const ctl = $$('ep-type');
        if (ctl.getValue() === 'O')
            $$('ep-other').enable();
        else
            $$('ep-other').disable();
    }

    $$('ep-type').onChange(setOther);

    const addEducation = () => {
        $$('ep-title').setValue('Add School');
        $$('ep-school').clear();
        $$('ep-type').clear();
        $$('ep-other').clear();
        $$('ep-location').clear();
        $$('ep-from-month').setValue('');
        $$('ep-from-year').setValue('');
        $$('ep-to-month').setValue('');
        $$('ep-to-year').setValue('');
        $$('ep-other').disable();
        $$('ep-other').clear();
        $$('ep-major').clear();
        $$('ep-graduate').setValue(false);
        setOther();
        Utils.popup_open('education-popup', 'ep-school');

        $$('pp-ok').onclick(() => {
            if ($$('ep-school').isError('School Name'))
                return;

            if ($$('ep-type').isError('School Type'))
                return;

            if ($$('ep-location').isError('School Location'))
                return;

            const data = {
                schoolName: $$('ep-school').getValue(),
                schoolType: $$('ep-type').getValue(),
                otherType: $$('ep-other').getValue(),
                schoolLocation: $$('ep-location').getValue(),
                enrollmentFromMonth: $$('ep-from-month').getValue(),
                enrollmentFromYear: $$('ep-from-year').getValue(),
                enrollmentToMonth: $$('ep-to-month').getValue(),
                enrollmentToYear: $$('ep-to-year').getValue(),
                graduate: $$('ep-graduate').getValue(),
                subject: $$('ep-major').getValue(),
                personId: personId
            };
            AWS.callSoap(WS, 'newEducation', data).then(ret => {
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

    const editEducation = () => {
        const row = grid.getSelectedRow();
        $$('ep-title').setValue('Edit School');
        AWS.callSoap(WS, 'loadEducation', {
            educationId: row.educationId
        }).then(res => {
            $$('ep-school').setValue(res.schoolName);
            $$('ep-major').setValue(res.subject);
            $$('ep-location').setValue(res.schoolLocation);
            $$('ep-from-month').setValue(res.enrollmentFromMonth > 0 ? res.enrollmentFromMonth : '');
            $$('ep-from-year').setValue(res.enrollmentFromYear > 0 ? res.enrollmentFromYear : '');
            $$('ep-to-month').setValue(res.enrollmentToMonth > 0 ? res.enrollmentToMonth : '');
            $$('ep-to-year').setValue(res.enrollmentToYear > 0 ? res.enrollmentToYear : '');
            $$('ep-graduate').setValue(res.graduate);
            $$('ep-type').setValue(res.schoolType);
            $$('ep-other').setValue(res.otherType);
            setOther();

            Utils.popup_open('education-popup', 'ep-school');

            $$('pp-ok').onclick(() => {
                if ($$('ep-school').isError('School Name'))
                    return;

                if ($$('ep-type').isError('School Type'))
                    return;

                if ($$('ep-location').isError('School Location'))
                    return;

                const data = {
                    educationId: row.educationId,
                    schoolName: $$('ep-school').getValue(),
                    schoolType: $$('ep-type').getValue(),
                    otherType: $$('ep-other').getValue(),
                    schoolLocation: $$('ep-location').getValue(),
                    enrollmentFromMonth: $$('ep-from-month').getValue(),
                    enrollmentFromYear: $$('ep-from-year').getValue(),
                    enrollmentToMonth: $$('ep-to-month').getValue(),
                    enrollmentToYear: $$('ep-to-year').getValue(),
                    graduate: $$('ep-graduate').getValue(),
                    subject: $$('ep-major').getValue(),
                    personId: personId
                };

                AWS.callSoap(WS, 'saveEducation', data).then(ret => {
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

    $$('add').onclick(addEducation);

    $$('edit').onclick(editEducation);
    grid.setOnRowDoubleClicked(editEducation);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected School?', () => {
            const data = {
                ids: [grid.getSelectedRow().educationId]
            };
            
            AWS.callSoap(WS, "deleteEducation", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

})();

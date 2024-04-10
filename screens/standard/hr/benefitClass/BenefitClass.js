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

    const WS = 'StandardHrBenefitClass';

    const columnDefs = [
        {headerName: 'Benefit Class', field: 'name', width: 70  },
        {headerName: 'First Active', field: 'firstActiveDate2', type: 'numericColumn', width: 15 },
        {headerName: 'Last Active', field: 'lastActiveDate2', type: 'numericColumn', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateGrid() {
        grid.clear();
        $$('associations').disable();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "listBenefitClasses", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.firstActiveDate2 = row.firstActiveDate !== '0' ? DateUtils.intToStr4(Number(row.firstActiveDate)) : '';
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Benefit Class');
            }
        });
    }

    updateGrid();

    $$('show').onChange(updateGrid);

    grid.setOnSelectionChanged((rows) => {
        $$('associations').enable(rows);
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Benefit Class');
        $$('dp-name').clear();
        $$('dp-first-active').clear();
        $$('dp-last-active').clear();
        Utils.popup_open('detail-popup', 'dp-name');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            const data = {
                name: $$('dp-name').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "newBenefitClass", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = grid.getSelectedRow();
        $$('dp-title').setValue('Edit Benefit Class');
        $$('dp-name').setValue(row.name);
        if (row.firstActiveDate) {
            $$('dp-first-active').setValue(Number(row.firstActiveDate));
        }
        if (row.lastActiveDate) {
            $$('dp-last-active').setValue(Number(row.lastActiveDate));
        }
        Utils.popup_open('detail-popup', 'dp-name');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            const data = {
                id: row.id,
                name: $$('dp-name').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "saveBenefitClass", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Benefit Class?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteBenefitClasses", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    /////////////////////////////////////////////////////////////////////////////////
    // benefit association popup
    /////////////////////////////////////////////////////////////////////////////////
    const benefitAssociatePopup = async (classId, excluded) => {

        Utils.popup_open('benefit-association-popup');

        return new Promise(function (resolve, reject) {

            let benefitsGrid = null;

            benefitsGrid = new AGGrid('benefitAssociateGrid', [{headerName: 'Benefit', field: 'benefitName'}], 'id');
            benefitsGrid.show();  

            AWS.callSoap(WS, "listAvailableBenefits", { excludedIdsArray: excluded }).then( function (res) {
                if (res.wsStatus === '0') {
                    benefitsGrid.clear();
                    $$('bap-ok').disable();

                    res.item = Utils.assureArray(res.item);
                    benefitsGrid.addRecords(res.item);
                }
            });          

            let ok = () => {                
                let row = benefitsGrid.getSelectedRow();
                AWS.callSoap(WS, "associateBenefits", { idsArray: row.data.benefitId, classId: classId }).then( function (res) {
                    if (res.wsStatus === '0') {
                        Utils.popup_close();
                        resolve(null);
                    }
                });
                
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            benefitsGrid.setOnSelectionChanged($$('bap-ok').enable);
            benefitsGrid.setOnRowDoubleClicked(ok);

            $$('bap-ok').onclick(ok);
            $$('bap-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // coverage association popup
    /////////////////////////////////////////////////////////////////////////////////
    const coverageAssociatePopup = async (classId, excluded) => {

        Utils.popup_open('coverage-association-popup');

        return new Promise(function (resolve, reject) {

            let configGrid = null;

            configGrid = new AGGrid('coverageAssociateGrid', [
                {headerName: 'Coverage Type', field: 'configName'},
                {headerName: 'Coverage', field: 'coverage'}
            ], 'id');
            configGrid.show();  

            AWS.callSoap(WS, "listAvailableBenefits").then( function (res) {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    $$('cap-benefit').clear().addItems(res.item, 'benefitId', 'benefitName');
                }
            });

            $$('cap-benefit').onChange(() => {
                let id = $$('cap-benefit').getValue();
                AWS.callSoap(WS, "listAvailableConfigs", { excludedIdsArray: excluded, benefitId: id }).then( function (res) {
                    if (res.wsStatus === '0') {
                        $$('cap-ok').disable();
                        configGrid.clear();

                        res.item = Utils.assureArray(res.item);
                        configGrid.addRecords(res.item);                        
                    }
                });
            })

            let ok = () => {                
                let row = configGrid.getSelectedRow();
                AWS.callSoap(WS, "associateConfigs", { idsArray: row.data.configId, classId: classId }).then( function (res) {
                    if (res.wsStatus === '0') {
                        Utils.popup_close();
                        resolve(null);
                    }
                });                
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            configGrid.setOnSelectionChanged($$('cap-ok').enable);
            configGrid.setOnRowDoubleClicked(ok);

            $$('cap-ok').onclick(ok);
            $$('cap-cancel').onclick(cancel);

        });
    };

    $$('associations').onclick(() => {

        let row = grid.getSelectedRow();
        let benefitGrid = null, coverageGrid = null;

        Utils.popup_open('association-popup');

        $$('ap-name').setValue(row.name);

        benefitGrid = new AGGrid('benefitGrid', [
            {headerName: 'Benefit', field: 'benefitName'},
        ], 'benefitId');
        benefitGrid.show();

        coverageGrid = new AGGrid('coverageGrid', [
            {headerName: 'Benefit', field: 'benefitName'},
            {headerName: 'Coverage', field: 'configName'},
        ], 'configId');
        coverageGrid.show();

        async function updateBenefitGrid() {
            $$('benefit-disassociate').disable();

            let res = await AWS.callSoap(WS, "listAssociatedBenefits", { classId: row.id });
            res.item = Utils.assureArray(res.item);
            benefitGrid.clear().addRecords(res.item);
        }

        async function updateCoverageGrid() {
            $$('coverage-disassociate').disable();

            let res = await AWS.callSoap(WS, "listAssociatedConfigs", { classId: row.id });
            res.item = Utils.assureArray(res.item);
            coverageGrid.clear().addRecords(res.item);
        }

        updateBenefitGrid();
        updateCoverageGrid();

        benefitGrid.setOnSelectionChanged($$('benefit-disassociate').enable);
        coverageGrid.setOnSelectionChanged($$('coverage-disassociate').enable);

        $$('benefit-associate').onclick(async () => {
            let excluded =  benefitGrid.getAllRows().map( row => row.benefitId );
            await benefitAssociatePopup(row.id, excluded);
            updateBenefitGrid();
        });

        $$('benefit-disassociate').onclick(async () => {
            let selectedBenefit = benefitGrid.getSelectedRow();

            AWS.callSoap(WS, "disassociateBenefits", { idsArray: selectedBenefit.benefitId, classId: row.id }).then( function (res) {
                if (res.wsStatus === '0') {
                    updateBenefitGrid();
                }
            });
        });

        $$('coverage-associate').onclick(async () => {
            let excluded =  coverageGrid.getAllRows().map( row => row.configId );
            await coverageAssociatePopup(row.id, excluded);
            updateCoverageGrid();
        });

        $$('coverage-disassociate').onclick(async () => {
            let selectedBenefit = coverageGrid.getSelectedRow();

            AWS.callSoap(WS, "disassociateConfigs", { idsArray: selectedBenefit.configId, classId: row.id }).then( function (res) {
                if (res.wsStatus === '0') {
                    updateCoverageGrid();
                }
            });
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });

    });

})();

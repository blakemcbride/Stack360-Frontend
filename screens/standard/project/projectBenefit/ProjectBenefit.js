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

    const WS = 'StandardProjectProjectBenefit';
    
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    const columnDefs = [
        {headerName: 'Category', field: 'categoryName', width: 30  },
        {headerName: 'Benefit', field: 'benefitName', width: 30  },
        {headerName: 'Coverage Configuration', field: 'configName', width: 60  },
    ];
    const grid = new AGGrid('grid', columnDefs, 'configId');
    grid.show();
    grid.clear();

    grid.setOnSelectionChanged($$('disassociate').enable);

    const coverageColumns = [
        {headerName: 'Coverage Configuration', field: 'configName'}
    ];
    const coverageGrid = new AGGrid('coverage-grid', coverageColumns, 'configId');
    coverageGrid.show();
    coverageGrid.clear();

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== '0') {
            return;
        }
    });
        
    const updateGrid = () => {
        const data = {
            projectId: projectId
        };

        AWS.callSoap(WS, 'listAssociatedBenefitConfigs', data).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                grid.clear();
                grid.addRecords(res.item);
                Utils.setText('status', `Displaying ${res.item.length} Associated Benefit`);
            }
        });

        $$('disassociate').disable();
    }

    updateGrid();

    const associatePopup = () => {

        Utils.popup_open('associate-popup');

        $$('ap-ok').disable();
        $$('ap-category').clear();
        $$('ap-benefit').clear();
        $$('ap-benefit').disable();
        coverageGrid.clear();

        AWS.callSoap(WS, 'listBenefitCategories').then(res => {
            if (res.wsStatus === '0') {
                if (res.item) {
                    res.item = Utils.assureArray(res.item);
                    $$('ap-category').add('', '(select)').addItems(res.item, 'categoryId', 'categoryName');
                }
            }
        });

        $$('ap-category').onChange(() => {
            const categoryId = $$('ap-category').getValue();
            coverageGrid.clear();
            $$('ap-benefit').clear();
            if (categoryId !== '') {
                AWS.callSoap(WS, 'listBenefits', {
                    categoryId: categoryId
                }).then(res => {
                    if (res.wsStatus === '0') {
                        if (res.item) {
                            $$('ap-benefit').enable();
                            res.item = Utils.assureArray(res.item);
                            $$('ap-benefit').add('', '(select)').addItems(res.item, 'benefitId', 'benefitName');
                        } else {
                            $$('ap-ok').disable();
                            $$('ap-benefit').disable();            
                        }
                    }
                })
            } else {
                $$('ap-ok').disable();
                $$('ap-benefit').disable();
            }
        });

        $$('ap-benefit').onChange(() => {
            const benefitId = $$('ap-benefit').getValue();
            coverageGrid.clear();
            $$('ap-ok').disable();
            if (benefitId !== '') {
                AWS.callSoap(WS, 'listAvailableBenefitConfigs', {
                    projectId: projectId,
                    benefitId: benefitId
                }).then(res => {
                    if (res.wsStatus === '0') {
                        if (res.item) {
                            res.item = Utils.assureArray(res.item);
                            coverageGrid.addRecords(res.item);
                        }
                    }
                });
            }
        });

        coverageGrid.setOnSelectionChanged($$('ap-ok').enable);

        $$('ap-ok').onclick(() => {
            const row = coverageGrid.getSelectedRow();
            if (!row) {
                return;
            }

            AWS.callSoap(WS, 'associateBenefitConfigs', {
                configIds: row.configId,
                projectId: projectId
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            })

            Utils.popup_close();
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    };

    $$('associate').onclick(associatePopup);

    const disAssociate = () => {
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }

        Utils.yesNo('Confirmation', 'Are you sure you want to disassociate the selected Associated Benefit?', () => {
            AWS.callSoap(WS, 'dissassociateBenefitConfigs', {
                configIds: row.configId,
                projectId: projectId
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    }

    $$('disassociate').onclick(disAssociate);

    grid.setOnRowDoubleClicked(disAssociate);
})();

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

    const WS = 'StandardProjectRouteStopCheckListDetail';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    const checkListColumns = [
        { headerName: 'Required', field: 'required', width: 20 },
        { headerName: 'Completed', field: 'completedDateFormat', width: 30 },
        { headerName: 'Summary', field: 'description' },
    ];

    const checkListGrid = new AGGrid('check-list-grid', checkListColumns, 'checkListId');
    checkListGrid.show();
    checkListGrid.setOnSelectionChanged($$('detail-edit').enable);
    checkListGrid.setOnRowDoubleClicked(editCheckList);

    const rights = await AWS.callSoap(WS, 'checkRight');
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('company-list').enable(rights.accessLevel === '2');
    $$('decision-point').enable(rights.accessLevel === '2');
    $$('detail-edit').show(rights.accessLevel === '2');
    checkListGrid.enable(rights.accessLevel === '2');

    const request = {
        projectId: projectId
    };

    await AWS.callSoap(WS, "listCompanyAndOrgGroupsForProject", request).then(res => {
        if (res.wsStatus === '0') {
            let companyList = $$('company-list');
            companyList.clear();

            companyList.add("", "(select)");

            // Add the categories to the drop down control.
            res.item = Utils.assureArray(res.item);
            if (res.item) {
                res.item.forEach(company => {
                    companyList.add(company.companyId + company.orgGroupId, company.nameFormatted, company);
                });
            }

            if (res.item.length > 0) {
                companyList.selectIndex(1);
                changeCompanySelection();
            }

        }
    });

    $$('company-list').onChange(changeCompanySelection);

    function changeCompanySelection() {
        let currentCompany = $$('company-list').getData();
        if (!currentCompany) {
            let decisionPoints = $$('decision-point');
            decisionPoints.clear();
            checkListGrid.clear();

            decisionPoints.add("", "(select)");
            decisionPoints.disable();
            $$('detail-edit').disable();
            $$('detail-report').disable();
            return;
        }

        const data = {
            projectId: projectId,
            companyId: currentCompany.companyId,
            orgGroupId: currentCompany.orgGroupId
        };
        AWS.callSoap(WS, "listRouteStopsForProject", data).then(res => {
            if (res.wsStatus === '0') {
                let decisionPoints = $$('decision-point');
                decisionPoints.clear();
                checkListGrid.clear();
    
                decisionPoints.add("", "(select)");
    
                // Add the categories to the drop down control.
                res.item = Utils.assureArray(res.item);
                if (res.item) {
                    res.item.forEach(decision => {
                        decisionPoints.add(decision.routeStopId, decision.routeStopNameFormatted, decision);
                    });
                }
    
                if (res.item.length === 1) {
                    // decisionPoints.setValue(res.currentRouteStopId);
                    decisionPoints.selectIndex(1);
                    decisionPoints.disable();
                    changeDecisionPoint();
                } else {
                    decisionPoints.enable(rights.accessLevel === '2');
                    $$('detail-report').disable();
                }
            }
        });
    }

    $$('decision-point').onChange(changeDecisionPoint);

    function changeDecisionPoint() {
        let currentDecision = $$('decision-point').getData();
        if (!currentDecision) {
            checkListGrid.clear();
            $$('detail-report').disable();
            $$('detail-edit').disable();
            return;
        }

        const data = {
            projectId: projectId,
            routeStopId: currentDecision.routeStopId,
        };
        $$('detail-report').enable(rights.accessLevel === '2');
        AWS.callSoap(WS, "listCheckListDetailsForRouteStop", data).then(res => {
            if (res.wsStatus === '0') {

                // Add the categories to the drop down control.
                checkListGrid.clear();
                $$('detail-edit').disable();

                res.item = Utils.assureArray(res.item);
                if (res.item) {
                    for (let i = 0; i < res.item.length; i ++) {
                        res.item[i].completedDateFormat = DateUtils.intToStr4(res.item[i].completedDate);
                    }
                }
                checkListGrid.addRecords(res.item);

                if (res.item.length < Utils.toNumber(res.cap))
                    $$('check-list-status').setColor('black').setValue('Displaying ' + res.item.length + ' Check List Details');
                else
                    $$('check-list-status').setColor('red').setValue('Displaying ' + res.item.length + ' Check List Details (limit)');
            }
        });
    }

    const checkListPopup = (row) => {

        let resetDialog = () => {
            $$('dp-summary').setValue('');
            $$('dp-required').setValue('');
            $$('dp-comments').setValue('');
            $$('dp-detail').setValue('');
            $$('dp-completed-by').setValue('');
            $$('dp-completed-date').setValue('');
            $$('dp-entered-by').setValue('');
            $$('dp-entered-date').setValue('');
        };

        let initDialog = async () => {

            resetDialog();

            $$('dp-summary').setValue(row.description);
            $$('dp-required').setValue(row.required);

            if (row.checkListDetailId) {
                $$('dp-title').setValue('Edit Check List Detail');
            } else {
                $$('dp-title').setValue('Add Check List Detail');
            }

            const request = {
                checkListId: row.checkListId,
                checkListDetailId: row.checkListDetailId
            };

            AWS.callSoap(WS, 'loadCheckListDetail', request).then(res => {
                if (res.wsStatus === '0') {
                    $$('dp-comments').setValue(res.comments);
                    $$('dp-detail').setValue(res.detail);
                    $$('dp-completed-by').setValue(res.completedName);
                    $$('dp-completed-date').setValue(res.entryDateTimeFormatted ? res.entryDateTimeFormatted.slice(0, 10) : '');
                    $$('dp-entered-by').setValue(res.entryNameFormatted);
                    $$('dp-entered-date').setValue(res.entryDateTimeFormatted);
                }
            });
        };

        initDialog();

        Utils.popup_open('check-list-popup');

        return new Promise(async function (resolve, reject) {
            let ok = async() => {
                let completedBy = $$('dp-completed-by').getValue();
                let completedDate = $$('dp-completed-date').getIntValue();
                let comments = $$('dp-comments').getValue();
                if (completedBy || completedDate || comments) {
                    if($$('dp-completed-by').isError('Completed By'))
                        return;
                    if($$('dp-completed-date').isError('Completed Date'))
                        return;

                    if (row.checkListDetailId) {
                        const data = {
                            checkListDetailId: row.checkListDetailId,
                            comments: comments,
                            completedDate: completedDate,
                            completedName: completedBy,
                        };
                        resolve(data);
                        Utils.popup_close();
                    } else {
                        const data = {
                            checkListId: row.checkListId,
                            comments: comments,
                            completedDate: completedDate,
                            completedName: completedBy,
                            projectId: projectId
                        };
                        resolve(data);
                        Utils.popup_close();
                    }
                } else {
                    const data = {
                        delete: true
                    };
                    resolve(data);
                    Utils.popup_close();
                }
            };

            let cancel = () => {
                const data = {
                    cancel: true
                };
                resolve(data);
                Utils.popup_close();
            };

            $$('dp-ok').onclick(ok);
            $$('dp-cancel').onclick(cancel);
        });

    };

    $$('dp-auto-complete').onclick(() => {
        $$('dp-completed-by').setValue(`${AWS.lname}, ${AWS.fname}`);
        $$('dp-completed-date').setValue(DateUtils.today());
        $$('dp-comments').focus();
    });

    $$('detail-edit').onclick(editCheckList);

    function updateGrid() {
        let currentDecision = $$('decision-point').getData();
        if (!currentDecision) {
            return;
        }

        const data = {
            projectId: projectId,
            routeStopId: currentDecision.routeStopId,
        };
        $$('detail-report').enable(rights.accessLevel === '2');
        AWS.callSoap(WS, "listCheckListDetailsForRouteStop", data).then(res => {
            if (res.wsStatus === '0') {

                // Add the categories to the drop down control.
                checkListGrid.clear();
                $$('detail-edit').disable();

                res.item = Utils.assureArray(res.item);
                if (res.item) {
                    for (let i = 0; i < res.item.length; i ++) {
                        res.item[i].completedDateFormat = DateUtils.intToStr4(res.item[i].completedDate);
                    }
                }
                checkListGrid.addRecords(res.item);

                if (res.item.length < Utils.toNumber(res.cap))
                    $$('check-list-status').setColor('black').setValue('Displaying ' + res.item.length + ' Check List Details');
                else
                    $$('check-list-status').setColor('red').setValue('Displaying ' + res.item.length + ' Check List Details (limit)');
            }
        });
    }

    async function editCheckList() {
        let row = checkListGrid.getSelectedRow();

        if (!row) {
            return;
        }

        let data = await checkListPopup(row);

        if (data.cancel) {
            return;
        }

        if (row.checkListDetailId) {
            if (data.delete) {
                const request = {
                    checkListDetailIds: row.checkListDetailId
                };
                AWS.callSoap(WS, 'deleteCheckListDetail', request).then(res => {
                    if (res.wsStatus === '0') {
                        updateGrid();
                        return;
                    }
                });
            } else {
                AWS.callSoap(WS, 'saveCheckListDetail', data).then(res => {
                    if (res.wsStatus === '0') {
                        updateGrid();
                        return;
                    }
                });
            }
        } else {
            if (data) {
                AWS.callSoap(WS, 'newCheckListDetail', data).then(res => {
                    if (res.wsStatus === '0') {
                        updateGrid();
                        return;
                    }
                });
            } else {
                return;
            }
        }

    };

    $$('detail-report').onclick(() => {
        let currentDecision = $$('decision-point').getData();
        if (!currentDecision) {
            return;
        }

        const data = {
            projectId: projectId,
            routeStopId: currentDecision.routeStopId,
        };

        AWS.callSoap(WS, 'getReport', data).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    });
    
})();

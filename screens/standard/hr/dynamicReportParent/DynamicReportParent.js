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
    const WS = 'StandardHrDynamicReportParent';

    let reportsGrid;

    const reportsColumnDefs = [
        {headerName: "Name", field: "name", width: 150},
        {headerName: "Type", field: "reportTypeFormatted", width: 200},
        {headerName: "Description", field: "description", width: 600}
    ];

    reportsGrid = new AGGrid('reportsGrid', reportsColumnDefs);
    reportsGrid.show();

    function edit(reportId = null, reportName = null) {
        if (reportId != null) {
            Utils.saveData('CURRENT_REPORT_ID', reportsGrid.getSelectedRow().reportId);
            Utils.saveData('CURRENT_REPORT_NAME', reportsGrid.getSelectedRow().name);
        } else {
            Utils.saveData('CURRENT_REPORT_ID', reportId);
            Utils.saveData('CURRENT_REPORT_NAME', reportName);
        }   
        Framework.getChild();
    }

    bindToEnum('drp-reportName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    $$('drp-reportName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);

    function getReportTypeFormatted(reportType) {
        switch (reportType) {
            case "1":
                return "Benefit Enrollment";
            
            case "2":
                return "Employee List";

            default:
                return "";
        }
    }

    function searchDynamicReports() {
        const params = {
            reportName: $$('drp-reportName').getValue(),
            reportNameSearchType: $$('drp-reportName-criteria').getValue(),
            reportType: $$('drp-reportType').getValue(),
        };
        
        AWS.callSoap(WS, 'searchDynamicReports', params).then(data => {
            if (data.wsStatus === '0') {
                reportsGrid.clear();

                data.item = Utils.assureArray(data.item);

                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].reportTypeFormatted = getReportTypeFormatted(data.item[i].reportType);
                }
                reportsGrid.addRecords(data.item);

                $$('drp-reportsCount').setValue('Displaying ' + data.item.length + ' Dynamic Reports');

                reportsGrid.setOnRowDoubleClicked(edit);
                reportsGrid.setOnSelectionChanged((x) => {
                    $$('report').enable(x);
                    $$('export').enable(x);
                    $$('clone').enable(x);
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
            }
        });      
    }

    $$('search').onclick(searchDynamicReports);

    $$('edit').onclick(edit);


    $$('report').onclick(() => {
        const params = {
            dynamicReportId: reportsGrid.getSelectedRow().reportId
        };
        
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });

    $$('export').onclick(() => {
        const params = {
            dynamicReportId: reportsGrid.getSelectedRow().reportId
        };
        
        AWS.callSoap(WS, 'getExport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });

    $$('clone').onclick(() => {
        $$('drp-copyReportName').setValue(reportsGrid.getSelectedRow().name + ' 2');
        Utils.popup_open('copy-report-popup');

        $$('drp-copy-report-ok').onclick(() => {
            const params = {
                dynamicReportId: reportsGrid.getSelectedRow().reportId,
                reportName: $$('drp-copyReportName').getValue()
            };
            
            AWS.callSoap(WS, 'copyDynamicReport', params).then(data => {
                if (data.wsStatus === '0') {
                    searchDynamicReports();
                    edit(data.reportId, data.name);
                }
            });
        });

        $$('drp-copy-report-cancel').onclick(Utils.popup_close);
    });

    $$('add').onclick(() => {
        $$('drp-newReportName').clear();
        $$('drp-newReportType').setValue('0');
        $$('drp-newDescription').clear();
        $$('drp-orientation').setValue('P');
        $$('drp-offsetLeft').setValue(0.5);
        $$('drp-offsetTop').setValue(0.5);
        $$('drp-fontSize').setValue(12);

        Utils.popup_open('new-report-popup');

        $$('drp-add-ok').onclick(() => {
            if ($$('drp-newReportName').isError('Report Name'))
                return;
            if ($$('drp-newReportType').isError('Report Type'))
                return;
            if ($$('drp-newDescription').isError('Report Description'))
                return;
            if ($$('drp-orientation').isError('Report Orientation'))
                return;
            if ($$('drp-offsetLeft').isError('Page Offset Left'))
                return;
            if ($$('drp-offsetTop').isError('Page Offset Top'))
                return;
            if ($$('drp-fontSize').isError('Default Font Size'))
                return;
        
            const params = {
                defaultFontSize: $$('drp-fontSize').getValue(),
                description: $$('drp-newDescription').getValue(),
                pageOffsetLeft: $$('drp-offsetLeft').getValue(),
                pageOffsetTop: $$('drp-offsetTop').getValue(),
                pageOrientation: $$('drp-orientation').getValue(),
                reportName: $$('drp-newReportName').getValue(),
                reportType: $$('drp-newReportType').getValue()
            };
            
            AWS.callSoap(WS, 'newDynamicReport', params).then(data => {
                if (data.wsStatus === '0') {
                    searchDynamicReports();
                    edit(data.id, $$('drp-newReportName').getValue());
                }
            });
            Utils.popup_close();
        });
        $$('drp-add-cancel').onclick(Utils.popup_close);
    });

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Report?', () => {
            const params = {
                ids: reportsGrid.getSelectedRow().reportId
            };
            AWS.callSoap(WS, 'deleteDynamicReports', params).then(function (res) {
                if (res.wsStatus === "0") {
                    searchDynamicReports();
                }
            });
        });
    });
})();

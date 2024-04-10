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

    const WS = 'StandardTimeTimeOffRequestReview';

    function EventHour() {}

    EventHour.prototype.init = function(params) {
        this.eGui = document.createElement('div');

        this.eGui.style.height = "100%";
        
        if (params.data.hour[params.colDef.field.substring(4)] !== "") {
            if (params.data.hour[params.colDef.field.substring(4)].eventDetail.length) {
                for (let i = 0; i < params.data.hour[params.colDef.field.substring(4)].eventDetail.length; i++) {
                    let eventDetail = document.createElement("div");
                    this.eGui.style.display = "flex";
                    this.eGui.style.flexDirection = "column";
                    switch (params.data.hour[params.colDef.field.substring(4)].eventDetail[i].eventType) {
                        case "1":
                            eventDetail.style.backgroundColor = "yellow";                    
                            break;
        
                        case "0":
                            eventDetail.style.backgroundColor = "green";                    
                            break;

                        case "4":
                            eventDetail.style.backgroundColor = "green";                    
                            break;
        
                        case "3":
                            eventDetail.style.backgroundColor = "red";                    
                            break;
        
                        default:
                            break;
                    }

                    if (params.colDef.field.substring(4) != 0 && params.data.hour[params.colDef.field.substring(4) - 1] === "" || params.colDef.field.substring(4) == 0) {
                        eventDetail.style.marginLeft = params.data.hour[params.colDef.field.substring(4)].eventDetail[i].startMinute * 100 / 59 + "%";
                    } else if (params.colDef.field.substring(4) != 23 && params.data.hour[Number((params.colDef.field.substring(4))) + 1] === "" || params.colDef.field.substring(4) == 23) {
                        eventDetail.style.marginRight = 100 - params.data.hour[params.colDef.field.substring(4)].eventDetail[i].finalMinute * 100 / 59 + "%";
                    }     

                    eventDetail.style.height = 100 / params.data.hour[params.colDef.field.substring(4)].eventDetail.length + "%";
                    eventDetail.style.margin = "1px 0";

                    this.eGui.appendChild(eventDetail);
                }
            } else {
                switch (params.data.hour[params.colDef.field.substring(4)].eventDetail.eventType) {
                    case "1":
                        this.eGui.style.backgroundColor = "yellow";                    
                        break;
    
                    case "0":
                        this.eGui.style.backgroundColor = "green";                    
                        break;
    
                    case "4":
                        this.eGui.style.backgroundColor = "green";                    
                        break;
                        
                    case "3":
                        this.eGui.style.backgroundColor = "red";                    
                        break;
    
                    default:
                        break;
                }

                if (params.colDef.field.substring(4) != 0 && params.data.hour[params.colDef.field.substring(4) - 1] === "" || params.colDef.field.substring(4) == 0) {

                    this.eGui.style.marginLeft = params.data.hour[params.colDef.field.substring(4)].eventDetail.startMinute * 100 / 59 + "%";
                } else if (params.colDef.field.substring(4) != 23 && params.data.hour[Number((params.colDef.field.substring(4))) + 1] === "" || params.colDef.field.substring(4) == 23) {
                    this.eGui.style.marginRight = 100 - params.data.hour[params.colDef.field.substring(4)].eventDetail.finalMinute * 100 / 59 + "%";
                }      
            }           
            
        }
    };

    EventHour.prototype.getGui = function() {
        return this.eGui;
    };

    let requestsGrid;
    let eventGrid;

    $$('torr-event_day').setValue(new Date());
    
    $$('torr-next_day').onclick(() => {
        $$('torr-event_day').setValue(DateUtils.dateAddDays($$('torr-event_day').getDateValue(), 1));
        getListEvents();
    });

    $$('torr-prev_day').onclick(() => {
        $$('torr-event_day').setValue(DateUtils.dateAddDays($$('torr-event_day').getDateValue(), -1));
        getListEvents();
    });

    const showEventTable = () => {
        if (eventGrid != undefined) {
            eventGrid.destroy();            
        }  
        let columnDefs = [
            {headerName: "Employee", field: "personName", width: 50}            
        ];
        for (let i = 0; i < 24; i++) {
            columnDefs.push({headerName: TimeUtils.format(Number(String(i) + "00")), field: "hour" + i, cellRenderer: 'eventHour', width: 20})        
        }
        eventGrid = new AGGrid('eventGrid', columnDefs);
        eventGrid.addComponent('eventHour', EventHour);
        eventGrid.show();
        getListEvents();
    }

    const showTable = () => {
        if (requestsGrid != undefined) {
            requestsGrid.destroy();            
        }
        
        const columnDefs = [
            {headerName: "Requestor", field: "requestingPersonFormatted", width: 50},
            {headerName: "First Day Off", field: "firstDate", width: 50},
            {headerName: "Last Day Off", field: "lastDate", width: 50},
            {headerName: "Requested On", field: "requestDate", width: 50},
            {headerName: "Status", field: "statusFormatted", width: 30, hide: !$$('torr-include').getValue()},
            {headerName: "Type (Project)", field: "project", width: 50},
            {headerName: "Requestor Comments", field: "requestingComments", width: 100}
        ];
        requestsGrid = new AGGrid('requestsGrid', columnDefs);
        requestsGrid.show();
        getListTimeOffRequests();
    }         

    const getStatusFormatted = (t) => {
        switch(t) {
            case 'O':  return "Pending";
            case 'A':  return "Approved";
            case 'E':  return "Entered";
            case 'R':  return "Rejected";
            default:   return "";
        }              
    }

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getReport').then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl);
            }
        });
    });

    const reviewRequest = (reviewComment, status) => {
        const row = requestsGrid.getSelectedRow();
        
        const params = {
            item: {
                approvingComments: reviewComment,
                id: row.id,
                status: status
            }
        }

        AWS.callSoap(WS, 'saveTimeOffRequests', params).then(data => {
            if (data.wsStatus === '0') {     
                getListTimeOffRequests();
                $$('torr-event_day').setValue(new Date());
                getListEvents();
                Utils.popup_close();
            }
        });        
    }

    $$('mark-entered').onclick(() => {
        const row = requestsGrid.getSelectedRow();
        if (row.status != "A") {
            Utils.showMessage('Error', 'Only Approved requests can be marked as Entered.');
            return;
        }

        reviewRequest("", "E")
    });

    $$('reject').onclick(() => {
        const row = requestsGrid.getSelectedRow();
        $$('torr-title').setValue('Reject Time Off Request');
        $$('torr-approve').setValue('Reject');
        $$('torr-comment_review').clear();

        if (row.status != "O") {
            Utils.showMessage('Error', 'Only Pending requests can be Rejected.');
            return;
        }

        Utils.popup_open('torr-popup');

        $$('torr-approve').onclick(() => {
            reviewRequest($$('torr-comment_review').getValue(), "R");
        });

        $$('torr-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('approve').onclick(() => {
        const row = requestsGrid.getSelectedRow();
        $$('torr-comment_review').clear();
        $$('torr-title').setValue('Approve Time Off Request');
        $$('torr-approve').setValue('Approve');
        if (row.status != "O") {
            Utils.showMessage('Error', 'Only Pending requests can be Approved.');
            return;
        }

        Utils.popup_open('torr-popup');

        $$('torr-approve').onclick(() => {
            reviewRequest($$('torr-comment_review').getValue(), "A");
        });

        $$('torr-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('view').onclick(() => {
        const row = requestsGrid.getSelectedRow();
        $$('torr-view_title').setValue('View Time Off Request');

        $$('torr_view-requestor').setValue(row.requestingPersonFormatted);
        $$('torr_view-on').setValue(DateUtils.intToDate(DateUtils.strToInt(requestsGrid.getSelectedRow().requestDate)));
        $$('torr_view-tot').setValue(row.project);
        $$('torr_view-status').setValue(row.statusFormatted);
        $$('torr_view-firstDay').setValue(DateUtils.intToDate(DateUtils.strToInt(requestsGrid.getSelectedRow().firstDate)));
        $$('torr_view-startTime').setValue(row.firstTime);
        $$('torr_view-lastDay').setValue(DateUtils.intToDate(DateUtils.strToInt(requestsGrid.getSelectedRow().lastDate)));
        $$('torr_view-endTime').setValue(row.lastTime);
        $$('torr_view-comment_request').setValue(row.requestingComments);
        $$('torr_view-comment_review').clear();

        if (row.status == "O") {
            $$('torr_view-mark-entered').hide();
            $$('torr_view-approve').show();
            $$('torr_view-reject').show();
            $$('torr_view-comment_review').enable();
        } else {
            $$('torr_view-mark-entered').show().enable();
            $$('torr_view-approve').hide();
            $$('torr_view-reject').hide();
            $$('torr_view-comment_review').disable();
        }
        

        let viewResults;
        $$('torr_view-view').onclick(() => {
            const showViewTable = () => {
                if (viewResults != undefined) {
                    viewResults.destroy();            
                }  
                const columnDefs = [
                    {headerName: "Type", field: "name", width: 60},
                    {headerName: "Total", field: "hours", type: "numericColumn",  width: 40}
                ];
                viewResults = new AGGrid('viewResults', columnDefs);
                viewResults.show();
            }       
    
            showViewTable();
            $$('torr-veiw-accured_title').setValue('Accured Time Off');
    
            const data = {
                personId: row.personId
            };
    
            AWS.callSoap(WS, 'listAccruedTimeOff', data).then(listAccruedTimeOff => {
                if (listAccruedTimeOff.wsStatus === "0") {
                    const res = Utils.assureArray(listAccruedTimeOff.item);
                    for (let i = 0; i < res.length; i++) {
                        res[i].hours = Utils.format(Utils.toNumber(res[i].hours), "Z", 0, 2);                    
                    }
                    viewResults.addRecords(res);
                }
            });
    
            Utils.popup_open('torr-veiw-accured_popup');
    
            $$('torr-veiw-accured_cancel').onclick(() => {
                Utils.popup_close();
            });
        });

        $$('torr_view-approve').onclick(() => {
            reviewRequest($$('torr_view-comment_review').getValue(), "A")
        });

        $$('torr_view-reject').onclick(() => {
            reviewRequest($$('torr_view-comment_review').getValue(), "R")
        });

        $$('torr_view-mark-entered').onclick(() => {
            reviewRequest("", "E")
        });

        Utils.popup_open('torr-veiw_popup');

        $$('torr_view-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('torr-include').onChange(() => {
        showTable();
        if ($$('torr-include').getValue()) {
            $$('mark-entered').show();            
        } else {
            $$('mark-entered').hide();
        }
    });

    const getListEvents = () => {
        const params = {
            date: $$('torr-event_day').getIntValue()
        }
        eventGrid.clear();

        AWS.callSoap(WS, 'listEvents', params).then(listEvents => {
            if (listEvents.wsStatus === '0') {  
                listEvents.item = Utils.assureArray(listEvents.item);
                eventGrid.addRecords(listEvents.item);     
            }
        });     
    }      

    let selectedRow;

    const getListTimeOffRequests = () => {
        $$('approve').disable();
        $$('reject').disable();
        $$('view').disable();
        $$('mark-entered').disable();

        requestsGrid.clear();
        const params = {
            includeApproved: $$('torr-include').getValue()
        }
        AWS.callSoap(WS, 'listTimeOffRequests', params).then(listTimeOffRequests => {
            if (listTimeOffRequests.wsStatus === "0") {
                const rowData = Utils.assureArray(listTimeOffRequests.item);
                for (let i = 0; i < rowData.length; i++) {
                    rowData[i].statusFormatted = getStatusFormatted(rowData[i].status);
                    rowData[i].firstDate = DateUtils.intToStr4(Number(rowData[i].firstDate));
                    rowData[i].lastDate = DateUtils.intToStr4(Number(rowData[i].lastDate));
                    rowData[i].requestDate = DateUtils.intToStr4(Number(rowData[i].requestDate));
                }
                requestsGrid.addRecords(rowData); 
                requestsGrid.setOnSelectionChanged((rows) => {
                    $$('approve').enable(rows);
                    $$('reject').enable(rows);
                    $$('view').enable(rows);
                    $$('mark-entered').enable(rows);
                    if (rows.length && selectedRow !== rows[0]) {
                        selectedRow = rows[0];
                        $$('torr-event_day').setValue(DateUtils.intToDate(DateUtils.strToInt(rows[0].firstDate)));
                        getListEvents();
                    }                    
                });   
            }            
        });        
    }

    showTable();
    showEventTable();
})();

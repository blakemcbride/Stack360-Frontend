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
    const WS = 'StandardHrDynamicReport';

    const reportId = Utils.getData('CURRENT_REPORT_ID');

    const container = new TabContainer('dr-tab-container');
    container.selectTab('dr-basic-TabButton');

    let availableColumnsGrid;
    let selectedColumnsGrid;
    const columnDefs = [
        {headerName: "Column Name", field: "title", width: 1000}
    ];

    availableColumnsGrid = new AGGrid('availableColumnsGrid', columnDefs);
    selectedColumnsGrid = new AGGrid('selectedColumnsGrid', columnDefs);
    availableColumnsGrid.show();
    selectedColumnsGrid.show();

    function reset() {    
        const params = {
            reportId: reportId
        }
        AWS.callSoap(WS, 'loadDynamicReport', params).then(data => {
            if (data.wsStatus === '0') {
                $$('dr-reportName').setValue(data.reportName);
                $$('dr-reportType').setValue(data.reportType);
                $$('dr-description').setValue(data.description);
                $$('dr-offsetLeft').setValue(Number(data.pageOffsetLeft));
                $$('dr-offsetTop').setValue(Number(data.pageOffsetTop));
                $$('dr-columnSpacing').setValue(Number(data.defaultSpaceBetweenColumns));
                $$('dr-fontSize').setValue(Number(data.defaultFontSize));
                $$('dr-titleLines').setValue(Number(data.linesInColumnTitle));
                $$('dr-orientation').setValue(data.pageOrientation);
    
                $$('dr-linesInColumnTitle').setValue(Number(data.linesInColumnTitle));
                $$('dr-defaultSpaceBetweenColumns').setValue(Number(data.defaultSpaceBetweenColumns));
    
                data.graphic = Utils.assureArray(data.graphic);
                graphicsGrid.addRecords(data.graphic);
                graphicsGrid.setOnSelectionChanged(() => {
                    $$('graphicsEdit').enable();
                    $$('graphicsDelete').enable();
                });
                graphicsGrid.setOnRowDoubleClicked(editGraphic);
    
                data.selection = Utils.assureArray(data.selection);
                for (let i = 0; i < data.selection.length; i++) {
                    data.selection[i].selectionLogicOperatorFormatted = getSelectionLogicOperatorFormatted(data.selection[i].logicOperator);
                    data.selection[i].lParenFormatted = getLParenFormatted(data.selection[i].leftParens);
                    data.selection[i].selectionOperatorFormatted = getSelectionOperatorFormatted(data.selection[i].selectionOperator);
                    data.selection[i].selectionValueFormatted = getValueFormatted(data.selection[i].selectionType, data.selection[i].selectionValue, data.selection[i].selectionColumn2Name);
                    data.selection[i].rParenFormatted = getRParenFormatted(data.selection[i].rightParens);
                }
                selectionGrid.addRecords(data.selection);
                selectionGrid.setOnSelectionChanged(() => {
                    $$('selectionEdit').enable();
                    $$('selectionDelete').enable();
                });
                selectionGrid.setOnRowDoubleClicked(editSelectionCriteria);

                data.category = Utils.assureArray(data.category);
                data.benefit = Utils.assureArray(data.benefit);
                data.config = Utils.assureArray(data.config);

                selectedBenefitsGrid.addRecords(data.category).addRecords(data.benefit).addRecords(data.config);
            }
        });  

        AWS.callSoap(WS, 'listReportColumns', params).then(data => {
            if (data.wsStatus === '0') {
                $$('removeColumn').disable();
                $$('editColumn').disable();
                data.availableColumns = Utils.assureArray(data.availableColumns);
                data.columns = Utils.assureArray(data.columns);
                availableColumnsGrid.addRecords(data.availableColumns);
                selectedColumnsGrid.addRecords(data.columns);
    
                for (let i = 1; i < 6; i++) {
                    $$('dr-sortDirection' + i).clear().add('0', '(select)');
                    $$('dr-sortDirection' + i).addItems(data.columns, "reportColumnId", "title");  
                    $$('dr-sortDirection' + i).onChange(() => {
                        let selectedColumns = selectedColumnsGrid.getAllRows();
                        for (let j = 0; j < selectedColumns.length; j++) {
                            if ($$('dr-sortDirection' + i).getValue() === selectedColumns[j].reportColumnId) {
                                $$('dr-sortOrder' + i).setValue(selectedColumns[j].sortDirection);
                            }            
                        }
                    });
                }
    
                $$('dr-selectionCriteriaColumn').clear().add('0', '(select)');
                $$('dr-selectionCriteriaColumn').addItems(data.availableColumns, "reportColumnId", "title");  
    
                if (data.columns.length > 5) {
                    $$('columns-clue-label').setValue('5 columns or less is recommended for Reports. No Limit for Exports.').setColor('red');
                } else {
                    $$('columns-clue-label').setValue('Drag and Drop columns back and forth to make your selections.').setColor('black');
                }
                availableColumnsGrid.setOnRowDoubleClicked(selectColumn);
                selectedColumnsGrid.setOnRowDoubleClicked(editColumn);
                selectedColumnsGrid.setOnSelectionChanged(() => {
                    $$('removeColumn').enable();
                    $$('editColumn').enable();
                });
            }
        }); 
        getListCategories();
    }

    function getSelectionLogicOperatorFormatted(logicOperator) {
        switch (logicOperator) {
            case 'A':
                return '&&';

            case 'O':
                return '||';

            default:
                return '';
        }
    }

    function getLParenFormatted(leftParens) {
        let lParen = '';
        for (let i = 0; i < Number(leftParens); i++) {
            lParen += '(';
        }
        return lParen;
    }

    function getSelectionOperatorFormatted(selectionOperator) {
        switch (selectionOperator) {
            case 'GE':
                return '>=';
            case 'EQ':
                return '=';
            case 'LE':
                return '<=';
            case 'LT':
                return '<';
            case 'GT':
                return '>';
            case 'NE':
                return '!=';
            case 'LK':
                return 'like';
            case 'IN':
                    return 'in';
            default:
                return '';
        }
    }

    function getValueFormatted(selectionType, selectionValue, selectionColumn2Name) {
        switch (selectionType) {
            case 'V':
                return selectionValue;
            case 'R':
                return '(ask at run time)';
            case 'D':
                return '(Current Date)';
            case 'C':
                return selectionColumn2Name;
            default:
                return '';
        }
    }

    function getRParenFormatted(rightParens) {
        let rParen = '';
        for (let i = 0; i < Number(rightParens); i++) {
            rParen += ')';
        }
        return rParen;
    }

    let selectionListItems;
    const selectionListItemsColumnDefs = [
        {headerName: "Selection List Items", field: "label", width: 1000}
    ];

    $$('selectionAdd').onclick(() => {
        $$('selection-criteria-popup-label').setValue('Add');

        if ($$('dr-advancedMode').getValue()) {
            $('#dr-criteriaAdvancedMode').show();
        } else {
            $('#dr-criteriaAdvancedMode').hide();
        }

        $$('dr-selectionCriteriaColumn').clear().add('0', '(select)');
        $$('dr-selectionCriteriaColumn').addItems(selectedColumnsGrid.getAllRows(), "columnId", "title");    
        $$('dr-selectionCriteriaColumn').addItems(availableColumnsGrid.getAllRows(), "columnId", "title");    
        $('#dr-selectionValueContainer').hide();

        $$('dr-selectionCriteriaColumn').onChange(() => {
            $$('dr-selectionCriteriaOperator').disable();
            let operators = $$('dr-selectionCriteriaColumn').getData().operators;
            for (let i = 0; i < operators.length; i++) {
                $$('operator' + operators[i].operator).enable();
            }
            if (selectionListItems !== undefined) {
                selectionListItems.destroy();
            }
            Utils.popup_set_width('selection-criteria-popup', '370px');

            console.log($$('dr-selectionValueDate'))

            $$('dr-selectionValueDate').hide();
            $$('dr-selectionValueRadioType').hide();
            $$('dr-selectionValueTextCriteria').hide();
            $$('dr-selectionValueText').hide();
            $$('dr-selectionValueNumeric').hide();
            $$('dr-selectionValueRadioCobra').hide();
            $$('dr-selectionValueRadioDepType').hide();
            $$('dr-selectionValueRadioGender').hide();
            $('#dr-selectionValueContainer').hide();
            
            switch ($$('dr-selectionCriteriaColumn').getData().controlType) {
                case '1':
                    $('#dr-selectionValueContainer').show();
                    break;
                case '2':
                    break;
                case '3':
                    $('#dr-selectionValueContainer').show();
                    $$('dr-selectionValueDate').show();
                    break;
                case '4':
                    break;
                case '5':
                    Utils.popup_set_width('selection-criteria-popup', '740px');
                    $('#dr-selectionValueContainer').hide();
                    selectionListItems = new AGGrid('selectionListItemsGrid', selectionListItemsColumnDefs);
                    selectionListItems.show();
                    selectionListItems.addRecords($$('dr-selectionCriteriaColumn').getData().listObject);
                    break;
                default:
                    break;
            }

        });
        $$('add-report-column-ok').onclick(() => {
            const row = {};
            row.selectionColumnName = $$('dr-selectionCriteriaColumn').getValue();
            row.selectionOperatorFormatted = $$('dr-selectionCriteriaOperator').getValue();
            row.selectionValueFormatted = $$('dr-selectionCriteriaType').getValue();
            selectionGrid.addRecord(row);
            Utils.popup_close();
        });
        $$('add-report-column-cancel').onclick(Utils.popup_close);
        Utils.popup_open('selection-criteria-popup');
    });

    function editSelectionCriteria() {
        
    }

    $$('selectionEdit').onclick(editSelectionCriteria);
    $$('selectionDelete').onclick(() => {  
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Selection?', () => {
            selectionGrid.deleteSelectedRows();
        });
    });  

    let availableCategorisGrid;
    let availableBenefitsGrid;
    let availableConfigsGrid;
    let selectedBenefitsGrid;
    let selectionGrid;
    let graphicsGrid;

    const availableCategorisColumnDefs = [
        {headerName: "Available Categories", field: "categoryName", width: 1000}
    ];
    const availableBenefitsColumnDefs = [
        {headerName: "Available Benefits", field: "benefitName", width: 1000}
    ];
    const availableConfigsColumnDefs = [
        {headerName: "Available Configs", field: "configName", width: 1000}
    ];
    const selectedBenefitsColumnDefs = [
        {headerName: "Selected Category", field: "categoryName", width: 200},
        {headerName: "Selected Benefit", field: "benefitName", width: 200},
        {headerName: "Selected Config", field: "configName", width: 200},
    ];
    const graphicsColumnDefs = [
        {headerName: "Description", field: "description", width: 400},
        {headerName: "X Position", field: "xPos", width: 200},
        {headerName: "Y Position", field: "yPos", width: 200},
    ];
    

    availableCategorisGrid = new AGGrid('availableCategorisGrid', availableCategorisColumnDefs);
    availableCategorisGrid.show();
    availableBenefitsGrid = new AGGrid('availableBenefitsGrid', availableBenefitsColumnDefs);
    availableBenefitsGrid.show();
    availableConfigsGrid = new AGGrid('availableConfigsGrid', availableConfigsColumnDefs);
    availableConfigsGrid.show();
    selectedBenefitsGrid = new AGGrid('selectedBenefitsGrid', selectedBenefitsColumnDefs);
    selectedBenefitsGrid.show();
    graphicsGrid = new AGGrid('graphicsGrid', graphicsColumnDefs);
    graphicsGrid.show();

    $$('dr-advancedMode').onChange(async () => {
        let temp = selectionGrid.getAllRows();
        if (selectionGrid !== undefined) {
            selectionGrid.destroy();
        }
        await showSelectionGrid();
        selectionGrid.addRecords(temp);
    });

    function showSelectionGrid() {
        let selectionColumnDefs;
        if ($$('dr-advancedMode').getValue()) {
            selectionColumnDefs = [
                {headerName: "Logic Operator", field: "selectionLogicOperatorFormatted", width: 150},
                {headerName: "L Paren", field: "lParenFormatted", width: 100},
                {headerName: "Column", field: "selectionColumnName", width: 400},
                {headerName: "Operator", field: "selectionOperatorFormatted", width: 200},
                {headerName: "Value", field: "selectionValueFormatted", width: 400},
                {headerName: "R Paren", field: "rParenFormatted", width: 100},
            ];
        } else {
            selectionColumnDefs = [
                {headerName: "Column", field: "selectionColumnName", width: 400},
                {headerName: "Operator", field: "selectionOperatorFormatted", width: 200},
                {headerName: "Value", field: "selectionValueFormatted", width: 400}
            ];
        }
        
        selectionGrid = new AGGrid('selectionGrid', selectionColumnDefs);
        selectionGrid.show();
    }

    showSelectionGrid();

    function getListCategories(excludeCategoriesArray = '') {
        const params = {
            excludeIdsArray: excludeCategoriesArray
        }
        AWS.callSoap(WS, 'listCategories', params).then(data => {
            if (data.wsStatus === '0') {
                availableCategorisGrid.clear();
                availableConfigsGrid.clear();
    
                $$('removeBenefits').disable();
    
                data.item = Utils.assureArray(data.item);
    
                availableCategorisGrid.addRecords(data.item);
    
                availableCategorisGrid.setOnRowDoubleClicked(async () => {
                    let selectedCategory = availableCategorisGrid.getSelectedRow();
                    let selectedBenefits = selectedBenefitsGrid.getAllRows();
                    
                    for (let i = 0; i < selectedBenefits.length; i++) {
                        if (selectedBenefits[i].categoryId === selectedCategory.categoryId) {
                            selectedBenefitsGrid.deleteRow(i);
                        }                        
                    }
                    selectedBenefitsGrid.addRecord(selectedCategory);

                    let temp = [];
                    for (let i = 0; i < selectedBenefitsGrid.getAllRows().length; i++) {
                        temp.push(selectedBenefitsGrid.getAllRows()[i].categoryId);
                    }
                    getListCategories(temp);
                    availableBenefitsGrid.clear();
                    availableConfigsGrid.clear();
                });
    
                availableCategorisGrid.setOnSelectionChanged(() => {
                    getListBenefits();
                });
            }
        });   
    }
    
    function getListBenefits(excludeBenefitsArray = '') {
        const params = {
            categoryId: availableCategorisGrid.getSelectedRow().categoryId,
            excludeIdsArray: excludeBenefitsArray
        }
        AWS.callSoap(WS, 'listBenefits', params).then(data => {
            if (data.wsStatus === '0') {
                availableBenefitsGrid.clear();
                availableConfigsGrid.clear();

                $$('removeBenefits').disable();

                data.item = Utils.assureArray(data.item);
    
                availableBenefitsGrid.addRecords(data.item);
    
                availableBenefitsGrid.setOnRowDoubleClicked(() => {
                    let selectedBenefit = availableBenefitsGrid.getSelectedRow();
                    let selectedBenefits = selectedBenefitsGrid.getAllRows();
                    
                    for (let i = 0; i < selectedBenefits.length; i++) {
                        if (selectedBenefits[i].categoryId === selectedBenefit.categoryId) {
                            selectedBenefitsGrid.deleteRow(i);
                        }                        
                    }
                    selectedBenefitsGrid.addRecord(selectedBenefit);

                    let temp = [];
                    for (let i = 0; i < selectedBenefitsGrid.getAllRows().length; i++) {
                        temp.push(selectedBenefitsGrid.getAllRows()[i].benefitId);
                    }
                    getListBenefits(temp);
                    availableConfigsGrid.clear();
                });

                availableBenefitsGrid.setOnSelectionChanged(() => {
                    getListConfigs();
                });
            }
        });   
    }

    function getListConfigs(excludeConfigsArray) {
        const params = {
            benefitId: availableBenefitsGrid.getSelectedRow().benefitId,
            excludeIdsArray: excludeConfigsArray
        }
        AWS.callSoap(WS, 'listConfigs', params).then(data => {
            if (data.wsStatus === '0') {
                availableConfigsGrid.clear();

                $$('removeBenefits').disable();

                data.item = Utils.assureArray(data.item);
    
                availableConfigsGrid.addRecords(data.item);
    
                availableConfigsGrid.setOnRowDoubleClicked(() => {
                    selectedBenefitsGrid.addRecord(availableConfigsGrid.getSelectedRow());

                    let temp = [];
                    for (let i = 0; i < selectedBenefitsGrid.getAllRows().length; i++) {
                        temp.push(selectedBenefitsGrid.getAllRows()[i].configId);
                    }
                    getListConfigs(temp);
                });

                availableConfigsGrid.setOnSelectionChanged(() => {
                    
                });
            }
        });   
    }

    selectedBenefitsGrid.setOnSelectionChanged(() => {
        $$('removeBenefits').enable().onclick(async () => {
            if (selectedBenefitsGrid.getSelectedRow().configId !== '') {
                for (let i = 0; i < availableCategorisGrid.getAllRows().length; i++) {
                    if (availableCategorisGrid.getAllRows()[i].categoryId === selectedBenefitsGrid.getSelectedRow().categoryId) {
                        await availableCategorisGrid.selectId(i);
                    }
                }
                for (let i = 0; i < availableBenefitsGrid.getAllRows().length; i++) {
                    if (availableBenefitsGrid.getAllRows()[i].categoryId === selectedBenefitsGrid.getSelectedRow().categoryId) {
                        availableBenefitsGrid.selectId(i);
                    }
                }
            } else if (selectedBenefitsGrid.getSelectedRow().benefitId !== '') {
                let temp = [];
                for (let i = 0; i < availableCategorisGrid.getAllRows().length; i++) {
                    if (availableCategorisGrid.getAllRows()[i].categoryId === selectedBenefitsGrid.getSelectedRow().categoryId) {
                        await availableCategorisGrid.selectId(i);
                        continue;
                    }
                }
                for (let i = 0; i < selectedBenefitsGrid.getAllRows().length; i++) {
                    if (selectedBenefitsGrid.getAllRows()[i].benefitId !== selectedBenefitsGrid.getSelectedRow().benefitId) {
                        temp.push(selectedBenefitsGrid.getAllRows()[i].benefitId);            
                    }           
                }
                getListBenefits(temp);
            } else {
                let temp = [];
                for (let i = 0; i < availableCategorisGrid.getAllRows().length; i++) {
                    if (availableCategorisGrid.getAllRows()[i].categoryId === selectedBenefitsGrid.getSelectedRow().categoryId) {
                        continue;
                    }
                }
                for (let i = 0; i < selectedBenefitsGrid.getAllRows().length; i++) {
                    if (selectedBenefitsGrid.getAllRows()[i].categoryId !== selectedBenefitsGrid.getSelectedRow().categoryId) {
                        temp.push(availableCategorisGrid.getAllRows()[i].categoryId);
                    }           
                }
                getListCategories(temp);
            }

            selectedBenefitsGrid.deleteSelectedRows();
        });
    });


    function editColumn() {
        const row = selectedColumnsGrid.getSelectedRow();
        const params = {
            formatType: row.formatType,
            reportColumnId: row.reportColumnId
        }
        AWS.callSoap(WS, 'listFormatCodes', params).then(data => {
            if (data.wsStatus === '0') {
                $$('dr-formatCode').clear().add('0', '(None Selected)');
                $$('dr-formatCode').addItems(data.item, "formatCode", "formatCode").setValue(data.currentFormatCode);
            }
        });   

        $$('dr-displayTotalsWhen').clear().add('0', '(select)');

        $$('dr-reportTitle').setValue(row.title);
        $$('dr-titleJustification').setValue(row.titleJustification);
        $$('dr-horizontalJustification').setValue(row.columnJustification);
        $$('dr-verticalJustification').setValue(row.verticalJustification);
        $$('dr-leadingSpace').setValue(row.leadingSpace);
        $$('dr-maxLinesRow').setValue(row.lines);
        $$('dr-alwaysUseMaxLines').setValue(row.useAllLines === 'Y');
        $$('dr-numericDigits').setValue(row.numericDigits);
        $$('dr-displayTotals').setValue(row.displayTotals);
        $$('dr-displayTotalsWhen').setValue('0');

        Utils.popup_open('edit-report-column-popup');

        $$('edit-report-column-ok').onclick(() => {
            row.title = $$('dr-reportTitle').getValue();
            row.titleJustification = $$('dr-titleJustification').getValue();
            row.columnJustification = $$('dr-horizontalJustification').getValue();
            row.verticalJustification = $$('dr-verticalJustification').getValue();
            row.leadingSpace = $$('dr-leadingSpace').getValue();
            row.lines = $$('dr-maxLinesRow').getValue();
            row.useAllLines = $$('dr-alwaysUseMaxLines').getValue() ? 'Y' : 'N';
            row.numericDigits = $$('dr-numericDigits').getValue();
            row.displayTotals = $$('dr-displayTotals').getValue();

            selectedColumnsGrid.updateSelectedRecord(row);
        });

        $$('edit-report-column-cancel').onclick(Utils.popup_close);
    }
$$
    $$('editColumn').onclick(editColumn);
    $$('removeColumn').onclick(removeColumn);

    function selectColumn() {
        selectedColumnsGrid.addRecord(availableColumnsGrid.getSelectedRow());
        availableColumnsGrid.deleteSelectedRows();

        if (selectedColumnsGrid.getAllRows().length > 5) {
            $$('columns-clue-label').setValue('5 columns or less is recommended for Reports. No Limit for Exports.').setColor('red');
        }
    }

    function removeColumn() {
        $$('removeColumn').disable();
        $$('editColumn').disable();
        availableColumnsGrid.addRecord(selectedColumnsGrid.getSelectedRow());
        selectedColumnsGrid.deleteSelectedRows();

        if (selectedColumnsGrid.getAllRows().length <= 5) {
            $$('columns-clue-label').setValue('Drag and Drop columns back and forth to make your selections.').setColor('black');
        }
    }

    function getListReportGraphics() {
        const params = {
            reportId: reportId
        }

        AWS.callSoap(WS, 'listReportGraphics', params).then(data => {
            if (data.wsStatus === '0') {
                graphicsGrid.clear();
                $$('graphicsEdit').disable();
                $$('graphicsDelete').disable();

                data.graphic = Utils.assureArray(data.graphic);
                graphicsGrid.addRecords(data.graphic);
            }
        });  
    }

    function editGraphic() {
        const row = graphicsGrid.getSelectedRow();
        $$('dr-graphicDescription').setValue(row.description);
        $$('dr-file_name').clear();
        $$('dr-file').disable().clear();
        $$('dr-graphicXPosition').setValue(row.xPos);
        $$('dr-graphicYPosition').clear(row.yPos);

        $$('graphic-popup-label').setValue('Edit');

        Utils.popup_open('edit-graphic-popup');
        
        $$('edit-graphic-ok').onclick(async () => {
            if ($$('dr-graphicDescription').isError('Description'))
                return;

            const params = {
                graphicId: row.graphicId,
                description: $$('dr-graphicDescription').getValue(),
                xPos: $$('dr-graphicXPosition').getValue(),
                yPos: $$('dr-graphicYPosition').getValue()
            };
            
            AWS.callSoap(WS, 'saveGraphic', params).then(data => {
                if (data.wsStatus === '0') {       
                    getListReportGraphics();
                    Utils.popup_close();
                }
            });   
        });

        $$('edit-graphic-cancel').onclick(Utils.popup_close);
    }

    $$('graphicsAdd').onclick(async () => {
        $$('dr-graphicDescription').clear();
        $$('dr-file_name').clear();
        $$('dr-file').clear();
        $$('dr-graphicXPosition').clear();
        $$('dr-graphicYPosition').clear();

        $$('graphic-popup-label').setValue('Add');

        Utils.popup_open('edit-graphic-popup');
        
        $$('edit-graphic-ok').onclick(async () => {
            if ($$('dr-file').isError('File'))
                return;

            if ($$('dr-graphicDescription').isError('Description'))
                return;

            const params = {
                uploadType: "reportGraphicUpload",
                description: $$('dr-graphicDescription').getValue(),
                reportId: reportId,
                xPos: $$('dr-graphicXPosition').getValue(),
                yPos: $$('dr-graphicYPosition').getValue()
            };
            Utils.waitMessage('File upload in progress.');
            await AWS.fileUpload('dr-file', 'FileUploadServlet', params);
            Utils.waitMessageEnd();
            Utils.showMessage('Status', 'Import process complete.');
            
            getListReportGraphics();
            Utils.popup_close(); 
        });

        $$('edit-graphic-cancel').onclick(Utils.popup_close);        
    });
    $$('graphicsEdit').onclick(editGraphic);
    $$('graphicsDelete').onclick(() => {
        const row = graphicsGrid.getSelectedRow();      
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Graphic?', () => {
            const params = {
                ids: row.graphicId
            };
            AWS.callSoap(WS, "deleteReportGraphics", params).then(data => {
                if (data.wsStatus === '0') {
                    getListReportGraphics();
                }
            });
        });
    });

    reset();
    $$('reset').onclick(reset);
    $$('save').onclick(() => {
        let selectedColumns = selectedColumnsGrid.getAllRows();
        for (let i = 0; i < selectedColumns.length; i++) {
            for (let j = 1; j < 6; j++) {
                if ($$('dr-sortDirection' + j).getValue() === selectedColumns[i].reportColumnId) {
                    selectedColumns[i].sortDirection = $$('dr-sortOrder' + j).getValue();
                }
            }
        }
        const params = {
            column: selectedColumns,
            defaultFontSize: $$('dr-fontSize').getValue(),
            defaultSpaceBetweenColumns: $$('dr-columnSpacing').getValue(),
            description: $$('dr-description').getValue(),
            linesInColumnTitle: $$('dr-titleLines').getValue(),
            pageOffsetLeft: $$('dr-offsetLeft').getValue(),
            pageOffsetTop: $$('dr-offsetTop').getValue(),
            pageOrientation: $$('dr-orientation').getValue(),
            reportId: reportId,
            reportName: $$('dr-reportName').getValue(),
            reportType: $$('dr-reportType').getValue(),
            selection: selectionGrid.getAllRows()
        }

        AWS.callSoap(WS, "saveDynamicReport", params).then(data => {
            if (data.wsStatus === '0') {

            }
        });
    });

    $$('report').onclick(() => {
        const params = {
            dynamicReportId: reportId
        };
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl);
            }
        });
    });

    $$('export').onclick(() => {
        const params = {
            dynamicReportId: reportId
        };
        AWS.callSoap(WS, 'getExport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.exportUrl);
            }
        });
    });
})();

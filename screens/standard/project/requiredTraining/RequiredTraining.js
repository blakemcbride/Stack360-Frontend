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

    const WS = 'com.arahant.services.standard.project.requiredTraining';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectDescription = Utils.getData("CURRENT_PROJECT_SUMMARY");
    let trainingGrid;
    let mode;

    $('#project-details').text(projectName + " - " + projectDescription);

    const fillTrainingGrid = () => {
        // Clear the grid.
        trainingGrid.clear();

        $$('edit-project-training').disable();
        $$('delete-project-training').disable();

        const data = {
            "project_id": projectId
        };
        Server.call(WS, "GetRequiredTraining", data).then(res => {
            if (res._Success && res.hasOwnProperty("required_trainings")) {
                trainingGrid.addRecords(res.required_trainings);
                trainingGrid.deselectAll();
            }
        });
    };

    const getTrainingCategories = (category_id = null) => {
        let isTenant = false;

        if ($$('client-filter').getValue() === '0')
            isTenant = true;

        const data = {
            'is-tenant': isTenant,
            'project-id': projectId
        };

        Server.call(WS, "CategoriesByClient", data).then(res => {
            if (res._Success && res.hasOwnProperty("training_categories")) {
                const categoriesCtl = $$('category');
                categoriesCtl.clear();
                categoriesCtl.add('', '(select)');

                for (let trainingCategory of res.training_categories) {
                    categoriesCtl.add(trainingCategory.category_id, trainingCategory.name);

                    // Set the value if edit popup.
                    if (category_id != null && trainingCategory.category_id === category_id)
                        categoriesCtl.setValue(trainingCategory.category_id);
                }
            }
        });
    };

    const editTraining = () => {
        $('#popup-header').text('Edit Project Training');
        mode = 'edit';

        const row = trainingGrid.getSelectedRow();

        if (!row) {
            Utils.showMessage('Error', 'No row selected.');  // should never happen
            return;
        }

        if (row.hasOwnProperty('is_company') && row.is_company === 'Yes')
            $$('client-filter').setValue(0);
        else
            $$('client-filter').setValue(1);

        $("#client-filter-group input:radio").attr('disabled', true);

        $$('category').clear();
        $$('category').add('', '(select)');
        $$('category').disable();

        $$('client-filter').disable();

        $$('required').setValue(row.required === 'Y' ? 1 : 0);

        getTrainingCategories(row.category_id);

        Utils.popup_open('training-edit-popup', 'category');
    };

    const setupTrainingGrid = () => {
        const columnDefs = [
            {headerName: 'Company', field: 'is_company', width: 10},
            {headerName: 'Category', field: 'category_name', width: 50},
            {headerName: 'Category Type', field: 'category_type', width: 20},
            {headerName: 'Hours', field: 'hours', width: 10},
            {headerName: 'Required', field: 'required', width: 10}
        ];
        trainingGrid = new AGGrid('training-grid', columnDefs, 'project_training_id');
        trainingGrid.show();

        trainingGrid.setOnSelectionChanged((rows) => {
            $$('edit-project-training').enable(rows);
            $$('delete-project-training').enable(rows);
        });

        trainingGrid.setOnRowDoubleClicked(() => {
            editTraining();
        });
    };

    setupTrainingGrid();
    fillTrainingGrid();

    /**
     * On client radio filter change.
     */
    $$('client-filter').onChange(() => {
        getTrainingCategories();
    });

    /**
     * Screen Add button click event handler.
     */
    $$('add-project-training').onclick(() => {
        $('#popup-header').text('Add Project Training');
        mode = 'add';

        $("#client-filter-group input:radio").attr('disabled', false);
        $$('client-filter').setValue('0');

        $$('category').clear();
        $$('category').add('', '(select)');
        $$('category').enable();
        $$('client-filter').enable();

        $$('required').setValue(0);

        getTrainingCategories();

        // Show popup.
        Utils.popup_open('training-edit-popup', 'category');
    });

    /**
     * Screen Edit button click event handler.
     */
    $$('edit-project-training').onclick(() => {
        editTraining();
    });

    $$('delete-project-training').onclick(() => {
        const row = trainingGrid.getSelectedRow();

        if (!row) {
            Utils.showMessage('Error', 'No row selected.');  // should never happen
            return;
        }

        Utils.yesNo('Query', 'Is it okay to delete this record?', () => {
            const data = {
                project_training_id: row.project_training_id
            };

            Server.call(WS, "DeleteRequiredTraining", data).then(res => {
                if (res._Success) {
                    Utils.showMessage('Success', 'Project training deleted.');
                    fillTrainingGrid();
                }
            });
        });
    });

    $$('training-edit-ok').onclick(() => {
        let error = $$('category').isError('Category');

        if (!error) {
            if (mode === 'add') {
                let data = {
                    project_id: projectId,
                    category_id: $$('category').getValue(),
                    required: $$('required').getValue()
                };

                Server.call(WS, "NewRequiredTraining", data).then(res => {
                    if (res._ErrorMessage) {
                        Utils.showMessage('Error', res._ErrorMessage);
                    } else if (res._Success) {
                        Utils.showMessage('Success', 'Project training added.');
                        Utils.popup_close('training-edit-popup');
                        fillTrainingGrid();
                    }
                });
            } else {  // edit
                const row = trainingGrid.getSelectedRow();

                const data = {
                    project_id: projectId,
                    project_training_id: row.project_training_id,
                    category_id: $$('category').getValue(),
                    required: $$('required').getValue()
                };

                Server.call(WS, "UpdateRequiredTraining", data).then(res => {
                    if (res._ErrorMessage) {
                        Utils.showMessage('Error', res._ErrorMessage);
                    } else if (res._Success) {
                        Utils.showMessage('Success', 'Project training updated.');
                        Utils.popup_close('training-edit-popup');
                        fillTrainingGrid();
                    }
                });
            }
        }
    });

    $$('training-edit-cancel').onclick(() => {
        Utils.popup_close('training-edit-popup');
    });

})();





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
    const WS = 'StandardHrHrDependentsAgeLimitReport';

    $$('year').setValue(Number(String(DateUtils.today()).substring(0, 4)));
    $$('inactiveAsOf').setValue(DateUtils.today());

    let benefitsGrid;

    const benefitsColumnDefs = [
        {headerName: "Benefit Category", field: "description", width: 300},
    ];

    benefitsGrid = new AGGrid('benefitsGrid', benefitsColumnDefs);
    benefitsGrid.multiSelect();
    benefitsGrid.show();

    AWS.callSoap(WS, "listBenefitCategoryCategories").then(data => {
        benefitsGrid.clear();
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);
            benefitsGrid.addRecords(data.item);
        }
    });

    $$('excludeInactiveChild').onChange(() => {
        if ($$('excludeInactiveChild').getValue()) {
            $$('inactiveAsOf').enable();
        } else {
            $$('inactiveAsOf').disable();
        }
    });

    $$('report').onclick(function () {
        if ($$('age').isError('Age'))
            return;
        if ($$('year').isError('Year'))
            return;

        if (benefitsGrid.numberOfSelectedRows() === 0) {
            Utils.showMessage('Error', 'At least one Benefit Category must be selected');
            return;
        }

        let benefitCategoryCategoryIds = [];

        const rows = benefitsGrid.getSelectedRows();
        for (let i = 0; i < rows.length; i++) {
            benefitCategoryCategoryIds.push(rows[i].id);
        }
        const params = {
            age: $$('age').getValue(),
            year: $$('year').getValue(),
            excludeStudent: $$('excludeStudent').getValue(),
            excludeHandicap: $$('excludeHandicap').getValue(),
            inactiveAsOf: $$('excludeInactiveChild') ? $$('inactiveAsOf').getIntValue() : 0,
            benefitCategoryCategoryIds: benefitCategoryCategoryIds
        }

        AWS.callSoap(WS, "getReport", params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });
    });
})();

function addCustomFilter(options){
    var settings = {
        customTitle : '',
        customPrefix : '',
        filtersDiv : '',
        customValues : '',
        customAllowMultiple : '',
        customHandler : function(){},
        defaultValues : [],
        allowNone : true
    };
    jQuery.extend(settings, options);
    var filterData = google.visualization.arrayToDataTable(settings.customValues);

    var filterChartDivId = settings.customPrefix + "_custom_chart";
    var filterChartDiv = "<div id='" + filterChartDivId + "' style='display:none;'></div>";
    jQuery(filterChartDiv).appendTo("#" + settings.filtersDiv);

    var filterFilterDivId = settings.customPrefix + "_custom_filter";
    var filterFilterDiv = "<div id='" + filterFilterDivId + "'></div>";
    jQuery(filterFilterDiv).prependTo("#" + settings.filtersDiv);

    var filterChart = new google.visualization.ChartWrapper({
        'chartType': 'Table',
        'containerId': filterChartDivId,
        'options': {'height': '13em', 'width': '20em'}
    });
    var filterFilter = new google.visualization.ControlWrapper({
        'controlType': 'CategoryFilter',
        'containerId': filterFilterDivId,
        'options': {
            'filterColumnLabel': settings.customTitle,
            'ui': {
                'allowNone' : settings.allowNone,
                'allowTyping': false,
                'allowMultiple': settings.customAllowMultiple,
                'selectedValuesLayout': 'belowStacked'
            }
        }
    });

    var filterDashboard = new google.visualization.Dashboard(document.getElementById(filterChartDivId));
    filterDashboard.bind(filterFilter, filterChart);

    google.visualization.events.addListener(filterFilter, 'statechange', function(event){
        settings.customHandler();
    });

    filterDashboard.draw(filterData);
    filterFilter.setState({"selectedValues":settings.defaultValues});
    return filterFilter;
}


var sortFilterChart = null;
var sortFilterDataTable = null;
var sortFilterObj = null;
var sortFilterArray = {};

function applySortOnChart(){
    var tmpDataView = new google.visualization.DataView(sortFilterDataTable);
    var sortBy = sortFilterObj.getState().selectedValues[0];
    var tmpRows = sortFilterChart.getDataTable().getViewRows();
    var hasFilter = (tmpDataView.getNumberOfRows() !== tmpRows.length);
    var sortedRows;
    if (sortBy && hasFilter){
        sortedRows = sortFilterChart.getDataTable().getSortedRows(sortFilterArray[sortBy][0]);
        if (sortFilterArray[sortBy][1]){
            sortedRows = sortedRows.reverse();
        }
        var tmpFiltered = new google.visualization.DataView(sortFilterChart.getDataTable());
        tmpFiltered.setRows(sortedRows);
        sortFilterChart.setDataTable(tmpFiltered);
        sortFilterChart.draw();
    }
    if (sortBy && !hasFilter){
        sortedRows = tmpDataView.getSortedRows(sortFilterArray[sortBy][0]);
        if (sortFilterArray[sortBy][1]){
            sortedRows = sortedRows.reverse();
        }
        tmpDataView.setRows(sortedRows);
        sortFilterChart.setDataTable(tmpDataView);
        sortFilterChart.draw();
    }
    if (!sortBy && hasFilter){
        var tmpFiltered2 = new google.visualization.DataView(sortFilterChart.getDataTable());
        sortFilterChart.setDataTable(tmpFiltered2);
        sortFilterChart.draw();
    }
    if (!sortBy && !hasFilter){
        sortFilterChart.setDataTable(tmpDataView);
        sortFilterChart.draw();
    }
}

function applyCustomFilters(){
    if (sortFilterObj){
        applySortOnChart();
    }
}

function addSortFilter(options){
    var settings = {
        filtersDiv : '',
        filterTitle : '',
        filterDataTable : null,
        filterChart : null
    };

    jQuery.extend(settings, options);

    sortFilterChart = settings.filterChart;
    sortFilterDataTable = settings.filterDataTable;
    var colsnr = settings.filterDataTable.getNumberOfColumns();
    var cols_array = [[settings.filterTitle]];
    for (var i = 0; i < colsnr; i++){
        cols_array.push([settings.filterDataTable.getColumnLabel(i)]);
        sortFilterArray[settings.filterDataTable.getColumnLabel(i)] = [i, false];
        cols_array.push([settings.filterDataTable.getColumnLabel(i) + " reversed"]);
        sortFilterArray[settings.filterDataTable.getColumnLabel(i) + " reversed"] = [i, true];
    }

    var options2 = {
        customTitle : settings.filterTitle,
        customPrefix : 'sortfilter',
        filtersDiv : settings.filtersDiv,
        customValues : cols_array,
        customAllowMultiple : false,
        customHandler : applyCustomFilters
    };

    sortFilterObj = addCustomFilter(options2);
}

var columnFiltersObj = [];
var columnFriendlyNames;

function getColNameFromFriendly(friendlyname){
    var colName = "";
    jQuery.each(columnFriendlyNames, function(key,value){
        if (value === friendlyname){
            colName = key;
        }
    });
    return (colName);
}

function applyColumnFilters(){

    jQuery("#googlechart_filters").html('');
    jQuery("#googlechart_view").html('');

    var config = [];

    jQuery.each(googlechart_config_array, function(idx, conf){
        if (conf[0] === jQuery("#googlechart_view").attr("chart_id")){
            var chart_id = conf[0];
            var chart_json = conf[1];
            var chart_columns_old = conf[2];
            var chart_filters_old = conf[3];
            var chart_width = conf[4];
            var chart_height = conf[5];
            var chart_filterposition = conf[6];
            var chart_options = conf[7];
            var chart_dashboard = conf[8];
            var chart_showSort = conf[9];
            var chart_hasPNG = conf[10];
            var chart_row_filters = conf[11];
            var chart_sortBy = conf[12];
            var chart_sortAsc = conf[13];

            var chart_columnFilters_old = conf[14];
            var chart_columnFilters_new = [];

            jQuery.each(columnFiltersObj, function(c_idx, columnFilterObj){
                var chart_columnFilter_new = {};
                chart_columnFilter_new.title = chart_columnFilters_old[c_idx].title;
                chart_columnFilter_new.type = chart_columnFilters_old[c_idx].type;
                chart_columnFilter_new.allowempty = chart_columnFilters_old[c_idx].allowempty;
                chart_columnFilter_new.settings = {};
                var defaults_new = [];
                jQuery.each(columnFilterObj.getState().selectedValues, function(idx, default_new){
                    defaults_new.push(getColNameFromFriendly(default_new));
                });
                chart_columnFilter_new.settings.defaults = defaults_new;
                chart_columnFilter_new.settings.selectables = [];
                jQuery.each(chart_columnFilters_old[c_idx].settings.selectables, function(co_idx, columnFilter_old){
                    chart_columnFilter_new.settings.selectables.push(columnFilter_old);
                });
                chart_columnFilters_new.push(chart_columnFilter_new);
            });

            var chart_json_view_columns = [];
            var colnr = 0;
            var chart_columns_new = {};
            chart_columns_new.original = [];
            chart_columns_new.prepared = [];
            jQuery.each(chart_columns_old.original, function(idx, chart_column_old){
                var chart_column_new = {};
                chart_column_new.name = chart_column_old.name;
                chart_column_new.status = chart_column_old.status;
                chart_columns_new.original.push(chart_column_new);
            });

            var usedFilterIdxs = [];
            jQuery.each(chart_columns_old.prepared, function(idx, chart_column_old){
                var columnFilterIdx = -1;
                var shouldSkip;
                jQuery.each(chart_columnFilters_old, function(idx, columnFilter_old){
                    if (columnFilter_old.settings.defaults.indexOf(chart_column_old.name) !== -1){
                        if (usedFilterIdxs.indexOf(idx) === -1){
                            columnFilterIdx = idx;
                            usedFilterIdxs.push(idx);
                        }
                        else{
                            shouldSkip = true;
                        }
                    }
                });
                if (shouldSkip){
                    return;
                }
                if (columnFilterIdx === -1){
                    var chart_column_new = {};
                    chart_column_new.name = chart_column_old.name;
                    chart_column_new.fullname = chart_column_old.fullname;
                    chart_column_new.status = chart_column_old.status;
                    chart_columns_new.prepared.push(chart_column_new);
                    if (chart_column_new.status === 1){
                        chart_json_view_columns.push(colnr);
                        colnr++;
                    }
                }
                else {
                    jQuery.each(chart_columnFilters_new[columnFilterIdx].settings.defaults, function(idx, default_col_new){
                        var chart_column_new = {};
                        chart_column_new.name = default_col_new;
                        chart_column_new.fullname = columnFriendlyNames[default_col_new];
                        chart_column_new.status = 1;
                        chart_columns_new.prepared.push(chart_column_new);
                        chart_json_view_columns.push(colnr);
                        colnr++;
                   });
                }
            });

            var chart_filters_new = {};
            jQuery.each(chart_filters_old,function(key,value){
                var columnFilterIdx = -1;
                jQuery.each(chart_columnFilters_old, function(idx, columnFilter_old){
                    if (columnFilter_old.settings.defaults.indexOf(key) !== -1){
                        columnFilterIdx = idx;
                    }
                });
                if (columnFilterIdx === -1){
                    chart_filters_new[key] = value;
                }
                else{
                    jQuery.each(chart_columnFilters_new[columnFilterIdx].settings.defaults, function(idx, default_col_new){
                        chart_filters_new[default_col_new] = value;
                    });
                }
            });

            chart_json.view.columns = chart_json_view_columns;
            config.push(chart_id);
            config.push(chart_json);
            config.push(chart_columns_new);
            config.push(chart_filters_new);
            config.push(chart_width);
            config.push(chart_height);
            config.push(chart_filterposition);
            config.push(chart_options);
            config.push(chart_dashboard);
            config.push(chart_showSort);
            config.push(chart_hasPNG);
            config.push(chart_row_filters);
            config.push(chart_sortBy);
            config.push(chart_sortAsc);
            config.push(chart_columnFilters_new);
        }
    });
    drawChart(config);
}

function addColumnFilters(options){
    var settings = {
        filtersDiv : '',
        columnFilters : [],
        columns: {},
        chartsettings : []
    };
    jQuery.extend(settings, options);
    columnFriendlyNames = settings.columns;
    columnFiltersObj = [];
    columnFiltersColumnsWithNames = [];
    jQuery.each(settings.columnFilters.reverse(), function(idx, columnFilter){
        var values = [[columnFilter.title]];
        var defaultValues = [];
        jQuery.each(columnFilter.settings.defaults, function(idx, defaultcol){
            defaultValues.push(settings.columns[defaultcol]);
        });
        jQuery.each(columnFilter.settings.selectables, function(idx, selectable){
            values.push([settings.columns[selectable]]);
        });
        var options2 = {
            customTitle : columnFilter.title,
            customPrefix : 'columnfilter' + columnFilter.title,
            filtersDiv: settings.filtersDiv,
            customValues : values,
            customAllowMultiple : (columnFilter.type === '1' ? true : false),
            customHandler : applyColumnFilters,
            defaultValues : defaultValues,
            allowNone : columnFilter.allowempty
        };
        columnFiltersObj.push(addCustomFilter(options2));
    });
    settings.columnFilters.reverse();
    columnFiltersObj.reverse();
}

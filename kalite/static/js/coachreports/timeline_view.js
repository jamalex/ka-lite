function drawChart_timeline(chart_div, dataTable, options) {
//    options["legend"] = 'none';
    options["tooltip"] = { isHtml: 'true', trigger: 'selection' };
    var chart = new google.visualization.LineChart($(chart_div)[0]);

    chart.draw(dataTable, options);
}

function json2dataTable_timeline(json, xaxis, yaxis) {
    var dataTable = new google.visualization.DataTable();
    
    nusers = Object.keys(json['data']).length;

    // One column per user
    dataTable.addColumn(stat2type(xaxis), xaxis);
    for (uid in json['data']) {
        dataTable.addColumn(stat2type(yaxis), json['users'][uid]);
    }
    dataTable.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}});

    for (var ui=0; ui<nusers; ++ui) {
        var uid = Object.keys(json['data'])[ui];
        
        // Collect all the clean data with a cumulative sum
        var good_xdata = [];
        var good_ydata = []
        var all_xdata = json['data'][uid][xaxis];
        var all_ydata = json['data'][uid][yaxis];
        for (var ri in all_xdata) {
            var xdata = all_xdata[ri];
            var ydata = (typeof all_ydata == 'number') ? 1 : all_ydata[ri]; //
            if (xdata == null || ydata == null) {
                continue;
            }
            good_xdata.push(new Date(xdata));
            good_ydata.push( ydata + (good_ydata.length==0 ? 0 : good_ydata[good_ydata.length-1]) );
        }
        
        // Now create a data table
        var data_array = [];
        for (ri=0; ri<good_xdata.length; ++ri) {
        
            var timepoint_array = [null, null]; // xval, tooltip
            for (var i=0; i<nusers; ++i) { // add people
                timepoint_array.push(null);
            }

            timepoint_array[0] = good_xdata[ri];// console.log(data_array[0]);
            timepoint_array[1+ui] = good_ydata[ri];
            timepoint_array[1+nusers] = user2tooltip(json, uid, xaxis, yaxis);//['users'][uid];
            
            data_array.push(timepoint_array);
        }
        dataTable.addRows(data_array);
    }
    return dataTable;
  }

function user2tooltip(json, uid, xaxis, yaxis) {
//    var href = get_current_href();
    var html = "<div class='tooltip'>" + json["users"][uid] + "</div>";
//    html += window.location.href.replace("<a href='/coachreports/student/?user_id=" + uid + "&
    return html;
}

function drawJsonChart(chart_div, json, xaxis, yaxis) {
    var options = {
      title: stat2name(xaxis) + ' vs. ' + stat2name(yaxis) + ' comparison',
      hAxis: {title: stat2name(xaxis) },
      vAxis: {title: stat2name(yaxis) },
    };

    drawChart_timeline(chart_div, json2dataTable_timeline(json, xaxis, yaxis), options);
}

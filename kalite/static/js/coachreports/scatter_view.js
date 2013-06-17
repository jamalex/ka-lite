function drawChart(chart_div, dataTable, options) {
    options["legend"] = 'none';
    options["tooltip"] = { isHtml: 'true', trigger: 'selection' };
    var chart = new google.visualization.ScatterChart($(chart_div)[0]);

    chart.draw(dataTable, options);
}

function bySortedValue(obj, callback, context) {
    var tuples = [];

    for (var key in obj) tuples.push([key, obj[key]]);

    tuples.sort(function(a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });

    return tuples;
}

function tablifyThis(tuples, urlpath, descriptor) {
    var table = "<table class='detail'>";
    for (var i in tuples.slice(0,3)) {
        table += "<tr><td><a href='" + urlpath + tuples[i][0] + "'>" + tuples[i][0] + "</a></td>" + "<td class='data'>" + tuples[i][1] + descriptor +"</td>";
    }
    table += "</table>";
    return table;
}

function obj2num(row, stat, json) {
    var type = stat2type(stat)
    var xdata = (type=="number") ? 0 : new Date();
    
    if (typeof row == 'number') {
        xdata = 0+row;
    } else {
        for (var d in row) {
            switch (stat) {
                case "ex:streak_progress": // compute an average
                case "ex:attempts":
                    xdata += row[d];///json['exercises'].length; 
                    break;
                case "ex:completion_timestamp":
                    if (row[d] != null && xdata > (new Date(row[d]))) {
                        xdata = new Date(row[d]);
                    }
                    break;
                default:
                    xdata += row[d];
                    break;
            }
        }
    }
    return xdata;
}

function json2dataTable(json, xaxis, yaxis) {
    var dataTable = new google.visualization.DataTable();
    
    // 2 data rows and a tooltip.  
    dataTable.addColumn(stat2type(xaxis), xaxis);
    dataTable.addColumn(stat2type(yaxis), yaxis);
    dataTable.addColumn({'type': 'string', 'role': 'tooltip', 'p': {'html': true}});
    // 
    for (var user in json['data']) {
        var xdata = obj2num(json['data'][user][xaxis], xaxis, json);
        var ydata = obj2num(json['data'][user][yaxis], yaxis, json);
        dataTable.addRows([[xdata, ydata, user2tooltip(json, user, xaxis, yaxis)]]);
    }
    return dataTable;
  }
  
function user2tooltip(json, user, xaxis, yaxis) {
    var axes = [xaxis];
    var exercises = json['exercises'];
    var videos = json['videos'];
    var tooltip = "<div class='tooltip'>";
    tooltip += "<div id='legend'><div class='username'>" + json['users'][user] + "</div><div class='legend'><div class='struggling'></div>Struggling</div><div class='legend'><div class='notattempted'></div>Not Attempted</div><div class='legend'><div class='attempted'></div>Attempted</div></div>";
    for (var ai in axes) {
        if(axes[ai] == 'pct_mastery' | axes[ai] == 'effort'){
            axes[ai] = 'ex:attempts';
        }
        // Some data don't have details, they're derived.
        var row = json['data'][user][axes[ai]];
        if (!row || typeof row == 'number')
            continue;

        // Get the prefix and stat name.
        stat_types = axes[ai].split(":");
        if (stat_types.length < 2)  // should never actually hit this
            stat_types = ["[Derived]", "[Derived]"];
        
        var struggling = "<div class='struggling'>";
        var attempted = "<div class='attempted'>";
        var notattempted = "<div class='notattempted'>";
        var struggles = {}
        var attempts = {}
        var notattempts = {}
        if (stat_types[0] == "ex") {
            for (var i in exercises) {
                if (exercises[i] in row) {
                    d = exercises[i]
                    if (parseInt(row[d]) >= 30) { // TODO: Get mastery and struggling data from API to check this more rigorously
                        struggles[d] = parseInt(row[d]);
                    } else {
                        attempts[d] = parseInt(row[d]);
                    }
                } else {
                    notattempts[exercises[i]] = 0;
                }
            }
            struggling += tablifyThis(bySortedValue(struggles), "/exercise/", " attempts") + "</div>"; // TODO: need to funnel in the topic_path here
            attempted += tablifyThis(bySortedValue(attempts), "/exercise/", " attempts") + "</div>"; // need to funnel in the topic_path here
            notattempted += tablifyThis(bySortedValue(notattempts), "/exercise/", " attempts") + "</div>"; // need to funnel in the topic_path here
        } else {
            attempted += "<tr><th>" + "Video" + "</th><th>" + stat_types[1] + "</th>";
            notattempted += "<tr><th>" + "Video" + "</th>";
            for (var i in videos) {
                var url = "/videos/?youtube_id=" + videos[i];
                if (videos[i] in row) {
                    d = videos[i]
                    attempted += "<tr><td><a href='" + url + "'>" + d + "</a></td>" + "<td>" + row[d] + "</td></tr>";
                } else {
                    notattempted += "<tr><td><a href='" + url + "'>" + videos[i] + "</a></td>"; 
                }
            }
        }
        tooltip += (stat_types[0] == "ex" ? struggling : "") + notattempted + attempted;
    }
    tooltip += "</div>"
    
    return tooltip  
}  

function drawJsonChart(chart_div, json, xaxis, yaxis) {
    var options = {
      title: stat2name(xaxis) + ' vs. ' + stat2name(yaxis) + ' comparison',
      hAxis: {title: stat2name(xaxis) },
      vAxis: {title: stat2name(yaxis) },
    };

    drawChart(chart_div, json2dataTable(json, xaxis, yaxis), options);
}

const safeColors = ["#8dd3c7", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f", "#ffffb3"];
const canvasWidth = 200;
const canvasHeight = 200;
var folder = "output";

var targetTopicLevel = 0;
let file_array;
var allMeetings, allSpeakers;
var allJson = {};
var timeView = false;
var keyword = "";

var meetingsBySpeaker = {};
var speakersByEdu = {};
var speakersByGender = {};
var speakersByEnglish = {};
var filter = [];
var loadingStatus = [];

$(document).ready(function () {
    $.getJSON(folder + "/meetinginfo.json", function (meetingInfo) {
        allMeetings = meetingInfo.meetings;
        allSpeakers = meetingInfo.speakers;

        loadControls();
        loadVisualizations();
    });

    $("#txtSearch").val("");
    
    $("#btnGo").click(function () {
        loadVisualizations();
    });

    $(".mode_select input").change(function () {
        timeView = ($(this).val() == "day");
        loadVisualizations();
    });


});

function loadVisualizations() {

    $("#canvas_container").empty();
    loadingStatus = [];
    $("#loadingStatus").html("Loading...");

    keyword = $("#txtSearch").val().trim().toLowerCase();


    var meetingArray = Object.entries(allMeetings);

    if (timeView) {
        var uniqueHours = [];
        for (var m of meetingArray) {
            var meetingHour = m[1].timeStamp.substring(0, 2);
            if (!uniqueHours.includes(meetingHour)) {
                uniqueHours.push(meetingHour);
            }
        }

        uniqueHours.sort();
        for (var i = 0; i < uniqueHours.length; i++) {

            $("#canvas_container").append("<div class=\"row " + (i % 2 == 1 ? "alt" : "") + "\" id=\"row" + uniqueHours[i]
                + "\"><div class=\"heading\">" + (uniqueHours[i] > 12 ? uniqueHours[i] - 12 + "pm" : uniqueHours[i] + "am") + "</div></div><div class=\"clear\"></div>");
        }

    } else {
        $("#canvas_container").append(
            "<div class=\"column alt\" id=\"col1\"><div class=\"heading\">Monday</div></div>"
            + "<div class=\"column\" id=\"col2\"><div class=\"heading\">Tuesday</div></div>"
            + "<div class=\"column alt\" id=\"col3\"><div class=\"heading\">Wednesday</div></div>"
            + "<div class=\"column\" id=\"col4\"><div class=\"heading\">Thursday</div></div>"
            + "<div class=\"column alt\" id=\"col5\"><div class=\"heading\">Friday</div></div>"
            + "<div class=\"column\" id=\"col6\"><div class=\"heading\">Saturday</div></div>"
            + "<div class=\"column\" id=\"col0\"><div class=\"heading\">Sunday</div></div>"
            + "<div class=\"clear\"></div>");
    }


    for (var m of meetingArray) {

        if ((filter.length == 0 && keyword == "") || checkFilter(m)) {
            var themeTerm = "&theme=education";

            if (filter[0] == "edu") {
                themeTerm = "&theme=education";
            }

            if (filter[0] == "gen") {
                themeTerm = "&theme=gender";
            }

            if (filter[0] == "lan") {
                themeTerm = "&theme=english";
            }


            if (timeView) {
                var meetingHour = m[1].timeStamp.substring(0, 2);
                $("#row" + meetingHour).append("<div class=\"centered\"><a href=\"topics.html?file=" + m[0] + ".json" + themeTerm + "\" class=\"meeting_container\" id=\"bookmark_" + m[0] + "\"></a><span class=\"invisible\">" + m[0] + "</span></div>");

            } else {
                var meetingDate = new Date(m[1].dateStamp);
                $("#col" + meetingDate.getDay()).append("<div class=\"centered\"><a href=\"topics.html?file=" + m[0] + ".json" + themeTerm + "\" class=\"meeting_container\" id=\"bookmark_" + m[0] + "\"></a><span class=\"invisible\">" + m[0] + "</span></div><div class=\"clear\"></div>");

            }

            loadJson(m[0] + ".json");
        }
    }

    if (timeView) {
        var maxViz = 0;
        $("#canvas_container .row").each(function (i, v) {
            var vizNum = $(v).find(".meeting_container").length;
            if(vizNum == 0){
                $(v).empty();
                $(v).append("<div class=\"empty_row\">&nbsp;</div>");
                $(v).height(15).css("margin-bottom", "7px");
            }
            maxViz = Math.max(maxViz, vizNum);
        });

        $("#canvas_container .row").width((maxViz + 1) * 350 + 50);
    } else {
        var maxViz = 0;
        $("#canvas_container .column").each(function (i, v) {
            maxViz = Math.max(maxViz, $(v).find(".meeting_container").length);
        });

        $("#canvas_container .column").height((maxViz) * 228 + 25);
    }
}

function toggle(sender, panel_id) {


    $("#" + panel_id).slideToggle(500, function () {
        if ($("#" + panel_id).is(":visible")) {
            $(sender).find("img").attr("src", "style/minus.png");
        } else {
            $(sender).find("img").attr("src", "style/plus.png");
        }
    });

    return false;
}

function loadControls() {

    var meetingArray = Object.entries(allMeetings);
    for (var m of meetingArray) {

        for (var s of m[1].participants) {
            if (meetingsBySpeaker[s]) {
                meetingsBySpeaker[s].push(m[0]);
            } else {
                meetingsBySpeaker[s] = [m[0]];
            }
        }
    }


    var speakerArray = Object.entries(allSpeakers);
    speakerArray.sort(function (a, b) {
        return meetingsBySpeaker[b[0]].length - meetingsBySpeaker[a[0]].length;
    });



    for (var s of speakerArray) {


        var education = s[1].education.toLowerCase();
        var gender = s[1].gender.toLowerCase();
        var english = s[1].english.toLowerCase();

        if (speakersByEdu[education]) {
            speakersByEdu[education].push(s[0]);
        } else {
            speakersByEdu[education] = [s[0]];
        }

        if (speakersByGender[gender]) {
            speakersByGender[gender].push(s[0]);
        } else {
            speakersByGender[gender] = [s[0]];
        }

        if (speakersByEnglish[english]) {
            speakersByEnglish[english].push(s[0]);
        } else {
            speakersByEnglish[english] = [s[0]];
        }
    }

    var speakersByEduArray = Object.entries(speakersByEdu);
    speakersByEduArray.sort(function (a, b) { return educationOrder.indexOf(a[0]) - educationOrder.indexOf(b[0]); });

    var maxValue = 0;

    for (var e of speakersByEduArray) {
        $("#control_education").append("<div class=\"filter_row subheading\" data-filter=\"edu_" + e[0] + "\"><div class=\"group_name \">"
            + e[0]
            + "</div>"
            + "<div class=\"group_control clickable\" onclick='toggle(this, \"panel_edu_" + e[0] + "\")'><img src=\"style/plus.png\" width=\"10\"></div>"
            + "<div class=\"group_value\">"
            + "<span id=\"total_" + e[0] + "\"></span>"
            + "</div>"
            + "<div class=\"clear\"></div></div>");

        $("#control_education").append("<div id=\"panel_edu_" + e[0] + "\" class=\"panel_group_list\"></div>");

        var totalMeetings = [];

        for (var p of e[1]) {
            $("#panel_edu_" + e[0]).append("<div class=\"filter_row\" data-filter=\"edu_ppl_" + p + "\"><div class=\"group_name group_list\">"
                + p
                + "</div>"
                + "<div class=\"group_control\">|</div>"
                + "<div class=\"group_value\" data-value=\"" + meetingsBySpeaker[p].length + "\" data-color=\"" + educationColor[educationOrder.indexOf(e[0])] + "\">"
                + meetingsBySpeaker[p].length
                + "</div>"
                + "<div class=\"clear\"></div>");

            for (var m of meetingsBySpeaker[p]) {
                if (!totalMeetings.includes(m)) {
                    totalMeetings.push(m);
                }
            }

        }



        $("#total_" + e[0]).text(totalMeetings.length);
        $("#total_" + e[0]).parent().attr("data-value", totalMeetings.length);
        $("#total_" + e[0]).parent().attr("data-color", educationColor[educationOrder.indexOf(e[0])]);

        maxValue = Math.max(maxValue, totalMeetings.length);


    }


    for (var e of Object.entries(speakersByGender)) {


        var totalMeetings = [];

        for (var s of e[1]) {
            for (var m of meetingsBySpeaker[s]) {
                if (!totalMeetings.includes(m)) {
                    totalMeetings.push(m);
                }
            }
        }


        $("#control_gender").append("<div class=\"filter_row subheading\" data-filter=\"gen_" + e[0] + "\"><div class=\"group_name\">"
            + e[0]
            + "</div>"
            + "<div class=\"group_control clickable\" onclick='toggle(this, \"panel_gen_" + e[0] + "\")'><img src=\"style/plus.png\" width=\"10\"></div>"
            + "<div class=\"group_value\" data-value=\"" + totalMeetings.length + "\" data-color=\"" + inactiveColor[2] + "\">"
            + totalMeetings.length
            + "</div>"
            + "<div class=\"clear\"></div></div><div id=\"panel_gen_" + e[0] + "\" class=\"panel_group_list\"></div>");


        for (var s of e[1]) {

            $("#panel_gen_" + e[0]).append("<div class=\"filter_row\" data-filter=\"gen_ppl_" + s + "\"><div class=\"group_name group_list\">"
                + s
                + "</div>"
                + "<div class=\"group_control\">|</div>"
                + "<div class=\"group_value\" data-value=\"" + meetingsBySpeaker[s].length + "\" data-color=\"" + genderColor[e[0]] + "\">"
                + meetingsBySpeaker[s].length
                + "</div>"
                + "<div class=\"clear\"></div>");

        }

        maxValue = Math.max(maxValue, totalMeetings.length);

    }

    for (var e of Object.entries(speakersByEnglish)) {

        var totalMeetings = [];

        for (var s of e[1]) {
            for (var m of meetingsBySpeaker[s]) {
                if (!totalMeetings.includes(m)) {
                    totalMeetings.push(m);
                }
            }
        }

        $("#control_english").append("<div class=\"filter_row subheading\" data-filter=\"lan_" + e[0] + "\"><div class=\"group_name\">"
            + e[0]
            + "</div>"
            + "<div class=\"group_control clickable\" onclick='toggle(this, \"panel_lan_" + e[0] + "\")'><img src=\"style/plus.png\" width=\"10\"></div>"
            + "<div class=\"group_value\" data-value=\"" + totalMeetings.length + "\" data-color=\"" + inactiveColor[2] + "\">"
            + totalMeetings.length
            + "</div>"
            + "<div class=\"clear\"></div></div></div><div id=\"panel_lan_" + e[0] + "\" class=\"panel_group_list\"></div>");


        for (var s of e[1]) {

            $("#panel_lan_" + e[0]).append("<div class=\"filter_row\" data-filter=\"lan_ppl_" + s + "\"><div class=\"group_name group_list\">"
                + s
                + "</div>"
                + "<div class=\"group_control\">|</div>"
                + "<div class=\"group_value\" data-value=\"" + meetingsBySpeaker[s].length + "\" data-color=\"" + englishColor[e[0]] + "\">"
                + meetingsBySpeaker[s].length
                + "</div>"
                + "<div class=\"clear\"></div>");

        }

        maxValue = Math.max(maxValue, totalMeetings.length);
    }

    $(".group_value").each(function (i, v) {
        if ($(v).attr("data-value")) {
            var ratio = $(v).attr("data-value") / maxValue;

            $("<div class=\"value_bar\" style=\"width:" + (ratio * 100) + "px; background-color:" + $(v).attr("data-color")
                + "\">&nbsp</div>").insertAfter($(v));
        }
    });

    $(".filter_row").click(function () {
        filterVisualization($(this).attr("data-filter"));
    });

}

function filterVisualization(filterValue) {

    console.log(filterValue);

    $(".filter_row.heading").removeClass("filter_current");
    $(".filter_row.heading .group_value").removeClass("icon_show");
    $(".filter_row").removeClass("data_selected");


    if (filterValue.includes("edu_")) {
        $(".filter_row.heading[data-filter=\"edu_all\"]").addClass("filter_current");
        $(".filter_row.heading[data-filter=\"edu_all\"]").find(".group_value").addClass("icon_show");
        $(".filter_row[data-filter=\"" + filterValue + "\"]").addClass("data_selected");

        activateControlGroup("#control_education");
        deactivateControlGroup($("#control_gender"));
        deactivateControlGroup($("#control_english"));

    }

    if (filterValue.includes("gen_")) {
        $(".filter_row.heading[data-filter=\"gen_all\"]").addClass("filter_current");
        $(".filter_row.heading[data-filter=\"gen_all\"]").find(".group_value").addClass("icon_show");
        $(".filter_row[data-filter=\"" + filterValue + "\"]").addClass("data_selected");

        deactivateControlGroup($("#control_education"));
        activateControlGroup("#control_gender");
        deactivateControlGroup($("#control_english"));
    }

    if (filterValue.includes("lan_")) {
        $(".filter_row.heading[data-filter=\"lan_all\"]").addClass("filter_current");
        $(".filter_row.heading[data-filter=\"lan_all\"]").find(".group_value").addClass("icon_show");
        $(".filter_row[data-filter=\"" + filterValue + "\"]").addClass("data_selected");

        deactivateControlGroup($("#control_education"));
        deactivateControlGroup($("#control_gender"));
        activateControlGroup("#control_english");

    }


    filter = [];
    filter.push(filterValue.substring(0, 3), filterValue.substring(4));

    loadVisualizations();

}

function activateControlGroup(c) {

    $(c).find(".subheading .value_bar").each(function (i, v) {
        var colorGroup = $(v).parent().attr("data-filter");
        var colorFor = colorGroup.substring(4);
        if (colorGroup.includes("edu_")) {
            $(v).css("background-color", educationColor[educationOrder.indexOf(colorFor)]);
        }

        if (colorGroup.includes("gen_")) {
            $(v).css("background-color", genderColor[colorFor]);
        }

        if (colorGroup.includes("lan_")) {
            $(v).css("background-color", englishColor[colorFor]);
        }

    });
}

function deactivateControlGroup(c) {

    $(c).find(".panel_group_list").hide();
    $(c).find(".clickable img").attr("src", "style/plus.png");
    $(c).find(".subheading .value_bar").css("background-color", inactiveColor[2]);

}

function checkFilter(m) {

    var keywordMatch = false;
    var participants = m[1].participants;
    var fileName = m[1].name;

    if (!keyword) {
        keywordMatch = true;
    }else{
        var mTopics = allJson[fileName+".json"].json.topics;
        for(var topic of mTopics){
            if(topic.description.toLowerCase().includes(keyword)){
                keywordMatch = true;
            }
        }
    }

    if (filter.length == 0) {

        return keywordMatch;

    } else {

        if (filter[0] == "edu") {

            if (filter[1].includes("all")) {
                return true && keywordMatch;

            } else if (filter[1].includes("ppl_")) {
                var attendee = filter[1].substring(4).toLowerCase();
                for (var p of participants) {
                    if (p == attendee) {
                        return true && keywordMatch;
                    }
                }
            } else {
                for (var p of participants) {
                    if (allSpeakers[p].education.toLowerCase() == filter[1]) {
                        return true && keywordMatch;
                    }
                }
            }
        }

        if (filter[0] == "gen") {

            if (filter[1].includes("all")) {
                return true && keywordMatch;

            } else if (filter[1].includes("ppl_")) {
                var attendee = filter[1].substring(4).toLowerCase();
                for (var p of participants) {
                    if (p == attendee) {
                        return true && keywordMatch;
                    }
                }
            } else {
                for (var p of participants) {
                    if (allSpeakers[p].gender.toLowerCase() == filter[1]) {
                        return true && keywordMatch;
                    }
                }
            }
        }

        if (filter[0] == "lan") {

            if (filter[1].includes("all")) {
                return true && keywordMatch;

            } else if (filter[1].includes("ppl_")) {
                var attendee = filter[1].substring(4).toLowerCase();
                for (var p of participants) {
                    if (p == attendee) {
                        return true && keywordMatch;
                    }
                }
            } else {
                for (var p of participants) {
                    if (allSpeakers[p].english.toLowerCase() == filter[1]) {
                        return true && keywordMatch;
                    }
                }
            }
        }
    }


    return false;
}

function updateLoadingStatus(meetingID) {

    loadingStatus.push(meetingID);
    if (loadingStatus.length == 75) {
        $("#loadingStatus").html("All 75 meeting are loaded.");
        $("#loadingStatus").fadeOut(3000);
        $(".control_toggle").show("slide", {direction: "right" }, 500);
    } else {
        $("#loadingStatus").html("Loading... " + loadingStatus.length + " out of 75 completed.");
    }

}

function loadJson(fileName) {

    if (allJson[fileName]) {
        loadTranscript(allJson[fileName]["folder"], allJson[fileName]["fileName"], allJson[fileName]["json"]);

    } else {
        $.getJSON(folder + "/" + fileName, function (json) {

            allJson[fileName] = { "folder": folder, "fileName": fileName, "json": json };
            loadTranscript(folder, fileName, json);
        });
    }
}

function loadTranscript(folder, fileName, json) {

    var transcript = new Transcript(json);
    var participants = json.speakers;

    transcript.adjustUtteranceTopic(targetTopicLevel);

    var canvasID = "canvas_" + (fileName.replace(".json", ""));
    var bookmarkID = "#bookmark_" + (fileName.replace(".json", ""));

    $('<canvas>').attr({
        id: canvasID,
        height: canvasHeight
    }).appendTo($(bookmarkID));

    var canvas = document.getElementById(canvasID);


    var speakers = new Map();

    for (i = 0; i < participants.length; i++) {
        participants[i].index = i;
        participants[i].category = participants[i].gender == "Male" ? 0 : 1;
        participants[i].color = getSafeColor(i);

        speakers.set(participants[i].name, participants[i]);
    }


    var topicMap = transcript.getTopicStats();
    var topicArray = Object.entries(topicMap);
    var maxDuration = 0;
    for (var t of topicArray) {
        maxDuration = Math.max(maxDuration, t[1].durationTotal);
        if (transcript.topicList[t[0]]) {
            t[1].description = transcript.topicList[t[0]].description;
        }
    }

    var ratio = (canvasHeight - 50) / maxDuration;

    loadTopicBars(canvas, topicArray, ratio);
    updateLoadingStatus(fileName);
}

function loadTopicBars(canvas, topicArray, ratio) {

    var width = 15;
    var vizWidth = topicArray.length * width + 35;
    $(canvas).attr({
        "width": vizWidth
    });

    $(canvas).parent().width(290);

    for (var t of topicArray) {

        var index = t[1].index;
        var durationTotal = t[1].durationTotal;
        var stats = t[1].stats;

        var statsArray = Object.entries(stats);
        statsArray.sort(function (a, b) {
            return b[1].duration - a[1].duration;
        });

        var y = (canvasHeight - (durationTotal * ratio)) / 2;

        for (var s of statsArray) {
            var speaker = s[1]["speaker"];
            var duration = s[1]["duration"];
            var sectionHeight = duration * ratio;

            var speakerColor = inactiveColor[0];

            if (filter.length == 0) {
                speakerColor = educationColor[educationOrder.indexOf(allSpeakers[speaker].education.toLowerCase())];

            } else if (filter[0] == "edu") {

                if (filter[1].includes("all")) {
                    speakerColor = educationColor[educationOrder.indexOf(allSpeakers[speaker].education.toLowerCase())];

                } else if (filter[1].includes("ppl") && filter[1].includes(speaker)) {
                    speakerColor = educationColor[educationOrder.indexOf(allSpeakers[speaker].education.toLowerCase())];

                } else if (filter[1] == allSpeakers[speaker].education.toLowerCase()) {

                    speakerColor = educationColor[educationOrder.indexOf(allSpeakers[speaker].education.toLowerCase())];
                }
            } else if (filter[0] == "gen") {

                if (filter[1].includes("all")) {
                    speakerColor = genderColor[allSpeakers[speaker].gender.toLowerCase()];

                } else if (filter[1].includes("ppl") && filter[1].includes(speaker)) {
                    speakerColor = genderColor[allSpeakers[speaker].gender.toLowerCase()];

                } else if (filter[1] == allSpeakers[speaker].gender.toLowerCase()) {
                    speakerColor = genderColor[allSpeakers[speaker].gender.toLowerCase()];
                }
            } else if (filter[0] == "lan") {

                if (filter[1].includes("all")) {
                    speakerColor = englishColor[allSpeakers[speaker].english.toLowerCase()];

                } else if (filter[1].includes("ppl") && filter[1].includes(speaker)) {
                    speakerColor = englishColor[allSpeakers[speaker].english.toLowerCase()];

                } else if (filter[1] == allSpeakers[speaker].english.toLowerCase()) {
                    speakerColor = englishColor[allSpeakers[speaker].english.toLowerCase()];
                }
            }


            drawBar(canvas, index, y, sectionHeight, width, speakerColor);

            y += sectionHeight;

        }

    }

}

function drawBar(canvas, index, y, height, width, speakerColor) {

    var ctx = canvas.getContext("2d");
    ctx.fillStyle = speakerColor;
    ctx.fillRect(20 + index * (width), y, (width - 5), height);

}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';

    do {
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
    }
    while (safeColors.includes(color));

    return color;
}

function getSafeColor(index) {

    if (index > 11) {
        return getRandomColor();
    } else {
        return safeColors[index];
    }
}

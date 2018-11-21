var dataset;
var count = 0;
var timelineTime;
var video1 = document.getElementById('video1');
var video_1 = document.getElementById('video_1');
var video2 = document.getElementById('video_2');
var mycan = document.getElementById('myCanvas');
var ctx = mycan.getContext('2d');
var gA = 0.5;
var h = 0;
var opacityCheck = 0;
var c = 0;
var videoTime;
var newDistance = 0;
var groups = new vis.DataSet();
var groupCount = 0;
var locCount = 0;
var tlContainer2 = document.getElementById('timeline2');
var tlContainer = document.getElementById('timeline');
var timeline = new vis.Timeline(tlContainer);
var timeline2 = new vis.Timeline(tlContainer2);
var items2 = new vis.DataSet();
var items = new vis.DataSet();
var searchData = {
    distance: [],
    orientation:[],
    location:[],
    motion: [],
};
var formatTime = function(seconds) {
    seconds = Math.round(seconds);
    var minutes = Math.floor(seconds / 60);
    minutes = (minutes >= 10) ? minutes : "0" + minutes;
    seconds = Math.floor(seconds % 60);
    seconds = (seconds >= 10) ? seconds : "0" + seconds;
    return minutes + ":" + seconds;
};
var progressControl = document.getElementById("progress");
var progressHolder = document.getElementById("progress_box");
var playProgressBar = document.getElementById("play_progress");
var currentTimeDisplay = document.getElementById("current_time_display");
var durationDisplay = document.getElementById("duration_display");
var playProgressInterval;

video1.addEventListener('play', function() {
    trackPlayProgress();
}, false);

var videoWasPlaying;
progressHolder.addEventListener("mousedown", function(){
    stopTrackingPlayProgress();

    if (video1.paused) {
        videoWasPlaying = false;
    } else {
        videoWasPlaying = true;
        video1.pause();
    }

    blockTextSelection();
    document.onmousemove = function(e) {
        setPlayProgress(e.pageX);
    };

    document.onmouseup = function() {
        unblockTextSelection();
        document.onmousemove = null;
        document.onmouseup = null;
        if (videoWasPlaying) {
            video1.play();
            trackPlayProgress();
        }
    }
}, true);

function blockTextSelection(){
    document.body.focus();
    document.onselectstart = function () { return false; };
}

function unblockTextSelection(){
    document.onselectstart = function () { return true; };
}

function findPosX(obj) {
    var curleft = obj.offsetLeft;
    while(obj = obj.offsetParent) {
        curleft += obj.offsetLeft;
    }
    return curleft;
}

progressHolder.addEventListener("mouseup", function(e){
    setPlayProgress(e.pageX);
}, true);

function sizeProgressBar(){
    progressControl.style.width = (controls.offsetWidth - 125) + "px";
    progressHolder.style.width = (progressControl.offsetWidth - 80) + "px";
    updatePlayProgress();
}

function trackPlayProgress(){
    playProgressInterval = setInterval(updatePlayProgress, 33);
}

function stopTrackingPlayProgress(){
    clearInterval(playProgressInterval);
}

function updatePlayProgress(){
    playProgressBar.style.width = ((video1.currentTime / video1.duration) * (progressHolder.offsetWidth - 2)) + "px";
    updateTimeDisplay();
}

function setPlayProgress(clickX) {
    var newPercent = Math.max(0, Math.min(1, (clickX - findPosX(progressHolder)) / progressHolder.offsetWidth));
    video1.currentTime = newPercent * video1.duration;
    video_1.currentTime = newPercent * video_1.duration;
    video2.currentTime = newPercent * video2.duration;
    playProgressBar.style.width = newPercent * (progressHolder.offsetWidth - 2)  + "px";
    updateTimeDisplay();
}

function updateTimeDisplay(){
    currentTimeDisplay.innerHTML = formatTime(video1.currentTime);
    if (video1.duration) durationDisplay.innerHTML = formatTime(video1.duration);
}


//change play and pause button
$('#pausecontrol').on('click', function() {
    var iSelector = $(this).find('i:first');
    if (iSelector.hasClass('glyphicon-play')) {
        iSelector.removeClass('glyphicon-play');
        iSelector.addClass('glyphicon-pause');
    } else if (iSelector.hasClass('glyphicon-pause')) {
        iSelector.removeClass('glyphicon-pause');
        iSelector.addClass('glyphicon-play');
    }
});

//opacity 
function storeValue(newValue) {
    document.getElementById("range").innerHTML = "Opacity: " + newValue + " %";
    window.gA = newValue / 100;
}
//        function move (percentage) {
        //      var range = timeline.getWindow();
        //    var range2 = timeline2.getWindow();
        //      var interval = range.end - range.start;
        //    var interval2 = range2.end - range2.start;
        //      timeline.setWindow({
        //              start: range.start.valueOf() - interval * percentage,
        //              end:   range.end.valueOf()   - interval * percentage
        //      });
        //    timeline2.setWindow({
        //              start: range2.start.valueOf() - interval2 * percentage,
        //              end:   range2.end.valueOf()   - interval2 * percentage
        //      });
        // }

          function showAllGroups(){
                groups.forEach(function(group){
                  groups.update({id: group.id, visible: true});
                })
              };


function init() {
    $.getJSON("newData2.json", function(data) {
        window.dataset = data;
    });

    //  $.getJSON("jsontestNew.json", function(data) {
    //     window.dataset = data;
    // });
    stage = new createjs.Stage("cycLayer");
    document.getElementById("distance").disabled = true;
    document.getElementById('orientation').disabled = true;
    document.getElementById('location').disabled = true;
    document.getElementById('motion').disabled = true;
    document.getElementById('runQuery').disabled = true;
    window.count = 0;

    var video_length = Math.ceil(video1.duration);
    var video_hour = Math.floor(video_length/3600);
    var video_minute = Math.floor((video_length%3600)/60);
    var video_secound = (video_length%3600)%60;
    var st = new Date("2015-03-25T00:00:00Z");
    st.setHours(st.getHours()+video_hour);
    st.setMinutes(st.getMinutes()+video_minute);
    st.setSeconds(st.getSeconds()+video_secound);
    // alert(st);
    var options = {
        moment:function(date) {
            return vis.moment(date).utc();
        },
        groupOrder: 'content',  // groupOrder can be a property name or a sorting function
        showMajorLabels: true,
        format: {
            majorLabels: {
                millisecond:'HH:mm:ss',
                second:     'HH:mm:ss',
                minute:     'HH:mm:ss',
                hour:       ' ',
                weekday:    '',
                day:        '',
                week:       '',
                month:      '',
                year:       ''
            }
        },
        groupOrder: function (a, b) {
            return a.value - b.value;
        },
        groupOrderSwap: function (a, b, groups) {
            var v = a.value;
            a.value = b.value;
            b.value = v;
        },
        groupTemplate: function(group){
            var container = document.createElement('div');
            var label = document.createElement('span');
            label.innerHTML = group.content + ' ';
            container.insertAdjacentElement('afterBegin',label);
            var hide = document.createElement('button');
            hide.className = "glyphicon glyphicon-remove-circle";

            hide.addEventListener('click',function(){
              groups.update({id: group.id, visible: false});
            });
            container.insertAdjacentElement('beforeEnd',hide);
            return container;
        },
        editable:{
            updateGroup: true,
            remove:true,
            updateTime: true
        },
        groupEditable: true,
        timeAxis: {scale: 'second', step: 2},
        zoomable: false,
        start: new Date("2015-03-25T00:00:00Z"),
        end: st,
    };
    var options2 = {
        moment:function(date) {
            return vis.moment(date).utc();
        },
        start: new Date("2015-03-25T00:00:00Z"),
        end: st,
        type: 'point',
        showMajorLabels: true,
        format: {
            majorLabels: {
                millisecond:'HH:mm:ss',
                second:     'HH:mm:ss',
                minute:     'HH:mm:ss',
                hour:       ' ',
                weekday:    '',
                day:        '',
                week:       '',
                month:      '',
                year:       ''
            }
        },

        timeAxis: {scale: 'second', step: 2},
        zoomable: false,
        editable: {
            remove: true,
            updateTime: true,
        },

        groupOrder: function (a, b) {
            return a.value - b.value;
        },
    };

    timeline2.setOptions(options2);
    timeline2.setItems(items2);
    timeline.setOptions(options);
    timeline.setGroups(groups);
    timeline.setItems(items);
   //  document.getElementById('zoomIn').onclick    = function () { timeline.zoomIn( 0.2); timeline2.zoomIn( 0.2);};
      // document.getElementById('zoomOut').onclick   = function () { timeline.zoomOut( 0.2); timeline2.zoomOut( 0.2);};
      // document.getElementById('moveLeft').onclick  = function () { move( 0.2);};
      // document.getElementById('moveRight').onclick = function () { move(-0.2);};
    timeline.on('rangechange', function(properties){
        timeline2.setWindow(properties.start, properties.end);
    });
    timeline2.on('rangechange', function(properties){
        timeline.setWindow(properties.start, properties.end);
    });
    timeline.on('click', function(properties){
        var seconds = properties.time.getUTCHours()*3600 + properties.time.getUTCMinutes()*60 + properties.time.getUTCSeconds();
        // if(seconds > Math.ceil(video1.duration)){
        //   alert("Incorrect video time");
        // }
        // alert(seconds);
        video1.currentTime = seconds;
        video2.currentTime = seconds;
        video_1.currentTime = seconds;
        updatePlayProgress();
    })
}

function colabInBox(text){
    var videoTime = seconds2time(video1.currentTime.toFixed(0));
    c = c + 1;
    var textBuffer = c + " . " + text + ". --  " + videoTime;  
    showCommenttimeline(video1.currentTime, text);
    var div = document.createElement("div");
    var element = document.getElementById("recordView");
    element.appendChild(div);
    var node = document.createTextNode(textBuffer + "  ");
    var btts = document.createElement("button");
    btts.setAttribute('class', 'btn btn-default');
    var icon = document.createElement("span");
    icon.className = "glyphicon glyphicon-remove-circle";
    btts.appendChild(icon);
    btts.addEventListener("click", function(q) {
        $(this).parent().remove();
    });
    div.appendChild(node);
    div.appendChild(btts);
    alert(" '" +text + "' is added on Annotation Timeline!");
}

function submitCmntFloating() {
    var videoTime = seconds2time(video1.currentTime.toFixed(0));
    c = c + 1;
    var textBuffer = c + " . " + document.getElementById("commentsfloat").value + ". --  " + videoTime;
    showCommenttimeline(video1.currentTime, document.getElementById("commentsfloat").value);
    var div = document.createElement("div");
    var element = document.getElementById("recordView");
    element.appendChild(div);
    var node = document.createTextNode(textBuffer + "  ");
    var btts = document.createElement("button");
    btts.setAttribute('class', 'btn btn-default');
    var icon = document.createElement("span");
    icon.className = "glyphicon glyphicon-remove-circle";
    btts.appendChild(icon);
    btts.addEventListener("click", function(q) {
        $(this).parent().remove();
    });
    div.appendChild(node);
    div.appendChild(btts);
    alert("'" + document.getElementById("commentsfloat").value + "' is added on Annotation Timeline!");
    document.getElementById("commentsfloat").value = "";
    
}

function resetCmntFloating() {
    document.getElementById("commentsfloat").value = "";
}

function hideFunction() {
    var x = document.getElementById('commentViewFloat');

    if (x.style.display == 'block') {
        x.style.display = 'none';
    } else {
        x.style.display = 'block';
    }
}

function submitCmnt() {
    var videoTime = seconds2time(video1.currentTime.toFixed(0));
    c = c + 1;
    var textBuffer = c + " . " + document.getElementById("comments").value + ". --  " + videoTime;
    showCommenttimeline(video1.currentTime, document.getElementById("comments").value);
    var div = document.createElement("div");
    var element = document.getElementById("recordView");
    element.appendChild(div);
    var node = document.createTextNode(textBuffer + "  ");
    var btts = document.createElement("button");
    btts.setAttribute('class', 'btn btn-default');
    var icon = document.createElement("span");
    icon.className = "glyphicon glyphicon-remove-circle";
    btts.appendChild(icon);
    btts.addEventListener("click", function(q) {
        $(this).parent().remove();
    });
    div.appendChild(node);
    div.appendChild(btts);
    document.getElementById("comments").value = "";
}

//Change video time to timestring format
function seconds2time(seconds) {
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds - (hours * 3600)) / 60);
    var seconds = seconds - (hours * 3600) - (minutes * 60);
    var time = "";

    if (hours != 0) {
        time = hours + ":";
    }
    if (minutes != 0 || time !== "") {
        minutes = (minutes < 10 && time !== "") ? "0" + minutes : String(minutes);
        time += minutes + ":";
    }
    if (time === "") {
        time = seconds + "s";
    } else {
        time += (seconds < 10) ? "0" + seconds : String(seconds);
    }
    return time;
}


function resetCmnt() {
    //c = 0 ;
    document.getElementById("comments").value = "";
    //document.getElementById("recordView").innerHTML = "";
}

function runmove() {
    if (video1.paused) {
        video1.play();
        video2.play();
        video_1.play();
    }
    document.getElementById("distance").disabled = true;
    document.getElementById('orientation').disabled = true;
    document.getElementById('location').disabled = true;
    document.getElementById('motion').disabled = true;
    document.getElementById('runQuery').disabled = true;
}

function distanceBetweenTwoPoints(x1, y1, x2, y2) {
    var a = x1 - x2
    var b = y1 - y2
    return Math.sqrt(a * a + b * b);
}

function pauseAll() {
    h = 0;
    var myNode = document.getElementById("queryView");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.firstChild);
    }

    document.getElementById("distance").disabled = false;
    document.getElementById('orientation').disabled = false;
    document.getElementById('location').disabled = false;
    document.getElementById('motion').disabled = false;
    document.getElementById('runQuery').disabled = false;

    if (!video1.paused)
        video1.pause();
    if (!video2.paused)
        video2.pause();
    if (!video_1.paused) {
        video_1.pause();
    }

    var ratio = video1.videoWidth / mycan.width;
    var videoWidth = video1.videoWidth / ratio;
    var videoHeight = video1.videoHeight / ratio;
    ctx.clearRect(0, 0, 582, 482);
    ctx.globalAlpha = gA;
    ctx.drawImage(video1, 0, 0, videoWidth, videoHeight);
    window.count = Math.round(video1.currentTime * 3.73);
    var btnlayer = document.getElementById("btnLayer");
    btnlayer.innerHTML = '';
    var cyclayer = document.getElementById("cycLayer");
    var cyctx = cyclayer.getContext('2d');
    cyctx.clearRect(0, 0, 582, 482);
    window.searchData = {
        distance: [],
        orientation:[],
        location: [],
        motion: [],
    };
}

        function Distance() {          
           

            var l = window.dataset[window.count].skeletons.length;
            var btnlayer = document.getElementById("btnLayer");
            btnlayer.style.zIndex = 2;
            var clayer = document.getElementById("cycLayer");
            clayer.style.zIndex = 3;
            var showQtext = "";
            var showtext = "";
            var textBuffer = " ";
            stage.removeAllChildren();
            stage.update();
            if (l == 1) {
                showtext += "";
                showQtext += "";
            } else if (l == 2) {
                var a = (window.dataset[window.count].skeletons[0].head.x - window.dataset[window.count].skeletons[1].head.x);
                var b = (window.dataset[window.count].skeletons[0].head.y - window.dataset[window.count].skeletons[1].head.y);
                var Distance1To2 = Math.sqrt(a * a + b * b);
                showtext += "Distance between Person 1 and Person 2: " + (Distance1To2 / 100 *0.6).toFixed(2) + " m <br>";
            } else {
                var a = (window.dataset[window.count].skeletons[0].head.x - window.dataset[window.count].skeletons[1].head.x);
                var b = (window.dataset[window.count].skeletons[0].head.y - window.dataset[window.count].skeletons[1].head.y);
                var Distance1To2 = Math.sqrt(a * a + b * b);

                var c = (window.dataset[window.count].skeletons[0].head.x - window.dataset[window.count].skeletons[2].head.x);
                var d = (window.dataset[window.count].skeletons[0].head.y - window.dataset[window.count].skeletons[2].head.y);
                var Distance1To3 = Math.sqrt(c * c + d * d);

                var e = (window.dataset[window.count].skeletons[1].head.x - window.dataset[window.count].skeletons[2].head.x);
                var g = (window.dataset[window.count].skeletons[1].head.y - window.dataset[window.count].skeletons[2].head.y);
                var Distance2To3 = Math.sqrt(e * e + g * g);

                showtext += "Distance between Person 1 and Person 2: " + (Distance1To2 / 100 * 0.6).toFixed(2) + " m <br>";
                showtext += "Distance between Person 1 and Person 3: " + (Distance1To3 / 100 * 0.6).toFixed(2) + " m <br>";
                showtext += "Distance between Person 2 and Person 3: " + (Distance2To3 / 100 * 0.6).toFixed(2) + " m <br>";
            }

            for (var i = 0; i < l; i++) {
                var pNo = window.dataset[window.count].skeletons[i].id;
                console.log(pNo);
                showtext += "Person " + (pNo + 1) + ":<br>";
                var a = window.dataset[window.count].skeletons[i].head.y-462;
                 var b = 100 - window.dataset[window.count].skeletons[i].head.x;
                 var DistanceToL = Math.sqrt(a*a +b*b);
                showtext += "Distance To Screen: " + ((DistanceToL)/100 * 0.6).toFixed(2) + " m<br>";

                //button with person name: container+ background + label 
                var background = new createjs.Shape();
                background.name = "background";
                background.graphics.beginFill("white").drawRoundRect(0, 0, 80, 30, 5);
                var label = new createjs.Text("Person " + (pNo + 1), " 16px Courier", "#000000");
                label.name = "label";
                label.textAlign = "center";
                label.textBaseline = "middle";
                label.x = 40;
                label.y = 18;
                var button = new createjs.Container();
                button.name = i;
                //top-left location
                button.x = window.dataset[window.count].skeletons[i].head.x;
                button.y = window.dataset[window.count].skeletons[i].head.y;
                button.alpha = 1;
                button.addChild(background, label);
                stage.addChild(button);
                 var clickText = new createjs.Text("Click any of the person buttons to start. ", " 20px Courier", "#00000");
                clickText.textAlign = "left";
                clickText.x = 4;
                clickText.y = 0;
                stage.addChild(clickText);
                button.on("click", function() {

                   
                    stage.removeAllChildren();

                    stage.update();
                    var enetityName = " ";
                    //add distance conctroller
                    var temp = this.name;

                    pNo = window.dataset[window.count].skeletons[temp].id;

                    stage.mouseMoveOutside = true;
                    var circle = new createjs.Shape();
                    var x = this.x + 40;
                    var y = this.y + 18;
                    var originalRadius = 56;
                    var recWidth = 50;
                    var recHeight = 25;

                    var textLabel = new createjs.Text("Select an entity to create a distance query \nbetween person " + (pNo + 1) + " and it", " 16px Courier", "#00000");
                    textLabel.textAlign = "left";
                    textLabel.x = 100;
                    textLabel.y = 0;
                    stage.addChild(textLabel);

                    var textLabel2 = new createjs.Text("Drag to zoom in or zoom out \nthe green circle to get a specific distance", " 16px Courier", "#00000");
                    textLabel2.textAlign = "left";
                    textLabel2.x = 50;
                    textLabel2.y = 0;
                    textLabel2.alpha = 0;
                    stage.addChild(textLabel2);

                    console.log("123");
                    circle.graphics.beginStroke("green").setStrokeStyle(4).drawCircle(0, 0, originalRadius);

                    var backgroundOS = new createjs.Shape();
                    backgroundOS.name = "background";
                    backgroundOS.graphics.beginFill("#00f000").drawRoundRect(0, 0, 160, 30, 5);
                    var labelOS = new createjs.Text("Smaller than", " 14px Courier", "#000000");
                    labelOS.name = "label";
                    labelOS.textAlign = "center";
                    labelOS.textBaseline = "middle";
                    labelOS.x = 80;
                    labelOS.y = 18;

                    var buttonOS = new createjs.Container();
                    buttonOS.name = temp + 1;

                    //top-left location
                    buttonOS.x = x - 80;
                    buttonOS.y = y - 40;
                    buttonOS.addChild(backgroundOS, labelOS);
                    buttonOS.alpha = 0;

                    var backgroundOL = new createjs.Shape();
                    backgroundOL.name = "background";
                    backgroundOL.graphics.beginFill("#00f000").drawRoundRect(0, 0, 160, 30, 5);
                    var labelOL = new createjs.Text("Larger than", " 14px Courier", "#000000");
                    labelOL.name = "label";
                    labelOL.textAlign = "center";
                    labelOL.textBaseline = "middle";
                    labelOL.x = 80;
                    labelOL.y = 18;

                    var buttonOL = new createjs.Container();
                    buttonOL.name = temp + 1;

                    //top-left location
                    buttonOL.x = x - 80;
                    buttonOL.y = y +10 ;
                    buttonOL.addChild(backgroundOL, labelOL);
                    buttonOL.alpha = 0;

                    console.log("sRect");
                    var sRect = new createjs.Shape();
                    sRect.graphics.beginFill("#00f000").drawRoundRect(-(recWidth / 2), originalRadius - (recHeight / 2), recWidth, recHeight, 5);
                    var sLabel = new createjs.Text("Drag", " 12px Courier", "#00000");
                    sLabel.textAlign = "center";
                    sLabel.x += recWidth / 2 - 25;
                    sLabel.y += originalRadius - (recHeight / 2) + 6;

                    // var lRect = new createjs.Shape();
                    // lRect.graphics.beginFill("#00f000").drawRoundRect(-(recWidth / 2), -(originalRadius + (recHeight / 2)), recWidth, recHeight, 5);
                    // var lLabel = new createjs.Text("larger", " 12px Courier", "#00000");
                    // lLabel.textAlign = "center";
                    // lLabel.x += recWidth / 2 - 25;
                    // lLabel.y -= originalRadius + (recHeight / 2) - 6;

                    var sDragger = new createjs.Container();
                    sDragger.x = x;
                    sDragger.y = y;

                    // var lDragger = new createjs.Container();
                    // lDragger.x = x;
                    // lDragger.y = y;

                    sDragger.addChild(circle);
                    sDragger.addChild(sRect, sLabel);
                    // lDragger.addChild(lRect, lLabel);

                    //initial opacity is 0
                    sDragger.alpha  = 0;

                    stage.addChild(sDragger);
                    stage.addChild(buttonOS,buttonOL);
                    //step: select enetity
                    //one person condition

                    if ((pNo + 1) == 1) {
                        //selections person 1
                        //large screen container
                        console.log(pNo);
                         var lineSC = new createjs.Shape();
   lineSC.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(180,456);

                        var largeSC = new createjs.Container();
                        var largeScreen = new createjs.Shape();
                        largeScreen = new createjs.Shape();
                        largeScreen.graphics.beginStroke("black").beginFill("white").drawRect(100, 462, 190, 10);
                        largeScreen.rotation = -5;
                        var screenLabel = new createjs.Text("large screen", " 9px Courier", "#00000");
                        screenLabel.textAlign = "center";
                        screenLabel.x = 246;
                        screenLabel.y = 443;
                        screenLabel.rotation = -5;
                        largeSC.addChild(lineSC,largeScreen, screenLabel);

                        //person 2 selector
                        var person2c = new createjs.Container();
                        var person2h = new createjs.Shape();
                         var line2 = new createjs.Shape();
   line2.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(40,40);
   

                        person2h.graphics.beginFill("lightgreen").drawCircle(40, 40, 30);
                        var person2t = new createjs.Text("person2", " 10px Courier", "#00000");
                        person2t.textAlign = "center";
                        person2t.x = 40;
                        person2t.y = 32;

                        person2c.addChild(line2,person2h, person2t);

                        //person 3 selector
   //                      var person3c = new createjs.Container();
   //                       var line3 = new createjs.Shape();
   // line3.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(40,110);
   //                      var person3h = new createjs.Shape();

   //                      person3h.graphics.beginFill("lightgreen").drawCircle(40, 110, 30);
   //                      var person3t = new createjs.Text("person3", " 10px Courier", "#00000");
   //                      person3t.textAlign = "center";
   //                      person3t.x = 40;
   //                      person3t.y = 102;

   //                      person3c.addChild(line3,person3h, person3t);
                        stage.addChild(largeSC, person2c);

                        //monitor which eneity is clicked
                        largeSC.on("click", function() {
                            textLabel.alpha = 0;
                            enetityName = "large screen";
                            textLabel2.alpha = 1;
                            largeSC.alpha = 0;
                          person2c.alpha = largeSC.alpha = 0;
                            sDragger.alpha=1;
                            stage.update();
                        })


                        person2c.on("click", function() {
                            textLabel2.alpha = 1;
                            textLabel.alpha = 0;
                            enetityName = "person 2";
                            largeSC.alpha = 0;
                           person2c.alpha = largeSC.alpha = 0;
                            sDragger.alpha=1;
                            stage.update();
                        })


                        // person3c.on("click", function() {
                        //     textLabel2.alpha = 1;
                        //     textLabel.alpha = 0;
                        //     enetityName = "person 3";
                        //     largeSC.alpha = 0;
                        //     person3c.alpha = person2c.alpha = largeSC.alpha = 0;
                        //                               sDragger.alpha=1;;
                        //     stage.update();
                        // })
                        stage.update();
                    }


                    //second person condition
                    if ((pNo + 1) == 2) {
                        //selections person 1
                        console.log(pNo);
                        //large screen container
                        // button.removeAllChildren();
                        var largeSC = new createjs.Container();
                        var largeScreen = new createjs.Shape();
                          var lineSC = new createjs.Shape();
   lineSC.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(180,456);
                        largeScreen = new createjs.Shape();
                        largeScreen.graphics.beginStroke("black").beginFill("white").drawRect(100, 462, 190, 10);
                        largeScreen.rotation = -5;
                        var screenLabel = new createjs.Text("large screen", " 9px Courier", "#00000");
                        screenLabel.textAlign = "center";
                        screenLabel.x = 246;
                        screenLabel.y = 443;
                        screenLabel.rotation = -5;
                        largeSC.addChild(lineSC, largeScreen, screenLabel);

                        //person 2 selector
                        var person2c = new createjs.Container();
                        var person2h = new createjs.Shape();
                         var line2 = new createjs.Shape();
   line2.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(40,40);

                        person2h.graphics.beginFill("lightgreen").drawCircle(40, 40, 30);
                        var person2t = new createjs.Text("person1", " 10px Courier", "#00000");
                        person2t.textAlign = "center";
                        person2t.x = 40;
                        person2t.y = 32;
                        person2c.addChild(line2, person2h, person2t);

                        //person 3 selector
                        var line3 = new createjs.Shape();
   line3.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(40,110);
                        // var person3c = new createjs.Container();
                        // var person3h = new createjs.Shape();

                        // person3h.graphics.beginFill("lightgreen").drawCircle(40, 110, 30);
                        // var person3t = new createjs.Text("person3", " 10px Courier", "#00000");
                        // person3t.textAlign = "center";
                        // person3t.x = 40;
                        // person3t.y = 102;

                        // person3c.addChild(line3,person3h, person3t);
                        stage.addChild(largeSC, person2c);

                        //monitor which eneity is clicked
                        largeSC.on("click", function() {
                            textLabel2.alpha = 1;
                            textLabel.alpha = 0;
                            enetityName = "large screen";
                            largeSC.alpha = 0;
                           person2c.alpha = largeSC.alpha = 0;

                             sDragger.alpha=1;
                            stage.update();
                        })


                        person2c.on("click", function() {
                            textLabel2.alpha = 1;
                            textLabel.alpha = 0;
                            enetityName = "person 1";
                            largeSC.alpha = 0;
                         person2c.alpha = largeSC.alpha = 0;

                            sDragger.alpha=1;
                            stage.update();

                        })




                        stage.update();
                    }

                    //third person condition

                    // if ((pNo + 1) == 3) {
                    //     //selections person 1
                    //     //large screen container
                    //     console.log(pNo);
                    //     var largeSC = new createjs.Container();
                    //     var largeScreen = new createjs.Shape();
                    //     var lineSC = new createjs.Shape();
                    //     lineSC.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(180,456);
                    //     largeScreen = new createjs.Shape();
                    //     largeScreen.graphics.beginStroke("black").beginFill("white").drawRect(100, 462, 190, 10);
                    //     largeScreen.rotation = -5;
                    //     var screenLabel = new createjs.Text("large screen", " 9px Courier", "#00000");
                    //     screenLabel.textAlign = "center";
                    //     screenLabel.x = 246;
                    //     screenLabel.y = 443;
                    //     screenLabel.rotation = -5;
                    //     largeSC.addChild(lineSC,largeScreen, screenLabel);

                    //     //person 2 selector
                    //     var person2c = new createjs.Container();
                    //     var person2h = new createjs.Shape();
                    //     var line2 = new createjs.Shape();
                    //     line2.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(40,40);

                    //     person2h.graphics.beginFill("lightgreen").drawCircle(40, 40, 30);
                    //     var person2t = new createjs.Text("person1", " 10px Courier", "#00000");
                    //     person2t.textAlign = "center";
                    //     person2t.x = 40;
                    //     person2t.y = 32;

                    //     person2c.addChild(line2,person2h, person2t);

                    //     //person 3 selector
                    //     var person3c = new createjs.Container();
                    //     var person3h = new createjs.Shape();

                    //     person3h.graphics.beginFill("lightgreen").drawCircle(40, 110, 30);
                    //     var person3t = new createjs.Text("person2", " 10px Courier", "#00000");
                    //     person3t.textAlign = "center";
                    //     person3t.x = 40;
                    //     person3t.y = 102;
                    //     var line3 = new createjs.Shape();

                    //     line3.graphics.moveTo(x,y).setStrokeStyle(2).beginStroke("#5CB85B").lineTo(40,110);

                    //     person3c.addChild(line3,person3h, person3t);
                    //     stage.addChild(largeSC, person2c, person3c);

                    //     //monitor which eneity is clicked
                    //     largeSC.on("click", function() {
                    //         textLabel2.alpha = 1;
                    //         textLabel.alpha = 0;
                    //         enetityName = "large screen";
                    //         largeSC.alpha = 0;
                    //         person3c.alpha = person2c.alpha = largeSC.alpha = 0;

                    //          sDragger.alpha=1;
                    //         stage.update();

                    //     })


                    //     person2c.on("click", function() {
                    //         textLabel2.alpha = 1;
                    //         textLabel.alpha = 0;
                    //         enetityName = "person 1";
                    //         largeSC.alpha = 0;
                    //         person3c.alpha = person2c.alpha = largeSC.alpha = 0;

                    //         // sDragger.alpha = lDragger.alpha = 1;
                    //         sDragger.alpha=1;
                    //         stage.update();

                    //     })


                    //     person3c.on("click", function() {
                    //         textLabel2.alpha = 1;
                    //         textLabel.alpha = 0;
                    //         enetityName = "person 2";
                    //         largeSC.alpha = 0;
                    //         person3c.alpha = person2c.alpha = largeSC.alpha = 0;

                           
                    //         sDragger.alpha=1;
                    //         stage.update();

                    //     })


                    //     stage.update();
                    // }


                    //drag start         

                    console.log("drag start");
                    sDragger.on("pressup", function(evt) {

                        sDragger.removeAllChildren();
                        buttonOS.alpha = buttonOL.alpha = 1;

                        labelOS.text = "Smaller than " + (newDistance/100*0.6).toFixed(2) + "m";
                        labelOL.text = "Larger than " + (newDistance/100*0.6).toFixed(2) + "m";
                        newDistance = distanceBetweenTwoPoints(x, y, evt.stageX, evt.stageY);


                        var circle = new createjs.Shape();
                        circle.graphics.beginStroke("green").setStrokeStyle(4).drawCircle(0, 0, newDistance);
                        originalRadius = newDistance;
                        //h = h + 1;
                        // Using h as a counter, h is a global variable, and will be added 1 whenever it is called. So the printed out query would not be messed up with each other. 

                        


                        var sRect = new createjs.Shape();
                        sRect.graphics.beginFill("#00f000").drawRoundRect(-(recWidth / 2), originalRadius - (recHeight / 2), recWidth, recHeight, 5);
                        var sLabel = new createjs.Text((newDistance/100 * 0.6).toFixed(2) +"m", " 12px Courier", "#00000");
                        sLabel.textAlign = "center";
                        sLabel.x += recWidth / 2 - 25;
                        sLabel.y += originalRadius - (recHeight / 2) + 6;
                      


                        // var lRect = new createjs.Shape();
                        // lRect.graphics.beginFill("#00f000").drawRoundRect(-(recWidth / 2), -(originalRadius + (recHeight / 2)), recWidth, recHeight, 5);
                        // var lLabel = new createjs.Text("larger", " 12px Courier", "#00000");
                        // lLabel.textAlign = "center";
                        // lLabel.x += recWidth / 2 - 25;
                        // lLabel.y -= originalRadius + (recHeight / 2) - 6;


                        sDragger.scaleX = sDragger.scaleY = 1;

                        sDragger.addChild(circle);

                        
                        sDragger.addChild(sRect, sLabel);
                        buttonOS.alpha = 1;
                        buttonOL.alpha = 1;
                        stage.update();
                    });

                      sDragger.on("pressmove", function(evt) {
                    
                        newDistance = distanceBetweenTwoPoints(x, y, evt.stageX, evt.stageY);
                        evt.currentTarget.scaleX = newDistance / originalRadius;
                        evt.currentTarget.scaleY = newDistance / originalRadius;
                        buttonOS.alpha = buttonOL.alpha = 0;
                        
                        // sDragger.removeChild(sLabel);
                        sLabel.text=(newDistance/100 * 0.6).toFixed(2) + "m";
                        // sDragger.addChild(sLabel);

                        stage.update();

                    });



                    buttonOS.on("click", function() {
                        // h = h + 1;

                        sDragger.alpha = buttonOS.alpha = buttonOL.alpha= 0;

                         $('a[href="#queryView"]').tab('show')
                        textLabel2.alpha = 0;
                        textBuffer ="· Distance between person " + (pNo + 1) + " and " + enetityName + " is smaller than " +((originalRadius / 100) * 0.6).toFixed(2) + " m.";
                                                
                        var d = {"obj1": "person " + (pNo + 1), "obj2": enetityName, "relation": "s", "distancebetween": (newDistance / 100 * 0.6).toFixed(2)};
                        window.searchData.distance.push(d);
                        makeQuery(textBuffer, "d", d);
                        alert("A new query: " + textBuffer + " is added! Check the 'Query' tab.");
                        // makeQuery is the function to add both text and button dynamically to the queryView
                        // It takes textBuffer, which is got before, as the only parameter. 
                        // Each time this function is called, it takes the desired text message, and will return the 
                        // message in the queryView. The message will be arranged in numerical sequence based on "h" .
                        // Each message will also allow user to delete it dynamically, right away. 
                        // This function has been applied in Distance(), Orientation() and Motion(), whenever there 
                        // is desired query message need to be put inside the queryView.  

                        stage.update();
                    })

                     buttonOL.on("click", function() {

                        // h = h + 1;


                        sDragger.alpha = buttonOS.alpha = buttonOL.alpha= 0;
                        $('a[href="#queryView"]').tab('show');
                        textLabel2.alpha = 0;
                        textBuffer = "· Distance between person " + (pNo + 1) + " and " + enetityName + " is larger than " + ((newDistance / 100) * 0.6).toFixed(2) + " m.";
                                                 
                                                var d = {"obj1": "person " + (pNo + 1), "obj2": enetityName, "relation": "l", "distancebetween": (newDistance / 100 * 0.6).toFixed(2)};
                                                window.searchData.distance.push(d);
                        makeQuery(textBuffer, "d", d);

                        alert("A new query: " + textBuffer + " is added! Check the 'Query' tab.");
                        // makeQuery is the function to add both text and button dynamically to the queryView
                        // It takes textBuffer, which is got before, as the only parameter. 
                        // Each time this function is called, it takes the desired text message, and will return the 
                        // message in the queryView. The message will be arranged in numerical sequence based on "h" .
                        // Each message will also allow user to delete it dynamically, right away. 
                        // This function has been applied in Distance(), Orientation() and Motion(), whenever there 
                        // is desired query message need to be put inside the queryView.  

                        stage.update();
                    });



                        

                    stage.update();
                });




                    


                stage.update();



            }
            $("#showinfo").html(showtext);
           

        }





function Location() {
    var l = window.dataset[window.count].skeletons.length;
    stage.removeAllChildren();
    stage.update();
    var btnlayer = document.getElementById("btnLayer");
    btnlayer.style.zIndex = 2;
    var clayer = document.getElementById("cycLayer");
    clayer.style.zIndex = 3;
    var showQtext = "";
    var showtext = "";
    var textBuffer = " ";
    var locationData;
    locationData=[];

    for (var i = 0; i < l; i++) {
        var pNo = window.dataset[window.count].skeletons[i].id;
        showtext += "Person " + (pNo + 1) + ":<br>";
        showtext += " (" + window.dataset[window.count].skeletons[i].head.x + ", " + window.dataset[window.count].skeletons[i].head.y + ") " + "<br>";
    }

    $("#showinfo").html(showtext);

    var backgroundO = new createjs.Shape();
    backgroundO.name = "background";
    backgroundO.graphics.beginFill("#D9534F").drawRoundRect(0, 0, 60, 20, 5);
    var labelO = new createjs.Text("Finish", " 14px Courier", "#000000");
    labelO.name = "label";
    labelO.textAlign = "center";
    labelO.textBaseline = "middle";
    labelO.x = 30;
    labelO.y = 12;

    var buttonO = new createjs.Container();
    buttonO.x = 520;
    buttonO.y = 0;
    buttonO.addChild(backgroundO, labelO);
    stage.addChild(buttonO);

    var backgroundC = new createjs.Shape();
    backgroundC.name = "background";
    backgroundC.graphics.beginStroke("#D9534F").beginFill("#FFFFFF").drawRoundRect(0, 0, 60, 20, 5);
    var labelC = new createjs.Text("Draw", " 14px Courier", "#000000");
    labelC.name = "label";
    labelC.textAlign = "center";
    labelC.textBaseline = "middle";
    labelC.x = 30;
    labelC.y = 12;

    var buttonC = new createjs.Container();
    buttonC.x = 450;
    buttonC.y = 0;
    buttonC.addChild(backgroundC, labelC);
    stage.addChild(buttonC);

    var largeSC = new createjs.Container();
    var largeScreen = new createjs.Shape();
    largeScreen = new createjs.Shape();
    largeScreen.graphics.beginStroke("black").beginFill("white").drawRect(100, 462, 190, 10);
    largeScreen.rotation = -5;
    var screenLabel = new createjs.Text("large screen", " 9px Courier", "#00000");
    screenLabel.textAlign = "center";
    screenLabel.x = 246;
    screenLabel.y = 443;
    screenLabel.rotation = -5;
    largeSC.addChild(largeScreen, screenLabel);
    stage.addChild(largeSC);

    var textLabel = new createjs.Text("Click Draw button to select locations by \nclicking and then draging to draw. \nFill the area rather than drawing a border", " 16px Courier", "#00000");
        textLabel.textAlign = "left";
        textLabel.x = 4;
        textLabel.y = 0;
        stage.addChild(textLabel);
        stage.update(); 

    //start draw 
    buttonC.on("click", function() {
        //alert(JSON.stringify(window.searchData));
        locationData = [];
        stage.removeAllChildren();
        stage.addChild(buttonC,buttonO,textLabel,largeSC);
        textLabel.text = "Click Draw button again to redraw. \nClick Finish button to finish and create a query", " 16px Courier", "#00000"
        stage.update();

        var art;
        // var stage = new createjs.Stage(clayer);

        var x, y, listener;
        art = stage.addChild(new createjs.Shape());

        stage.update();

        art.cache(20, 40, 562, 440);

        stage.on("stagemousedown", startDraw);

        function startDraw(evt) {

            listener = stage.on("stagemousemove", draw);
            stage.on("stagemouseup", endDraw);
            color = "#D96B67";
            x = evt.stageX - 0.001; // offset so we draw an initial dot
            y = evt.stageY - 0.001;
            console.log("add2");
            draw(evt); // draw the initial dot
        }


        function draw(evt) {

            art.graphics.ss(40, 1).s(color).mt(x, y).lt(evt.stageX, evt.stageY);

            // the composite operation is the secret sauce.
            // we'll either draw or erase what the user drew.
            art.updateCache(erase.checked ? "destination-out" : "source-over");




            art.graphics.clear();
            x = evt.stageX;
            y = evt.stageY;

            lx = x.toFixed(0) -10;
            ly = y.toFixed(0) ;
            // console.log(x,y);
            // console.log(lx,ly);

            var lo = {"x": lx, "y": ly};

            locationData.push(lo);
            stage.update();
        }

        function endDraw(evt) {
            stage.off("stagemousemove", listener);
            evt.remove();
        }
})

    buttonO.on("click", function() {
        // stage.removeAllChildren();
        // stage.update();
        // h = h + 1;
        // locationData.xData = locationData.xData.pop();
        // locationData.yData = locationData.yData.pop();
        $('a[href="#queryView"]').tab('show');
        locationData.splice(-1,1);
        console.log(locationData);


        var l = {"locid": window.locCount, "locinfo": locationData};
        window.searchData.location.push(l);
        window.locCount += 1;
        //alert(JSON.stringify(window.searchData));

        // Using h as a counter, h is a global variable, and will be added 1 whenever it is called. So the printed out query would not be messed up with each other. 

        textBuffer ="· Someone is on one of these locations.";
        alert("A new query: " +textBuffer +" is added! Check the 'Query' tab.");
        makeQuery(textBuffer, "l", l);
    })










} //end location




function Orientation() {





    var l = window.dataset[window.count].skeletons.length;
    var btnlayer = document.getElementById("btnLayer");
    btnlayer.style.zIndex = 2;
    var clayer = document.getElementById("cycLayer");
    clayer.style.zIndex = 3;

    var showQtext = "";
    var showtext = "";
    var textBuffer = " ";




    stage.removeAllChildren();
    stage.update();

    var clickText = new createjs.Text("Click any of the person buttons to start. ", " 20px Courier", "#00000");
        clickText.textAlign = "left";
        clickText.x = 4;
        clickText.y = 0;
        stage.addChild(clickText);




    for (var i = 0; i < l; i++) {
        var pNo = window.dataset[window.count].skeletons[i].id;
        showtext += "Person " + (pNo + 1) + ":<br>";
        showtext += window.dataset[window.count].skeletons[i].head.orientation + "<br>";


        //button with person name: container+ background + label 
        var background = new createjs.Shape();
        background.name = "background";
        background.graphics.beginFill("white").drawRoundRect(0, 0, 80, 30, 5);
        var label = new createjs.Text("Person " + (pNo + 1), " 16px Courier", "#000000");
        label.name = "label";
        label.textAlign = "center";
        label.textBaseline = "middle";
        label.x = 40;
        label.y = 18;
        var button = new createjs.Container();
        button.name = i;
        //top-left location
        button.x = window.dataset[window.count].skeletons[i].head.x;
        button.y = window.dataset[window.count].skeletons[i].head.y;
        button.alpha = 1;
        button.addChild(background, label);







        //button on click
        button.on("click", function() {
            this.alpha = 0;
            clickText.alpha = 0;



            var temp = this.name;
            var pNo = window.dataset[window.count].skeletons[temp].id;
            var x = this.x + 50;
            var y = this.y + 18;
            var textLabel = new createjs.Text("Drag the orange bar to select a direction \nthat person " + (pNo + 1) + " is looking at. \nClick OK to create a query", " 14px Courier", "#00000");
            textLabel.textAlign = "left";
            textLabel.x = 40;
            textLabel.y = 0;
            stage.addChild(textLabel);

             var textLabelO = new createjs.Text( (window.dataset[window.count].skeletons[temp].head.orientation).toFixed(0), " 12px Courier", "#00000");
            textLabelO.textAlign = "left";
            textLabelO.x = x-14;
            textLabelO.y = y-5;



            stage.mouseMoveOutside = true;

            var largeSC = new createjs.Container();
    var largeScreen = new createjs.Shape();
    largeScreen = new createjs.Shape();
    largeScreen.graphics.beginStroke("black").beginFill("white").drawRect(100, 462, 190, 10);
    largeScreen.rotation = -5;
    var screenLabel = new createjs.Text("large screen", " 9px Courier", "#00000");
    screenLabel.textAlign = "center";
    screenLabel.x = 246;
    screenLabel.y = 443;
    screenLabel.rotation = -5;
    largeSC.addChild(largeScreen, screenLabel);
    stage.addChild(largeSC);

            var circle = new createjs.Shape();
            circle.graphics.beginFill("#F0AD4E").drawCircle(-3, 0, 10);


            var orienLineC = new createjs.Shape();
            orienLineC.graphics.beginStroke("#F0AD4E").beginFill("#F0AD4E").drawRect(0, 0, 90, 4);


            var orienLinel = new createjs.Shape();
            orienLinel.graphics.beginStroke("#F0CD9B").beginFill("#F0CD9B").drawRect(0, 0, 70, 2);

            var orienLiner = new createjs.Shape();
            orienLiner.graphics.beginStroke("#F0CD9B").beginFill("#F0CD9B").drawRect(0, 0, 70, 2);




            orienLineC.rotation = window.dataset[window.count].skeletons[temp].head.orientation;
            orienLinel.rotation = window.dataset[window.count].skeletons[temp].head.orientation + 50;
            orienLiner.rotation = window.dataset[window.count].skeletons[temp].head.orientation - 50;



            var dragger = new createjs.Container();
            dragger.x = x;
            dragger.y = y;

            dragger.addChild(orienLineC, orienLinel, orienLiner, circle);
            stage.addChild(dragger);

            var arrow = new createjs.Container();
            arrow.x = 500;
            arrow.y = 5;
            var lineV = new createjs.Shape();
            lineV.graphics.beginStroke("#F0AD4E").beginFill("#F0AD4E").drawRect(0, 0, 90, 2);
            lineV.rotation = 90;
            var lineH = new createjs.Shape();
            lineH.graphics.beginStroke("#F0AD4E").beginFill("#F0AD4E").drawRect(-45, 45, 90, 2);
            var zero9 = new createjs.Text("90°", " 14px Courier", "#00000");
            zero9.textAlign = "left";
            zero9.x = 5;
            zero9.y = 90;
            var zero0 = new createjs.Text("0°", " 14px Courier", "#00000");
            zero0.textAlign = "left";
            zero0.x = 45;
            zero0.y = 50;
            var zero270 = new createjs.Text("270°", " 14px Courier", "#00000");
            zero270.textAlign = "left";
            zero270.x = 5;
            zero270.y = 0;
            var zero18 = new createjs.Text("180°", " 14px Courier", "#00000");
            zero18.textAlign = "left";
            zero18.x = -55;
            zero18.y = 50;

            arrow.addChild(lineV, lineH, zero0, zero9, zero270, zero18);
            stage.addChild(arrow,textLabelO);




            // console.log(orienLine.rotation);


            var backgroundO = new createjs.Shape();
            backgroundO.name = "background";
            backgroundO.graphics.beginFill("#F2B12A").drawRoundRect(0, 0, 30, 20, 5);
            var labelO = new createjs.Text("OK", " 12px Courier", "white");
            labelO.name = "label";
            labelO.textAlign = "center";
            labelO.textBaseline = "middle";
            labelO.x = 15;
            labelO.y = 10;

            var buttonO = new createjs.Container();
            buttonO.name = temp + 1;

            //top-left location
            buttonO.x = x - 15;
            buttonO.y = y - 10;
            buttonO.addChild(backgroundO, labelO);
            buttonO.alpha = 0;


            stage.addChild(buttonO);



            stage.update();




            dragger.on("pressmove", function(evt) {

                var angle = orAngle(x, y, evt.stageX, evt.stageY);
                 buttonO.alpha=0;



                if (angle < 0) {
                    angle = 360 + angle;

                };

                orienLineC.rotation = angle;
                orienLiner.rotation = angle - 50;
                orienLinel.rotation = angle + 50;
                textLabelO.alpha=1;

                textLabelO.text = angle.toFixed(0);    





                stage.update();
            });

            function orAngle(x1, y1, x2, y2) {
                var rads = Math.atan2(y2 - y1, x2 - x1);
                var angle = rads * (180 / Math.PI);

                return angle;
            };



            dragger.on("pressup", function(evt) {

                buttonO.alpha=1;
                textLabelO.alpha=0;


                stage.update();
                console.log(h);

            });




            buttonO.on("click", function() {
                textLabel.alpha = 0;
                dragger.alpha = 0;
                clickText.alpha = 1;

                $('a[href="#queryView"]').tab('show');

                // h = h + 1;
                // alert("test");

                // textBuffer = h + textBuffer;


                this.alpha = 0;
                  stage.update();

                // textBuffer = h + ". Orientation of person " + (pNo +1) + " is about " + orienLineC.rotation.toFixed(2) + "°";
                textBuffer = "· Orientation of person " + (pNo +1) + " is about " + orienLineC.rotation.toFixed(2) + "°";
                var o = {"person": (pNo + 1), "orient": orienLineC.rotation.toFixed(2)};
                window.searchData.orientation.push(o);
                makeQuery(textBuffer, "o", o);


                Orientation.innerHTML = "Orientation";
                alert("A new query: "+ textBuffer +" is added! Check the 'Query' tab.")



            })

                // stage.update();





        }) //button is clicked end

        stage.addChild(button);
        stage.update();


    } //for end


    $("#showinfo").html(showtext);
} //orientation end

function Motion() {

    var l = window.dataset[window.count].skeletons.length;
    var btnlayer = document.getElementById("btnLayer");
    btnlayer.style.zIndex = 2;
    var clayer = document.getElementById("cycLayer");
    clayer.style.zIndex = 3;

    var showQtext = "";
    var showtext = "";
    var textBuffer = " ";


    stage.removeAllChildren();
    stage.update();

    var clickText = new createjs.Text("Click any of the person buttons to start. ", " 20px Courier", "#00000");
        clickText.textAlign = "left";
        clickText.x = 4;
        clickText.y = 0;
        stage.addChild(clickText);


    for (var i = 0; i < l; i++) {
        var pNo = window.dataset[window.count].skeletons[i].id;
        showtext += "Person " + (pNo + 1) + ":<br>";
        showtext += window.dataset[window.count].skeletons[i].activity + "<br>";

        var background = new createjs.Shape();

        background.name = "background";
        background.graphics.beginFill("white").drawRoundRect(0, 0, 80, 30, 5);
        var label = new createjs.Text("Person " + (pNo + 1), " 16px Courier", "#000000");
        label.name = "label";
        label.textAlign = "center";
        label.textBaseline = "middle";
        label.x = 40;
        label.y = 18;
        var button = new createjs.Container();
        button.name = i;
        //top-left location
        button.x = window.dataset[window.count].skeletons[i].head.x;
        button.y = window.dataset[window.count].skeletons[i].head.y;
        button.alpha = 1;
        button.addChild(background, label);

         
        //button on click
        button.on("click", function() {
            this.alpha = 0;
            clickText.alpha = 0;
            stage.update();



            var temp = this.name;
            var pNo = window.dataset[window.count].skeletons[temp].id;
            var x = this.x + 50;
            var y = this.y + 18;

            var textLabel = new createjs.Text("Select an activity to find when person " + (pNo + 1) + " was doing it", " 14px Courier", "#00000");
            textLabel.textAlign = "left";
            textLabel.x = 100;
            textLabel.y = 0;
            stage.addChild(textLabel);

            var textLabel2 = new createjs.Text("Select another one to a new query, \nor click close button to finish", " 14px Courier", "#00000");
            textLabel2.textAlign = "left";
            textLabel2.x = 100;
            textLabel2.y = 0;
            textLabel2.alpha = 0;
            stage.addChild(textLabel2);



            //pointing
            var pointC = new createjs.Container();
            var pointB = new createjs.Shape();
            pointB.graphics.beginFill("#92CDDE").drawCircle(40, 40, 30);

            var pointT = new createjs.Text("Pointing", " 12px Courier", "#000000");
            pointT.textAlign = "center";
            pointT.x = 40;
            pointT.y = 35;

            pointC.addChild(pointB, pointT);
            stage.addChild(pointC);

            //standing
            var standC = new createjs.Container();
            var standB = new createjs.Shape();
            standB.graphics.beginFill("#92CDDE").drawCircle(40, 110, 30);

            var standT = new createjs.Text("Standing", " 12px Courier", "#000000");
            standT.textAlign = "center";
            standT.x = 40;
            standT.y = 105;

            standC.addChild(standB, standT);
            stage.addChild(standC);

            //tablet
            var tabletC = new createjs.Container();
            var tabletB = new createjs.Shape();
            tabletB.graphics.beginFill("#92CDDE").drawCircle(40, 180, 30);

            var tabletT = new createjs.Text("Tablet", " 12px Courier", "#000000");
            tabletT.textAlign = "center";
            tabletT.x = 40;
            tabletT.y = 175;

            tabletC.addChild(tabletB, tabletT);
            stage.addChild(tabletC);


            //phone
            var phoneC = new createjs.Container();
            var phoneB = new createjs.Shape();
            phoneB.graphics.beginFill("#92CDDE").drawCircle(40, 250, 30);

            var phoneT = new createjs.Text("Phone", " 12px Courier", "#000000");
            phoneT.textAlign = "center";
            phoneT.x = 40;
            phoneT.y = 245;

            phoneC.addChild(phoneB, phoneT);
            stage.addChild(phoneC);


            //paper
            var paperC = new createjs.Container();
            var paperB = new createjs.Shape();
            paperB.graphics.beginFill("#92CDDE").drawCircle(40, 320, 30);

            var paperT = new createjs.Text("Paper", " 12px Courier", "#000000");
            paperT.textAlign = "center";
            paperT.x = 40;
            paperT.y = 315;

            paperC.addChild(paperB, paperT);
            stage.addChild(paperC);


            var closeC = new createjs.Container();
            closeC.x = 40;
            closeC.y = 390;
            var closeCi = new createjs.Shape();
            closeCi.graphics.beginFill("#92CDDE").drawCircle(0, 0, 30);
            var closeT = new createjs.Shape();
            closeT.graphics.beginFill("#222222").drawRect(-15, 0, 30, 2);
            closeT.rotation = 315;
            var closeB = new createjs.Shape();
            closeB.graphics.beginFill("#222222").drawRect(-15, 0, 30, 2);
            closeB.rotation = 45;


            closeC.addChild(closeCi, closeB, closeT);

            stage.addChild(closeC);
            closeC.alpha = 0;



            //click pointing
            pointC.on("click", function() {
                // pointC.alpha = standC.alpha = tabletC.alpha = phoneC.alpha = paperC.alpha = 0;
                textLabel2.alpha = 1;
                textLabel.alpha = 0;

                closeC.alpha = 1;
                 $('a[href="#queryView"]').tab('show');


                // h = h + 1;

                textBuffer = "· Activity of person " + (pNo + 1) + " is pointing";
                                      var m = {"person": (pNo + 1) , "m":"pointing"};
                                        window.searchData.motion.push(m);
                makeQuery(textBuffer, "m", m);
                alert("A new query: " +textBuffer +" is added! Check the 'Query' tab.");

                stage.update();

            })


            //click standing
            standC.on("click", function() {
                // pointC.alpha = standC.alpha = tabletC.alpha = phoneC.alpha = paperC.alpha = 0;
                textLabel2.alpha = 1;
                textLabel.alpha = 0;

                closeC.alpha = 1;
                 $('a[href="#queryView"]').tab('show');
                // h = h + 1;
                textBuffer = "· Activity of person " + (pNo + 1) + " is standing";
                                      var m = {"person": (pNo + 1), "m": "standing"};
                                        window.searchData.motion.push(m);
                makeQuery(textBuffer, "m", m);
                alert("A new query: " +textBuffer +" is added! Check the 'Query' tab.");
                stage.update();

            })

            //click tablet
            tabletC.on("click", function() {
                // pointC.alpha = standC.alpha = tabletC.alpha = phoneC.alpha = paperC.alpha = 0;
                textLabel.alpha = 0;
                textLabel2.alpha = 1;
                // tabletC.alpha = 0;
                closeC.alpha = 1;
                 $('a[href="#queryView"]').tab('show');

                // h = h + 1;
                textBuffer = "· Activity of person " + (pNo + 1) + " is using tablet";
                                      var m = {"person":  (pNo + 1), "m": "tablet"};
                                        window.searchData.motion.push(m);
                                      //alert(m.person + " " + m.m);
                makeQuery(textBuffer, "m", m);
                alert("A new query: " +textBuffer +" is added! Check the 'Query' tab.");

                stage.update();

            })

            //click paper
            paperC.on("click", function() {
                // pointC.alpha = standC.alpha = tabletC.alpha = phoneC.alpha = paperC.alpha = 0 ;
                textLabel.alpha = 0;
                textLabel2.alpha = 1;

                // paperC.alpha = 0;
                closeC.alpha = 1;
                 $('a[href="#queryView"]').tab('show');
                // h = h + 1;
                textBuffer = "· Activity of person " + (pNo + 1) + " is using  paper";
                                      var m = {"person":  (pNo + 1), "m": "paper"};
                                        window.searchData.motion.push(m);
                makeQuery(textBuffer, "m", m);
                alert("A new query: " +textBuffer +" is added! Check the 'Query' tab.");

                stage.update();

            })


            //click phone
            phoneC.on("click", function() {
                // pointC.alpha = standC.alpha = tabletC.alpha = phoneC.alpha = paperC.alpha = 0;
                textLabel.alpha = 0;
                textLabel2.alpha = 1;


                closeC.alpha = 1;
                 $('a[href="#queryView"]').tab('show');

                // h = h + 1;

                textBuffer = "· Activity of person " + (pNo + 1) + " is using  phone";
                                      var m = {"person":  (pNo + 1), "m": "phone"};
                                        window.searchData.motion.push(m);
                makeQuery(textBuffer, "m", m);
                alert("A new query: " +textBuffer +" is added! Check the 'Query' tab.");
                stage.update();

            })

            closeC.on("click", function() {
                stage.removeAllChildren();

                stage.update();

            })


            stage.update();



        }) //button click end

        stage.addChild(button);
        stage.update();

    } //for end
    $("#showquery").html(showQtext);
    $("#showinfo").html(showtext);
} //motion end


// makeQuery takes each query text message as input, and display the message inside the queryView.
// It allows user to delete each message inside queryView dynamically, anytime. 

function makeQuery(textBuffer, t, info) {

    //Each time the function called, a new "div" will be created, in order to hold the element in the future step.

    var div = document.createElement("div");


    // Append the newly created "div" into the mother div "queryView".

    var element = document.getElementById("queryView");

    element.appendChild(div);


    // create a new element para to hold both the text query and button                   

    var para = document.createElement("p");


    var node = document.createTextNode(textBuffer + " "); // "node" to hold the textBuffer


    // Create the image button from bootstrap and hold in btts

    var btts = document.createElement("button");

    btts.setAttribute('class', 'btn btn-default');

    var icon = document.createElement("span");

    icon.className = "glyphicon glyphicon-remove-circle";

    btts.appendChild(icon);


    // add listener to the image button

    btts.addEventListener("click", function(q) {

        // Because in futher steps, the image button btts will be appened into the element "para"
        // And "para" will be put into the newly created div.
        // Thus using jQuery here, this.parent() refers to the newly created div
        $(this).parent().remove();
        if(t == "d"){
            for(var i=0; i<window.searchData.distance.length; i++){
                if(window.searchData.distance[i].obj1 == info.obj1 && window.searchData.distance[i].obj2 == info.obj2){
                    window.searchData.distance.splice(i,1);
                }
            }
        }
        else if(t == "o"){
            for(var i=0; i<window.searchData.orientation.length; i++){
                if(window.searchData.orientation[i].person == info.person){
                    window.searchData.orientation.splice(i,1);
                }
            }
        }
        else if(t == "m"){
            for(var i=0; i<window.searchData.motion.length; i++){
                if(window.searchData.motion[i].person == info.person){
                    window.searchData.motion.splice(i,1);
                }
            }
        }
        else if(t == "l"){
            for(var i=0; i<window.searchData.location.length; i++){
                if(window.searchData.location[i].locid == info.locid){
                    window.searchData.location.splice(i,1);
                }
            }
            // alert(JSON.stringify(window.searchData));
        }
    });


    // "node" holds the textBuffer, and "btts" holds the image button
    // Appending both to the new element "para". 
    // This new "para" now holds the button and text in same element

    para.appendChild(node);

    para.appendChild(btts);

    // After appending "para" to the new div, the this.parent().remove() in line 1544 will work. 
    // After clicking on the button here, the parent here refers to this whole div.
    // Remove it, text and button go away together, right away.
    // Cool.!
    div.appendChild(para);

}

function Pause() {
    if (video1.paused) {
        video_1.currentTime = video1.currentTime;
        video2.currentTime = video1.currentTime;
        video1.play();
        video2.play();
        video_1.play();
        var btnlayer = document.getElementById("btnLayer");
        var cyclayer = document.getElementById("cycLayer");
        btnlayer.style.zIndex = 3;
        cyclayer.style.zIndex = 2;
        document.getElementById("distance").disabled = true;
        document.getElementById('orientation').disabled = true;
        document.getElementById('location').disabled = true;
        document.getElementById('motion').disabled = true;
        document.getElementById('runQuery').disabled = true;
    } else {
        pauseAll();
    }
}


function showCommenttimeline(cmntT, cmnTcnt){
    var dbase = new Date("2015-03-25T00:00:00Z");

     if((dbase.getSeconds()+cmntT)/60 >= 1){
                            dbase.setSeconds(dbase.getSeconds()+(dbase.getSeconds()+cmntT)%60);
                            if((dbase.getSeconds()+cmntT)/3600 > 1){
                                    dbase.setHours(dbase.getHours()+Math.floor((dbase.getSeconds()+cmntT)/3600));
                                    dbase.setMinutes(dbase.getMinutes()+Math.floor(((dbase.getSeconds()+cmntT)%3600)/60));
                            }
                            else{
                                    dbase.setMinutes(dbase.getMinutes()+Math.floor((dbase.getSeconds()+cmntT)/60));
                            }
                    }
                    else{
                            dbase.setSeconds(dbase.getSeconds()+cmntT);
                    }

    items2.add({
            start: dbase, 
            content:cmnTcnt,
        });

  } 
  //get satisfied period
function getavaiRange(arr){
      var tempCount = 0;
      var resultArr = [];
      for(var i=0; i<arr[arr.length-1]; i++){
              if(arr[tempCount] != i){
                      resultArr.push(i);
                }
              else{
                      tempCount += 1;
                }
        }
      return resultArr;
}

function getQueryStr(type){
    if(type == "d"){
        var disstr = "";
        for(var i=0; i<window.searchData.distance.length; i++){
            disstr += "Distance between " + window.searchData.distance[i].obj1 + " and " + window.searchData.distance[i].obj2 + " is ";
            if(window.searchData.distance[i].relation == "l"){
                disstr += "larger than " + (window.searchData.distance[i].distancebetween ) + "m.";
            }
            else{
                disstr += "smaller than " + window.searchData.distance[i].distancebetween + "m.";
            }
            if(i != window.searchData.distance.length-1){
                disstr += "<br>";
            }
        }
        return disstr;
    }
    else if(type == "o"){
        var oristr = "";
        for(var i=0; i<window.searchData.orientation.length; i++){
            oristr += "Orientation of person " + window.searchData.orientation[i].person + " is between " + window.searchData.orientation[i].orient + "° +/- 40°";
            if(i != window.searchData.orientation.length-1){
                oristr += "<br>";
            }
        }
        return oristr;
    }
    else if(type == "m"){
        var motstr = "";
        for(var i=0; i<window.searchData.motion.length; i++){
            motstr += "Activity of person " + window.searchData.motion[i].person + " is " + window.searchData.motion[i].m;
            if(i != window.searchData.motion.length-1){
                motstr += "<br>";
            }
        }
        return motstr;
    }
    else{
        return "Someone is on one of these locations.";
    }
}

  function showtimeline(){
          //alert(JSON.stringify(window.searchData));
          var disrange = [];
          var orirange = [];
          var locrange = [];
          var motrange = [];
          var disstr = getQueryStr("d");
          var oristr = getQueryStr("o");
          var motstr = getQueryStr("m");
          var locstr = getQueryStr("l");
          window.location.href = "#timeline" ;

          //second
          for(var s=0; s<window.dataset.length; s++){
                  var tscount = Math.round(s * 3.73);
                  //alert(tscount);
                  if(tscount > window.dataset.length){
                          break;
                    }
                  var l =  window.dataset[tscount].skeletons.length;
                  //distance check
                  // alert(window.searchData.distance.length);
                  for(var i=0; i<window.searchData.distance.length; i++){
                          var item = window.searchData.distance[i];
                          if(item.obj2 == "large screen"){
                                  var pid = parseInt(item.obj1.substring(item.obj1.length-1, item.obj1.length));

                                  if(pid > l){
                                          disrange.push(s);//not satisfied
                                          break;
                                    }
                                  else{
                                          var a = window.dataset[tscount].skeletons[pid-1].head.x-100;
                                          var b = window.dataset[tscount].skeletons[pid-1].head.y-462;
                                          var d = (Math.sqrt(a*a+b*b)/100*0.6).toFixed(2);
                                          console.log(d);
                                          console.log("small",item.distancebetween,s);
                                          //smaller than
                                          if(item.relation == "s"){
                                                  if(d < (item.distancebetween +0.6)){
                                                    console.log("small",d);

                                                    }
                                                  else{
                                                          disrange.push(s);

                                                          break;
                                                    }
                                            }
                                          else if(item.relation == "l"){
                                                  if(d > (item.distancebetween - 0.6)){
                                                    }
                                                  else{
                                                          //alert(d+" "+item.distancebetween);
                                                          disrange.push(s);
                                                          break;
                                                    }
                                            }
                                    }
                            }
                          else{
                                  //alert(1);
                                  var pid1 = parseInt(item.obj1.substring(item.obj1.length-1, item.obj1.length));
                                  var pid2 = parseInt(item.obj2.substring(item.obj2.length-1, item.obj2.length));
                                  if((pid1 > l) || (pid2 > l)){
                                          disrange.push(s);
                                          break;
                                    }
                                  else{
                                          var a = window.dataset[tscount].skeletons[pid1-1].head.x-window.dataset[tscount].skeletons[pid2-1].head.x;
                                          var b = window.dataset[tscount].skeletons[pid1-1].head.y-window.dataset[tscount].skeletons[pid2-1].head.y;
                                          var d = (Math.sqrt(a*a+b*b)/100 * 0.6).toFixed(2);
                                          if(item.relation == "s"){
                                                  if(d <( item.distancebetween +0.3)){

                                                    }
                                                  else{
                                                          disrange.push(s);
                                                          break;
                                                    }
                                            }
                                          else if(item.relation == "l"){
                                                  if(d > (item.distancebetween - 0.3)){
                                                    }
                                                  else{
                                                          //alert(d);
                                                          disrange.push(s);
                                                          break;
                                                    }
                                            }
                                    }
                            }
                    }
                  //orientation check
                  // console.log(window.searchData.orientation);
                  for(var i in window.searchData.orientation){
                          var item = window.searchData.orientation[i];
                          var pid = item.person;
                          if(pid > l){
                                  orirange.push(s);
                                  break;
                            }
                          else{
                                  if(window.dataset[tscount].skeletons[pid-1].head.orientation < parseFloat(item.orient)+50.00 && window.dataset[tscount].skeletons[pid-1].head.orientation > parseFloat(item.orient)-50.00){
                                    }
                                  else{
                                          orirange.push(s);
                                          break;
                                    }
                            }
                    }
                  //location TBA
                  //motion check
                  // alert(JSON.stringify(window.searchData.motion));
                  for(var i=0; i<window.searchData.motion.length; i++){
                          var item = window.searchData.motion[i];
                          var pid = item.person;
                          if(pid > l){
                                  motrange.push(s);//
                                    break;
                            }
                          else{
                                  if(window.dataset[tscount].skeletons[pid-1].activity == item.m){
                                    }
                                  else{
                                          motrange.push(s);
                                          break;
                                    }
                            }
                    }

                    //location check
                    // alert(window.searchData.location.length);

                    for(var i=0; i<window.searchData.location.length; i++){
                        var item = window.searchData.location[i].locinfo;
                        var check =false;

                        for(var j=0; j<item.length; j++){
                            
                            var lox = parseInt(item[j].x);
                            var loy = parseInt(item[j].y);
 
                            for(var p=0; p<l; p++){
                                if((window.dataset[tscount].skeletons[p].head.x < lox + 40 && window.dataset[tscount].skeletons[p].head.x > lox - 40) && (window.dataset[tscount].skeletons[p].head.y<loy  + 40 && window.dataset[tscount].skeletons[p].head.y > loy - 40)){
                                    check = true;
                                    break;
                                } 
                            }
                            if(check == true){
                                break;
                            }
                        }
                        if(check){
                        }
                        else{
                            locrange.push(s);
                            break;  
                        }
            }
        }
          // alert(disrange);
          //satisfied time period
          disrange = getavaiRange(disrange);
          // alert(orirange);
          orirange = getavaiRange(orirange);
          // alert(motrange);
          motrange = getavaiRange(motrange);
          //alert(orirange);
          // alert(motrange);
          //alert(locrange);
          locrange = getavaiRange(locrange);

          //alert(locrange);

          //draw on timeline

          if(disrange.length == 0 && orirange.length == 0 && motrange.length == 0 && locrange.length == 0){
                  alert("No result found!");
            }
          else{
                  window.groupCount += 1;
                  //groups.add({id: window.groupCount, content: 'Query ' + window.groupCount});
                  groups.add({id: window.groupCount, content: 'Query'});
            }
          var tstarto = orirange[0];
          var tendo = 0;
          var tstartd = disrange[0];
          var tendd = 0;
          var tstartm = motrange[0];
          var tendm = 0;
          var tstartl = locrange[0];
          var tendl = 0;
          var dfound = false;
          var ofound = false;
          var mfound = false;
          var lfound = false;

          if(disrange.length!=0 || orirange.length!=0 || motrange.length !=0 || locrange.length!=0){
            alert("Found! Results are shown on timeline.");
          }

          //only one second satisfied
          if(disrange.length == 1){
                  tstartd = disrange[0];
                  tendd = disrange[0];
                  var dbase = new Date("2015-03-25T00:00:00Z");
                  var dbaseend = new Date("2015-03-25T00:00:00Z");
                  if((dbase.getSeconds()+tstartd)/60 > 1){
                            dbase.setSeconds(dbase.getSeconds()+(dbase.getSeconds()+tstartd)%60);
                            if((dbase.getSeconds()+tstartd)/3600 > 1){
                                    dbase.setHours(dbase.getHours()+Math.floor((dbase.getSeconds()+tstartd)/3600));
                                    dbase.setMinutes(dbase.getMinutes()+Math.floor(((dbase.getSeconds()+tstartd)%3600)/60));
                            }
                            else{
                                    dbase.setMinutes(dbase.getMinutes()+Math.floor((dbase.getSeconds()+tstartd)/60));
                            }
                    }
                    else{
                            dbase.setSeconds(dbase.getSeconds()+tstartd);
                    }
                    if((dbaseend.getSeconds()+tendd)/60 > 1){
                            dbaseend.setSeconds(dbaseend.getSeconds()+(dbaseend.getSeconds()+tendd)%60);
                            if((dbaseend.getSeconds()+tendd)/3600 > 1){
                                    dbaseend.setHours(dbaseend.getHours()+Math.floor((dbaseend.getSeconds()+tendd)/3600));
                                    dbaseend.setMinutes(dbaseend.getMinutes()+Math.floor(((dbaseend.getSeconds()+tendd)%3600)/60));
                            }
                            else{
                                    dbaseend.setMinutes(dbaseend.getMinutes()+Math.floor((dbaseend.getSeconds()+tendd)/60));
                            }
                    }
                    else{
                            dbaseend.setSeconds(dbaseend.getSeconds()+tendd);
                    }
                    items.add({
                            start: dbase, 
                            end: dbaseend, 
                            group: window.groupCount, 
                            className:"Tdistance", 
                            content:"Distance",
                            title:disstr
                    });
            }
          else{
                  for(var i=1; i<=disrange.length; i++){
                    //find break point
                    //the end
                            if(i == disrange.length){
                                    tendd = disrange[i-1];
                                    dfound = true;
                            }
                            else{
                                //
                                    if(disrange[i]-disrange[i-1] != 1){
                                            tendd = disrange[i-1];
                                            dfound = true;
                                          //alert(tstartd + "+" + tendd);
                                    }
                            }
                            if(dfound == true){
                                    // alert("Found");
                                    var dbase = new Date("2015-03-25T00:00:00Z");
                                    var dbaseend = new Date("2015-03-25T00:00:00Z");
                                    if((dbase.getSeconds()+tstartd)/60 > 1){
                                            dbase.setSeconds(dbase.getSeconds()+(dbase.getSeconds()+tstartd)%60);
                                            if((dbase.getSeconds()+tstartd)/3600 > 1){
                                                    dbase.setHours(dbase.getHours()+Math.floor((dbase.getSeconds()+tstartd)/3600));
                                                    dbase.setMinutes(dbase.getMinutes()+Math.floor(((dbase.getSeconds()+tstartd)%3600)/60));
                                            }
                                            else{
                                                    dbase.setMinutes(dbase.getMinutes()+Math.floor((dbase.getSeconds()+tstartd)/60));
                                            }
                                    }
                                    else{
                                            dbase.setSeconds(dbase.getSeconds()+tstartd);
                                    }
                                    if((dbaseend.getSeconds()+tendd)/60 > 1){
                                            dbaseend.setSeconds(dbaseend.getSeconds()+(dbaseend.getSeconds()+tendd)%60);
                                            if((dbaseend.getSeconds()+tendd)/3600 > 1){
                                                    dbaseend.setHours(dbaseend.getHours()+Math.floor((dbaseend.getSeconds()+tendd)/3600));
                                                    dbaseend.setMinutes(dbaseend.getMinutes()+Math.floor(((dbaseend.getSeconds()+tendd)%3600)/60));
                                            }
                                            else{
                                                    dbaseend.setMinutes(dbaseend.getMinutes()+Math.floor((dbaseend.getSeconds()+tendd)/60));
                                            }
                                    }
                                    else{
                                            dbaseend.setSeconds(dbaseend.getSeconds()+tendd);
                                    }
                                    items.add({
                                            start: dbase, 
                                            end: dbaseend, 
                                            group: window.groupCount, 
                                            className:"Tdistance", 
                                            content:"Distance",
                                            title:disstr
                                    });
                                    // alert(tstartd+" "+tendd);
                                    if(i != orirange.length){
                                        tstartd = disrange[i];
                                        dfound = false;
                                    }
                                    else{
                                        dfound = false;
                                    }
                            }
                    }
            }

          if(orirange.length == 1){
                  tstarto = orirange[0];
                  tendo = orirange[0];
                  var obase = new Date("2015-03-25T00:00:00Z");
                  var obaseend = new Date("2015-03-25T00:00:00Z");
                  if((obase.getSeconds()+tstarto)/60 > 1){
                            obase.setSeconds(obase.getSeconds()+(obase.getSeconds()+tstarto)%60);
                            if((obase.getSeconds()+tstarto)/3600 > 1){
                                    obase.setHours(obase.getHours()+Math.floor((obase.getSeconds()+tstarto)/3600));
                                    obase.setMinutes(obase.getMinutes()+Math.floor(((obase.getSeconds()+tstarto)%3600)/60));
                            }
                            else{
                                    obase.setMinutes(obase.getMinutes()+Math.floor((obase.getSeconds()+tstarto)/60));
                            }
                    }
                    else{
                            obase.setSeconds(obase.getSeconds()+tstarto);
                    }
                    if((obaseend.getSeconds()+tendo)/60 > 1){
                            obaseend.setSeconds(obaseend.getSeconds()+(obaseend.getSeconds()+tendo)%60);
                            if((obaseend.getSeconds()+tendo)/3600 > 1){
                                    obaseend.setHours(obaseend.getHours()+Math.floor((obaseend.getSeconds()+tendo)/3600));
                                    obaseend.setMinutes(obaseend.getMinutes()+Math.floor(((obaseend.getSeconds()+tendo)%3600)/60));
                            }
                            else{
                                    obaseend.setMinutes(obaseend.getMinutes()+Math.floor((obaseend.getSeconds()+tendo)/60));
                            }
                    }
                    else{
                            obaseend.setSeconds(obaseend.getSeconds()+tendo);
                    }
                    items.add({
                            start: obase, 
                            end: obaseend, 
                            group: window.groupCount, 
                            className:"Torientation", 
                            content:"Orientation",
                            title:oristr
                    });
            }
          else{
                  for(var i=1; i<=orirange.length; i++){
                            if(i == orirange.length){
                                    tendo = orirange[i-1];
                                    ofound = true;
                            }
                            else{
                                    if(orirange[i]-orirange[i-1] != 1){
                                            tendo = orirange[i-1];
                                            ofound = true;
                                        // alert(tstarto + "+" + tendo);
                                    }
                            }
                            if(ofound == true){
                                    // alert("Found");
                                    var obase = new Date("2015-03-25T00:00:00Z");
                                    var obaseend = new Date("2015-03-25T00:00:00Z");
                                    if((obase.getSeconds()+tstarto)/60 > 1){
                                            obase.setSeconds(obase.getSeconds()+(obase.getSeconds()+tstarto)%60);
                                            if((obase.getSeconds()+tstarto)/3600 > 1){
                                                    obase.setHours(obase.getHours()+Math.floor((obase.getSeconds()+tstarto)/3600));
                                                    obase.setMinutes(obase.getMinutes()+Math.floor(((obase.getSeconds()+tstarto)%3600)/60));
                                            }
                                            else{
                                                    obase.setMinutes(obase.getMinutes()+Math.floor((obase.getSeconds()+tstarto)/60));
                                            }
                                    }
                                    else{
                                            obase.setSeconds(obase.getSeconds()+tstarto);
                                    }
                                    if((obaseend.getSeconds()+tendo)/60 > 1){
                                            obaseend.setSeconds(obaseend.getSeconds()+(obaseend.getSeconds()+tendo)%60);
                                            if((obaseend.getSeconds()+tendo)/3600 > 1){
                                                    obaseend.setHours(obaseend.getHours()+Math.floor((obaseend.getSeconds()+tendo)/3600));
                                                    obaseend.setMinutes(obaseend.getMinutes()+Math.floor(((obaseend.getSeconds()+tendo)%3600)/60));
                                            }
                                            else{
                                                    obaseend.setMinutes(obaseend.getMinutes()+Math.floor((obaseend.getSeconds()+tendo)/60));
                                            }
                                    }
                                    else{
                                            obaseend.setSeconds(obaseend.getSeconds()+tendo);
                                    }
                                    items.add({
                                            start: obase, 
                                            end: obaseend, 
                                            group: window.groupCount, 
                                            className:"Torientation", 
                                            content:"Orientation",
                                            title:oristr
                                    });
                                    // alert(tstarto+" "+tendo);
                                    if(i != orirange.length){
                                        tstarto = orirange[i];
                                        ofound = false;
                                    }
                                    else{
                                        ofound = false;
                                    }
                            }
                    }
            }
            //location draw
            if(locrange.length == 1){
                tstartl = locrange[0];
                tendl = locrange[0];
                var base = new Date("2015-03-25T00:00:00Z");
                var baseend = new Date("2015-03-25T00:00:00Z");
                if((base.getSeconds()+tstartl)/60 >= 1){
                                base.setSeconds(base.getSeconds()+(base.getSeconds()+tstartl)%60);
                                if((base.getSeconds()+tstartl)/3600 >= 1){
                                        base.setHours(base.getHours()+Math.floor((base.getSeconds()+tstartl)/3600));
                                        base.setMinutes(base.getMinutes()+Math.floor(((base.getSeconds()+tstartl)%3600)/60));
                                }
                                else{
                                        base.setMinutes(base.getMinutes()+Math.floor((base.getSeconds()+tstartl)/60));
                                }
                        }
                        else{
                                base.setSeconds(base.getSeconds()+tstartl);
                        }
                        if((baseend.getSeconds()+tendl)/60 >= 1){
                                baseend.setSeconds(baseend.getSeconds()+(baseend.getSeconds()+tendl)%60);
                                if((baseend.getSeconds()+tendl)/3600 >= 1){
                                        baseend.setHours(baseend.getHours()+Math.floor((baseend.getSeconds()+tendl)/3600));
                                        baseend.setMinutes(baseend.getMinutes()+Math.floor(((baseend.getSeconds()+tendl)%3600)/60));
                                }
                                else{
                                        baseend.setMinutes(baseend.getMinutes()+Math.floor((baseend.getSeconds()+tendl)/60));
                                }
                        }
                        else{
                                baseend.setSeconds(baseend.getSeconds()+tendl);
                        }
                        items.add({
                                start: base, 
                                end: baseend, 
                                group: window.groupCount, 
                                className:"Tlocation", 
                                content:"Location",
                                title: locstr
                        });

            }
            else{
                for(var i=1; i<=locrange.length; i++){
                                if(i == locrange.length){
                                        tendl = locrange[i-1];
                                        lfound = true;
                                }
                                else{
                                        // alert(tstartl);
                                        if(locrange[i]-locrange[i-1] != 1){
                                                tendl = locrange[i-1];
                                                lfound = true;
                                                // alert(tendl);
                                        }
                                }
                                if(lfound == true){
                                        // alert("Found");
                                        var base = new Date("2015-03-25T00:00:00Z");
                                        var baseend = new Date("2015-03-25T00:00:00Z");
                                        if((base.getSeconds()+tstartl)/60 >= 1){
                                                base.setSeconds(base.getSeconds()+(base.getSeconds()+tstartl)%60);
                                                if((base.getSeconds()+tstartl)/3600 >= 1){
                                                        base.setHours(base.getHours()+Math.floor((base.getSeconds()+tstartl)/3600));
                                                        base.setMinutes(base.getMinutes()+Math.floor(((base.getSeconds()+tstartl)%3600)/60));
                                                }
                                                else{
                                                        base.setMinutes(base.getMinutes()+Math.floor((base.getSeconds()+tstartl)/60));
                                                }
                                        }
                                        else{
                                                base.setSeconds(base.getSeconds()+tstartl);
                                        }
                                        if((baseend.getSeconds()+tendl)/60 >= 1){
                                                baseend.setSeconds(baseend.getSeconds()+(baseend.getSeconds()+tendl)%60);
                                                if((baseend.getSeconds()+tendl)/3600 >= 1){
                                                        baseend.setHours(baseend.getHours()+Math.floor((baseend.getSeconds()+tendl)/3600));
                                                        baseend.setMinutes(baseend.getMinutes()+Math.floor(((baseend.getSeconds()+tendl)%3600)/60));
                                                }
                                                else{
                                                        baseend.setMinutes(baseend.getMinutes()+Math.floor((baseend.getSeconds()+tendl)/60));
                                                }
                                        }
                                        else{
                                                baseend.setSeconds(baseend.getSeconds()+tendl);
                                        }
                                        items.add({
                                                start: base, 
                                                end: baseend, 
                                                group: window.groupCount, 
                                                className:"Tlocation", 
                                                content:"Location",
                                                title:locstr
                                        });
                                        // alert(tstartm+" "+tendm);
                                        if(i != locrange.length){
                                            tstartl = locrange[i];
                                            lfound = false;
                                        }
                                        else{
                                            lfound = false;
                                        }
                                        //alert(tstartm);
                                }

                        }
            }

          //alert(motrange);
          if(motrange.length == 1){
                  tstartm = motrange[0];
                  tendm = motrange[0];
                  var base = new Date("2015-03-25T00:00:00Z");
                  var baseend = new Date("2015-03-25T00:00:00Z");
                  if((base.getSeconds()+tstartm)/60 >= 1){
                            base.setSeconds(base.getSeconds()+(base.getSeconds()+tstartm)%60);
                            if((base.getSeconds()+tstartm)/3600 >= 1){
                                    base.setHours(base.getHours()+Math.floor((base.getSeconds()+tstartm)/3600));
                                    base.setMinutes(base.getMinutes()+Math.floor(((base.getSeconds()+tstartm)%3600)/60));
                            }
                            else{
                                    base.setMinutes(base.getMinutes()+Math.floor((base.getSeconds()+tstartm)/60));
                            }
                    }
                    else{
                            base.setSeconds(base.getSeconds()+tstartm);
                    }
                    if((baseend.getSeconds()+tendm)/60 >= 1){
                            baseend.setSeconds(baseend.getSeconds()+(baseend.getSeconds()+tendm)%60);
                            if((baseend.getSeconds()+tendm)/3600 >= 1){
                                    baseend.setHours(baseend.getHours()+Math.floor((baseend.getSeconds()+tendm)/3600));
                                    baseend.setMinutes(baseend.getMinutes()+Math.floor(((baseend.getSeconds()+tendm)%3600)/60));
                            }
                            else{
                                    baseend.setMinutes(baseend.getMinutes()+Math.floor((baseend.getSeconds()+tendm)/60));
                            }
                    }
                    else{
                            baseend.setSeconds(baseend.getSeconds()+tendm);
                    }
                    items.add({
                            start: base, 
                            end: baseend, 
                            group: window.groupCount, 
                            className:"Tmotion", 
                            content:"Motion",
                            title:motstr
                    });
            }
          else{
                  for(var i=1; i<=motrange.length; i++){
                            if(i == motrange.length){
                                    tendm = motrange[i-1];
                                    mfound = true;
                            }
                            else{
                                    //alert(tstartm);
                                    if(motrange[i]-motrange[i-1] != 1){
                                            tendm = motrange[i-1];
                                            mfound = true;
                                            // alert(tstartm + "+" + tendm);
                                    }
                            }
                            if(mfound == true){
                                    // alert("Found");
                                    var base = new Date("2015-03-25T00:00:00Z");
                                    var baseend = new Date("2015-03-25T00:00:00Z");
                                    if((base.getSeconds()+tstartm)/60 >= 1){
                                            base.setSeconds(base.getSeconds()+(base.getSeconds()+tstartm)%60);
                                            if((base.getSeconds()+tstartm)/3600 >= 1){
                                                    base.setHours(base.getHours()+Math.floor((base.getSeconds()+tstartm)/3600));
                                                    base.setMinutes(base.getMinutes()+Math.floor(((base.getSeconds()+tstartm)%3600)/60));
                                            }
                                            else{
                                                    base.setMinutes(base.getMinutes()+Math.floor((base.getSeconds()+tstartm)/60));
                                            }
                                    }
                                    else{
                                            base.setSeconds(base.getSeconds()+tstartm);
                                    }
                                    if((baseend.getSeconds()+tendm)/60 >= 1){
                                            baseend.setSeconds(baseend.getSeconds()+(baseend.getSeconds()+tendm)%60);
                                            if((baseend.getSeconds()+tendm)/3600 >= 1){
                                                    baseend.setHours(baseend.getHours()+Math.floor((baseend.getSeconds()+tendm)/3600));
                                                    baseend.setMinutes(baseend.getMinutes()+Math.floor(((baseend.getSeconds()+tendm)%3600)/60));
                                            }
                                            else{
                                                    baseend.setMinutes(baseend.getMinutes()+Math.floor((baseend.getSeconds()+tendm)/60));
                                            }
                                    }
                                    else{
                                            baseend.setSeconds(baseend.getSeconds()+tendm);
                                    }
                                    items.add({
                                            start: base, 
                                            end: baseend, 
                                            group: window.groupCount, 
                                            className:"Tmotion", 
                                            content:"Activity",
                                            title:motstr
                                    });
                                    // alert(tstartm+" "+tendm);
                                    if(i != motrange.length){
                                        tstartm = motrange[i];
                                        mfound = false;
                                    }
                                    else{
                                        mfound = false;
                                    }
                                    //alert(tstartm);
                            }
                    }
            }
    }
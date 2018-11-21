var appConfig = { showFrameBox: false,
                  originalFPS: 25, 
                  targetFPS: 4, 
                  sightAngle: 90, 
                  backwardMovementSeconds: 0, 
                  forwardMovementSeconds: 0, 
                  proxemic: {w: 100, h: 100},
                  kinectImageSize: {w: 512, h: 424, marginBorder: 20}, 
                  collisionDetection: {lineOfSightLength: 670, pixelPrecision: 10}, 
                  grouping: {nearDistance: 250, viewingAngle: 85}, 
                  formation: {personFacePerson: {minDistance: 85}},
                  heatmapRadius: 20,
                  pixelToMetreRatio: 60/150 // 60 cm 150 pixel
                };
var personConfig =  [ {movementColor:{forward:{r:38, g:0, b:255}, backward:{r:191, g:181, b:255}}}, 
                      {movementColor:{forward:{r:34, g:148, b:0}, backward:{r:93, g:250, b:179}}},
                      {movementColor:{forward:{r:240, g:158, b: 0}, backward:{r:235, g:216, b:0}}},
                      {movementColor:{forward:{r:0, g:0, b: 205}, backward:{r:0, g:191, b:255}}}
                    ];
var groupConfig = [ {r:125, g:0, b:0}, 
                    {r:158, g:20, b:119}, 
                    {r:212, g:175, b:55}
                  ];
var preferences = {drawLine:[], showZones:false}; //{drawLine:[{from:{type:"person", id:0}, to:{type:"person", id:1}}]};
var canvas, margin, stage;
var mode = "run";
var debugFrame = 85;
var eagleSenseData;
var playbackStatus = 'pause';
var currentFrame = 0; 
var currentTime = 0;
var playFirstFrame = false;
var video1;
var heatmapData, maxHeatMapValue, activeHeatMapPersonIds = [], activeTracePersonIds = [];
var initiatedVideoSeekBar = false, videoSeekBar, videoPlayButton = "clickToPlay";
var handlePauseEvent;
const HAVE_ENOUGH_DATA = 4;

function loadData(step) {
  eraseCookie('config');
  if(step == 1) { 
    getData('data/102_4.json', function(data){
      eagleSenseData = data;
      loadData(step+1);
    });
  } else if(step == 2) {
    loadConfig(function(data){
      console.log('config', data)
      appConfig = data.appConfig;
      personConfig = data.personConfig;
      groupConfig = data.groupConfig;
      preferences = data.preferences;
      loadData(step+1);
    });
  } else if(step == 3) {
    loadForm(function(){
      loadData(step+1);
    });
  }
  else { 
    init(eagleSenseData);
  }
}
function init(data) {
  setupRetinaSupport();
  
  /* // slider components
  $('#seeker').attr('data-slider-min', 0);
  $('#seeker').attr('data-slider-max', 120);
  var seekbar = $('#seeker').slider();*/
  //more seeker guide here http://seiyria.com/bootstrap-slider/

  canvas = new createjs.Stage("easel");
  centerX = canvas.width/2;
  centerY = canvas.height/2;
  canvas.scaleX = 2;
  canvas.scaleY = 2;

  stage = new createjs.Container();
  stage.x = 0;
  stage.y = 0;
  canvas.addChild(stage);

  //process local time
  var startTime = data[0].timestamp_js;
  data.forEach(function(o){
    o.localTime = o.timestamp_js - startTime;
  })
  console.log('data', data)
  
  if(mode == 'conversion'){
    //for converting data to specific fps
    data = computeFrame(data, appConfig.targetFPS);
    for(var i=0; i<data.length; i++) {
      //delete data[i].localTime;
    }
    console.log('output', JSON.stringify(data));
  }
  else if(mode == "run" || mode == 'debugFrame'){
    var temporaryIos = [];
    temporaryIos.push(drawInteractiveObject(0, "Display", "display", 330, 400, 320, 15, 172, null, true));
    // add io to stage for compute data purpose
    for(var i=0; i<temporaryIos.length; i++){
      stage.addChild(temporaryIos[i]);
    }

    var returnObject = computeData(data, appConfig, temporaryIos);
    var frames = returnObject.frames;
    var noOfPerson = returnObject.maxPersonId+1;
    console.log('frames', frames);

    onFormInputUpdated(function(){
      for(var i=0; i<temporaryIos.length; i++){
        stage.addChild(temporaryIos[i]);
      }
      returnObject = computeData(data, appConfig, temporaryIos);
      frames = returnObject.frames;
    });

    $('#video1').on('loadedmetadata', function(){
      initVideo(frames);
      initUI(frames);
      initSummaryView(frames);
      ticker();

      $('#loadingIcon').remove();
    })

    function ticker(){
        createjs.Ticker.setFPS(appConfig.targetFPS);
        createjs.Ticker.addEventListener("tick", function() {
          if(mode == 'debugFrame') {
            currentFrame = debugFrame;
            console.log(frames[debugFrame]);
          }

          //console.log(playbackStatus, currentFrame, currentTime, frames[currentFrame].localTime)
          if(playbackStatus == 'pause' || playbackStatus == 'waitingToPlay') {
            // no change to current frame
          }
          else if(playbackStatus == 'playAndSeeking' || playbackStatus == 'pauseAndSeeking') {
            // change current frame
          } 
          else if(playbackStatus == 'play' ) {
            // increase current frame
            if(currentTime == 0 && !playFirstFrame) playFirstFrame = true;
            else currentTime+= 1000/appConfig.targetFPS;

          }

          currentFrame = 0;
          while(frames[currentFrame] != null && frames[currentFrame].localTime < currentTime){
            currentFrame++;
            if(currentFrame >= frames.length) {
              //console.log('Warning: no frame match current time');
              if($('#videoPlayButtonStatus').val() == 'clickToPause') $('#videoPlayButtonStatus').trigger('change');
              handlePauseEvent();
              return;
            } 
          }

          if(initiatedVideoSeekBar){
            if(playbackStatus == 'playAndSeeking' || playbackStatus == 'pauseAndSeeking'){

            } else {
              videoSeekBar.slider('setValue', Math.floor(currentTime/1000));
            }
          }

          document.getElementById('frameBox').innerHTML = "Frame: "+currentFrame+" / "+frames.length+"<br>";
          document.getElementById('timeBox').innerHTML = getTimeString( frames[currentFrame].localTime/1000 )+" / "+getTimeString(frames[frames.length-1].localTime/1000);

          stage.removeAllChildren();
          //stage.addChild(drawFixedObject(0, "cabinet", 600,50,80,40,0));
          //stage.addChild(drawFixedObject(1, "couch", 200,350,300,100,0));
          //stage.addChild(drawZone(frames[currentFrame].persons, "arc", "Touch Zone", 100, 40, 200, 100, {r:220, g:20, b:60}, 0));
          //stage.addChild(drawZone(frames[currentFrame].persons, "rectangle", "Interact", 100, 220, 400, 200, {r:220, g:20, b:60}, 0));
          if(preferences.showZones == true) {
            stage.addChild(drawZone(frames[currentFrame].persons, "rectangle", "<1.2m", 100, 120, 400, 300, {r:220, g:20, b:60}, 0));
            stage.addChild(drawZone(frames[currentFrame].persons, "rectangle", "1.2-1.5m", 100, 45, 400, 75, {r:34, g:139, b:34}, 0));        
          }
          var currentFrameInteractiveObjects = [];
          for(var i=0; i<frames[currentFrame].interactiveObjects.length; i++){
            currentFrameInteractiveObjects.push(frames[currentFrame].interactiveObjects[i]);
            stage.addChild(frames[currentFrame].interactiveObjects[i]);
          }
          var currentFramePersons = [];
          for(var i=0; i<noOfPerson; i++) {
            if(frames[currentFrame].persons[i].isInMap == true) {
              currentFramePersons.push( frames[currentFrame].persons[i].person );
              if(appConfig.backwardMovementSeconds > 0) {
                stage.addChild(drawBackwardMovement(frames, currentFrame, i, appConfig.backwardMovementSeconds, {r:personConfig[i].movementColor.backward.r, g:personConfig[i].movementColor.backward.g, b:personConfig[i].movementColor.backward.b}));
              }
              if(appConfig.forwardMovementSeconds > 0) {
              stage.addChild(drawForwardMovement(frames, currentFrame, i, appConfig.forwardMovementSeconds, {r:personConfig[i].movementColor.forward.r, g:personConfig[i].movementColor.forward.g, b:personConfig[i].movementColor.forward.b}));
              }
              stage.addChild( frames[currentFrame].persons[i].person );
              //stage.addChild(drawPersonLineOfSight(frames[currentFrame].persons[i].person));
            }
          }
          for(var i=0; i<preferences.drawLine.length; i++){
            if(!preferences.drawLine[i] || !preferences.drawLine[i].from || !preferences.drawLine[i].to) continue;
              var o1, o2;
              var from = preferences.drawLine[i].from;
              var to = preferences.drawLine[i].to;
              //console.log(from.id, to.id)
              if(from.id != null && to.id != null) {
              if(from.type == 'person'){
                if(frames[currentFrame].persons[from.id].isInMap == true) o1 = frames[currentFrame].persons[from.id].person;
                else continue;
              } else {
                o1 = currentFrameInteractiveObjects[from.id];
              }

              if(to.type == 'person'){
                if(frames[currentFrame].persons[to.id].isInMap == true) o2 = frames[currentFrame].persons[to.id].person;
                else continue;
              } else {
                o2 = currentFrameInteractiveObjects[to.id];
              }

              stage.addChild(drawDistance(o1, o2));
            }
          }
          //if(currentFramePersons.length >= 2) {
            //stage.addChild(drawDistance(currentFramePersons[0], currentFramePersons[1]));
          //}
          if(frames[currentFrame].formations){
            for(var i=0; i<frames[currentFrame].formations.length; i++) {
              stage.addChild(frames[currentFrame].formations[i]);
            }
          }
          canvas.update();
        });
    }
  } else {
    debug(stage, canvas);
  }
}
function debug(){
  //stage.addChild(drawFixedObject(0, "cabinet", 630,60,80,40,45));
  // facing each other
  //p1_1 = drawPerson("0", "0", 100, 200, 270, 270, "phone");
  //p1_2 = drawPerson("1", "1", 200, 200, 90, 90, "phone");

  // 2 person side by side 180 degree
  p1_1 = drawPerson("0", "0", 100, 200, -3, -3, "phone");
  p1_2 = drawPerson("1", "1", 200, 200, 160, 160, "tablet");

  // 3 person side by side
  //p1_1 = drawPerson("0", "0", 120, 280, -70, -70, "phone");
  //p1_2 = drawPerson("1", "1", 200, 200, 0, 0, "phone");
  //p1_3 = drawPerson("2", "2", 280, 220, 70, 70, "phone");

  //p2 = drawPerson("2", 500, 240, -30, -50, 90, "tablet");
  io1 = drawInteractiveObject(2, "TV", "display", 200, 30, 250, 20, 0);
  //d1 = drawDistance(p1_1, io1);
  //d2 = drawDistance(p1_1, p1_2);
  stage.addChild(io1);
  //var newp = [p1, p2];
  //stage.addChild(drawZone([p1,p2],"Interaction", 0, 40, 450, 130, {r:255, g:0, b:255}, 0));
  //stage.addChild(drawZone([p1,p2],"Observation", 0, 170, 450, 130, {r:34, g:139, b:34}, 0));
  //stage.addChild(drawZone([p1,p2], "rectangle", "Observation", 130, 90, 180, 150, {r:220, g:20, b:60}, 45));

  //stage.addChild(drawZone([p1,p2], "rectangle", "Observation", 100, 40, 200, 100, {r:220, g:20, b:60}, 0));
  //stage.addChild(drawZone([p1,p2], "arc", "Entry", 30, 40, 340, 170, {r:34, g:139, b:34}, 0));
  //stage.addChild(drawZone([p1,p2], "arc", "Core", 100, 40, 200, 100, {r:220, g:20, b:60}, 0));
  //stage.addChild(drawZone(newp,"rectangle", "Observation", 30, 170, 350, 130, {r:34, g:139, b:34}, 0));
  //stage.addChild(drawZone(newp,"rectangle", "Waiting", 430, 150, 180, 150, {r:255, g:204, b:0}, -45));
  //stage.addChild(drawZone(newp, "arc", "Touch Zone", 100, 40, 200, 100, {r:220, g:20, b:60}, 0));

  var p1 = {isInMap:true, person: p1_1};
  var p2 = {isInMap:true, person: p1_2};
  //var p3 = {isInMap:true, person: p1_3};
  var frame1 = {persons: [p1, p2], interactiveObjects: [io1]}
  var frames = [frame1];

  //p1_1_l = drawPersonLineOfSight(frames[0].persons[0].person);
  //p1_2_l = drawPersonLineOfSight(frames[0].persons[1].person);

  frames = highlightGroup(frames, 0, frame1.interactiveObjects);
  console.log('frames', frames);

  stage.removeAllChildren();
  //stage.addChild(drawBorder());
  //stage.addChild(drawFixedObject(1, "couch", 200,350,300,100,0));
  stage.addChild(frames[0].interactiveObjects[0]);
  stage.addChild(frames[0].persons[0].person);
  stage.addChild(frames[0].persons[1].person);
  //stage.addChild(frames[0].persons[2].person);
 // stage.addChild(p1_1_l);
 // stage.addChild(p1_2_l);
  //stage.addChild(d1);
  //stage.addChild(d2);
  //stage.addChild(drawPersonFacePersonFormation(frames[0].persons[0].person, frames[0].persons[1].person));
  //stage.addChild(drawPersonNearPersonFormation(frames[0].persons[0].person, frames[0].persons[1].person));


  /*
  var rect = new createjs.Shape();
  rect.name = "rect";
  rect.graphics.setStrokeStyle(1).beginStroke("Black").beginFill("white");
  rect.graphics.drawRect(0, 0, 200, 25);
  rect.regX = 200/2;
  rect.regY = 30/2;
  rect.x = 250;
  rect.y = 60;
  rect.rotation = 0;
  stage.addChild(rect);

  for(x=-1000;x<1000;x+=10){
    for(y=-1000; y<1000; y+=10){
      var pt = stage.localToLocal(x, y, rect);
      if(rect.hitTest(pt.x, pt.y))
        console.log(x, y, pt, rect.hitTest(pt.x, pt.y))
    }
  }*/
  /*
  var line = new createjs.Shape();
  line.graphics.beginStroke("blue").setStrokeStyle(3);
  line.graphics.moveTo(80, 280);
  line.graphics.lineTo(140, 320);
  stage.addChild(line);*/


  canvas.update();
}
// config form
function onFormInputUpdated(returnFunction){
  $('input.form-control, select.form-control').change(function(){
    //console.log($(this).attr('id'), $(this).val());

    if($(this).attr('id') == 'inputSightAngle'){
      appConfig.sightAngle = $(this).val();
      return returnFunction();
    }
    else if($(this).attr('id') == 'inputBodyProxemicDistance'){
      appConfig.proxemic.w = $(this).val();
      appConfig.proxemic.h = $(this).val();
      return returnFunction();
    }
    else if($(this).attr('id') == 'inputBackwardMovementSeconds'){
      appConfig.backwardMovementSeconds = $(this).val();
      return;
    }
    else if($(this).attr('id') == 'inputForwardMovementSeconds'){
      appConfig.forwardMovementSeconds = $(this).val();
      return;
    }
    else if($(this).hasClass('selectDistanceLine')){
      var index = parseInt($(this).attr('data-id'));
      var type = $(this).attr('data-type');
      var pair;
      //console.log(index, type);

      if(type == 'from'){
        pair = '#distanceLine'+(index+1)+'To';
      } else {
        pair = '#distanceLine'+(index+1)+'From';
      }

      if($(this).val() != 'select' && $(pair).val() != 'select' && $(this).val() != $(pair).val()){
        while(preferences.drawLine.length < index+1){
          preferences.drawLine.push({from:{type:null, id:null}, to:{type:null, id:null}});
        }
        if(type == 'from'){
          if($(this).val() < 100){
            // person
            preferences.drawLine[index].from.type = "person";
            preferences.drawLine[index].from.id = $(this).val();
          } else {
          // object
            preferences.drawLine[index].from.type = "object";
            preferences.drawLine[index].from.id = $(this).val()-100;
          }
          if($(pair).val() < 100){
            // person
            preferences.drawLine[index].to.type = "person";
            preferences.drawLine[index].to.id = $(pair).val();
          } else {
          // object
            preferences.drawLine[index].to.type = "object";
            preferences.drawLine[index].to.id = $(pair).val()-100;
          }
        } else {
          if($(this).val() < 100){
            // person
            preferences.drawLine[index].to.type = "person";
            preferences.drawLine[index].to.id = $(this).val();
          } else {
          // object
            preferences.drawLine[index].to.type = "object";
            preferences.drawLine[index].to.id = $(this).val()-100;
          }
          if($(pair).val() < 100){
            // person
            preferences.drawLine[index].from.type = "person";
            preferences.drawLine[index].from.id = $(pair).val();
          } else {
          // object
            preferences.drawLine[index].from.type = "object";
            preferences.drawLine[index].from.id = $(pair).val()-100;
          }
        }
      } else {
        preferences.drawLine[index] = {from:{type:null, id:null}, to:{type:null, id:null}};
      }
    }
    /*
    else if($(this).attr('id') == 'distanceLine1From'){
      //console.log($(this).val());
      //console.log($('#distanceLine1To').val());
      if($(this).val() != 'select' && $('#distanceLine1To').val() != 'select' && $(this).val() != $('#distanceLine1To').val()){
        if(preferences.drawLine.length<1) {
          preferences.drawLine.push({from:{type:null, id:null}, to:{type:null, id:null}});
        } else if(!preferences.drawLine[0]) {
          preferences.drawLine[0] = {from:{type:null, id:null}, to:{type:null, id:null}};
        }
        if($(this).val() < 100) {
          // person
          preferences.drawLine[0].from.type = "person";
          preferences.drawLine[0].from.id = $(this).val();
        } else {
          // object
          preferences.drawLine[0].from.type = "object";
          preferences.drawLine[0].from.id = $(this).val()-100;
        }

        if($('#distanceLine1To').val() < 100) {
          // person
          preferences.drawLine[0].to.type = "person";
          preferences.drawLine[0].to.id = $('#distanceLine1To').val();
        } else {
          // object
          preferences.drawLine[0].to.type = "object";
          preferences.drawLine[0].to.id = $('#distanceLine1To').val()-100;
        }
      } else {
        // remove first object from array
        preferences.drawLine[0] = null;
      }
      //console.log(preferences)
      return;
    }
    else if($(this).attr('id') == 'distanceLine1To'){
      if($(this).val() != 'select' && $('#distanceLine1From').val() != 'select' && $(this).val() != $('#distanceLine1From').val()){
        if(preferences.drawLine.length<1) {
          preferences.drawLine.push({from:{type:null, id:null}, to:{type:null, id:null}});
        } else if(!preferences.drawLine[0]) {
          preferences.drawLine[0] = {from:{type:null, id:null}, to:{type:null, id:null}};
        }
        if($(this).val() < 100) {
          // person
          preferences.drawLine[0].to.type = "person";
          preferences.drawLine[0].to.id = $(this).val();
        } else {
          // object
          preferences.drawLine[0].to.type = "object";
          preferences.drawLine[0].to.id = $(this).val()-100;
        }

        if($('#distanceLine1From').val() < 100) {
          // person
          preferences.drawLine[0].from.type = "person";
          preferences.drawLine[0].from.id = $('#distanceLine1From').val();
        } else {
          // object
          preferences.drawLine[0].from.type = "object";
          preferences.drawLine[0].from.id = $('#distanceLine1From').val()-100;
        }
      } else {
        // remove first object from array
        preferences.drawLine[0] = null;
      }
      //console.log(preferences)
      return;
    }*/
    /*
    else if($(this).attr('id') == 'distanceLine2From'){
      //console.log($(this).val());
      //console.log($('#distanceLine1To').val());
      if($(this).val() != 'select' && $('#distanceLine2To').val() != 'select' && $(this).val() != $('#distanceLine2To').val()){
        if(preferences.drawLine.length<2) {
          preferences.drawLine.push({from:{type:null, id:null}, to:{type:null, id:null}});
        } else if(!preferences.drawLine[1]) {
          preferences.drawLine[1] = {from:{type:null, id:null}, to:{type:null, id:null}};
        }
        if($(this).val() < 100) {
          // person
          preferences.drawLine[1].from.type = "person";
          preferences.drawLine[1].from.id = $(this).val();
        } else {
          // object
          preferences.drawLine[1].from.type = "object";
          preferences.drawLine[1].from.id = $(this).val()-100;
        }

        if($('#distanceLine2To').val() < 100) {
          // person
          preferences.drawLine[1].to.type = "person";
          preferences.drawLine[1].to.id = $('#distanceLine2To').val();
        } else {
          // object
          preferences.drawLine[1].to.type = "object";
          preferences.drawLine[1].to.id = $('#distanceLine2To').val()-100;
        }
      } else {
        // remove first object from array
        preferences.drawLine[1] = null;
      }
      //console.log(preferences)
      return;
    }
    else if($(this).attr('id') == 'distanceLine2To'){
      if($(this).val() != 'select' && $('#distanceLine2From').val() != 'select' && $(this).val() != $('#distanceLine2From').val()){
        if(preferences.drawLine.length<1) {
          preferences.drawLine.push({from:{type:null, id:null}, to:{type:null, id:null}});
        } else if(!preferences.drawLine[1]) {
          preferences.drawLine[1] = {from:{type:null, id:null}, to:{type:null, id:null}};
        }
        if($(this).val() < 100) {
          // person
          preferences.drawLine[1].to.type = "person";
          preferences.drawLine[1].to.id = $(this).val();
        } else {
          // object
          preferences.drawLine[1].to.type = "object";
          preferences.drawLine[1].to.id = $(this).val()-100;
        }

        if($('#distanceLine2From').val() < 100) {
          // person
          preferences.drawLine[1].from.type = "person";
          preferences.drawLine[1].from.id = $('#distanceLine2From').val();
        } else {
          // object
          preferences.drawLine[1].from.type = "object";
          preferences.drawLine[1].from.id = $('#distanceLine2From').val()-100;
        }
      } else {
        // remove first object from array
        preferences.drawLine[0] = null;
      }
      //console.log(preferences)
      return;
    }*/
    
    else if($(this).attr('id') == 'person1BackwardMovementColor'){
      personConfig[0].movementColor.backward = hexToRgb( $(this).val());
      return;
    }
    else if($(this).attr('id') == 'person1ForwardMovementColor'){
      personConfig[0].movementColor.forward = hexToRgb( $(this).val());
      return;
    }
    else if($(this).attr('id') == 'person2BackwardMovementColor'){
      personConfig[1].movementColor.backward = hexToRgb( $(this).val());
      return;
    }
    else if($(this).attr('id') == 'person2ForwardMovementColor'){
      personConfig[1].movementColor.forward = hexToRgb( $(this).val());
      return;
    }

    else if($(this).attr('id') == 'group1Color'){
      groupConfig[0] = hexToRgb( $(this).val());
      return returnFunction();
    }
    else if($(this).attr('id') == 'group2Color'){
      groupConfig[1] = hexToRgb( $(this).val());
      return returnFunction();
    }
  })
}
function loadForm(returnFunction){
  $('#inputSightAngle').val(appConfig.sightAngle);
  $('#inputBodyProxemicDistance').val(appConfig.proxemic.w);
  $('#inputBackwardMovementSeconds').val(appConfig.backwardMovementSeconds);
  $('#inputForwardMovementSeconds').val(appConfig.forwardMovementSeconds);

  $('#person1BackwardMovementColor').val(rgbToHex(personConfig[0].movementColor.backward));
  $('#person1ForwardMovementColor').val(rgbToHex(personConfig[0].movementColor.forward));
  $('#person2BackwardMovementColor').val(rgbToHex(personConfig[1].movementColor.backward));
  $('#person2ForwardMovementColor').val(rgbToHex(personConfig[1].movementColor.forward));

  $('#group1Color').val(rgbToHex(groupConfig[0]));
  $('#group2Color').val(rgbToHex(groupConfig[1]));

  return returnFunction();
}
function initUI(frames){
  if(appConfig.showFrameBox == false) $('#frameBox').hide();

  $('.colorpicker-component').colorpicker();
  $('#summaryView').hide();

  $('#preferencesPill').click(function(){
    $('#summaryViewPill').removeClass('active');
    $('#preferencesPill').addClass('active');

    $('#preferences').show();
    $('#summaryView').hide();
  });
  $('#summaryViewPill').click(function(){
    $('#preferencesPill').removeClass('active');
    $('#summaryViewPill').addClass('active');

    $('#summaryView').show();
    $('#preferences').hide();
  });

  $('.panel').slimScroll({
    height: '720px',
    color: '#c1c1c1',
    wheelStep: 5
  });

  var slideOpacity = function(){
    $('#opacityLabel').text($('#backgroundOpacitySlider').val());
    $('#videoOverlay').css('opacity', $('#backgroundOpacitySlider').val()/100)
  };
  $("#backgroundOpacitySlider").slider({ 
    id: 'backgroundOpacitySliderCss', 
    min: 0, 
    max: 100, 
    value: 100})
  .on('slide', slideOpacity)
  .on('slideStop', slideOpacity);
}
function initSummaryView(frames){
  var slidingHeatMap = function(){
    setHeatMapLabel();
    updateHeatMapPreview();
    updateTracePreview();
  };
  var stopSlidingHeatMap = function(){
    setHeatMapLabel();
    updateHeatMapPreview();
    updateTracePreview();
  };

  // heat map events 
    var setHeatMapLabel = function(start, end){
      if(start != null && end != null) {
        $('#heatmapStartTime').text(getTimeString(start));
        $('#heatmapEndTime').text(getTimeString(end));
      } else {
        var timeValues = $('#positionHeatMapSlider').val().split(',');
        $('#heatmapStartTime').text(getTimeString(timeValues[0]));
        $('#heatmapEndTime').text(getTimeString(timeValues[1]));
      }
    };
    var updateHeatMapPreview = function(){
      $('#heatSample').html('');
      $('#heatSample2').html('');
      $('#heatSample3').html('');
      $('#heatSample4').html('');
      $('#overlay').html('');

      var timeValues = $('#positionHeatMapSlider').val().split(',');
      refreshMainHeatmap();
      $('.overviewImage').each(function(){
        drawHeatmap(frames, $(this).attr('id'), $(this).parent().attr('data-person-id'), timeValues[0], timeValues[1]);
      })
    }
    var refreshMainHeatmap = function(){
      $('#overlay').html('');
      for(var i=0; i<activeHeatMapPersonIds.length; i++){
        var timeValues = $('#positionHeatMapSlider').val().split(',');
        drawHeatmap(frames, 'overlay', activeHeatMapPersonIds[i], timeValues[0], timeValues[1]);
      }
    }

    setHeatMapLabel(0, Math.floor(frames[frames.length-1].localTime/1000));
    $("#positionHeatMapSlider").slider({ 
      id: 'positionHeatMapSliderCss', 
      min: 0, 
      max: Math.floor(frames[frames.length-1].localTime/1000), 
      value: [0, Math.floor(frames[frames.length-1].localTime/1000)]})
    .on('slide', slidingHeatMap)
    .on('slideStop', stopSlidingHeatMap);
    $('.overview').click(function(){
      // deactivate click
      if($(this).children('.overviewImage').hasClass('active')){
        $(this).children('.overviewImage').removeClass('active');
        $(this).children('.overviewText').removeClass('active');
        activeHeatMapPersonIds = activeHeatMapPersonIds.remove($(this).attr('data-person-id'));
        refreshMainHeatmap();
      } 
      // activate click
      else {
        $(this).children('.overviewImage').addClass('active');
        $(this).children('.overviewText').addClass('active');
        activeHeatMapPersonIds.push($(this).attr('data-person-id'));
        refreshMainHeatmap();
      }
    });
  // trace movement events
    var updateTracePreview = function(){
      var timeValues = $('#positionHeatMapSlider').val().split(',');
      //console.log(activeTracePersonIds)
      if(activeTracePersonIds.length > 0)  {
        drawTraceOverlay(frames, 'traceOverlay', activeTracePersonIds, timeValues[0], timeValues[1]);
        $('#traceOverlay').show();
      } else {
        $('#traceOverlay').hide();
      }
      $('.traceImage').each(function(){
        drawTraceOverlay(frames, $(this).attr('id'), [$(this).parent().attr('data-person-id')], timeValues[0], timeValues[1]);
      })
    }
    $('.trace').click(function(){
      // deactivate click
      if($(this).children('.traceImage').hasClass('active')){
        $(this).children('.traceImage').removeClass('active');
        $(this).children('.traceText').removeClass('active');

        activeTracePersonIds = activeTracePersonIds.remove($(this).attr('data-person-id'));
        updateTracePreview();
      }
      // activate click
      else {
        $(this).children('.traceImage').addClass('active');
        $(this).children('.traceText').addClass('active');

        activeTracePersonIds.push($(this).attr('data-person-id'));
        updateTracePreview();
      }
    });
  // initialize vis
    updateHeatMapPreview();
    updateTracePreview();
}
function initVideo(frames){
    var enableLogEvent = false;
    video1 = document.getElementById('video1');
    video2 = document.getElementById('video2');
    video3 = document.getElementById('video3');
    video4 = document.getElementById('video4');
    videoOverlay = document.getElementById('videoOverlay');
    var videos = [video1, video2, video3, videoOverlay];
    if(video4 != null) videos.push(video4);
    //videoOverlay2 = document.getElementById('videoOverlay2');
    $('#videoOverlay').hide();
    //$('#videoOverlay2').hide();
    $('#videoOverylayCheckbox').on('click', function(){
    	if($(this).is(':checked')){
    		$('#videoOverlay').show();
        //$('#videoOverlay2').hide();
        //$('#videoOverylayCheckbox2').prop('checked', false);
    	} else {
    		$('#videoOverlay').hide();
        //$('#videoOverlay2').hide();
    	}
    });
    /*
    $('#videoOverylayCheckbox2').on('click', function(){
      if($(this).is(':checked')){
        $('#videoOverlay2').show();
        $('#videoOverlay').hide();
        $('#videoOverylayCheckbox').prop('checked', false);
      } else {
        $('#videoOverlay').hide();
        $('#videoOverlay2').hide();
      }
    });*/
    $('#zoneOverlayCheckbox').on('click', function(){
      if($(this).is(':checked')){
        preferences.showZones = true;
      } else {
        preferences.showZones = false;
      }
    });


    canPlay = function(){
      var allCanPlay = true;
      videos.forEach(function(video){
        if(video.readyState != HAVE_ENOUGH_DATA){
          allCanPlay = false
        }
      });
      if(allCanPlay == true) return true;
      else return false;
    }
    handlePlayEvent = function(){
        if(enableLogEvent) console.log('play')
      /*
        videos.forEach(function(video){
          console.log(video.readyState, canPlay)
        });*/
        if($('#videoSeekBar').val() >= videoSeekBar.max) {
          videoSeekBar.slider('setValue', 0);
          videos.forEach(function(v){
            v.currentTime = $('#videoSeekBar').val();
          });
          currentTime = 0;
        }
        if(canPlay() == false) {
          playbackStatus = 'waitingToPlay';
          handlePauseEvent();
        } else {
          playbackStatus = 'play';
          videos.forEach(function(v){
            if(v.duration >= $('#videoSeekBar').val()){
              v.play();
            } else {
              v.pause();
            }
          });
        }
    }
    handlePauseEvent = function(){
        if(playbackStatus == 'waitingToPlay') {
          if(enableLogEvent) console.log('waiting to play')
        } else {
          playbackStatus = 'pause';
          if(enableLogEvent) console.log('pause')
        }
        videos.forEach(function(v){
          v.pause();
        });
    }
    handleSeekEvent = function(){
        if(playbackStatus == 'play' || playbackStatus == 'waitingToPlay' || playbackStatus == 'playAndSeeking'){
          if(enableLogEvent) console.log('play and seeking');
          playbackStatus = 'playAndSeeking';
        }
        else{
          if(enableLogEvent) console.log('pause and seeking');
          playbackStatus = 'pauseAndSeeking';
        }
        videos.forEach(function(v){
          v.currentTime = $('#videoSeekBar').val();
        });
        currentTime = parseInt($('#videoSeekBar').val()*1000);
        if(currentTime == 0) playFirstFrame = false;
    }
    handleSeekStopEvent = function(){
      if(playbackStatus == 'playAndSeeking'){
        handlePlayEvent();
      } else {
        handlePauseEvent();
      }
    }
    playVideoIfAllVideoReady = function(){
      if( (playbackStatus == 'waitingToPlay' || playbackStatus == 'playAndSeeking') && canPlay()){
        handlePlayEvent();
      }
    }
    videoSeekBar = $('#videoSeekBar').slider({ 
      id: 'videoSeekBarCss', 
      min: 0, 
      max: Math.floor(frames[frames.length-1].localTime/1000), 
      value: 0});
    videoSeekBar.on('slideStart', handleSeekEvent);
    videoSeekBar.on('slide', handleSeekEvent);
    videoSeekBar.on('slideStop', handleSeekStopEvent);
    videoSeekBar.on('change', handleSeekEvent);
    videoSeekBar.max = Math.floor(frames[frames.length-1].localTime/1000);
    $('#videoPlayButton').on('click', function(){
      $('#videoPlayButtonStatus').trigger('change');
    })
    $('#videoPlayButtonStatus').change( function(){
      //console.log('change', $('#videoPlayButtonStatus').val())
      if($('#videoPlayButtonStatus').val() == 'clickToPlay'){
        $('#videoPlayButtonStatus').val('clickToPause');
        $('#videoPlayButton').html('Pause');
        $('#videoPlayButton').removeClass('btn-danger');
        $('#videoPlayButton').blur();
        handlePlayEvent();
      } else {
        $('#videoPlayButtonStatus').val('clickToPlay');
        $('#videoPlayButton').html('Play');
        $('#videoPlayButton').addClass('btn-danger');
        $('#videoPlayButton').blur();
        handlePauseEvent();
      }
    });
    //video1.addEventListener('playing', handlePlayEvent, false);
    //video1.addEventListener('play', handlePlayEvent, false);
    //video1.addEventListener('pause', handlePauseEvent, false);
    //video1.addEventListener('seeking', handleSeekEvent, false);
    //video1.addEventListener('seeked', handleSeekEvent, false);
    initiatedVideoSeekBar = true;

    videos.forEach(function(video){
      video.addEventListener('canplay', playVideoIfAllVideoReady);
    });
}
function drawTraceOverlay(frames, divId, personIds, startTime, endTime){
  traceOverlayCanvas = new createjs.Stage(divId);
  centerX = traceOverlayCanvas.width/2;
  centerY = traceOverlayCanvas.height/2;
  var scale = $('#'+divId).width() / appConfig.kinectImageSize.w;
  traceOverlayCanvas.scaleX = scale*2;
  traceOverlayCanvas.scaleY = scale*2;

  var startFrame=0, endFrame=frames.length-1;
  while(frames[startFrame].localTime/1000 < startTime){
    startFrame++;
  }
  while(frames[endFrame].localTime/1000 > endTime){
    endFrame--;
  }

  traceOverlayCanvas.removeAllChildren();
  for(var i=0; i<personIds.length; i++){
    var d = drawOverviewMovement(frames, personIds[i], startFrame, endFrame, personConfig[personIds[i]].movementColor.backward, {r:0,g:0,b:0});
    traceOverlayCanvas.addChild(d);
  }
  traceOverlayCanvas.update();
}
function drawHeatmap(frames, divId, personId, startTime, endTime){
  var scale = $('#'+divId).width() / appConfig.kinectImageSize.w;
  computeHeatmapData(frames, scale, startTime, endTime);
  createHeatmap(divId, scale, personId);
}
function createHeatmap(id, scale, personId){
  // create configuration object
  var config = {
    container: document.getElementById(id),
    radius: appConfig.heatmapRadius*scale,
    maxOpacity: .5,
    minOpacity: 0,
    blur: .75
  };
  //console.log(config)
  // create heatmap with configuration
  var heatmap = h337.create(config);
  heatmap.setData({
    max: maxHeatMapValue[personId],
    data: heatmapData[personId]
  });
}
function computeFrame(data){
  var targetFrameTimeStamp =0;
  var newData = [];
  var step = 1000/appConfig.targetFPS;

  for(var i=0; i<data.length; i++) {
    if(data[i].localTime >= targetFrameTimeStamp) {
      
      for(var j=0; j<data[i].skeletons.length; j++) {
        /*
        // rotate -90 (0 = downward)
        data[i].skeletons[j].head.orientation = data[i].skeletons[j].head.orientation-90;
        
        // flip horizontally 
        data[i].skeletons[j].head.x = 512 - data[i].skeletons[j].head.x;
        
        if(data[i].skeletons[j].head.orientation >= 0 && data[i].skeletons[j].head.orientation < 90) 
          data[i].skeletons[j].head.orientation = 360 - data[i].skeletons[j].head.orientation;
        else if(data[i].skeletons[j].head.orientation > 90 && data[i].skeletons[j].head.orientation <= 180) 
          data[i].skeletons[j].head.orientation = 360 - data[i].skeletons[j].head.orientation;
        else if(data[i].skeletons[j].head.orientation > 180 && data[i].skeletons[j].head.orientation < 270) 
          data[i].skeletons[j].head.orientation = 360 - data[i].skeletons[j].head.orientation;
        else if(data[i].skeletons[j].head.orientation > 270 && data[i].skeletons[j].head.orientation < 360) 
          data[i].skeletons[j].head.orientation = 360 - data[i].skeletons[j].head.orientation;
        */
        /*
        if(data[i].skeletons[j].head.orientation >= 0 && data[i].skeletons[j].head.orientation < 90) 
          data[i].skeletons[j].head.orientation = data[i].skeletons[j].head.orientation + (2*(90-data[i].skeletons[j].head.orientation));
        else if(data[i].skeletons[j].head.orientation > 90 && data[i].skeletons[j].head.orientation <= 180) 
          data[i].skeletons[j].head.orientation = data[i].skeletons[j].head.orientation - (2*(data[i].skeletons[j].head.orientation-90));
        else if(data[i].skeletons[j].head.orientation > 180 && data[i].skeletons[j].head.orientation < 270) 
          data[i].skeletons[j].head.orientation = data[i].skeletons[j].head.orientation + (2*(270-data[i].skeletons[j].head.orientation));
        else if(data[i].skeletons[j].head.orientation > 270 && data[i].skeletons[j].head.orientation < 360) 
          data[i].skeletons[j].head.orientation = data[i].skeletons[j].head.orientation - (2*(data[i].skeletons[j].head.orientation-270));
        */
      }
      newData.push(data[i]);
      targetFrameTimeStamp += step;
    }
  }

  return newData;
}
function computeData(data, appConfig, temporaryIos) {
  var maxPersonId = 0;
  var frames = [];
  var maxX = 0, maxY = 0, maxD = 0;

  //first determine number of persons
  for(var i=0; i<data.length; i++){
    for(var j=0; j<data[i].skeletons.length; j++) {   
      if(data[i].skeletons[j].id > maxPersonId) maxPersonId = data[i].skeletons[j].id;
      if(data[i].skeletons[j].head.x > maxX) maxX = data[i].skeletons[j].head.x;
      if(data[i].skeletons[j].head.y > maxY) maxY = data[i].skeletons[j].head.y;
      if(data[i].skeletons[j].head.orientation > maxD) maxD = data[i].skeletons[j].head.orientation;
    }
  }
  //console.log('max x, y, orientation', maxX, maxY, maxD)
  // i refers to each raw data
  for(var i=0; i<data.length; i++){
    var newFrame = {frameNo:i+1, localTime:data[i].localTime, persons:[]};
    //console.log('frame no', i+1)
    //console.log('data', data[i])
    // initialize empty frames
    for(var j=0; j<=maxPersonId; j++){
        newFrame.persons[j] = {person: null, isInMap: false};
    }

    // j refers to each skeleton
    for(var j=0; j<=maxPersonId; j++){
      //console.log('i,j', i, j)
      if(data[i].skeletons[j] != null) {
        var o = data[i].skeletons[j];
        newFrame.persons[o.id] = {};
        // rotate counter clockwise 90 degree to (-y, x)
       // var shiftedHead = rotate(maxX/2, maxY/2, o.head.x, o.head.y, 270)
        //newFrame.persons[j].person = drawPerson(o.id, o.id, shiftedHead.x, shiftedHead.y, o.head.orientation, o.head.orientation, o.activity);

        // uncomment for non-inverted x, y
        newFrame.persons[o.id].person = drawPerson(o.id, o.id+1, o.head.x, o.head.y, o.head.orientation, o.head.orientation, o.activity);
        newFrame.persons[o.id].isInMap = true;
      } 
    }
    newFrame.interactiveObjects = [];
    for(var j=0; j<temporaryIos.length; j++){
      var io = temporaryIos[j];
      newFrame.interactiveObjects.push(drawInteractiveObject(io.config.id, io.config.name, io.config.type, io.config.x, io.config.y, io.config.w, io.config.h, io.config.rotation, io.config.color, io.config.flipLabel180degree));
    }
    //console.log('frame', newFrame);
    frames.push(newFrame);
  }
  for(var i=0; i<frames.length; i++){
    frames = highlightGroup(frames, i, temporaryIos);
    //if(frames[i].hasGroup) console.log(i, 'has group')
  }

  for(var i=0; i<frames.length; i++){
    var frame = frames[i];
    if(frame.groups) {
      for(var j=0; j<frame.groups.length; j++){
        var group = frame.groups[j];
        if(group.groupType == 'personFaceDevice'){

        } else if(group.groupType == 'personFacePerson'){
          if(!frame.formations) frame.formations = [];
          //frame.formations.push(drawPersonFacePersonFormation(group.persons[0], group.persons[1]));
        } else if(group.groupType == 'personNearPerson'){

        } else {
          frame.formations = null;
        }
      }
    }
  }

  return {maxPersonId:maxPersonId, frames:frames};
}
function computeHeatmapData(frames, scale, startTime, endTime){
  var tempHeatmapData = [];
  maxHeatMapValue = [];
  heatmapData = [];
  isInit = false;

  initTempHeatMapData = function(personLength){
    for(var k=0; k<personLength; k++){
      tempHeatmapData.push({});
      maxHeatMapValue.push(0);
      heatmapData.push([]);
    }
    isInit = true;
  }
  var startFrame=0, endFrame=frames.length-1;
  while(frames[startFrame].localTime/1000 < startTime){
    startFrame++;
  }
  while(frames[endFrame].localTime/1000 > endTime){
    endFrame--;
  }
  // each frame
  for(var i=startFrame; i<=endFrame; i++){
    // each person
    for(var j=0; j<frames[i].persons.length; j++){
      if(isInit == false) initTempHeatMapData(frames[i].persons.length);

      if(!frames[i].persons[j].isInMap) continue;
      var person = frames[i].persons[j].person;

      // assign key, value to heatmap
      var x = Math.round(person.headX*scale);
      var y = Math.round(person.headY*scale);
      var heatmapIndex = 'x'+x+'y'+y;
      if(!tempHeatmapData[person.id][heatmapIndex]) 
        tempHeatmapData[person.id][heatmapIndex] = {x: x, y: y, value: 1};
      else 
        tempHeatmapData[person.id][heatmapIndex].value += 1;

      if(tempHeatmapData[person.id][heatmapIndex].value > maxHeatMapValue[person.id]) maxHeatMapValue[person.id] = tempHeatmapData[person.id][heatmapIndex].value;

    }
  }
  for(var i=0; i<frames.length; i++){
    for(var index in tempHeatmapData[i]){
      heatmapData[i].push(tempHeatmapData[i][index]);
    }
  }
}
function drawPersonNearPersonFormation(person1, person2){
    var fformation = new createjs.Container();
    fformation.type = "f-formation-person-near-person";
    fformation.fixed = false;

    var a = person1.headX - person2.headX;
    var b = person1.headY - person2.headY;
    var distance = Math.sqrt( a*a + b*b );

    //O-ring
    var oRing = new createjs.Shape();
    oRing.name = "o-ring";
    oRing.config = {};
    oRing.config.offset = person1.getChildByName("body").config.h+10;
    oRing.config.w = 200;
    oRing.config.h = 200;
    oRing.config.x = person1.headX;
    oRing.config.y = person1.headY;

    var color = groupConfig[person1.groupId];
    oRing.graphics.beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5)).setStrokeStyle(1).drawEllipse(0,0, oRing.config.w, oRing.config.h);
    oRing.regX = (oRing.config.w/2);
    oRing.regY = (oRing.config.h/2);
    oRing.x = oRing.config.x;
    oRing.y = oRing.config.y;
    oRing.rotation = person1.headRotation;

    fformation.addChild(oRing);

    //O-ring
    var oRing2 = new createjs.Shape();
    oRing2.name = "o-ring";
    oRing2.config = {};
    oRing2.config.offset = person2.getChildByName("body").config.h+10;
    oRing2.config.w = 200;
    oRing2.config.h = 200;
    oRing2.config.x = person2.headX;
    oRing2.config.y = person2.headY;

    var color = groupConfig[person2.groupId];
    oRing2.graphics.beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5)).setStrokeStyle(1).drawEllipse(0,0, oRing2.config.w, oRing2.config.h);
    oRing2.regX = (oRing2.config.w/2);
    oRing2.regY = (oRing2.config.h/2);
    oRing2.x = oRing2.config.x;
    oRing2.y = oRing2.config.y;
    oRing2.rotation = person2.headRotation;

    fformation.addChild(oRing2);

    var intersection = circleIntersection(oRing.config.x, oRing.config.y, 100, oRing2.config.x, oRing2.config.y, 100);
    var i1 = {x:intersection[0], y:intersection[2]};
    var i2 = {x:intersection[1], y:intersection[3]};
    console.log(i1,i2)

    return fformation;
}
function drawPersonFacePersonFormation(person1, person2){
    var fformation = new createjs.Container();
    fformation.type = "f-formation-person-face-person";
    fformation.fixed = false;

    var a = person1.headX - person2.headX;
    var b = person1.headY - person2.headY;
    var distance = Math.sqrt( a*a + b*b );

    // if distance is > 50 draw o-ring
    if(distance >= appConfig.formation.personFacePerson.minDistance){
      //O-ring
      var oRing = new createjs.Shape();
      oRing.name = "o-ring";
      oRing.config = {};
      oRing.config.offset = person1.getChildByName("body").config.h+10;
      oRing.config.w = distance-oRing.config.offset;
      oRing.config.h = distance-oRing.config.offset;
      oRing.config.x = (person1.headX+person2.headX)/2;
      oRing.config.y = (person1.headY+person2.headY)/2;

      var color = groupConfig[person1.groupId];
      oRing.graphics.beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5)).setStrokeStyle(5).drawEllipse(0,0, oRing.config.w, oRing.config.h);
      oRing.regX = oRing.config.w/2;
      oRing.regY = oRing.config.h/2;
      oRing.x = oRing.config.x;
      oRing.y = oRing.config.y;
      oRing.rotation = 0;

      var pRing = new createjs.Shape();
      pRing.name = "p-ring";
      pRing.config = {};
      pRing.config.offsetw = person1.getChildByName("body").config.h+50;
      pRing.config.offseth = person1.getChildByName("body").config.w+60;
      pRing.config.w = distance+pRing.config.offsetw;
      pRing.config.h = pRing.config.offseth;
      pRing.config.x = (person1.headX+person2.headX)/2;
      pRing.config.y = (person1.headY+person2.headY)/2;

      pRing.graphics.beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5)).setStrokeStyle(5).drawEllipse(0,0, pRing.config.w, pRing.config.h);
      pRing.regX = pRing.config.w/2;
      pRing.regY = pRing.config.h/2;
      pRing.x = pRing.config.x;
      pRing.y = pRing.config.y;
      pRing.rotation = 0;

      fformation.addChild(oRing);
      fformation.addChild(pRing);
    }
    return fformation;
}
function isPersonLineOfSightCrossInteractiveObject(person, io){
  var lineOfSightLength = appConfig.collisionDetection.lineOfSightLength;
  var precision = appConfig.collisionDetection.pixelPrecision;

  var rect= io.getChildByName('rect');

  /*
  for(x=-1000; x<1000; x+=20){
    for(y=-1000; y<1000; y+=20){
      var pt = stage.localToLocal(x, y ,rect);
      if(rect.hitTest(pt.x, pt.y))
        console.log(pt.x, pt.y, x, y, 'hit')
    }
  }*/
  // simulate line of sight every precesion unit
  for(var i=0; i<lineOfSightLength; i+=precision){
    var xToCheck = person.headX+(i*Math.cos(toRadians(person.headRotation+90)));
    var yToCheck = person.headY+(i*Math.sin(toRadians(person.headRotation+90)));

    if(xToCheck < 0 || yToCheck <0) break;

    var pt = stage.localToLocal(xToCheck, yToCheck, rect);
    //console.log(i, person.id, pt, xToCheck, yToCheck)
    if(rect.hitTest(pt.x, pt.y) == true) {
      //console.log('hit', pt, xToCheck, yToCheck, person.headX, person.headY, person.headRotation);
      return true;
    }
  }
}
function isPersonLineOfSightCrossPerson(person1, person2){
  var lineOfSightLength = appConfig.collisionDetection.lineOfSightLength;
  var precision = appConfig.collisionDetection.pixelPrecision;

  var body2= person2.getChildByName('body');

  // simulate line of sight every precesion unit
  for(var i=0; i<lineOfSightLength; i+=precision){
    var xToCheck = person1.headX+(i*Math.cos(toRadians(person1.headRotation+90)));
    var yToCheck = person1.headY+(i*Math.sin(toRadians(person1.headRotation+90)));
    //console.log(xToCheck, yToCheck)
    if(xToCheck < 0 || yToCheck <0) break;

    //console.log(i, person.id, pt, xToCheck, yToCheck)
    var pt = body2.globalToLocal(xToCheck, yToCheck);
    if(body2.hitTest(pt.x, pt.y) == true) {
      //console.log('hit', pt, xToCheck, yToCheck, person1.headX, person1.headY, person1.headRotation);
      return true;
    }
  }
}
function isPersonNearPerson(person1, person2){
  // distance
  var a = person1.headX - person2.headX;
  var b = person1.headY - person2.headY;
  var distance = Math.sqrt( a*a + b*b )

  if(! (distance < appConfig.grouping.nearDistance)) return false;
  var person1_x1 = person1.headX;
  var person1_y1 = person1.headY;
  var person1_x2 = person1.headX+(3000*Math.cos(toRadians(person1.headRotation+90)));
  var person1_y2 = person1.headY+(3000*Math.sin(toRadians(person1.headRotation+90)));

  var person2_x1 = person2.headX;
  var person2_y1 = person2.headY;
  var person2_x2 = person2.headX+(3000*Math.cos(toRadians(person2.headRotation+90)));
  var person2_y2 = person2.headY+(3000*Math.sin(toRadians(person2.headRotation+90)));
  //console.log(person1_x1, person1_y1, person1_x2, person1_y2, person2_x1, person2_y1, person2_x2, person2_y2)
  if(!lineIntersect(person1_x1, person1_y1, person1_x2, person1_y2, 
                    person2_x1, person2_y1, person2_x2, person2_y2) ) {
    return false;
  }
  return true;
}
function drawPersonLineOfSight(person){
  var lineOfSightLength = appConfig.collisionDetection.lineOfSightLength;

  var sight = new createjs.Shape();
  sight.graphics.beginFill("red").drawRect(0, 0, 1, lineOfSightLength);
  sight.x = person.headX;
  sight.y = person.headY;
  sight.rotation = person.headRotation;

  return sight;
}
function highlightGroup(frames, processFrame, temporaryIos){
  var frame = frames[processFrame];
  var groupId = 0;
  var usingCurrentGroup = false;
  var frameHasGroup = false;
  var groups = [];
  
  // case 1 check facing interactive object && person within viewing angle of device
    // for each object
    for(var i=0; i<temporaryIos.length; i++){    
      var tempIo = temporaryIos[i]; 

      var minAngle = tempIo.config.rotation+180-appConfig.grouping.viewingAngle;
      var maxAngle = tempIo.config.rotation+180+appConfig.grouping.viewingAngle;

      var personsJoiningGroup = [];
      // for each person
      for(var j=0; j<frame.persons.length; j++){ 
        if(frame.persons[j].isInMap == true){
          var person = frame.persons[j].person;
          // check if person available and on stage
          if(person.groupId == null) { 
            // check if within display viewing distance
          	// console.log(processFrame, i, j, person.headX, person.headY, person.headRotation, minAngle, maxAngle);
            if(isAngleInRange(minAngle, maxAngle, person.headRotation)){
              // check if person sight cross  
              //console.log(processFrame, i, j, person.headX, person.headY, person.headRotation);
              if(isPersonLineOfSightCrossInteractiveObject(person, tempIo)){
                var newColor = {r:groupConfig[groupId].r, g:groupConfig[groupId].g, b:groupConfig[groupId].b};
                var newPerson = drawPerson(person.config.id, person.config.name, person.config.x, person.config.y, person.config.bodyDegree, person.config.headDegree, person.config.activity, newColor);
                // mark person in group, not available for another group
                newPerson.groupId = groupId;
                newPerson.groupType = "personFaceDevice";
                frame.persons[j].person = newPerson;
                personsJoiningGroup.push(frame.persons[j].person);

                var io = frame.interactiveObjects[i];
                var newIo = drawInteractiveObject(io.config.id, io.config.name, io.config.type, io.config.x, io.config.y, io.config.w, io.config.h, io.config.rotation, newColor, io.config.flipLabel180degree);
                newIo.groupId = groupId;
                frame.interactiveObjects[i] = newIo;

                //console.log('frame '+processFrame, '| person', person.id, 'and object', io.name,'is in group', newPerson.groupId);
                usingCurrentGroup = true;
              }
            }
          }
        }
      }
      if(usingCurrentGroup == true) {
        frameHasGroup = true;
        groupId++;
        usingCurrentGroup = false;
        groups.push({groupType:"personFaceDevice", persons:personsJoiningGroup, interactiveObjects: frame.interactiveObjects[i]});
      } 
    }

  // case 2 check facing another person
  // case 3 check stay close to another person and not facing away and have a mobile or tablet out
    // for each person
    for(var i=0; i<frame.persons.length; i++){
      // check if available
      var personsJoiningGroup = [];
      if(frame.persons[i].isInMap && frame.persons[i].person.groupId == null){
        var person1 = frame.persons[i].person;
        // for each other person
        for(var j=0; j<frame.persons.length; j++){
          // check if not the same person & available
          if(i!=j && frame.persons[j].isInMap && frame.persons[j].person.groupId == null){
            var person2 = frame.persons[j].person;
            var needGrouping = false;
            var groupType;
            // check if line of sight cross body
            //console.log(i, j);
            if(isPersonLineOfSightCrossPerson(person1, person2) && isPersonLineOfSightCrossPerson(person2, person1)){
              //console.log('case 2')
              needGrouping = true;
              groupType = "personFacePerson";
            } 
            // check if stay close together & line of sight cross each other
            else if(isPersonNearPerson(person1, person2)){
              //console.log('case 3')
              needGrouping = true;
              groupType = "personNearPerson";
            }

            if(needGrouping){
              // mark person in group, not available for another group
              // replace person with new person with group color

              var newColor = {r:groupConfig[groupId].r, g:groupConfig[groupId].g, b:groupConfig[groupId].b};
              //console.log(newColor)
              var newPerson1 = drawPerson(person1.config.id, person1.config.name, person1.config.x, person1.config.y, person1.config.bodyDegree, person1.config.headDegree, person1.config.activity, newColor, false);
              newPerson1.groupId = groupId;
              newPerson1.groupType = groupType;
              frame.persons[i].person = newPerson1;

              var newPerson2 = drawPerson(person2.config.id, person2.config.name, person2.config.x, person2.config.y, person2.config.bodyDegree, person2.config.headDegree, person2.config.activity, newColor, false);
              newPerson2.groupId = groupId;
              newPerson2.groupType = groupType;
              frame.persons[j].person = newPerson2;

              //console.log('frame '+processFrame, '| person', newPerson1.id, 'and person', newPerson2.id,'is in group', groupId);
              personsJoiningGroup.push(frame.persons[i].person);
              personsJoiningGroup.push(frame.persons[j].person);
              usingCurrentGroup = true;
            }
          }
        }
        if(usingCurrentGroup == true) {
          frameHasGroup = true;
          groupId++;
          usingCurrentGroup = false;
          groups.push({groupType:groupType, persons:personsJoiningGroup});
        }
      }
    }

    // for each person
      // check if available
        // for each other person
          // check if available
            // check if orientation is < 180 degree
              // check if distance < 1.5 meter
                // mark person in group
                // mark person is not available for other group

  // change the color of persons and object in each group
  if(groups.length > 0) frame.groups = groups;
  else frame.groups = null;

  frames[processFrame] = frame;

  return frames;
}
function drawBackwardMovement(frames, processFrame, personId, seconds, rgb){
  var totalFrames = appConfig.targetFPS * seconds;
  var noFramesProcessed = 0;

  var mo = new createjs.Container();
  mo.type = "movement";
  mo.fixed = false;

  // draw from latest frame to older frames
  //console.log('frame', processFrame, frames[processFrame]);
  while(processFrame >=1 && noFramesProcessed <= totalFrames){
    if(frames[processFrame].persons[personId].isInMap == true &&
        frames[processFrame-1].persons[personId].isInMap == true) {
      var start = frames[processFrame].persons[personId].person.getChildByName("body");
      var end =   frames[processFrame-1].persons[personId].person.getChildByName("body");
      var alpha = 1.0-(noFramesProcessed/totalFrames);

      var line = new createjs.Shape();
      line.name = "line";
      line.graphics.beginStroke(createjs.Graphics.getRGB(rgb.r,rgb.g,rgb.b, alpha)).setStrokeStyle(2, "round");
      line.graphics.moveTo(start.x, start.y);
      line.graphics.lineTo(end.x, end.y);
      mo.addChild(line);
    }

    processFrame--;
    noFramesProcessed++;
  }
  //console.log('exit')

  return mo;
}
function drawForwardMovement(frames, processFrame, personId, seconds, rgb){
  var totalFrames = appConfig.targetFPS * seconds;
  var noFramesProcessed = 0;

  var mo = new createjs.Container();
  mo.type = "movement";
  mo.fixed = false;

  // draw from latest frame to older frames
  //console.log('frame', processFrame, frames[processFrame]);
  while(processFrame+1 < frames.length && noFramesProcessed <= totalFrames){
    if(frames[processFrame].persons[personId].isInMap == true &&
        frames[processFrame+1].persons[personId].isInMap == true) {
      var start = frames[processFrame].persons[personId].person.getChildByName("body");
      var end =   frames[processFrame+1].persons[personId].person.getChildByName("body");
      var alpha = 1.0-(noFramesProcessed/totalFrames);

      var line = new createjs.Shape();
      line.name = "line";
      line.graphics.beginStroke(createjs.Graphics.getRGB(rgb.r,rgb.g,rgb.b, alpha)).setStrokeStyle(4, "round");
      line.graphics.moveTo(start.x, start.y);
      line.graphics.lineTo(end.x, end.y);
      mo.addChild(line);
    }

    processFrame++;
    noFramesProcessed++;
  }
  //console.log('exit')

  return mo;
}
function drawOverviewMovement(frames, personId, startFrame, endFrame, rgb1, rgb2){
  var processFrame = startFrame;
  var totalFrames = endFrame-startFrame;
  var noFramesProcessed = 0;

  var mo = new createjs.Container();
  mo.type = "movement";
  mo.fixed = false;

  // draw from latest frame to older frames
  //console.log('frame', processFrame, frames[processFrame]);
  while(processFrame+1 < frames.length && processFrame < endFrame){
      if(frames[processFrame].persons[personId].isInMap == true &&
        frames[processFrame+1].persons[personId].isInMap == true) {
        var start = frames[processFrame].persons[personId].person.getChildByName("body");
        var end =   frames[processFrame+1].persons[personId].person.getChildByName("body");
        var alpha = 1.0;
        var r = rgb1.r + Math.floor((rgb2.r-rgb1.r)/totalFrames*(processFrame-startFrame));
        var g = rgb1.g + Math.floor((rgb2.g-rgb1.g)/totalFrames*(processFrame-startFrame));
        var b = rgb1.b + Math.floor((rgb2.b-rgb1.b)/totalFrames*(processFrame-startFrame));

        var line = new createjs.Shape();
        line.name = "line";
        line.graphics.beginStroke(createjs.Graphics.getRGB(r, g, b, alpha)).setStrokeStyle(4, "round");
        line.graphics.moveTo(start.x, start.y);
        line.graphics.lineTo(end.x, end.y);
        mo.addChild(line);
      }

      processFrame++;
  }

  return mo;
}
function drawZone(persons, type, name, x, y, w, h, rgb, rotation){
  var config = {inactiveAlpha: 0.1, activeAlpha: 0.2, textInactiveAlpha:0.3, textActiveAlpha:0.6};
  var alpha = config.inactiveAlpha;
  var textAlpha = config.textInactiveAlpha;
  var active = false;
  var zo = new createjs.Container();
  zo.type = "zone";
  zo.fixed = true;

  // dummy for collision test
  var dummy = new createjs.Shape();
  if(type == "rectangle"){
    dummy.graphics.beginFill("white").drawRect(0, 0, w, h);
    dummy.regX = w/2;
    dummy.regY = h/2;
    dummy.x = x+(w/2);
    dummy.y = y+(h/2);
    dummy.rotation = rotation;
  } else if(type == "ellipse"){
    dummy.graphics.beginFill("white").drawEllipse(0, 0, w, h);
    dummy.regX = w/2;
    dummy.regY = h/2;
    dummy.x = x+(w/2);
    dummy.y = y+(h/2);
    dummy.rotation = rotation;
  } else if(type == "arc"){
    var curveStartPoint = {x: x+w, y: y};
    var curveMidPoint = {x:x+(w/2), y:y+h};
    var curveEndPoint = {x:x, y:y};
    var curveControlPoint = {x: curveMidPoint.x*2 - (curveStartPoint.x+curveEndPoint.x)/2, 
                             y: curveMidPoint.y*2 - (curveStartPoint.y+curveEndPoint.y)/2};
    dummy.graphics.beginStroke("black").beginFill("white");
    dummy.graphics.setStrokeStyle(0.5);
    dummy.graphics.moveTo(x, y);
    dummy.graphics.lineTo(curveStartPoint.x, curveStartPoint.y);
    dummy.graphics.quadraticCurveTo(curveControlPoint.x, curveControlPoint.y, curveEndPoint.x, curveEndPoint.y).closePath();
    //console.log(dummy)
  }

  //check collision
  persons.forEach(function(p){
    //check x axis
    //console.log(p);
    if(p.isInMap == true){
      var body = p.person.getChildByName("body");
      var pt = dummy.globalToLocal(body.x, body.y);
      if(dummy.hitTest(pt.x, pt.y)) {
        alpha = config.activeAlpha;
        textAlpha = config.textActiveAlpha;
        active = true;
      }
      //console.log(body.x, body.y, dummy.x, dummy.y, pt.x, pt.y);
    }
  });

  if(type == "rectangle"){
    var rect = new createjs.Shape();
    rect.name = "rect";
    rect.graphics.beginFill(createjs.Graphics.getRGB(rgb.r,rgb.g,rgb.b,alpha));
    if(active) rect.graphics.setStrokeStyle(1).beginStroke(createjs.Graphics.getRGB(rgb.r, rgb.g, rgb.b, 1));
    rect.graphics.drawRect(0, 0, w, h);
    rect.regX = w/2;
    rect.regY = h/2;
    rect.x = x+(w/2);
    rect.y = y+(h/2);
    rect.rotation = rotation;
    zo.addChild(rect);
  } else if(type == "ellipse"){
    var el = new createjs.Shape();
    el.name = "ellipse";
    el.graphics.beginFill(createjs.Graphics.getRGB(rgb.r,rgb.g,rgb.b,alpha));
    if(active) el.graphics.setStrokeStyle(1).beginStroke(createjs.Graphics.getRGB(rgb.r, rgb.g, rgb.b, 1));
    el.graphics.drawEllipse(0, 0, w, h);
    el.regX = w/2;
    el.regY = h/2;
    el.x = x+(w/2);
    el.y = y+(h/2);
    el.rotation = rotation;
    zo.addChild(el);
  } else if(type == "arc"){
    var arc = new createjs.Shape();
    arc.graphics.beginStroke().beginFill(createjs.Graphics.getRGB(rgb.r,rgb.g,rgb.b,alpha));
    if(active) arc.graphics.setStrokeStyle(1).beginStroke(createjs.Graphics.getRGB(rgb.r, rgb.g, rgb.b, 1));
    arc.graphics.setStrokeStyle(0.5);
    
    var curveStartPoint = {x: x+w, y: y};
    var curveMidPoint = {x:x+(w/2), y:y+h};
    var curveEndPoint = {x:x, y:y};
    var curveControlPoint = {x: curveMidPoint.x*2 - (curveStartPoint.x+curveEndPoint.x)/2, 
                             y: curveMidPoint.y*2 - (curveStartPoint.y+curveEndPoint.y)/2};
    arc.graphics.moveTo(x, y);
    arc.graphics.lineTo(curveStartPoint.x, curveStartPoint.y);
    arc.graphics.quadraticCurveTo(curveControlPoint.x, curveControlPoint.y, curveEndPoint.x, curveEndPoint.y).closePath();
    //console.log(curveStartPoint, curveMidPoint, curveEndPoint, curveControlPoint);
    zo.addChild(arc);
  }

  var label = new createjs.Text();
  label.name = "label";
  label.text = name;
  label.font = "normal 20px Trebuchet MS";
  label.color = createjs.Graphics.getRGB(rgb.r,rgb.g,rgb.b, textAlpha);
  label.regX = label.getBounds().width/2;
  label.regY = label.getBounds().height/2;
  label.x = x+(w/2);
  label.y = y+(h/2)-(label.getBounds().height/2);
  label.rotation = rotation;
  zo.addChild(label);

  return zo;
}
function drawInteractiveObject(id, name, type, x, y, w, h, rotation, color, flipLabel180degree){
  var io = new createjs.Container();
  io.type = "interactive_object";
  io.fixed = true;
  io.groupId = null;
  io.id = id;
  io.name = name;
  io.config = {id:id, name:name, type:type, x:x, y:y, w:w, h:h, rotation:rotation, color:color, flipLabel180degree:flipLabel180degree};


  if(type=="display") {
    io.interactiveObjectType = 'display';
    var rect = new createjs.Shape();
    rect.name = "rect";
    if(!color)
      rect.graphics.setStrokeStyle(1).beginStroke("Black").beginFill("white");
    else
      rect.graphics.setStrokeStyle(1).beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 1.0)).beginFill(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5));
    rect.graphics.drawRect(0, 0, w, h);
    rect.regX = w/2;
    rect.regY = h/2;
    rect.x = x;
    rect.y = y;
    rect.rotation = rotation;
    io.addChild(rect);

    var back = new createjs.Shape();
    var config = {hFactor: 0.4, wFactor: 0.8, hMax: 6};
    config.backHeight = h*config.hFactor>config.hMax?config.hMax:h*config.hFactor;
    back.name = "back";
    if(!color)
      back.graphics.setStrokeStyle(1).beginStroke("Black").beginFill("white");
    else
      back.graphics.setStrokeStyle(1).beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 1.0)).beginFill(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5));
    back.graphics.drawRect(0, 0, w*config.wFactor, config.backHeight);
    back.regX = (w/2)-(w*(1-config.wFactor)/2); 
    back.regY = (h/2)+config.backHeight; 
    back.x = x;
    back.y = y;
    back.rotation = rotation;
    io.addChild(back);

    var label = new createjs.Text();
    label.name = "label";
    label.id = id;
    label.text = name;
    label.font = "normal 14px Trebuchet MS";
    label.color = "black";
    label.regX = label.getBounds().width/2;
    label.regY = (label.getBounds().height/2)+2;
    label.x = x;
    label.y = y;
    if(flipLabel180degree == true) {
      label.rotation = rotation+180;
    } else {
      label.rotation = rotation;
    }

    io.addChild(label);
  }

  return io;
}
function drawFixedObject(id, name, x, y, w, h, rotation){
  var fo = new createjs.Container();
  fo.type = "noninteractive_object";
  fo.fixed = true;

  var rect = new createjs.Shape();
  rect.name = "rect";
  rect.graphics.setStrokeStyle(1).beginStroke("Black");
    //var stripe = new Image();
    //stripe.src = "images/7.svg";
    //rect.graphics.beginBitmapFill(stripe);
  rect.graphics.drawRect(0, 0, w, h);
  rect.regX = w/2;
  rect.regY = h/2;
  rect.x = x;
  rect.y = y;
  rect.rotation = rotation;

  //var stripe = new createjs.Bitmap("images/stripe1.png");
  fo.addChild(rect);

  var label = new createjs.Text();
  label.name = "label";
  label.id = id;
  label.text = name;
  label.font = "normal 14px Trebuchet MS";
  label.color = "black";
  label.regX = label.getBounds().width/2;
  label.regY = label.getBounds().height/2;
  label.x = x;
  label.y = y-2;
  label.rotation = rotation;
  fo.addChild(label);

  return fo;
}
function drawBorder(){
  var border = new createjs.Shape();
  border.name = "border";
  border.fixed = true;
  border.graphics.setStrokeStyle(1).beginStroke("Black");
  var sizeX = appConfig.kinectImageSize.w+(2*appConfig.kinectImageSize.marginBorder);
  var sizeY = appConfig.kinectImageSize.h+(2*appConfig.kinectImageSize.marginBorder);
  border.graphics.drawRect(0, 0, sizeX, sizeY);
  return border;
}
function drawDistance(o1, o2){
  var x1, y1, x2, y2;
  if(o1.type == "person") {
    var body = o1.getChildByName("body");
    x1 = body.x; 
    y1 = body.y; 
  } else if(o1.type == 'interactive_object'){
    if(o1.interactiveObjectType == 'display'){
      x1 = o1.config.x;
      y1 = o1.config.y;
    }
  }
  if(o2.type == "person") {
    var body = o2.getChildByName("body");
    x2 = body.x; 
    y2 = body.y; 
  } else if(o2.type == 'interactive_object'){
    if(o2.interactiveObjectType == 'display'){
      x2 = o2.config.x;
      y2 = o2.config.y;
    }
  }
  //console.log('a', x1, y1, x2, y2, o1, o2);

  var distance = new createjs.Container();
  distance.type = "distance";
  distance.fixed = false;

  var line = new createjs.Shape();
  line.name = "line";

  var label = new createjs.Text();
  label.name = "label";
  var d2points = calculateDistanceBetweenTwoPoints(x1, y1, x2, y2);
  var distanceCm = d2points*appConfig.pixelToMetreRatio;
  label.text = (distanceCm/100).toFixed(2)+"m";
  if(o1.type == 'person' && o2.type == 'person')
    label.text = label.text+"\n"+getProxemicZoneLabel(distanceCm);
  
  //label.text = "0.80m\nPersonal";
  label.font = "bold 13px Trebuchet MS";
  if(getProxemicZoneLabel(distanceCm)=="Public") {
    label.color = "#333333"
    line.graphics.beginStroke("#333333");
  }
  else {
    label.color = "red";
    line.graphics.beginStroke("red");
  }
  label.textAlign = "center";
  label.regX = 0; //label.getBounds().width/2
  label.regY = 0;
  label.x = (x1 + x2)/2;
  label.y = ((y1 + y2)/2)+4;
  label.rotation = Math.atan((y2 - y1)/(x2 - x1))*180/Math.PI;
  distance.addChild(label);

  line.graphics.setStrokeStyle(0.5);
  line.graphics.moveTo(x1, y1);
  line.graphics.lineTo(x2, y2);
  distance.addChild(line);

  return distance;
}
function drawPerson(id, name, x, y, bodyDegree, headDegree, activity, color, disableProxemic){

    var person = new createjs.Container();
    person.type = "person";
    person.fixed = false;
    person.id = id;
    person.groupId = null;
    person.config = {id: id, name:name, x:x, y:y, bodyDegree:bodyDegree, headDegree:headDegree, activity:activity, color:color};

    if(!disableProxemic){
      //proxemic
      var proxemic = new createjs.Shape();
      proxemic.name = "proxemic";
      proxemic.config = {w:appConfig.proxemic.w/appConfig.pixelToMetreRatio*2, h:appConfig.proxemic.h/appConfig.pixelToMetreRatio*2 , x:x, y:y};
      //beginFill("#DDDDDD")
      if(!color)
        proxemic.graphics.beginStroke(createjs.Graphics.getRGB(240, 240, 240, 0.8)).setStrokeStyle(5).drawEllipse(0,0, proxemic.config.w, proxemic.config.h);
      else
        proxemic.graphics.beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5)).setStrokeStyle(5).drawEllipse(0,0, proxemic.config.w, proxemic.config.h);
      proxemic.regX = proxemic.config.w/2;
      proxemic.regY = proxemic.config.h/2;
      proxemic.x = proxemic.config.x;
      proxemic.y = proxemic.config.y;
      proxemic.rotation = bodyDegree;
      person.addChild(proxemic);
    }

    //body
    var body = new createjs.Shape();
    body.name = "body";
    body.config = {w:150, h:70 , x:x, y:y-2.5}; //{w:90, h:45 , x:x, y:y-2.5};
    if(!color)
      body.graphics.beginFill(createjs.Graphics.getRGB(240, 240, 240, 0.8)).drawEllipse(0,0, body.config.w, body.config.h);
    else
      body.graphics.beginFill(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5)).drawEllipse(0,0, body.config.w, body.config.h);
    body.regX = body.config.w/2;
    body.regY = body.config.h/2;
    body.x = body.config.x;
    body.y = body.config.y;
    body.rotation = bodyDegree;
    person.addChild(body);

    //head
    var head = new createjs.Shape();
    head.name = "head";
    head.config = {w:60, h:80 , x:x, y:y+5}; // {w:30, h:45 , x:x, y:y-5};
    if(!color)
      head.graphics.beginFill("#CCCCCC").drawEllipse(0,0, head.config.w, head.config.h);
    else
      head.graphics.beginFill(createjs.Graphics.getRGB(color.r,color.g,color.b, 1.0)).drawEllipse(0,0, head.config.w, head.config.h);
    head.regX = head.config.w/2;
    head.regY = head.config.h/2;
    head.x = head.config.x;
    head.y = head.config.y;
    head.rotation = headDegree;
    person.addChild(head);

    //person metadata
    person.headX = head.config.x;
    person.headY = head.config.y;
    person.headRotation = headDegree;

    //name
    var label = new createjs.Text();
    label.name = "label";
    label.text = name;
    label.font = "bold 16px Trebuchet MS";
    label.color = "black";
    label.regX = 5;
    label.regY = 10;
    label.x = x;
    label.y = y+5;
    label.rotation = headDegree;
    person.addChild(label);

    if(true){
    //if(!disableProxemic){
      //sight left
      var sightRadius = 120; //70;
      var sight_l = new createjs.Shape();
      sight_l.name = "sight_left";
      if(!color)
        sight_l.graphics.beginStroke("#999999");
      else
        sight_l.graphics.beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 1.0));
      sight_l.graphics.setStrokeStyle(1);
      sight_l.graphics.moveTo(0, 0);
      sight_l.graphics.lineTo(-Math.cos((180-appConfig.sightAngle)/2*Math.PI/180)*sightRadius, -Math.sin((180-appConfig.sightAngle)/2*Math.PI/180)*sightRadius);
      sight_l.regX = 8;
      sight_l.regY = 16;
      sight_l.x = x;
      sight_l.y = y-7;
      sight_l.rotation = headDegree+180;
      person.addChild(sight_l);

      //sight right
      var sight_r = new createjs.Shape();
      sight_r.name = "sight_right";
      if(!color)
        sight_r.graphics.beginStroke("#999999");
      else
        sight_r.graphics.beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 1.0));
      sight_r.graphics.setStrokeStyle(1);
      sight_r.graphics.moveTo(0, 0);
      sight_r.graphics.lineTo(Math.cos((180-appConfig.sightAngle)/2*Math.PI/180)*sightRadius, -Math.sin((180-appConfig.sightAngle)/2*Math.PI/180)*sightRadius);
      sight_r.regX = -8;
      sight_r.regY = 16;
      sight_r.x = x;
      sight_r.y = y-7;
      sight_r.rotation = headDegree+180;
      person.addChild(sight_r);
    }

    if(activity == "phone") {
      person.addChild(drawMobileObject("phone", x, y, headDegree, color));
    } else if(activity == "tablet") {
      person.addChild(drawMobileObject("tablet", x, y, headDegree, color));
    }

    return person;
}
function drawMobileObject(type, x, y, rotation, color){
  var config = {phone:{w:16,h:24,r:2, xFromBody:20, yFromBody:-70}, 
                phone_b:{size:2, offsetX:1, offsetY:7},
                tablet:{w:32,h:48,r:3, xFromBody:20, yFromBody:-70, rFromBody:5},
                tablet_s:{w:28,h:40}};
  var mo = new createjs.Container();
  mo.type = "mobile";
  mo.fixed = false;
  mo.config = {type:type, x:x, y:y, rotation:rotation, color:color};

  if(type == "phone") {
    var rect = new createjs.Shape();
    rect.name = "phone";
    if(!color)
      rect.graphics.setStrokeStyle(1).beginStroke("Black").beginFill("grey");
    else
      rect.graphics.setStrokeStyle(1).beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 1.0)).beginFill(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5));
    rect.graphics.drawRoundRect(config.phone.xFromBody, config.phone.yFromBody, config.phone.w, config.phone.h, config.phone.r, config.phone.r, config.phone.r, config.phone.r);
    rect.regX = config.phone.w/2;
    rect.regY = config.phone.h/2;
    rect.x = x;
    rect.y = y;
    rect.rotation = rotation+180;
    mo.addChild(rect);

    var circle = new createjs.Shape();
    circle.name = "phone_button";
    circle.graphics.beginFill("white");
    circle.graphics.drawCircle(config.phone.xFromBody+config.phone_b.offsetX, config.phone.yFromBody+config.phone_b.offsetY, config.phone_b.size);
    circle.regX = config.phone_b.size/2;
    circle.regY = config.phone_b.size/2;
    circle.x = x;
    circle.y = y;
    circle.rotation = rotation+180;
    mo.addChild(circle);

  } else if(type == "tablet") {
    var rect = new createjs.Shape();
    rect.name = "tablet";
    if(!color)
      rect.graphics.setStrokeStyle(1).beginStroke("Black").beginFill("grey");
    else
      rect.graphics.setStrokeStyle(1).beginStroke(createjs.Graphics.getRGB(color.r,color.g,color.b, 1.0)).beginFill(createjs.Graphics.getRGB(color.r,color.g,color.b, 0.5));
    rect.graphics.drawRoundRect(config.tablet.xFromBody, config.tablet.yFromBody, config.tablet.w, config.tablet.h, config.tablet.r, config.tablet.r, config.tablet.r, config.tablet.r);
    rect.regX = config.tablet.w/2;
    rect.regY = config.tablet.h/2;
    rect.x = x;
    rect.y = y;
    rect.rotation = rotation+config.tablet.rFromBody+180;
    mo.addChild(rect);

    var rect_s = new createjs.Shape();
    rect_s.name = "tablet_screen";
    rect_s.graphics.beginFill("white");
    rect_s.graphics.drawRect(config.tablet.xFromBody, config.tablet.yFromBody, config.tablet_s.w, config.tablet_s.h, config.tablet_s.r, config.tablet_s.r, config.tablet_s.r, config.tablet_s.r);
    rect_s.regX = config.tablet_s.w/2;
    rect_s.regY = config.tablet_s.h/2;
    rect_s.x = x;
    rect_s.y = y;
    rect_s.rotation = rotation+config.tablet.rFromBody+180;
    mo.addChild(rect_s);
  }

  return mo;
}
function setupRetinaSupport(){
  var canvas = document.querySelectorAll('canvas');

  canvas.forEach(function(cv){
    var ctx = cv.getContext('2d');

    if (window.devicePixelRatio > 1) {
        var canvasWidth = cv.width;
        var canvasHeight = cv.height;

        cv.width = canvasWidth * window.devicePixelRatio;
        cv.height = canvasHeight * window.devicePixelRatio;
        cv.style.width = canvasWidth;
        cv.style.height = canvasHeight;

        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  })
}
function getProxemicZoneLabel(distance){
  //cm
  if(distance <= 50) return "Intimate";
  else if(distance <= 100) return "Personal";
  else if(distance <= 200) return "Social";
  else return "Public";
}

// calculations
function getData(url, returnFunction){
  var getJSON = function(url, callback) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.responseType = 'json';
      xhr.onload = function() {
        var status = xhr.status;
        if (status == 200) {
          callback(null, xhr.response);
        } else {
          callback(status);
        }
      };
      xhr.send();
  };
  getJSON(url, function(err, data) {
    if (err != null) {
      console.log('Cannot get JSON file: ' + err);
    } else {
      console.log('Successfully get JSON file');
      return returnFunction(data);
    }
  });
}
function loadConfig(returnFunction){
  if(readCookie('config') == null) {
    createCookie('config', JSON.stringify({appConfig:appConfig, personConfig:personConfig, groupConfig: groupConfig, preferences:preferences}), 365);
  }

  return returnFunction(JSON.parse(readCookie('config')));
}
function saveconfig(jsonData){
    createCookie('config', jsonData, 365);
}
function calculateDistanceBetweenTwoPoints(x1, y1, x2, y2){
  var a = x1 - x2
  var b = y1 - y2

  return Math.sqrt( a*a + b*b );
}
function cleanDate(d) {
  return new Date(+d.replace(/\/Date\((\d+)\)\//, '$1'));
}
function rotate(cx, cy, x, y, angle) {
    var radians = (Math.PI / 180) * angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
    return {x:nx, y:ny};
}
function toDegrees (angle) {
  return angle * (180 / Math.PI);
}
function toRadians (angle) {
  return angle * (Math.PI / 180);
}
function isAngleInRange(from, to, angle){
  // make sure to >= from
  while (to < from) to += 360;
  // make sure angle >= from
  while (angle < from) angle += 360;
  // compare
  return angle >= from && angle <= to;
}
function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!(x2<=x&&x<=x1)) {return false;}
        } else {
            if (!(x1<=x&&x<=x2)) {return false;}
        }
        if (y1>=y2) {
            if (!(y2<=y&&y<=y1)) {return false;}
        } else {
            if (!(y1<=y&&y<=y2)) {return false;}
        }
        if (x3>=x4) {
            if (!(x4<=x&&x<=x3)) {return false;}
        } else {
            if (!(x3<=x&&x<=x4)) {return false;}
        }
        if (y3>=y4) {
            if (!(y4<=y&&y<=y3)) {return false;}
        } else {
            if (!(y3<=y&&y<=y4)) {return false;}
        }
    }
    return true;
}
function circleIntersection(x0, y0, r0, x1, y1, r1) {
        var a, dx, dy, d, h, rx, ry;
        var x2, y2;

        /* dx and dy are the vertical and horizontal distances between
         * the circle centers.
         */
        dx = x1 - x0;
        dy = y1 - y0;

        /* Determine the straight-line distance between the centers. */
        d = Math.sqrt((dy*dy) + (dx*dx));

        /* Check for solvability. */
        if (d > (r0 + r1)) {
            /* no solution. circles do not intersect. */
            return false;
        }
        if (d < Math.abs(r0 - r1)) {
            /* no solution. one circle is contained in the other */
            return false;
        }

        /* 'point 2' is the point where the line through the circle
         * intersection points crosses the line between the circle
         * centers.  
         */

        /* Determine the distance from point 0 to point 2. */
        a = ((r0*r0) - (r1*r1) + (d*d)) / (2.0 * d) ;

        /* Determine the coordinates of point 2. */
        x2 = x0 + (dx * a/d);
        y2 = y0 + (dy * a/d);

        /* Determine the distance from point 2 to either of the
         * intersection points.
         */
        h = Math.sqrt((r0*r0) - (a*a));

        /* Now determine the offsets of the intersection points from
         * point 2.
         */
        rx = -dy * (h/d);
        ry = dx * (h/d);

        /* Determine the absolute intersection points. */
        var xi = x2 + rx;
        var xi_prime = x2 - rx;
        var yi = y2 + ry;
        var yi_prime = y2 - ry;

        return [xi, xi_prime, yi, yi_prime];
}
function createCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
function eraseCookie(name) {
    createCookie(name,"",-1);
}
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgbToHex(color) {
    return "#" + componentToHex(color.r) + componentToHex(color.g) + componentToHex(color.b);
}
function getTimeString(seconds){
  return pad(getMinute(seconds), 2)+":"+pad(getSeconds(seconds), 2);
}
function getMinute(seconds) {
  return Math.floor(seconds / 60);
}
function getSeconds(seconds) {

  return parseInt(seconds % 60);
}
function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};
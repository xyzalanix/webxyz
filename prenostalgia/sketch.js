var right = 0.5;
var left = 0.5;
var bh = 30;
var bw = 30;
let fake;
let real;
let playing = false;

function preload(){
  f1 = loadSound("prenostalgia/processed/marie_fake.mp3"); //20160529
  r1 = loadSound("prenostalgia/processed/marie_real.mp3");
  f2 = loadSound("prenostalgia/processed/demo_fake.mp3"); //2017XXXX
  r2 = loadSound("prenostalgia/processed/demo_real.mp3");
  f3 = loadSound("prenostalgia/processed/annemasse_fake.mp3"); //20160704
  r3 = loadSound("prenostalgia/processed/annemasse_real.mp3");
  f4 = loadSound("prenostalgia/processed/plath_fake.mp3"); //20210905
  r4 = loadSound("prenostalgia/processed/plath_real.mp3");
  f5 = loadSound("prenostalgia/processed/sabor_fake.mp3"); //20210907
  r5 = loadSound("prenostalgia/processed/sabor_real.mp3");

  font = loadFont('fonts/texgyreheroscn-regular.otf');

}

function setup() {

  btt2 = createButton('⏵');
  btt3 = createButton('⏵');
  btt4 = createButton('⏵');
  btt5 = createButton('⏵');
  btt1 = createButton('⏵');

  bttstop = createButton('STOP');

}

function loaded1(){
  stopAll();
  f1.playMode("restart");
  f1.play();
  f1.loop();
  r1.playMode("restart");
  r1.play();
  r1.loop();
  playing = true;

}
function loaded2(){
  stopAll();
  f2.playMode("restart");
  f2.play();
  f2.loop();
  r2.playMode("restart");
  r2.play();
  r2.loop();
  playing = true;

}
function loaded3(){
  stopAll();
  f3.playMode("restart");
  f3.play();
  f3.loop();
  r3.playMode("restart");
  r3.play();
  r3.loop();
  playing = true;

}
function loaded4(){
  stopAll();
  f4.playMode("restart");
  f4.play();
  f4.loop();
  r4.playMode("restart");
  r4.play();
  r4.loop();
  playing = true;

}
function loaded5(){
  stopAll();
  f5.playMode("restart");
  f5.play();
  f5.loop();
  r5.playMode("restart");
  r5.play();
  r5.loop();
  playing = true;

}

function draw() {
  spacing = 210;

  bx = (windowWidth/2)-168;
  by = (windowHeight/2)-168;
  createCanvas(windowWidth, windowHeight);
//
  btt1.mouseClicked(loaded1);
  btt1.position(bx,by);
  // btt1.center();
  btt1.addClass('button');
  btt1.style('background: radial-gradient(circle, #f1f1f1, 50%, #f1f1f100, 75%, #60fcae00);');

  btt2.mouseClicked(loaded2);
  btt2.position(bx+spacing,by);
  // btt2.center();
  btt2.addClass('button');
  btt2.style('background: radial-gradient(circle, #f1f1f1, 50%, #f1f1f100, 75%, #60fcae00);');

  // btt2.style('font-size:16px;');

  btt3.mouseClicked(loaded3);
  btt3.position(bx,by+spacing);
  // btt3.center();
  btt3.addClass('button');
  btt3.style('background: radial-gradient(circle, #f1f1f1, 50%, #f1f1f100, 75%, #60fcae00);');

  // btt3.style('font-size:16px;');

  btt4.mouseClicked(loaded4);
  btt4.position(bx-spacing,by);
  // btt3.center();
  btt4.addClass('button');
  btt4.style('background: radial-gradient(circle, #f1f1f1, 50%, #f1f1f100, 75%, #60fcae00);');

  // btt4.style('font-size:16px;');

  btt5.mouseClicked(loaded5);
  btt5.position(bx,by-spacing);
  // btt3.center();
  btt5.addClass('button');
  btt5.style('background: radial-gradient(circle, #f1f1f1, 50%, #f1f1f100, 75%, #60fcae00);');



  // btt5.style('font-size:16px;');
//

  left = map(mouseX, 0, windowWidth, 1, 0);
  right = map(mouseX, 0, windowWidth, 0, 1);

  f1.setVolume(right);
  r1.setVolume(left);
  f2.setVolume(right);
  r2.setVolume(left);
  f3.setVolume(right);
  r3.setVolume(left);
  f4.setVolume(right);
  r4.setVolume(left);
  f5.setVolume(right);
  r5.setVolume(left);

  print('Real:' + left,'Fake:' + right)
  if (playing){
    // mix indicators
    fill('#999999');
    strokeWeight(0);
    textFont(font);
    textSize(15);
    textAlign(CENTER, CENTER);
    text('Real: ' + round(left, 2), 50, windowHeight/2);
    textAlign(CENTER, CENTER);
    text('Fake: ' + round(right, 2), windowWidth-50, windowHeight/2);

  }
  // stop button
  bttstop.mouseClicked(stopAll);
  bttstop.position(windowWidth/2-16,windowHeight-(windowHeight*0.08));
  bttstop.style('background:none;border:none;color:#999999;font-size:15px;');
  bttstop.addClass('stopbutton');

  // strokeWeight(0.5);
  // stroke('#000000');
  // line(width / 2, 0, width / 2, height);

  if (mouseX < windowWidth/2) { // left
    cursor('prenostalgia/real.cur');
  } else if (mouseX > windowWidth/2) {  // right
    cursor('prenostalgia/fake.cur');
  }
}

function stopAll(){
  playing = false;
  f1.stop();
  r1.stop();
  f2.stop();
  r2.stop();
  f3.stop();
  r3.stop();
  f4.stop();
  r4.stop();
  f5.stop();
  r5.stop();
}

var right = 0.5;
var left = 0.5;
var bh = 30;
var bw = 30;
let fake;
let real;

function preload(){
  f1 = loadSound("notas-pre-voz/processed/marie_fake.wav");
  r1 = loadSound("notas-pre-voz/processed/marie_real.wav");
  f2 = loadSound("notas-pre-voz/processed/demo_fake.wav");
  r2 = loadSound("notas-pre-voz/processed/demo_real.wav");
  f3 = loadSound("notas-pre-voz/processed/annemasse_fake.wav");
  r3 = loadSound("notas-pre-voz/processed/annemasse_real.wav");
  f4 = loadSound("notas-pre-voz/processed/piano_fake.wav");
  r4 = loadSound("notas-pre-voz/processed/piano_real.wav");
  f5 = loadSound("notas-pre-voz/processed/sabor_fake.wav");
  r5 = loadSound("notas-pre-voz/processed/sabor_real.wav");
}

function setup() {

  btt1 = createButton('1');
  btt2 = createButton('2');
  btt3 = createButton('3');
  btt4 = createButton('4');
  btt5 = createButton('5');
  // dim = width / 2;

  noStroke();
  ellipseMode(RADIUS);
}

function loaded1(){
  stopAll();
  f1.play();
  f1.loop();
  r1.play();
  r1.loop();
}
function loaded2(){
  stopAll();

  f2.play();
  f2.loop();
  r2.play();
  r2.loop();
}
function loaded3(){
  stopAll();

  f3.play();
  f3.loop();
  r3.play();
  r3.loop();
}
function loaded4(){
  stopAll();

  f4.play();
  f4.loop();
  r4.play();
  r4.loop();
}
function loaded5(){
  stopAll();

  f5.play();
  f5.loop();
  r5.play();
  r5.loop();
}

function draw() {
  spacing = 60;
  bx = (windowWidth/2)-30;
  by = (windowHeight/2)-20;
  createCanvas(windowWidth, windowHeight);
//
  btt1.mousePressed(loaded1);
  btt1.position(bx,by);
  // btt1.center();
  btt1.addClass('button');
  btt1.style('font-size:22px;');

  btt2.mousePressed(loaded2);
  btt2.position(bx+spacing,by);
  // btt2.center();
  btt2.addClass('button');
  btt2.style('font-size:22px;');

  btt3.mousePressed(loaded3);
  btt3.position(bx,by+spacing);
  // btt3.center();
  btt3.addClass('button');
  btt3.style('font-size:22px;');

  btt4.mousePressed(loaded4);
  btt4.position(bx-spacing,by);
  // btt3.center();
  btt4.addClass('button');
  btt4.style('font-size:22px;');

  btt5.mousePressed(loaded5);
  btt5.position(bx,by-spacing);
  // btt3.center();
  btt5.addClass('button');
  btt5.style('font-size:22px;');
//

  right = map(mouseX, 0, windowWidth, 0, 1);
  left = map(mouseX, 0, windowWidth, 1, 0);
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

  textAlign(CENTER, CENTER);
  text(round(left, 2), windowWidth*1/4, windowHeight*0.9);
  textAlign(CENTER, CENTER);
  text(round(right, 2), windowWidth*3/4, windowHeight*0.9);

}

function stopAll(){
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

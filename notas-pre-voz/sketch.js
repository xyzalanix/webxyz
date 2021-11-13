var right = 0.5;
var left = 0.5;
var bh = 30;
var bw = 30;
let fake;
let real;

function preload(){
  f1 = loadSound("notas-pre-voz/processed/marie_fake.mp3"); //20160529
  r1 = loadSound("notas-pre-voz/processed/marie_real.mp3");
  f2 = loadSound("notas-pre-voz/processed/demo_fake.mp3"); //2017XXXX
  r2 = loadSound("notas-pre-voz/processed/demo_real.mp3");
  f3 = loadSound("notas-pre-voz/processed/annemasse_fake.mp3"); //20160704
  r3 = loadSound("notas-pre-voz/processed/annemasse_real.mp3");
  f4 = loadSound("notas-pre-voz/processed/plath_fake.mp3"); //20210905
  r4 = loadSound("notas-pre-voz/processed/plath_real.mp3");
  f5 = loadSound("notas-pre-voz/processed/sabor_fake.mp3"); //20210907
  r5 = loadSound("notas-pre-voz/processed/sabor_real.mp3");

  font = loadFont('fonts/texgyreheroscn-regular.otf');

}

function setup() {

  btt2 = createButton('');
  btt3 = createButton('');
  btt4 = createButton('');
  btt5 = createButton('');
  btt1 = createButton('');
  // dim = width / 2;
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
  spacing = 150;

  bx = (windowWidth/2)-120;
  by = (windowHeight/2)-105;
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
  fill('#777777');
  strokeWeight(0);
  textFont(font);
  textAlign(CENTER, CENTER);
  text('Real: ' + round(left, 2), 50, windowHeight/2);
  textAlign(CENTER, CENTER);
  text('Fake: ' + round(right, 2), windowWidth-50, windowHeight/2);


  // strokeWeight(0.5);
  // stroke('#60fcae');
  // line(width / 2, 0, width / 2, height);

  if (mouseX < windowWidth/2) { // left
    cursor('notas-pre-voz/real.cur');
  } else if (mouseX > windowWidth/2) {  // right
    cursor('notas-pre-voz/fake.cur');
  }
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

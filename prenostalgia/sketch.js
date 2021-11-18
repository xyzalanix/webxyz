var right = 0.5;
var left = 0.5;
var bh = 30;
var bw = 30;
let fake;
let real;
let marie = false;
let patos200 = false;
let snakes = false;
let gracias = false;
let sabor = false;
// var loading = true;

function preload(){
  f1 = loadSound("prenostalgia/processed/marie_fake.mp3"); //20160529
  r1 = loadSound("prenostalgia/processed/marie_real.mp3");
  f2 = loadSound("prenostalgia/processed/red-district_fake.mp3"); //2017XXXX
  r2 = loadSound("prenostalgia/processed/red-district_real.mp3");
  f3 = loadSound("prenostalgia/processed/snakes_fake_v2.mp3"); //20160704
  r3 = loadSound("prenostalgia/processed/snakes_real_v2.mp3");
  f4 = loadSound("prenostalgia/processed/gracias_fake.mp3"); //20210905
  r4 = loadSound("prenostalgia/processed/gracias_real.mp3");
  f5 = loadSound("prenostalgia/processed/sabor_fake.mp3"); //20210907
  r5 = loadSound("prenostalgia/processed/sabor_real.mp3");

  font = loadFont('fonts/texgyreheroscn-regular.otf');

}

// function loaded(){
//   loading = false;
// }

function setup() {
  btt2 = createButton('▶');
  btt3 = createButton('▶');
  btt4 = createButton('▶');
  btt5 = createButton('▶');
  btt1 = createButton('▶');
  bttstop = createButton('■');

}

function loaded1(){
  falseReset();
  stopAll();
  f1.playMode("restart");
  f1.play();
  f1.loop();
  r1.playMode("restart");
  r1.play();
  r1.loop();
  marie = true;
}
function loaded2(){
  falseReset();
  stopAll();
  f2.playMode("restart");
  f2.play();
  f2.loop();
  r2.playMode("restart");
  r2.play();
  r2.loop();
  patos200 = true;

}
function loaded3(){
  falseReset();
  stopAll();
  f3.playMode("restart");
  f3.play();
  f3.loop();
  r3.playMode("restart");
  r3.play();
  r3.loop();
  snakes = true;

}
function loaded4(){
  falseReset();
  stopAll();
  f4.playMode("restart");
  f4.play();
  f4.loop();
  r4.playMode("restart");
  r4.play();
  r4.loop();
  gracias = true;

}
function loaded5(){
  falseReset();
  stopAll();
  f5.playMode("restart");
  f5.play();
  f5.loop();
  r5.playMode("restart");
  r5.play();
  r5.loop();
  sabor = true;

}

function draw() {
  // if (loading){
  //   fill('#999999');
  //   strokeWeight(0);
  //   textFont(font);
  //   textSize(13);
  //   textAlign(CENTER, CENTER);
  //   text("Je me méfie de Alan:\n\nMarie discovers I was recording her singing.", windowWidth/2,);
  // }

  spacing = 120;

  bx = (windowWidth/2)-110;
  by = (windowHeight/2)-110;
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

  print('Orignal:' + left,'Reconstructed:' + right)

  fill('#999999');
  strokeWeight(0);
  textFont(font);
  textSize(13);
  if (marie){

    len_real = r1.duration()-(r1.currentTime());
    len_fake = f1.duration()-(f1.currentTime());
    textAlign(CENTER, CENTER);
    text("Je me méfie de Alan:\n\nMarie discovers I was recording her singing.", windowWidth/2, windowHeight-(windowHeight*0.15));
    textAlign(LEFT, CENTER);
    text(round(len_real, 0)+"s", 50, windowHeight-(windowHeight*0.15));
    textAlign(RIGHT, CENTER);
    text(round(len_fake, 0)+"s", windowWidth-50, windowHeight-(windowHeight*0.15));
  } else if (patos200){
    len_real = r2.duration()-(r2.currentTime());
    len_fake = f2.duration()-(f2.currentTime());
    textAlign(CENTER, CENTER);
    text("Patos 200:\n\nLost demo from highly self-absorbed times,\nliving at the foot of Cerro del Chupón in Satélite, Monterrey.", windowWidth/2, windowHeight-(windowHeight*0.15));
    textAlign(LEFT, CENTER);
    text(round(len_real, 0)+"s", 50, windowHeight-(windowHeight*0.15));
    textAlign(RIGHT, CENTER);
    text(round(len_fake, 0)+"s", windowWidth-50, windowHeight-(windowHeight*0.15));
  } else if (snakes){
    len_real = r3.duration()-(r3.currentTime());
    len_fake = f3.duration()-(f3.currentTime());
    textAlign(CENTER, CENTER);
    text("Are there snakes around here?:\n\nWhile singing in the fields of Annemasse at night, Marina and João convince themselves \nthey're not afraid of snakes, while I mock typical french songs.", windowWidth/2, windowHeight-(windowHeight*0.15));
    textAlign(LEFT, CENTER);
    text(round(len_real, 0)+"s", 50, windowHeight-(windowHeight*0.15));
    textAlign(RIGHT, CENTER);
    text(round(len_fake, 0)+"s", windowWidth-50, windowHeight-(windowHeight*0.15));
  } else if (gracias){
    len_real = r4.duration()-(r4.currentTime());
    len_fake = f4.duration()-(f4.currentTime());
    textAlign(CENTER, CENTER);
    text("Muchas Gracias:\n\nEmotionally charged Christian radio passage.", windowWidth/2, windowHeight-(windowHeight*0.15));
    textAlign(LEFT, CENTER);
    text(round(len_real, 0)+"s", 50, windowHeight-(windowHeight*0.15));
    textAlign(RIGHT, CENTER);
    text(round(len_fake, 0)+"s", windowWidth-50, windowHeight-(windowHeight*0.15));
  } else if (sabor){
    len_real = r5.duration()-(r5.currentTime());
    len_fake = f5.duration()-(f5.currentTime());
    textAlign(CENTER, CENTER);
    text("Pa'que agarre el sabor:\n\nMom's recipe for Pollo Encilantrado.", windowWidth/2, windowHeight-(windowHeight*0.15));
    textAlign(LEFT, CENTER);
    text(round(len_real, 0)+"s", 50, windowHeight-(windowHeight*0.15));
    textAlign(RIGHT, CENTER);
    text(round(len_fake, 0)+"s", windowWidth-50, windowHeight-(windowHeight*0.15));
  }

  // mix indicators
  fill('#999999');
  strokeWeight(0);
  textFont(font);
  textSize(13);
  textAlign(LEFT, CENTER);
  text('Original: ' + round(left, 2), 50, windowHeight/2);
  textAlign(RIGHT, CENTER);
  text('Reconstructed: ' + round(right, 2), windowWidth-50, windowHeight/2);
  // stop button
  bttstop.mouseClicked(stopAll);
  bttstop.position(windowWidth/2-11,windowHeight-(windowHeight*0.08));
  bttstop.style('background:none;border:none;color:#999999;font-size:16px;');
  bttstop.addClass('stopbutton');

  // strokeWeight(0.5);
  // stroke('#000000');
  // line(width / 2, 0, width / 2, height);
  cursor('prenostalgia/select.cur');
//   if (mouseX < windowWidth/2) { // left
//     cursor('select.png');
//   } else if (mouseX > windowWidth/2) {  // right
//     cursor('');
//   }
}
function falseReset(){
  marie = false;
  patos200 = false;
  snakes = false;
  gracias = false;
  sabor = false;
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
  marie = false;
  patos200 = false;
  snakes = false;
  gracias = false;
  sabor = false;
}

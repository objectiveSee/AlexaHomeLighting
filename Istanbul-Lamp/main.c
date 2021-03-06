// This #include statement was automatically added by the Particle IDE.
#include "neopixel/neopixel.h"


// #define DEBUG_MODE

typedef enum {
    animationWhite = 0,
    animationColorWheel,
    animationFireworks,
    animationCircles,
    animationCandles,
    animationSeaFoam,
    animationPurpleRain,
    animationChristmas,
    animationCount
} animationType;

// NEOPIXEL
#define PIXEL_COUNT 8
#define PIXEL_TYPE WS2812B

// Light properties
byte MAX_BRIGHT = 210;  // limits current, using 3A power source all LEDs on white should not exceed 89% (which is 230/255)
float brightness = 1.0f;
#define NUM_STRIPS 7    // Number of Neopixel strips
static const byte TOTAL_PIXELS = NUM_STRIPS * PIXEL_COUNT;
static Adafruit_NeoPixel* strips[NUM_STRIPS];

// State of the lights
static bool isOff = true;
static bool shouldBeOff = false; // cause first loop to trigger a change (should be opposite value of isOff)

static int colors[3] = {0,30,0};
static int countdown = 0;
static const animationType kDefaultAnimation = animationChristmas;
animationType animation;

/*************************************************/

void setup() {

    delay(1000);    // safety delay

    Particle.function("setAnimation", setAnimation);
    
    // Alexa Home Lighting API
    Particle.function("setOnOff", setOnOff);
    Particle.function("setBright", setBrightness);
    
    Particle.subscribe("internet_button_pressed", internet_button_pressed, MY_DEVICES); // Other Particles can call this even easier
    
    animation = kDefaultAnimation;
    
    initStrips();
    delay(100); // for fun
    
    #ifdef DEBUG_MODE
    shouldBeOff = false;
    blackOut(500);
    delay(500);
    #endif

    // wakeUp(400);
    // delay(4000);
}

void loop() {
    
    if ( !shouldBeOff && isOff ) {
        // whiteOut(2000);
        isOff = false;
    } else if ( shouldBeOff && !isOff ) {
        blackOut(2000);
        isOff = true;
    }
    
    if ( ! isOff ) {
        if ( animation == animationColorWheel ) {
            wheelCycle(29, false);
        } else if ( animation == animationFireworks ) {
            fireworks(20, false);
        } else if ( animation == animationWhite ) {
            twinkle2(20);
        } else if ( animation == animationCircles ) {
            circles(16);
        } else if ( animation == animationCandles ) {
            candle(4, true);
        } else if ( animation == animationSeaFoam ) {
            seafoam(4, false);
        } else if ( animation == animationPurpleRain ) {
            purplerain(4);
        } else if ( animation == animationChristmas ) {
        	christmas(8);
        } else {
            delay(400);
        }
    } else {
        delay(100);
    }

}

#pragma mark - Animations

/** Alternates green and red. looks nice but static.*/
// void myNewAnimation1 (unsigned long duration, bool twinkle) {
// 	byte red,green,blue;
// 	for( byte j=0; j<PIXEL_COUNT; j++) {
//         for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
//         	red = 0; green = 0; blue = 0;
//         	if ( j % 2 ) {
//         		red = 255;
//         	} else {
//         		green = 255;
//         	}
//             strips[strip_id]->setPixelColor(j, red, green, blue);
//         }
//     }
//     showAllStrips();
//     delay(duration);
// }

void christmas(unsigned long duration) {
	byte red,green,blue;

	red = 0x0;
	green = 0xFF;
	blue = 0x10;

	for( byte j=0; j<PIXEL_COUNT; j++) {
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
            if ( strip_id % 2 == 0 ) {
                strips[strip_id]->setPixelColor(j, 0xFF, 0, 0);
            } else {
                strips[strip_id]->setPixelColor(j, red, green, blue);
            }
        }
    }
    setIsSparkling(true, 0x99, 0x99, 0x99,2);	// red with slow decay
    updateSparkles();
    showAllStrips();
    delay(duration);
}

void purplerain(unsigned long duration) {
	byte red,green,blue;
	for( byte j=0; j<PIXEL_COUNT; j++) {
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
            strips[strip_id]->setPixelColor(j, 174, 12, 255);
        }
    }
    showAllStrips();
    delay(duration);
}

void seafoam (unsigned long duration, bool twinkle) {
	const static float seaSpeed = 0.03;
	static float seaBrightness = 0.5;
	if ( random(2) ) {
		seaBrightness += seaSpeed;
	} else {
		seaBrightness -= seaSpeed;
	}
	if ( seaBrightness > 1 ) {
		seaBrightness = 1;
	} else if ( seaBrightness < 0 ) {
		seaBrightness = 0;
	}
	byte red,green,blue;
	for( byte j=0; j<PIXEL_COUNT; j++) {
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        	red = 0; green = 0; blue = 0;
        	if ( j % 2 ) {
        		red = 100;
        	} else {
        		green = 255;
        		blue = 90;
        	}
            strips[strip_id]->setPixelColor(j, red * seaBrightness, green * seaBrightness, blue * seaBrightness);
        }
    }
    showAllStrips();
    delay(duration);
}

void candle(unsigned long duration, bool twinkle) {
    
    for( byte j=0; j<PIXEL_COUNT; j++) {
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
            strips[strip_id]->setPixelColor(j, Wheel((strip_id * 4)+43));
        }
    }
    setIsSparkling(twinkle, 0xFF, 0x00, 0x00,1);
    if ( twinkle ) {
        updateSparkles();
    }
    showAllStrips();
    delay(duration);
}


#define CIRCLES_SCALE_FACTOR 10  // higher means slower cycling through colors
void circles(unsigned long duration) {
    
    unsigned long mil = millis();
    
    byte wheelPosition = (mil/CIRCLES_SCALE_FACTOR)%256;
    byte wheelIncrement = 256 / PIXEL_COUNT;
    
    for( byte j=0; j<PIXEL_COUNT; j++) {
        
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
            strips[strip_id]->setPixelColor(j, Wheel(wheelPosition));
        }
        
        wheelPosition = (wheelPosition + wheelIncrement) % 256;
    }
    showAllStrips();
    delay(duration);
}

static const float kWheelCycleOffsetPerStrip = 36.428571429;    // 255/NUM_STRIPS
static byte wheelPosition = 0;
#define kWheelIncrement 1
void wheelCycle(unsigned long duration, bool twinkle) {

    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        
        float thisFloat = (strip_id * kWheelCycleOffsetPerStrip) + wheelPosition;
        byte thisIndex = ((byte) thisFloat) % 255;
        uint32_t thisColor = Wheel(thisIndex);
        for( byte j=0; j<PIXEL_COUNT; j++) {
            strips[strip_id]->setPixelColor(j, thisColor);
        }
    }
    setIsSparkling(twinkle, 0xFF, 0xFF, 0xFF, 3);
    if ( twinkle ) {
        updateSparkles();
    }
    showAllStrips();
    delay(duration);
    wheelPosition += kWheelIncrement;
}

/**
 * Twinkle using overlays instead of how twinkle() implements it.
 */
#define WHITE_TWINK 100
void twinkle2(unsigned long duration) {
    setIsSparkling(true, 0xFF, 0xFF, 0xFF, 3);
    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        for( int i=0; i<PIXEL_COUNT; i++) {
            strips[strip_id]->setPixelColor(i, WHITE_TWINK,WHITE_TWINK,WHITE_TWINK);
        }
    }
    updateSparkles();
    showAllStrips();
    delay(duration);
}

/**
 * fireworks will randomly illuminate a pixel on the chandalier and fade the rest by some increment. If allWhite then it'll only use white colors.
 */
static const int kTwinkleFade = 3;
static const int kNewTwinkleFactor = 7;
static const int kTwinkleRandomRange = NUM_STRIPS * PIXEL_COUNT * kNewTwinkleFactor;
void fireworks(unsigned long duration, bool allWhite) {
    
    uint8_t r,g,b;
    uint32_t color;
    int rnd = random(kTwinkleRandomRange);
    static uint8_t colorKey = 0;
    colorKey++; // pseudo-random number
    
    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        for( int i=0; i<PIXEL_COUNT; i++) {
            
            rnd--;
            if ( rnd == 0 ) {
                // light up this pixel
                if ( allWhite ) {
                    strips[strip_id]->setPixelColor(i,255,255,255);
                } else {
                    strips[strip_id]->setPixelColor(i, Wheel(colorKey & 255));
                }
            } else {
                // fade the pixel away
                color = strips[strip_id]->getPixelColor(i);
                splitColor(color, &r, &g, &b);
                r = max(0, r - kTwinkleFade);
                g = max(0, g - kTwinkleFade);
                b = max(0, b - kTwinkleFade);
                strips[strip_id]->setPixelColor(i,r,g,b);
            }
            
        }
    }
    
    showAllStrips();
    delay(duration);
}

void wakeUp(unsigned long duration) {
    
    unsigned long delay_per_lamp = duration / NUM_STRIPS;
    unsigned long delay_per_led = delay_per_lamp / PIXEL_COUNT;
    int i;
    
    // turn all off just in case.
    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        for(i=0; i<PIXEL_COUNT; i++) {
            strips[strip_id]->setPixelColor(i,0,0,0);
        }
        if ( strip_id != 0 ) {
            strips[strip_id]->show();
        }
    }
    
    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
     
        for(i=0; i<PIXEL_COUNT; i++) {
            strips[strip_id]->setPixelColor(i, Wheel((i+(strip_id*20)) & 255));
            strips[strip_id]->show();
            delay(delay_per_led);
        }
        // delay(delay_per_lamp);
        
    }
}

const uint8_t kBrightnessIncreasePerStep = 1;
const int kMaxWhite = 255;  // highest value, as brightness is controlled elsewhere we can go "full range" here
void whiteOut(unsigned long duration) {
    int i;
    uint8_t r,g,b;
    uint32_t color = 0;
    const int startBrightness = 0;
    for ( int step = startBrightness; step < kMaxWhite; step++ ) {
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
            for(i=0; i<PIXEL_COUNT; i++) {
                color = strips[strip_id]->getPixelColor(i);
                splitColor(color, &r, &g, &b);
                r = max(step, r + kBrightnessIncreasePerStep);
                g = max(step, g + kBrightnessIncreasePerStep);
                b = max(step, b + kBrightnessIncreasePerStep);
                
                // set it.
                strips[strip_id]->setPixelColor(i,r,g,b);
            }
        }
        showAllStrips();
        delay(50);
    }
}

void blackOut(unsigned long duration) {
    int i;
    uint8_t r,g,b;
    uint32_t color = 0;
    const int kBlackOutOffset = 15;
    int extraSteps = kBlackOutOffset * NUM_STRIPS;
    for ( int step = 0; step < kMaxWhite + extraSteps; step++ ) {
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
            
            if ( step < strip_id*kBlackOutOffset ) {
                break;
            }
            
            int backwards = NUM_STRIPS - strip_id - 1;
            
            
            for(i=0; i<PIXEL_COUNT; i++) {
                color = strips[backwards]->getPixelColor(i);
                splitColor(color, &r, &g, &b);
                r = max(0, r - kBrightnessIncreasePerStep);
                g = max(0, g - kBrightnessIncreasePerStep);
                b = max(0, b - kBrightnessIncreasePerStep);
                
                // set it.
                strips[backwards]->setPixelColor(i,r,g,b);
            }
        }
        for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
            strips[strip_id]->show();
        }
        delay(10);
    }
}

void debugLoop() {
    
    static int red = 0;
    red++;
    if ( red > 20 ) {
        red = 0;
    }
    
    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        for ( int i = 0; i < PIXEL_COUNT; i++ ) {
            strips[strip_id]->setPixelColor(i,red,20,20);
        }
        strips[strip_id]->show();
    }
    
    delay(250);
}

#pragma mark - Overlays

static int sparkleColor[3] = {255,255,255};
static bool _isSparkling = false;
static byte sparkleBuffer[TOTAL_PIXELS][3];	// R,G,B = 3
static byte sparkleDecay = 3;
static int kSparkleRange = 1500;

void setIsSparkling(bool sparkling, byte r, byte g, byte b, byte decay) {
    if ( sparkling != _isSparkling ) {
        _isSparkling = sparkling;
        clearSparkleBuffer();
    }
    sparkleColor[0] = r; 
    sparkleColor[1] = g;
    sparkleColor[2] = b;
    sparkleDecay = decay;
}

bool isSparkling() {
    return _isSparkling;
}

void clearSparkleBuffer() {
    memset(&sparkleBuffer, 0, TOTAL_PIXELS); // @ 1 byte each
}
void updateSparkles() {
    
    if ( ! _isSparkling ) {
        return;
    }
    
    uint8_t r,g,b;
    uint32_t color = 0;
    int newSparkle = random(kSparkleRange);
    
    byte sparkle_index = 0;	// index into all pixels (eg. across all strips not just 1 strip)

    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        for ( int i = 0; i < PIXEL_COUNT; i++ ) {
            
            // get the current pixel color and "merge" it with the sparkle using max().
            color = strips[strip_id]->getPixelColor(i);
            splitColor(color, &r, &g, &b);
            r = max(r, sparkleBuffer[sparkle_index][0]);
            g = max(g, sparkleBuffer[sparkle_index][1]);
            b = max(b, sparkleBuffer[sparkle_index][2]);
            strips[strip_id]->setPixelColor(i,r,g,b);
            
            if ( newSparkle == sparkle_index ) {
                // set the value of the new sparkle
                for ( byte n = 0; n < 3; n++ ) {
                	sparkleBuffer[sparkle_index][n] = sparkleColor[n];
            	}
            } else {
                // decrement all other sparkles so they fade away
                for ( byte n = 0; n < 3; n++ ) {
                    if ( sparkleBuffer[sparkle_index][n] > sparkleDecay ) {
                        sparkleBuffer[sparkle_index][n] = (sparkleBuffer[sparkle_index][n]) -  sparkleDecay;
                    } else {
                        sparkleBuffer[sparkle_index][n] = 0;
                    }
                }
            }

            sparkle_index++;
        }
    }
}

#pragma mark - Cloud API

/*************************************************
 * Turns the light on or off depending on whether a RGB color of 0x000000 is passed (off) or not (on)
 */
int setOnOff(String command) {
    // received a command!
    int length = command.length();
    if ( length != 6 ) {
        return -1;
    }
    if ( parseColorRGB(command, colors) < 0 ) {
        return -1;
    }
    
    //// HACK TO GET ON/OFF WORKING FOR NOW
    if ( (colors[0] == colors[1]) && (colors[1] == colors[2]) && (colors[1] == 0 ) ) {
        shouldBeOff = true;
    } else {
        shouldBeOff = false;
    }
    
    if ( !shouldBeOff && brightness <= 0.1f ) {   // if turning on and brightness is too low, set to a dim value
        updateBrightness(0.1f);
    }
    
    countdown = 20;
    return 1;
}

int setAnimation(String command) {
    if ( command==0 || command.length() < 1 ) {
        return -1;
    }
    if ( command.compareTo("fireworks") == 0 ) {
        animation = animationFireworks;
    } else if ( command.compareTo("wheel") == 0 ) {
        animation = animationColorWheel;
    } else if ( command.compareTo("white") == 0 ) {
        animation = animationWhite;
    } else if ( command.compareTo("circles") == 0 ) {
        animation = animationCircles;
    } else if ( command.compareTo("off") == 0 ) {
        shouldBeOff = true;
        return 0;
    } else {
        return -1;
    }
    
    shouldBeOff = false;
    
    return (int)animation;
}

/**
 * Sets brightness of the light.
 * NOTE: does not currently turn the light on if you set brightness to > 0, nor turn it off if brightness is 0. This is matching how the 
 * Philips Hue lights seem to work when using the Philips dimmer switch.
 */
int setBrightness(String command) {
    if ( command==0 || command.length() < 2 ) {
        return -1;
    }
    
    // leading character is A or R, the rest is a number
    char type = command.charAt(0);  // 'A' or 'R' for absolute or relative
    String valueStr = command.substring(1);    // take all but the first character
    
    float value = valueStr.toFloat();   // from -100 to 100
    float currentBrightness = brightness * 100; // multiply since we send value as a number between -100 and 100 from the Amazon lighting API
    
    if ( type == 'A' ) {    // absolute
        currentBrightness = value;
    } else if ( type == 'R' ) { // relative
        currentBrightness += value;
    }
    
    // convert from percent back to non-percent
    updateBrightness(currentBrightness/100.0f);
    
    return (int)(brightness*100.0f);  // convert to int that is between 0 and 100. convert to int after updateBrightness() is called since we set brightness there
}

void internet_button_pressed(const char *event, const char *data) {
    // Serial.print(event);
    // Serial.print(", data: ");
    // if (data) {
    //     Serial.println(data);
    // } else {
    //     Serial.println("NULL");
    // }
    
    if ( data[0] == '2' ) {
        shouldBeOff = false;
        animation = (animationType)((animation + 1 ) % animationCount);
    } else if ( data[0] == '4' ) {
        shouldBeOff = false;
        animation = (animationType)((animation - 1 ) % animationCount);
    } else if ( data[0] == '3' ) {
        // off
        shouldBeOff = true;
    } else if ( data[0] == '1' ) {
        // on
        shouldBeOff = false;
    }
}

/**
 * Private
 */
#pragma mark - Hardware Setup & Pins

/**
 * Mapping of output pins for each strip. There are only 7 PWM pins capable of driving the LED strips.
 */
int pinForStrip(int strip) {
    switch(strip) {
        case 2: return RX;
        case 5: return TX;
        case 0: return A7; // A7 == WXP
        case 1: return D0;
        case 6: return D1;
        case 4: return D2;
        case 3: return D3;
    }
    
    while(1) {
        Serial.println("Bad input pinForStrip");
        delay(5000);
    }

    // this is bad!
    return -1;
}

void initStrips() {
    for ( unsigned char i = 0; i < NUM_STRIPS; i++ ) {
        strips[i] = new Adafruit_NeoPixel(PIXEL_COUNT, pinForStrip(i), PIXEL_TYPE);
        strips[i]->begin();
        strips[i]->setBrightness(brightness * MAX_BRIGHT);
    }
}
 
#pragma mark - Helpers, Misc.

/**
 * value should be between 0 and 1
 */
void updateBrightness(float value) {
    if ( value > 1 ) {
        value = 1;
    } else if ( value < 0 ) {
        value = 0;
    }
    brightness = value;
    for ( unsigned char i = 0; i < NUM_STRIPS; i++ ) {
        strips[i]->setBrightness(brightness * MAX_BRIGHT);
    }
}

/**
 * Takes a RGB string (6 bytes) and stores the 3byte RGB value into outBuffer (must be 3 bytes long).
 */
int parseColorRGB(String command, int * outBuffer) {
    
    char buff[3] = {0,0,0};
    int color = -1;
    for ( int j=0; j<3; j++ ) {
        buff[0] = command[j*2];
        buff[1] = command[(j*2) + 1];
        color = strtol(buff, NULL, 16);
        if ( color < 0 ) {
            return -1;
        }
        outBuffer[j] = color;
    }
    return 1;
}

// unused
void colorForStrip(int strip, int*r, int*b, int*g) {

    switch (strip) {
        case 0: *r = 0xAA; *g=0xBB; *b=0x00; return;
        case 1: *r = 0x99; *g=0xBB; *b=0x00; return;
        case 2: *r = 0x88; *g=0x00; *b=0x11; return;
        case 3: *r = 0x77; *g=0x22; *b=0x00; return;
        case 4: *r = 0x66; *g=0x99; *b=0x44; return;
        case 5: *r = 0x55; *g=0x00; *b=0xAA; return;
        case 6: *r = 0x11; *g=0xFF; *b=0x33; return;
    }
    
    static int which = 0;
    if ( strip == 0 ) {
        which = (which+1)%NUM_STRIPS;
    }
    int multiplier = 27;
    int strips_from_which = NUM_STRIPS - ((strip - which) % NUM_STRIPS);
    
    // if ( which == strip ) {
        multiplier = 27 * ((float)strips_from_which / (float)NUM_STRIPS);
    // }
    
    *g = strip * multiplier;
    *r = ((NUM_STRIPS-1)-strip) *18;
    *b = 0;
    
    
    // *r = 0; *b=0; *g=0;
}

/**
 * Upacks a 32 bit colors into it's R, G, and B components.
 */
void splitColor( uint32_t c, uint8_t *r, uint8_t*g, uint8_t*b )
{
    *r = (uint8_t)(c >> 16);
    *g = (uint8_t)(c >> 8);
    *b = (uint8_t)(c >> 0);
}

void showAllStrips() {
    // Show all strips @ same time
    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        strips[strip_id]->show();
    }    
}

uint32_t Wheel(byte WheelPos) {
  if(WheelPos < 85) {
   return strips[0]->Color(WheelPos * 3, 255 - WheelPos * 3, 0);
  } else if(WheelPos < 170) {
   WheelPos -= 85;
   return strips[0]->Color(255 - WheelPos * 3, 0, WheelPos * 3);
  } else {
   WheelPos -= 170;
   return strips[0]->Color(0, WheelPos * 3, 255 - WheelPos * 3);
  }
}
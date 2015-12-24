// This #include statement was automatically added by the Particle IDE.
#include "neopixel/neopixel.h"

// NEOPIXEL
#define PIXEL_COUNT 8
#define PIXEL_TYPE WS2812B

// Number of Neopixel strips
#define NUM_STRIPS 1

static Adafruit_NeoPixel* strips[NUM_STRIPS];

static int colors[3] = {50,20,20};
static int countdown = 0;

/*************************************************/

void setup() {

    delay(2000);    // safety delay

    Spark.function("setColor", setColor);
    
    initStrips();

    delay(100); // for fun.
    
}
void loop() {
    
    static int current = 0;
    
    for ( int strip_id = 0; strip_id < NUM_STRIPS; strip_id++ ) {
        
        for ( int i = 0; i < PIXEL_COUNT; i++ ) {
            if ( i == current ) {
                strips[strip_id]->setPixelColor(i, colors[0],colors[1],colors[2]);
            } else {
                strips[strip_id]->setPixelColor(i, 0,0,0);
            }
        }
        strips[strip_id]->show();
        
        delay(100); // debug: allow time for show() until we know how driving 7 strips concurrently is handled by Photon.
    }
    
    current = (current+1)%PIXEL_COUNT;
}

/*************************************************
 * Public (Cloud) Functions
 */
int setColor(String command) {
    // received a command!
    int length = command.length();
    if ( length < 6 ) {
        return -1;
    }
    if ( parseColorRGB(command, colors) < 0 ) {
        return -1;
    }
    countdown = 20;
    return 1;
}

/**
 * Private
 */

/**
 * Takes a RGB string (6 bytes) and stores the 3byte RGB value into outBuffer (must be 3 bytes long)
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

/**
 * Mapping of output pins for each strip.
 */
int pinForStrip(int strip) {
    switch(strip) {
        case 0: return D2;
        case 1: return D1;
        case 2: return D0;
        case 3: return D3;
        case 4: return D4;
        case 5: return D5;
        case 6: return D6;
    }

    // this is bad!
    return -1;
}

void initStrips() {
    for ( unsigned char i = 0; i < NUM_STRIPS; i++ ) {
        strips[i] = new Adafruit_NeoPixel(PIXEL_COUNT, pinForStrip(i), PIXEL_TYPE);
        strips[i]->begin();
        strips[i]->setBrightness(210);  // limits current, using 3A power source all LEDs on white should not exceed 89% (which is 230/255)
    }
}
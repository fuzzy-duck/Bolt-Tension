#include "AivafMasterFirmware.h"

#define STATUS_LED 13

#define NUM_BOLTS 8

#define NUM_LEDS_PER_BOLT 10

#define NUM_LEDS NUM_BOLTS * NUM_LEDS_PER_BOLT

#define LED_PIN A0
#define LED_TYPE WS2813
#define COLOR_ORDER GRB


#define LED_FADE_UPDATE 3
#define LED_INDEX_UPDATE 40


bool messageArrived;
String msgBuffer;
char processMsgBuffer[30];

enum GameMode {attractor, intro1, intro2, intro3, } gameMode;

STA_StatusLED statusLed(STATUS_LED);
CRGB leds[NUM_LEDS];

int globalFadeVal, globalLedIndex;

class Bolt
{
  public:
  Bolt(int inputPin, int ledIndex);

  void Setup(void);
  void UpdateBolt(void);

  void SetState(int state);

  void LedOff(void);
  void GreenEffect(void);
  void RedEffect(void);
  void WhiteEffect(void);
  void RotatingWhiteEffect(void);
  
  private:
  int _inputPin, _ledIndex, _boltState;
  bool _lastPinState;
  uint32_t _lastLedUpdate;
};

Bolt myBolts[NUM_BOLTS] = {{2, 0}, {3, NUM_LEDS_PER_BOLT*1}, {4, NUM_LEDS_PER_BOLT*2}, {5, NUM_LEDS_PER_BOLT*3}, {6, NUM_LEDS_PER_BOLT*4}, {7, NUM_LEDS_PER_BOLT*5}, {8, NUM_LEDS_PER_BOLT*6}, {9, NUM_LEDS_PER_BOLT*7}};


DEFINE_GRADIENT_PALETTE(greenEffect_gp) {
  0, 0, 0, 0,
  128, 0, 255, 0,
  255, 0, 0, 0
};

DEFINE_GRADIENT_PALETTE(redEffect_gp) {
  0, 0, 0, 0,
  128, 255, 0, 0,
  255, 0, 0, 0
};

DEFINE_GRADIENT_PALETTE(whiteEffect_gp) {
  0, 0, 0, 0,
  128, 255, 255, 255,
  255, 0, 0, 0
};

CRGBPalette16 greenEffect = greenEffect_gp;
CRGBPalette16 redEffect = redEffect_gp;
CRGBPalette16 whiteEffect = whiteEffect_gp;

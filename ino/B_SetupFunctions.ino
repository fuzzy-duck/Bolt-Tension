void SetupIO(void)
{
  statusLed.Setup();

  FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection(TypicalLEDStrip);

  FastLED.setBrightness(255);

  for (int i = 0; i < NUM_BOLTS; i++)
  {

    myBolts[i].Setup();
  }

}

void  SetupInterrupts(void)
{

}

void SetupRoutine(void)
{

  fill_solid(leds, NUM_LEDS, CRGB::Red);

  FastLED.show();
  delay(500);
  fill_solid(leds, NUM_LEDS, CRGB::Green);
  FastLED.show();
  delay(500);
  fill_solid(leds, NUM_LEDS, CRGB::Blue);
  FastLED.show();
  delay(500);
  fill_solid(leds, NUM_LEDS, CRGB::Black);

  FastLED.show();
}


Bolt::Bolt(int inputPin, int ledIndex)
{
  this->_inputPin = inputPin;
  this->_ledIndex = ledIndex;
}

void Bolt::Setup(void)
{
  pinMode(this->_inputPin, INPUT_PULLUP);
}

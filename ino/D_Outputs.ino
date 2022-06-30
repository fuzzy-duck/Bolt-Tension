//void UpdateAttractor()
//{
//  static uint32_t lastFlash;
//  static bool ledState = false;
//  if (millis() >= lastFlash + ATTRACTOR_PERIOD)
//  {
//    lastFlash = millis();
//    digitalWrite(CROSS_BUTTON_LED, ledState);
//    digitalWrite(TICK_BUTTON_LED, !ledState);
//    ledState = !ledState;
//  }
//}

void Bolt::LedOff(void)
{
    for (int i = 0 ; i < NUM_LEDS_PER_BOLT; i++)
  {
    leds[this->_ledIndex + i] = CRGB::Black;
  }
}

void Bolt::GreenEffect(void)
{
  for (int i = 0 ; i < NUM_LEDS_PER_BOLT; i++)
  {
    leds[this->_ledIndex + i] = ColorFromPalette(greenEffect, globalFadeVal);
    
  }

}

void Bolt::RedEffect(void)
{
  for (int i = 0 ; i < NUM_LEDS_PER_BOLT; i++)
  {
    leds[this->_ledIndex + i] = ColorFromPalette(redEffect, globalFadeVal);
  }

}

void Bolt::WhiteEffect(void)
{
  for (int i = 0 ; i < NUM_LEDS_PER_BOLT; i++)
  {
    leds[this->_ledIndex + i] = ColorFromPalette(whiteEffect, globalFadeVal);
  }

}

void Bolt::RotatingWhiteEffect(void)
{
  if (millis() > this->_lastLedUpdate + LED_INDEX_UPDATE)
  {
    for (int i = 0 ; i < NUM_LEDS_PER_BOLT; i++)
    {
      leds[this->_ledIndex + i].nscale8(255 -75);
      
    }

    leds[this->_ledIndex + globalLedIndex] += CHSV( 0, 0, 192);
    
    this->_lastLedUpdate = millis();
  }
}

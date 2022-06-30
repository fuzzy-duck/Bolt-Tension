void UpdateGame(void)
{
//  static GameMode gameMode = attractor;
//  if (gameMode == attractor)
//  {
//    UpdateAttractor();
//    if (UserInteraction())
//    {
//      attractor = false;
//      SetFaults();
//    }
//  }
//  else if (gameMode == Intro)
//  {
//    Intro();
//  }
}

//void Intro(void)
//{
//
//}
//void ResetAllFaults(void)
//{
//  for (int i = 0; i < NUM_BOLTS; i++)
//  {
//    myBolts[i].SetFaultState(false);
//  }
//}
//
//void SetFaults(void)
//{
//  int numFaults, boltNum;
//  ResetAllFaults();
//  do
//  {
//    boltNum = random(0, NUM_BOLTS);
//    if (!myBolts[boltNum].GetFaultState())
//    {
//      myBolts[boltNum].SetFaultState(true);
//      numFaults++;
//    }
//  } while (numFaults < 3);
//}
//
//void Bolt::SetFaultState(bool faultPresent)
//{
//  this->_faultPresent = faultPresent;
//}
//
//bool Bolt::GetFaultState(void)
//{
//  return this->_faultPresent;
//}









void UpdateGlobalLedVariables(void)
{
  static uint32_t fadeTimer, swirlTimer;
  if (millis() > fadeTimer + LED_FADE_UPDATE)
  {
    globalFadeVal += 5;
    globalFadeVal %= 255;
    //Serial.println(globalFadeVal);
    fadeTimer = millis();
  }

  if (millis() > swirlTimer + LED_INDEX_UPDATE)
  {
    globalLedIndex++;
    globalLedIndex %= NUM_LEDS_PER_BOLT;
    swirlTimer = millis();
  }
}

void Bolt::UpdateBolt(void)
{
  bool pinState = digitalRead(this->_inputPin);
  if(this->_lastPinState != pinState && !pinState)
  {
    Serial.println("B " + String(this->_inputPin - 2));
  }
  this->_lastPinState = pinState;

   
  if(this->_boltState == 0)
  {
    this->RotatingWhiteEffect();
  }
  else if(this->_boltState == 1)
  {
    this->WhiteEffect();
  }
  else if(this->_boltState == 2)
  {
    this->GreenEffect();
  }
  else if(this->_boltState == 3)
  {
    this->RedEffect();
  }
  else if(this->_boltState == 4)
  {
    this->LedOff();
  } 
}

void Bolt::SetState(int state)
{
  this->_boltState = state;
}

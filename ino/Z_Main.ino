void setup() {
  Serial.begin(115200);
  
  SetupIO();
  SetupInterrupts();
  SetupRoutine();
  
}

void loop() {
  static uint32_t ledUpdate, fakeSignalUpdate;
  statusLed.Update();
  
  UpdateGlobalLedVariables();
  ProcessSerialMessages();

  for (int i = 0; i < NUM_BOLTS; i++)
  {
    myBolts[i].UpdateBolt();
  }

 
//  if (millis() > ledUpdate + 10)
//  {
//    FastLED.show();
//    ledUpdate = millis();
//
//  }

  FastLED.show();
  delay(10);

  if(millis() > fakeSignalUpdate + 5000)
  {
    Serial.println("B " + String(random(8)));
    fakeSignalUpdate = millis();
  }
 
}

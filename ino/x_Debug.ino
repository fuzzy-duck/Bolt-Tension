void SetupSerial(void)
{
  Serial.begin(115200);
  while (!Serial);
}

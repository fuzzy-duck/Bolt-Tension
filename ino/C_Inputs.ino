void serialEvent()
{
  while (Serial.available())
  {
    /* Read incoming character */
    char inChar = (char)Serial.read();
    if (inChar == '\n')
    {
      //Serial.println("Message recieved by arduino was: " + msgBuffer);
      msgBuffer.toCharArray(processMsgBuffer, msgBuffer.length() + 1);
      msgBuffer = "";
      messageArrived = true;
    }
    else
    {
      /* Add incoming char to the buffer */
      msgBuffer += inChar;
    }
  }
}

void ProcessSerialMessages(void)
{
  String stringToken;
  int intVar, payload;
  String charVar;
  /* If a message has arrived */
  if (messageArrived)
  {
    stringToken = strtok(processMsgBuffer, " ");

    if (stringToken == "L")
    {
      intVar = atoi(strtok(NULL, " "));
      intVar = constrain(intVar, 0, 7);
      payload = atoi(strtok(NULL, " "));
      payload = constrain(payload, 0, 4);

      myBolts[intVar].SetState(payload);
    }
    else if (stringToken == "R")
    {
      for (int i = 0; i < 7; i++)
      {
        myBolts[i].SetState(0);
      }
    }
    else if (stringToken == "U")
    {
      for (int i = 0; i < 7; i++)
      {
        myBolts[i].SetState(1);
      }
    }
    messageArrived = false;
  }
}

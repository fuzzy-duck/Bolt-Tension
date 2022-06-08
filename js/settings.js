/**
SWIT = x3 switches (on / off)
PLUG = x3 plugs (on / off)
DIMM = Dimmer 0-100
RADI = Radiator 0-100
WIN = Window (open or closed)
THER = Thermostat 8-32

SWIT 0 1 0
SWIT 0 1 1

PLUG 1 0 0
PLUG 1 1 0
PLUG 1 1 1

DIMM 38

RADI 34
RADI 33
RADI 32
RADI 31
RADI 30
RADI 29
RADI 28
RADI 27
RADI 26
RADI 25
RADI 24
RADI 23
RADI 22
RADI 21
RADI 20
RADI 19
RADI 18
RADI 17
RADI 16
RADI 15
RADI 14
RADI 13
RADI 12
RADI 11
 * 
 */
export const debugMode = true;

export const GADGET_SETTINGS = {
    switches:3, 
    plugs:3, 
    dimmers:1, 
    radiators:1, 
    windows:1, 
    thermostats:1 
}
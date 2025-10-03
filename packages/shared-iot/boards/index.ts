import rpi4 from "./raspberry-pi-4.json";
import rpi3 from "./raspberry-pi-3.json";
import esp32 from "./esp32-wroom.json";
import uno from "./arduino-uno.json";
import esp8266 from "./esp8266.json";

export const Boards = {
  "raspberry-pi-4": rpi4,
  "raspberry-pi-3": rpi3,
  "esp32-wroom": esp32,
  "arduino-uno": uno,
  "esp8266": esp8266
};

export type BoardKey = keyof typeof Boards;
export function getBoard(key: BoardKey) { return Boards[key]; }

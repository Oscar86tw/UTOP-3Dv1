export default {
  "moduleId": "PARKING-BARRIER-001",
  "runtimeType": "barrier",
  "name": "柵欄機",
  "category": "parking",
  "version": "3.0.2",
  "baseVersion": "1.1.4",
  "parameters": [
    "armLength",
    "rotation",
    "armSide",
    "travelTime"
  ],
  "digitalInputs": [
    "open",
    "close",
    "stop",
    "safety",
    "reset"
  ],
  "digitalOutputs": [
    "fullyOpen",
    "fullyClosed",
    "running",
    "fault"
  ]
};

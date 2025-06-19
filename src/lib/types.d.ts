// This file is for global type declarations

// We are extending the existing Window interface
interface Window {
  // Add a property for the standard SpeechRecognition API
  SpeechRecognition: typeof SpeechRecognition;
  
  // Add a property for the vendor-prefixed version in WebKit browsers
  webkitSpeechRecognition: typeof SpeechRecognition;
}

// We also need to declare the SpeechRecognition class itself
// as it's not part of the standard DOM library.
// This is a basic definition to satisfy TypeScript.
declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};
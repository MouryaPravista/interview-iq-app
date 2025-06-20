// This file is for global type declarations.
// It tells TypeScript about browser-specific APIs that aren't in the default library.

// By using 'declare global', we are merging our custom types with the existing global scope.
declare global {
  // We extend the existing Window interface to include SpeechRecognition APIs.
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  // We declare the SpeechRecognition class constructor.
  // This is the modern and correct way to declare a global variable type.
  const SpeechRecognition: {
    prototype: SpeechRecognition;
    new(): SpeechRecognition;
  };
}

// We must add an empty export statement to make this a module,
// which is required for global declarations to work correctly in a modular project.
export {};
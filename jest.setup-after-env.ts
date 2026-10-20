// Runs after the test framework is installed (Reanimated's documented Jest setup, with its resolver
// configured in package.json; on SDK 57 it ships in react-native-worklets). Animations run on fake 60 FPS timers.
require('react-native-reanimated').setUpTests();

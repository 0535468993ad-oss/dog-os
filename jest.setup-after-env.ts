// Runs after the test framework is installed (Reanimated's documented Jest setup, with its resolver
// configured in package.json; since SDK 58 it ships in react-native-reanimated again). Animations run on fake 60 FPS timers.
require('react-native-reanimated').setUpTests();

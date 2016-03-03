## Tests

This is all subject to change.

### Run the tests

From the root directory of Guerilla, run:

```bash
npm test
```

This will place a coverage report are put in ```coverage/lcov-report/index.html```.

### Conventions

Guerilla's tests will be broken up into ```unit``` and ```integration``` tests.

* All test filenames should end with `.test.js` suffix.
* There is a special test, ```tests/coverage.test.js```. It is **only** intended to create a coverage basline.
* Unit tests should be located in ```tests/``` directory.
* Each component's unit test should be in a subdirectory that matches the location of the component.
    * ```routes/master/workers.js``` test should be located at ```test/routes/master/workers.test.js```.
* Integration tests should be located in ```tests/integration``` directory.
    * Typically, tests that hit endpoints and verify responses will go here.

#### `fixtures` directory
Contains sample data/files/templates used for testing

#### `helpers` directory
Logic to help setup or teardown Guerilla, read fixtures, and otherwise simplify the logic in our tests.

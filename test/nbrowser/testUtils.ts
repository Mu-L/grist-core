/**
 * Exports `server`, set up to start using setupTestSuite(), e.g.
 *
 *    import {assert, driver} from 'mocha-webdriver';
 *    import {server, setupTestSuite} from 'test/nbrowser/testUtils';
 *
 *    describe("MyTest", function() {
 *      this.timeout(20000);      // Needed because we wait for server for up to 15s.
 *      setupTestSuite();
 *    });
 *
 * Run with VERBOSE=1 in the environment to see the server log on the console. Normally it goes
 * into a file whose path is printed when server starts.
 *
 * Run `bin/mocha 'test/nbrowser/*.ts' -b --no-exit` to open a command-line prompt on
 * first-failure for debugging and quick reruns.
 */
import log from 'app/server/lib/log';
import {addToRepl, assert, Capability, driver, enableDebugCapture, ITimeouts,
  Key, setOptionsModifyFunc, useServer} from 'mocha-webdriver';
import * as gu from 'test/nbrowser/gristUtils';
import {server} from 'test/nbrowser/testServer';
import {setupCleanup} from 'test/server/testCleanup';

// Exports the server object with useful methods such as getHost(), waitServerReady(),
// simulateLogin(), etc.
export {server, setupCleanup};

setOptionsModifyFunc(({chromeOpts, firefoxOpts}) => {
  if (process.env.TEST_CHROME_BINARY_PATH) {
    chromeOpts.setChromeBinaryPath(process.env.TEST_CHROME_BINARY_PATH);
  }

  // Set "kiosk" printing that saves to PDF without offering any dialogs. This applies to regular
  // (non-headless) Chrome. On headless Chrome, no dialog or output occurs regardless.
  chromeOpts.addArguments("--kiosk-printing");
  // Latest chrome version 127, has started ignoring alerts and popups when controlled via a
  // webdriver.
  // https://github.com/SeleniumHQ/selenium/issues/14290
  // According to the article above, popups and alerts are still shown in `BiDi` sessions. While we
  // don't have latest webdriver library (where the new `enableBiDi` method is exposed), it can be
  // toggled by using the `set` method in `capabilities` interface, as it is done here (long URL):

  // eslint-disable-next-line max-len
  // https://github.com/shs96c/selenium/blob/ff82c4af6a493321d9eaec6ba8fa8589e4aa824d/javascript/node/selenium-webdriver/firefox.js#L415
  chromeOpts.set('webSocketUrl', true);
  chromeOpts.set(Capability.UNHANDLED_PROMPT_BEHAVIOR, "ignore");

  chromeOpts.setUserPreferences({
    // Don't show popups to save passwords, which are shown when running against a deployment when
    // we use a login form.
    "credentials_enable_service": false,
    "profile": {
      content_settings: {
        exceptions: {
          clipboard: {
            '*': {
              // Grant access to the system clipboard. This applies to regular (non-headless)
              // Chrome. On headless Chrome, this has no effect.
              setting: 1,
            }
          },
        },
      },
      // Don't show popups to save passwords.
      password_manager_enabled: false,
    },

    // These preferences are my best effort to set up "print to pdf" that saves into the test's temp
    // dir, based on discussion here: https://bugs.chromium.org/p/chromedriver/issues/detail?id=2821.
    // On headless, it's ignored (no files are saved). When run manually, it would work EXCEPT with
    // kiosk-printing (i.e. also ignored), so look for your downloaded PDFs elsewhere (perhaps
    // ~/Downloads). Leaving it here in case it works better some day.
    "printing.default_destination_selection_rules": JSON.stringify({
      kind: "local",
      namePattern: "Save as PDF",
    }),
    "printing.print_preview_sticky_settings.appState": JSON.stringify({
      recentDestinations: [{
        id: 'Save as PDF',
        origin: 'local',
        account: '',
      }],
      version: 2
    }),
    "download.default_directory": server.testDir,
    "savefile.default_directory": server.testDir,
    "autofill": {
      profile_enabled: false,
      credit_card_enabled: false,
    },
  });
});

interface TestSuiteOptions {
  samples?: boolean;
  tutorial?: boolean;
  team?: boolean;

  // If set, clear user preferences for all test users at the end of the suite. It should be used
  // for suites that modify preferences. Not that it only works in dev, not in deployment tests.
  clearUserPrefs?: boolean;

  // Max milliseconds to wait for a page to finish loading. E.g. affects clicks that cause
  // navigation, which wait for that. A navigation that takes longer will throw an exception.
  pageLoadTimeout?: number;
}

// Sets up the test suite to use the Grist server, and also to record logs and screenshots after
// failed tests (if MOCHA_WEBDRIVER_LOGDIR var is set).
//
// Returns a Cleanup instance as a convenience, for use scheduling any clean-up that would have
// the same scope as the test suite.
export function setupTestSuite(options?: TestSuiteOptions) {
  useServer(server);
  enableDebugCapture();
  addToRepl('gu', gu, 'gristUtils, grist-specific helpers');
  addToRepl('Key', Key, 'key values such as Key.ENTER');
  addToRepl('server', server, 'test server');

  // After every suite, assert it didn't leave an alert open.
  checkForAlerts();

  // After every suite, assert it didn't leave new browser windows open.
  checkForExtraWindows();

  // After every suite, clear sessionStorage and localStorage to avoid affecting other tests.
  if (!process.env.NO_CLEANUP) {
    after(clearCurrentWindowStorage);
  }
  // Also, log out, to avoid logins interacting, unless NO_CLEANUP is requested (useful for
  // debugging tests).
  if (!process.env.NO_CLEANUP) {
    after(() => server.removeLogin());
  }

  // If requested, clear user preferences for all test users after this suite.
  if (options?.clearUserPrefs) {
    after(clearTestUserPreferences);
  }

  // Though unlikely it is possible that the server was left paused by a previous test, so let's
  // always call resume.
  afterEach(() => server.resume());

  // Close database until next test explicitly needs it, to avoid conflicts
  // with tests that don't use the same server.
  after(async () => server.closeDatabase());

  if (options?.pageLoadTimeout) {
    setDriverTimeoutsForSuite({pageLoad: options.pageLoadTimeout});
  }

  return setupRequirement({team: true, ...options});
}

// Check for alerts after the test suite.
function checkForAlerts() {
  after(async () => {
    const isAlertShown = await gu.isAlertShown();
    try {
      assert.isFalse(isAlertShown, "Unexpected alert open after the test ended");
    } finally {
      if (isAlertShown) {
        await gu.acceptAlert();
      }
    }
  });
}

// Clean up any browser windows after the test suite that didn't exist at its start.
function checkForExtraWindows() {
  let origHandles: string[];
  before(async () => {
    origHandles = await driver.getAllWindowHandles();
  });
  after(async () => {
    assert.deepEqual(await driver.getAllWindowHandles(), origHandles);
  });
}

// Clean up any browser windows after the test suite that didn't exist at its start.
// Call this BEFORE setupTestSuite() when the test is expected to create new windows, so that they
// may get cleaned up before the check for extraneous windows runs.
export function cleanupExtraWindows() {
  let origHandles: string[];
  before(async () => {
    origHandles = await driver.getAllWindowHandles();
  });
  after(async () => {
    const newHandles = await driver.getAllWindowHandles();
    for (const w of newHandles) {
      if (!origHandles.includes(w)) {
        await driver.switchTo().window(w);
        await driver.close();
      }
    }
    await driver.switchTo().window(newHandles[0]);
  });
}


async function clearCurrentWindowStorage() {
  if ((await driver.getCurrentUrl()).startsWith('http')) {
    try {
      await driver.executeScript('window.sessionStorage.clear(); window.localStorage.clear();');
    } catch (err) {
      log.info("Could not clear window storage after the test ended: %s", err.message);
    }
  }
}

async function clearTestUserPreferences() {
  // After every suite, clear user preferences for all test users.
  const dbManager = await server.getDatabase();
  let emails = Object.keys(gu.TestUserEnum).map(user => gu.translateUser(user as any).email);
  emails = [...new Set(emails)];    // Remove duplicates.
  await dbManager.testClearUserPrefs(emails);
}

export function setDriverTimeoutsForSuite(newTimeouts: ITimeouts) {
  let prevTimeouts: ITimeouts|null = null;

  before(async () => {
    prevTimeouts = await driver.manage().getTimeouts();
    await driver.manage().setTimeouts(newTimeouts);
  });

  after(async () => {
    if (prevTimeouts) {
      await driver.manage().setTimeouts(prevTimeouts);
    }
  });
}

/**
 * Implement some optional requirements for a test, such as having an example document
 * present, or a team site to run tests in.  These requirements should be automatically
 * satisfied by staging/prod deployments, and only need doing in self-contained tests
 * or tests against dev servers.
 *
 * Returns a Cleanup instance for any cleanup that would have the same scope as the
 * requirement.
 */
export function setupRequirement(options: TestSuiteOptions) {
  const cleanup = setupCleanup();
  const {samples, tutorial} = options;
  if (samples || tutorial) {
    if (process.env.TEST_ADD_SAMPLES || !server.isExternalServer()) {
      gu.shareSupportWorkspaceForSuite(); // TODO: Remove after the support workspace is removed from the backend.
      gu.addSamplesForSuite(tutorial);
    }
  }

  before(async function() {

    if (new URL(server.getHost()).hostname !== 'localhost') {
      // Non-dev servers should already meet the requirements; in any case we should not
      // fiddle with them here.
      return;
    }

    // Optionally ensure that a team site is available for tests.
    if (options.team) {
      await gu.addSupportUserIfPossible();
      const api = gu.createHomeApi('support', 'docs');
      for (const suffix of ['', '2'] as const) {
        let orgName = `test${suffix}-grist`;
        const deployment = process.env.GRIST_ID_PREFIX;
        if (deployment) { orgName = `${orgName}-${deployment}`; }
        let isNew: boolean = false;
        try {
          await api.newOrg({name: `Test${suffix} Grist`, domain: orgName});
          isNew = true;
        } catch (e) {
          // Assume the org already exists.
        }
        if (isNew) {
          await api.updateOrgPermissions(orgName, {
            users: {
              'gristoid+chimpy@gmail.com': 'owners',
            }
          });
          // Recreate the api for the correct org, then update billing.
          const api2 = gu.createHomeApi('support', orgName);
          const billing = api2.getBillingAPI();
          try {
            await billing.updateBillingManagers({
              users: {
                'gristoid+chimpy@gmail.com': 'managers',
              }
            });
          } catch (e) {
            // ignore if no billing endpoint
            if (!String(e).match('404: Not Found')) {
              throw e;
            }
          }
        }
      }
    }
  });
  return cleanup;
}

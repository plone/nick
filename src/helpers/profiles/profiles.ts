/**
 * Profile helper.
 * @module helpers/profiles/profiles
 */

// External imports
import path from 'path';
import { fileURLToPath } from 'url';

// Internal imports
import config from '../config/config';
import { fileExists } from '../fs/fs';
import { log } from '../log/log';

// Set initalization state
let initialized = false;

/**
 * Map asynchronous but in order through profiles
 * @method mapProfiles
 * @param {function} callback Callback function
 * @returns {Promise<any>} Promise which returns when all callbacks are done
 */
export async function mapProfiles(
  callback: (profile: string, index: number) => Promise<any>,
): Promise<any[]> {
  const output = [];

  // Loop through profiles
  for (let i = 0; i < config.settings.profiles.length; i++) {
    // Get profile path
    const profile = config.settings.profiles[i];
    const [packageName, profileName] = profile.split(':');
    const packageEntry = fileURLToPath(import.meta.resolve(packageName));
    const profilePath = path.resolve(
      path.dirname(packageEntry),
      `./profiles/${profileName}`,
    );

    // Run callback
    output.push(await callback(profilePath, i));
  }

  // Return output
  return output;
}

/**
 * Run init step for all profiles
 * @method initProfiles
 * @returns {Promise<void>} Promise which returns when all init steps are done
 */
export async function initProfiles(): Promise<void> {
  if (!initialized) {
    await mapProfiles(async (profilePath) => {
      try {
        if (await fileExists(`${profilePath}/index`)) {
          const profileModule = await import(`${profilePath}/index`);
          if (profileModule.init) {
            await profileModule.init();
          }
        }
      } catch (error) {
        log.error(`Error loading profile at ${profilePath}`, error);
      }
    });
    initialized = true;
  }
}

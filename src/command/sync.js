const Command = require('common-bin');
const initConfig = require('../config');
const cleaner = require('../lib/cleaner');
const Downloader = require('../lib/Downloader');
const out = require('../lib/out');

class SyncCommand extends Command {
  constructor(rawArgv) {
    super(rawArgv);
    this.usage = 'Usage: yuque-hexo-lyrics sync';
  }

  async run() {
    for (let i in initConfig) {
      const initConfig_item = initConfig[i];
      // for initConfig in config { }
      if (!initConfig_item) {
        process.exit(0);
      }
      // clear previous directory.
      if (initConfig_item.lastGeneratePath === '') {
        out.info('clear previous directory.');
        cleaner.cleanPosts();
      }
      // get articles from yuque or cache
      // const downloader = new Downloader(initConfig_item);
      // await downloader.autoUpdate();
      // out.info('yuque-hexo-lyrics sync done! test local download!');
    }
    // TODO: 在这里用for循环对initConfig对象数组进行遍历
    for (let i in initConfig) {
      const initConfig_item = initConfig[i];
      // for initConfig in config { }
      if (!initConfig_item) {
        process.exit(0);
      }
      // clear previous directory.
      // if (initConfig_item.lastGeneratePath === '') {
      //   out.info('clear previous directory.');
      //   cleaner.cleanPosts();
      // }
      // get articles from yuque or cache
      const downloader = new Downloader(initConfig_item);
      await downloader.autoUpdate();
      out.info('yuque-hexo-lyrics sync done! test local download!');
    }
  }
}

module.exports = SyncCommand;

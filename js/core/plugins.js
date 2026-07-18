/**
 * Public plugin API, exposed as window.Lumen. External scripts register
 * modules (e.g. AI tools) without modifying the core editor:
 *
 *   Lumen.plugin.register({
 *     name: 'remove-bg',
 *     run: async (blob, meta) => { ... return resultBlob; }
 *   })
 *
 * `name` must match one of the AI panel's card ids (see
 * js/ui/panels/ai.js) for it to appear as "Connected" and be invokable
 * from that card. See core/plugin-runner.js for the invocation contract
 * and README.md's "Plugin API" section for a full worked example.
 */
import { bus } from './bus.js';

export const Lumen = {
  plugin: {
    plugins: {},
    register(plugin) {
      this.plugins[plugin.name] = plugin;
      console.log('Plugin registered:', plugin.name);
      bus.emit('plugin:registered', plugin.name);
    },
    get(name) { return this.plugins[name]; },
    list() { return Object.keys(this.plugins); }
  }
};

window.Lumen = Lumen;

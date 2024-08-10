import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import monkey, { cdn } from 'vite-plugin-monkey';
import tsconfigPaths from 'vite-tsconfig-paths';
// import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    monkey({
      entry: 'src/index.tsx', // userscript entry file path
      userscript: {
        // name: 'linuxdo-browse',
        namespace: 'linuxdo-browse',
        // version: '0.1.0',
        author: 'delph1s',
        description: 'LinuxDo蓝点消除计划',
        // homepage: '',
        homepageURL: 'https://github.com/delph1s/linuxdo-browse',
        // website: '',
        // source: '',
        // icon: '',
        iconURL: 'https://cdn.linux.do/uploads/default/original/3X/9/d/9dd49731091ce8656e94433a26a3ef36062b3994.png',
        // defaulticon: '',
        // icon64: '',
        // icon64URL: '',
        // updateURL: '',
        // downloadURL: '',
        // supportURL: '',
        // include: [],
        match: ['*://linux.do/', '*://linux.do/*'],
        // 'exclude-match': ['*://linux.do/*.json'],
        exclude: ['*://linux.do/*.json'],
        // require: [],
        // resource: {},
        // connect: [
        //   'connect.linux.do',
        // ],
        // sandbox: 'raw',
        // antifeature: [],
        // noframes: false,
        // webRequest: [],
        // 'inject-into': 'page',
        // unwrap: false,
        // greasyfork
        license: 'GPLv2',
        // contributionURL: '',
        // contributionAmount: '1',
        // compatible: '',
        // incompatible: '',
        'run-at': 'document-end',
        grant: [
          // 'GM_cookie',
          // 'GM_xmlhttpRequest',
        ],
      },
      // format: {
      //   generate: uOptions => {
      //     console.log(uOptions.userscript);
      //     if (uOptions.mode === 'serve') {
      //       return '测试';
      //     }
      //     if (uOptions.mode === 'build') {
      //       return '打包'
      //     }
      //     if (uOptions.mode === 'meta') {
      //       return '元'
      //     }
      //   }
      // },
      // clientAlias: 'monkeyClient',
      server: {
        open: false,
        prefix: name => {
          return `${name}-dev`;
        },
        mountGmApi: false,
      },
      build: {
        // fileName: 'linuxdo-browse',
        metaFileName: true,
        externalGlobals: {
          react: cdn.npmmirror('React', 'umd/react.production.min.js'),
          'react-dom': cdn.npmmirror('ReactDOM', 'umd/react-dom.production.min.js'),
          dayjs: cdn.npmmirror('dayjs', 'dayjs.min.js'),
          'dayjs/plugin/duration': cdn.npmmirror(
            'dayjs_plugin_duration',
            'plugin/duration.js',
          ),
          lodash: cdn.npmmirror('_', 'lodash.min.js'),
          // ahooks use these
          'lodash/throttle': '_.throttle',
          'lodash/debounce': '_.debounce',
          'lodash/isEqual': '_.isEqual',
        },
        autoGrant: true,
        // externalResource: {},
        // systemjs: 'inline',
        // cssSideEffects: css => {
        //   return (css) => {
        //     console.log(css);
        //   }
        // }
      },
    }),
  ],
  build: {
    minify: false, // greasyfork 要求可读代码
  },
});

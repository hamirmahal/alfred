(window.webpackJsonp=window.webpackJsonp||[]).push([[12],{66:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return o})),n.d(t,"metadata",(function(){return l})),n.d(t,"rightToc",(function(){return s})),n.d(t,"default",(function(){return p}));var r=n(2),i=n(7),a=(n(0),n(91)),o={id:"files-and-directories",title:"Files and Directories"},l={id:"files-and-directories",isDocsHomePage:!1,title:"Files and Directories",description:'Sometimes adding integration with a specific tool requires "boilerplate" files that are not configuration files. For example, redux requires root.js, configureStore.js, and other boilerplate files. Because of this, Alfred provides files and dirs properties which let writers of skills easily add boilerplate files and entire boilerplate directories to a user\'s project.',source:"@site/docs/files-and-directories.md",permalink:"/docs/files-and-directories",editUrl:"https://github.com/amilajack/alfred/edit/master/website/docs/files-and-directories.md",sidebar:"docs",previous:{title:"Project and Config",permalink:"/docs/project-and-config"},next:{title:"Tasks",permalink:"/docs/tasks"}},s=[{value:"Conditionally Adding Files",id:"conditionally-adding-files",children:[]},{value:"Transforming Files",id:"transforming-files",children:[]},{value:"When Files are Written",id:"when-files-are-written",children:[]}],c={rightToc:s};function p(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(a.b)("wrapper",Object(r.a)({},c,n,{components:t,mdxType:"MDXLayout"}),Object(a.b)("p",null,'Sometimes adding integration with a specific tool requires "boilerplate" files that are not configuration files. For example, ',Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"https://redux.js.org/"}),"redux")," requires ",Object(a.b)("inlineCode",{parentName:"p"},"root.js"),", ",Object(a.b)("inlineCode",{parentName:"p"},"configureStore.js"),", and other boilerplate files. Because of this, Alfred provides ",Object(a.b)("inlineCode",{parentName:"p"},"files")," and ",Object(a.b)("inlineCode",{parentName:"p"},"dirs")," properties which let writers of ",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"skills"}),"skills")," easily add boilerplate files and entire boilerplate directories to a user's project."),Object(a.b)("p",null,"Here is an example of how the react skill uses the ",Object(a.b)("inlineCode",{parentName:"p"},"files")," API to add react support to a project:"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js"}),"const reactSkill = {\n  name: 'react',\n  // ...\n  files: [\n    {\n      src: path.join(__dirname, '../boilerplate/index.html'),\n      dest: 'src/index.html'\n    },\n    // ...\n  ]\n};\n\nexport default reactSkill;\n")),Object(a.b)("p",null,"The ",Object(a.b)("inlineCode",{parentName:"p"},"dest")," property determines where the file is written to relative to the user's root project directory. The ",Object(a.b)("inlineCode",{parentName:"p"},"src")," property is the path to the file you want to write to to the location given by ",Object(a.b)("inlineCode",{parentName:"p"},"dest"),"."),Object(a.b)("h2",{id:"conditionally-adding-files"},"Conditionally Adding Files"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js",metastring:"{7-12}","{7-12}":!0}),"const reactSkill = {\n  name: 'react',\n  files: [\n    {\n      src: path.join(__dirname, '../boilerplate/index.html'),\n      dest: 'src/index.html',\n      condition(args) {\n        const { project } = args;\n        return project.targets.some(target => {\n          return target.platform === 'browser' && target.project === 'app';\n        });\n      }\n    },\n    // ...\n  ],\n  // ...\n};\n\nexport default reactSkill;\n")),Object(a.b)("p",null,"You may want to write a file only if certain conditions are met. Returning ",Object(a.b)("inlineCode",{parentName:"p"},"true")," from ",Object(a.b)("inlineCode",{parentName:"p"},"condition")," will determine if the file should be written or not. In the example above, the file will be written if at least one target is a browser app."),Object(a.b)("h2",{id:"transforming-files"},"Transforming Files"),Object(a.b)("p",null,"Similar to configs which are transformed by functions in ",Object(a.b)("inlineCode",{parentName:"p"},"transforms"),", skills can also change their files to be compatible with other skills."),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js",metastring:"{18-24}","{18-24}":!0}),"const reduxSkill = {\n  name: 'redux',\n  files: [\n    {\n      alias: 'configureStore',\n      filename: 'configureStore.js',\n      content:\n`import { applyMiddleware, compose, createStore } from 'redux';\nimport thunkMiddleware from 'redux-thunk';\n\nexport default function configureStore(preloadedState) {\n  // ...\n}`\n    }\n  ],\n  transforms: {\n    typescript(skill) {\n      skill.files\n        .get('configureStore')\n        .rename('configureStore.ts')\n        .replace(\n          'export default function configureStore(preloadedState) {',\n          'export default function configureStore(preloadedState: State): Store {'\n        );\n      return skill;\n    }\n  }\n}\n\nexport default reduxSkill;\n")),Object(a.b)("p",null,"Alfred provides some helpful ways of transforming files. Currently, Alfred supports file transformations through the following methods: applying diffs and string replacement. Note that directly writing files to the file system is highly discouraged."),Object(a.b)("h4",{id:"applying-diffs"},"Applying Diffs"),Object(a.b)("p",null,Object(a.b)("em",{parentName:"p"},"This section is a work in progress")),Object(a.b)("h4",{id:"string-replacement"},"String Replacement"),Object(a.b)("p",null,"Content in files can either be replaced by the ",Object(a.b)("inlineCode",{parentName:"p"},"replace")," method, which can be used in two ways:"),Object(a.b)("p",null,"Replacing an entire file with the given content:"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js"}),".replace('module.exports = {}')\n")),Object(a.b)("p",null,"Or giving a string to search for and replacing that matched string with the given content:"),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-js"}),".replace('module.exports = {}', 'export default {}')\n")),Object(a.b)("h2",{id:"when-files-are-written"},"When Files are Written"),Object(a.b)("p",null,"Files are written during the ",Object(a.b)("inlineCode",{parentName:"p"},"afterLearn")," and ",Object(a.b)("inlineCode",{parentName:"p"},"afterNew")," ",Object(a.b)("a",Object(r.a)({parentName:"p"},{href:"skill-hooks"}),"hooks"),". Only skills that are newly learned will have their files transformed."))}p.isMDXComponent=!0},91:function(e,t,n){"use strict";n.d(t,"a",(function(){return d})),n.d(t,"b",(function(){return u}));var r=n(0),i=n.n(r);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var c=i.a.createContext({}),p=function(e){var t=i.a.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},d=function(e){var t=p(e.components);return i.a.createElement(c.Provider,{value:t},e.children)},f={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},b=i.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,o=e.parentName,c=s(e,["components","mdxType","originalType","parentName"]),d=p(n),b=r,u=d["".concat(o,".").concat(b)]||d[b]||f[b]||a;return n?i.a.createElement(u,l(l({ref:t},c),{},{components:n})):i.a.createElement(u,l({ref:t},c))}));function u(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,o=new Array(a);o[0]=b;var l={};for(var s in t)hasOwnProperty.call(t,s)&&(l[s]=t[s]);l.originalType=e,l.mdxType="string"==typeof e?e:r,o[1]=l;for(var c=2;c<a;c++)o[c]=n[c];return i.a.createElement.apply(null,o)}return i.a.createElement.apply(null,n)}b.displayName="MDXCreateElement"}}]);